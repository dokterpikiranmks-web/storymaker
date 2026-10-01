import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api";
import { isWorkerAuthorized } from "@/lib/auth";
import { getDueSlides, leaseWhatsapp } from "@/lib/campaigns";
import { absoluteUrl, getAppTimezone } from "@/lib/env";
import { isInstagramConfigured } from "@/lib/instagram";
import { setAppState, WORKER_HEARTBEAT_KEY } from "@/lib/settings";
import { db } from "@/db";
import { dailyCampaigns, storySlides, type SlideMeta } from "@/db/schema";
import { ACTS } from "@/lib/stories/constants";
import { eq, inArray, sql } from "drizzle-orm";

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

    const campaignIds = [...new Set(due.map((s) => s.campaignId))];
    const campaignRows = campaignIds.length
      ? await db
          .select({ id: dailyCampaigns.id, campaignDate: dailyCampaigns.campaignDate })
          .from(dailyCampaigns)
          .where(inArray(dailyCampaigns.id, campaignIds))
      : [];
    const dateMap = new Map(campaignRows.map((c) => [c.id, c.campaignDate]));

    const items = due.map((s) => {
      const act = ACTS[s.act];
      const meta = (s.meta ?? {}) as SlideMeta;
      const version = meta.imageEtag ?? String(s.updatedAt.getTime());
      const headline = s.headline.replace(/\*/g, "");
      const imagePath = `/api/media/${s.id}?format=jpg&v=${version}`;
      return {
        id: s.id,
        campaignId: s.campaignId,
        campaignDate: dateMap.get(s.campaignId) ?? null,
        act: s.act,
        actNumber: act.index,
        actShortTitle: act.shortTitle,
        label: `Babak ${act.index} · ${act.slot} ${act.time} · ${act.shortTitle}`,
        headline,
        bodyText: s.bodyText,
        callToAction: s.callToAction,
        caption: s.caption ?? [headline, s.bodyText, s.callToAction].filter(Boolean).join("\n\n"),
        scheduledAt: s.scheduledAt?.toISOString() ?? null,
        targetTime: s.targetTime,
        status: s.status,
        forcePost: Boolean(meta.forcePost),
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

/**
 * POST /api/worker/queue
 * Trigger 'Post Now' untuk slide berikutnya yang berstatus SCHEDULED (atau slideId spesifik).
 * Memasang forcePost: true dan scheduledAt: now agar diproses seketika oleh worker.
 */
export async function POST(req: Request) {
  if (!process.env.WORKER_SECRET?.trim()) {
    return jsonError("WORKER_SECRET belum diset di server", 503);
  }

  const isAuth = isWorkerAuthorized(req);
  if (!isAuth) {
    const { requireDashboard } = await import("@/lib/api");
    const denied = await requireDashboard(req);
    if (denied) return denied;
  }

  try {
    const body = (await readJson(req).catch(() => ({}))) as { slideId?: string; campaignId?: string };
    const now = new Date();

    let targetSlide = null;
    if (body.slideId) {
      const [s] = await db.select().from(storySlides).where(eq(storySlides.id, body.slideId)).limit(1);
      targetSlide = s;
    } else {
      // Cari slide berikutnya yang berstatus SCHEDULED
      const [s] = await db
        .select()
        .from(storySlides)
        .where(eq(storySlides.status, "SCHEDULED"))
        .orderBy(storySlides.scheduledAt)
        .limit(1);
      targetSlide = s;
    }

    if (!targetSlide) {
      return jsonError("Tidak ada slide berstatus SCHEDULED yang menunggu pengiriman", 404);
    }

    const [updated] = await db
      .update(storySlides)
      .set({
        status: "SCHEDULED",
        scheduledAt: now,
        waLockAt: null,
        igLockAt: null,
        lastError: null,
        meta: sql`coalesce(${storySlides.meta}, '{}'::jsonb) || ${JSON.stringify({ forcePost: true, forcedAt: now.toISOString() })}::jsonb`,
        updatedAt: now,
      })
      .where(eq(storySlides.id, targetSlide.id))
      .returning();

    return jsonOk({
      ok: true,
      message: `Slide ${targetSlide.act} (${targetSlide.id}) ditandai forcePost untuk diproses segera`,
      slide: updated,
    });
  } catch (err) {
    return handleRouteError(err, "worker:queue:postNow");
  }
}
