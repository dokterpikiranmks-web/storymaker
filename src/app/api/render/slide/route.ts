import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storySlides, type SlideMeta } from "@/db/schema";
import { handleRouteError, jsonError, jsonOk, pngResponse, readJson, requireDashboard } from "@/lib/api";
import { getSlide } from "@/lib/campaigns";
import { absoluteUrl } from "@/lib/env";
import { contentEtag, renderSlideJpeg, renderSlidePng } from "@/lib/render/renderer";
import { storeRenderedImage } from "@/lib/render/storage";
import { getPersona } from "@/lib/settings";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/lib/stories/constants";
import { renderSlideSchema, zodMessage } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/render/slide  (PRD Task 3.1 + 3.3)
 * Body: { headline, body, actType, themeName, cta?, store?, slideId?, format? }
 * - store=false (default) → returns the 1080×1920 PNG/JPEG buffer.
 * - store=true → uploads to Supabase Storage `story-assets` (or Postgres fallback) and returns the public URL.
 */
export async function POST(req: Request) {
  const denied = await requireDashboard(req);
  if (denied) return denied;

  const parsed = renderSlideSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { headline, body, cta, actType, themeName, slideId, store, format } = parsed.data;

  try {
    const persona = await getPersona();
    const input = {
      headline,
      body,
      cta: cta ?? null,
      actType,
      themeName,
      handle: parsed.data.handle ?? persona.handle,
      signature: parsed.data.signature ?? persona.signature,
    };

    if (!store) {
      if (format === "jpeg") return pngResponse(await renderSlideJpeg(input), { contentType: "image/jpeg", filename: `${actType}.jpg` });
      return pngResponse(await renderSlidePng(input), { filename: `${actType}.png` });
    }

    const slide = slideId ? await getSlide(slideId) : null;
    if (slideId && !slide) return jsonError("Slide tidak ditemukan", 404);

    const png = await renderSlidePng(input);
    const etag = contentEtag(png);
    const meta = (slide?.meta ?? {}) as SlideMeta;
    const stored = await storeRenderedImage({ png, etag, slideId: slide?.id, campaignId: slide?.campaignId, previousPath: meta.storagePath });

    if (slide) {
      const nextMeta: SlideMeta = { ...meta, imageEtag: etag, storage: stored.storage, renderedAt: new Date().toISOString() };
      if (stored.path) nextMeta.storagePath = stored.path;
      await db.update(storySlides).set({ renderedImageUrl: stored.url, meta: nextMeta, updatedAt: new Date() }).where(eq(storySlides.id, slide.id));
    }

    return jsonOk({
      url: absoluteUrl(stored.url, req),
      path: stored.url,
      storage: stored.storage,
      etag,
      width: SLIDE_WIDTH,
      height: SLIDE_HEIGHT,
      bytes: png.length,
    });
  } catch (err) {
    return handleRouteError(err, "render/slide");
  }
}
