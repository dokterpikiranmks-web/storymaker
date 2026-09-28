import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { isCronAuthorized } from "@/lib/auth";
import { getDueSlides } from "@/lib/campaigns";
import { dispatchInstagramForSlide } from "@/lib/dispatch";
import { isInstagramConfigured } from "@/lib/instagram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/cron/dispatch — publishes due Instagram Stories without the local daemon.
 * Trigger from Vercel Cron / cron-job.org with `Authorization: Bearer CRON_SECRET` (or WORKER_SECRET).
 */
export async function GET(req: Request) {
  if (!isCronAuthorized(req)) return jsonError("Unauthorized", 401);
  try {
    if (!isInstagramConfigured()) return jsonOk({ ok: true, skipped: "Instagram belum dikonfigurasi", processed: [] });
    const due = await getDueSlides(10);
    const processed = [];
    for (const slide of due) {
      if (!slide.postToInstagram || slide.igPostedAt) continue;
      processed.push({ slideId: slide.id, ...(await dispatchInstagramForSlide(slide.id, req)) });
    }
    return jsonOk({ ok: true, processed });
  } catch (err) {
    return handleRouteError(err, "cron:dispatch");
  }
}
