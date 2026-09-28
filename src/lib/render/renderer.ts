import "server-only";
import { createHash } from "node:crypto";
import { Resvg } from "@resvg/resvg-js";
import { encode as encodeJpeg } from "jpeg-js";
import satori from "satori";
import { loadFonts } from "./fonts";
import { buildSlideElement, type SlideRenderInput } from "./templates";
import { SLIDE_HEIGHT, SLIDE_WIDTH } from "@/lib/stories/constants";

export type { SlideRenderInput } from "./templates";

/** JSX → SVG via Satori (text converted to paths, no system fonts needed). */
export async function renderSlideSvg(input: SlideRenderInput): Promise<string> {
  const fonts = await loadFonts();
  return satori(buildSlideElement(input), { width: SLIDE_WIDTH, height: SLIDE_HEIGHT, fonts });
}

function rasterize(svg: string) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: SLIDE_WIDTH },
    font: { loadSystemFonts: false },
    background: "#000000",
  });
  return resvg.render();
}

/** PRD Task 3.1 — exact 1080×1920 PNG buffer. */
export async function renderSlidePng(input: SlideRenderInput): Promise<Buffer> {
  const svg = await renderSlideSvg(input);
  return Buffer.from(rasterize(svg).asPng());
}

/** JPEG variant (Instagram Content Publishing only accepts JPEG; also lighter for WhatsApp). */
export async function renderSlideJpeg(input: SlideRenderInput, quality = 92): Promise<Buffer> {
  const svg = await renderSlideSvg(input);
  const image = rasterize(svg);
  const encoded = encodeJpeg({ data: image.pixels, width: image.width, height: image.height }, quality);
  return Buffer.from(encoded.data);
}

export function contentEtag(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex").slice(0, 16);
}
