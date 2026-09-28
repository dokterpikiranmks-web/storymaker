import { isUuid, pngResponse } from "@/lib/api";
import { getCampaign, getSlide, slideRenderInput } from "@/lib/campaigns";
import { renderSlideJpeg, renderSlidePng } from "@/lib/render/renderer";
import { getPersona } from "@/lib/settings";
import { ACTS } from "@/lib/stories/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Public, unguessable (UUID) media endpoint that renders a slide on the fly.
 * Used by Meta (Instagram fetches the JPEG itself), the WhatsApp daemon and per-slide downloads.
 * GET /api/media/:slideId?format=jpg|png&download=1
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });
  try {
    const slide = await getSlide(id);
    if (!slide) return new Response("Not found", { status: 404 });
    const url = new URL(req.url);
    const jpeg = ["jpg", "jpeg"].includes(url.searchParams.get("format") ?? "");
    const download = url.searchParams.get("download") === "1";
    const persona = await getPersona();
    const input = slideRenderInput(slide, persona);
    const buffer = jpeg ? await renderSlideJpeg(input) : await renderSlidePng(input);

    let filename = `story-${ACTS[slide.act].index}.${jpeg ? "jpg" : "png"}`;
    if (download) {
      const campaign = await getCampaign(slide.campaignId);
      const act = ACTS[slide.act];
      filename = `story-maker_${campaign?.campaignDate ?? "slide"}_${act.index}-${act.slot.toLowerCase()}.${jpeg ? "jpg" : "png"}`;
    }
    return pngResponse(buffer, {
      contentType: jpeg ? "image/jpeg" : "image/png",
      filename,
      download,
      cache: url.searchParams.get("v") ? "public, max-age=86400" : "public, max-age=60",
    });
  } catch (err) {
    console.error("[media] render failed", err);
    return new Response("Render failed", { status: 500 });
  }
}
