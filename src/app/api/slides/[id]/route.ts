import { handleRouteError, isUuid, jsonError, jsonOk, readJson, requireDashboard } from "@/lib/api";
import { getSlide, renderSlideToStorage, toSlideDTO, updateSlide, VISUAL_FIELDS } from "@/lib/campaigns";
import { updateSlideSchema, zodMessage } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  const { id } = await params;
  if (!isUuid(id)) return jsonError("ID tidak valid", 400);
  try {
    const slide = await getSlide(id);
    if (!slide) return jsonError("Slide tidak ditemukan", 404);
    return jsonOk({ slide: toSlideDTO(slide) });
  } catch (err) {
    return handleRouteError(err, "slides:get");
  }
}

/** PATCH /api/slides/:id — inline editing; visual changes trigger an automatic re-render. */
export async function PATCH(req: Request, { params }: Ctx) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  const { id } = await params;
  if (!isUuid(id)) return jsonError("ID tidak valid", 400);

  const parsed = updateSlideSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  if (Object.keys(parsed.data).length === 0) return jsonError("Tidak ada perubahan", 400);

  try {
    let slide = await updateSlide(id, parsed.data);
    if (!slide) return jsonError("Slide tidak ditemukan", 404);
    const visualChanged = VISUAL_FIELDS.some((f) => parsed.data[f] !== undefined);
    let renderError: string | null = null;
    if (visualChanged || !slide.renderedImageUrl) {
      try {
        slide = await renderSlideToStorage(slide);
      } catch (err) {
        console.error("[slides:patch] render failed", err);
        renderError = (err as Error).message;
      }
    }
    return jsonOk({ slide: toSlideDTO(slide), renderError });
  } catch (err) {
    return handleRouteError(err, "slides:patch");
  }
}
