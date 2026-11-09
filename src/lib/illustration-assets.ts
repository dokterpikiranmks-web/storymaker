/**
 * src/lib/illustration-assets.ts
 * Manages illustration asset caching and mapping for Dokter Pikiran Makassar.
 */

import fs from "fs";
import path from "path";
import type { ContentPillar } from "./types";

const memoryCache = new Map<string, string>();

/**
 * Resolves local image file to base64 data URL with caching.
 */
export function getLocalImageAsBase64(relativePath: string): string | null {
  if (memoryCache.has(relativePath)) {
    return memoryCache.get(relativePath)!;
  }

  const projectRoot = process.cwd();
  const fullPath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(projectRoot, relativePath);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const buffer = fs.readFileSync(fullPath);
  const ext = path.extname(fullPath).toLowerCase();
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg";
  const base64 = `data:${mimeType};base64,${buffer.toString("base64")}`;

  memoryCache.set(relativePath, base64);
  return base64;
}

/**
 * Standard pillar default illustrations.
 */
export const DEFAULT_PILLAR_ILLUSTRATIONS: Record<ContentPillar, string> = {
  MOTIVASI_PAGI: "public/samples/morning-peace-illustration.jpg",
  KESEHATAN_FUNGSIONAL: "public/samples/gut-brain-illustration.jpg",
  MENTAL_NEUROSAINS: "public/samples/gut-brain-illustration.jpg",
  SELF_TERAPI: "public/samples/gut-brain-illustration.jpg",
  INSPIRASI_MALAM: "public/samples/morning-peace-illustration.jpg",
};

/**
 * Gets base64 data URL for an illustration by pillar or explicit file path.
 */
export function getIllustrationForPillar(
  pillar: ContentPillar,
  customPath?: string
): string | null {
  if (customPath) {
    const custom = getLocalImageAsBase64(customPath);
    if (custom) return custom;
  }

  const defaultRel = DEFAULT_PILLAR_ILLUSTRATIONS[pillar];
  return getLocalImageAsBase64(defaultRel);
}
