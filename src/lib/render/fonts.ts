import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Font } from "satori";

/** WOFF files copied from @fontsource (Satori supports TTF/OTF/WOFF, not WOFF2). */
const FONT_FILES = [
  { name: "Inter", file: "inter-latin-400-normal.woff", weight: 400, style: "normal" },
  { name: "Inter", file: "inter-latin-600-normal.woff", weight: 600, style: "normal" },
  { name: "Inter", file: "inter-latin-800-normal.woff", weight: 800, style: "normal" },
  { name: "JetBrains Mono", file: "jetbrains-mono-latin-400-normal.woff", weight: 400, style: "normal" },
  { name: "JetBrains Mono", file: "jetbrains-mono-latin-700-normal.woff", weight: 700, style: "normal" },
  { name: "Playfair Display", file: "playfair-display-latin-600-normal.woff", weight: 600, style: "normal" },
  { name: "Playfair Display", file: "playfair-display-latin-700-normal.woff", weight: 700, style: "normal" },
  { name: "Playfair Display", file: "playfair-display-latin-500-italic.woff", weight: 500, style: "italic" },
] as const;

let fontCache: Promise<Font[]> | null = null;

export function loadFonts(): Promise<Font[]> {
  if (!fontCache) {
    const dir = path.join(process.cwd(), "src", "assets", "fonts");
    fontCache = Promise.all(
      FONT_FILES.map(async (f) => ({
        name: f.name,
        data: await readFile(path.join(dir, f.file)),
        weight: f.weight,
        style: f.style,
      })),
    ).catch((err) => {
      fontCache = null;
      throw err;
    });
  }
  return fontCache;
}
