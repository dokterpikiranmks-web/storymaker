import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api";
import { hasDashboardAccess, isWorkerAuthorized } from "@/lib/auth";
import { getSlide, toSlideDTO } from "@/lib/campaigns";
import { dispatchInstagramForSlide } from "@/lib/dispatch";
import { dispatchInstagramSchema, zodMessage } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/dispatch/instagram  (PRD Task 5.2)
 * Body: { slideId }. Auth: dashboard session OR `Authorization: Bearer WORKER_SECRET` (local daemon).
 */
export async function POST(req: Request) {
  if (!isWorkerAuthorized(req) && !(await hasDashboardAccess(req))) {
    return jsonError("Unauthorized", 401);
  }
  const parsed = dispatchInstagramSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);

  try {
    const result = await dispatchInstagramForSlide(parsed.data.slideId, req);
    const slide = await getSlide(parsed.data.slideId);
    const status = result.ok ? 200 : result.skipped ? 409 : 502;
    return jsonOk({ ...result, slide: slide ? toSlideDTO(slide) : null }, { status });
  } catch (err) {
    return handleRouteError(err, "dispatch:instagram");
  }
}
