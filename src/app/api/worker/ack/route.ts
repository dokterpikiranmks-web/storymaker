import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api";
import { isWorkerAuthorized } from "@/lib/auth";
import { ackWhatsapp, toSlideDTO } from "@/lib/campaigns";
import { workerAckSchema, zodMessage } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST /api/worker/ack — daemon reports WhatsApp Status result { slideId, channel: "whatsapp", ok, error? }. */
export async function POST(req: Request) {
  if (!process.env.WORKER_SECRET?.trim()) return jsonError("WORKER_SECRET belum diset di server", 503);
  if (!isWorkerAuthorized(req)) return jsonError("Unauthorized", 401);
  const parsed = workerAckSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  try {
    const slide = await ackWhatsapp(parsed.data.slideId, parsed.data.ok, parsed.data.error);
    if (!slide) return jsonError("Slide tidak ditemukan", 404);
    return jsonOk({ slide: toSlideDTO(slide) });
  } catch (err) {
    return handleRouteError(err, "worker:ack");
  }
}
