import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { isWorkerAuthorized } from "@/lib/auth";
import { getDueSlides, leaseWhatsapp } from "@/lib/campaigns";
import { absoluteUrl, getAppTimezone } from "@/lib/env";
import { isInstagramConfigured } from "@/lib/instagram";
import { setAppState, WORKER_HEARTBEAT_KEY } from "@/lib/settings";
import type { SlideMeta } from "@/db/schema";
import { ACTS } from "@/lib/stories/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/worker/queue?connected=1&me=628xx&version=1.0.0
 * Polled every 60s by the local Baileys daemon (Authorization: Bearer WORKER_SECRET).
 * Returns due SCHEDULED slides and leases WhatsApp jobs atomically.
 */
export async function GET(req: Request) {
  if (!process.env.WORKER_SECRET?.trim()) {
    return jsonError("WORKER_SECRET belum diset di server — daemon dinonaktifkan demi keamanan.", 503);
  }
  if (!isWorkerAuthorized(req)) return jsonError("Unauthorized", 401);

  try {
    const url = new URL(req.url);
    const connected = url.searchParams.get("connected") === "1";
    await setAppState(WORKER_HEARTBEAT_KEY, {
      connected,
      me: url.searchParams.get("me")?.slice(0, 40) || null,
      version: url.searchParams.get("version")?.slice(0, 20) || null,
    });

    const due = await getDueSlides(10);
    const leased = connected ? await leaseWhatsapp(due.map((s) => s.id)) : new Set<string>();

    const items = due.map((s) => {
      const act = ACTS[s.act];
      const meta = (s.meta ?? {}) as SlideMeta;
      const version = meta.imageEtag ?? String(s.updatedAt.getTime());
      const headline = s.headline.replace(/\*/g, "");
      const imagePath = `/api/media/${s.id}?format=jpg&v=${version}`;
      return {
        id: s.id,
        campaignId: s.campaignId,
        act: s.act,
        label: `Babak ${act.index} · ${act.slot} ${act.time} · ${act.shortTitle}`,
        headline,
        caption: s.caption ?? [headline, s.bodyText, s.callToAction].filter(Boolean).join("\n\n"),
        scheduledAt: s.scheduledAt?.toISOString() ?? null,
        postToWhatsapp: s.postToWhatsapp,
        postToInstagram: s.postToInstagram,
        waPosted: Boolean(s.waPostedAt),
        igPosted: Boolean(s.igPostedAt),
        waLeased: leased.has(s.id),
        imagePath,
        imageUrl: absoluteUrl(imagePath, req),
      };
    });

    return jsonOk({ now: new Date().toISOString(), timezone: getAppTimezone(), instagramConfigured: isInstagramConfigured(), items });
  } catch (err) {
    return handleRouteError(err, "worker:queue");
  }
}
