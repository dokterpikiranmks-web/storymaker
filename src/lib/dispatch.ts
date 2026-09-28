import "server-only";
import { and, eq, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { storySlides } from "@/db/schema";
import { finalizeSlideStatus, getSlide, slideRenderInput } from "@/lib/campaigns";
import { absoluteUrl, isPublicHttpsUrl } from "@/lib/env";
import { isInstagramConfigured, publishInstagramStory } from "@/lib/instagram";
import { contentEtag, renderSlideJpeg } from "@/lib/render/renderer";
import { getPersona } from "@/lib/settings";
import { isSupabaseStorageConfigured, uploadPublicAsset } from "@/lib/supabase/server";

export type InstagramDispatchResult =
  | { ok: true; mediaId: string; skipped?: boolean }
  | { ok: false; error: string; skipped?: boolean };

/**
 * Publishes one slide as an Instagram Story. Idempotent + lock protected so the
 * dashboard, the local daemon and the cron endpoint can never double-post.
 */
export async function dispatchInstagramForSlide(slideId: string, req?: Request): Promise<InstagramDispatchResult> {
  if (!isInstagramConfigured()) {
    return { ok: false, error: "Instagram belum dikonfigurasi (IG_USER_ID / IG_ACCESS_TOKEN)" };
  }
  const slide = await getSlide(slideId);
  if (!slide) return { ok: false, error: "Slide tidak ditemukan" };
  if (slide.igPostedAt) return { ok: true, mediaId: slide.igMediaId ?? "", skipped: true };

  const lockCutoff = new Date(Date.now() - 5 * 60_000);
  const claimed = await db
    .update(storySlides)
    .set({ igLockAt: new Date() })
    .where(and(eq(storySlides.id, slideId), isNull(storySlides.igPostedAt), or(isNull(storySlides.igLockAt), lt(storySlides.igLockAt, lockCutoff))))
    .returning({ id: storySlides.id });
  if (claimed.length === 0) return { ok: false, error: "Slide sedang diproses oleh proses lain", skipped: true };

  try {
    const persona = await getPersona();
    const jpeg = await renderSlideJpeg(slideRenderInput(slide, persona));
    const etag = contentEtag(jpeg);
    const imageUrl = isSupabaseStorageConfigured()
      ? await uploadPublicAsset(`instagram/${slide.id}-${etag}.jpg`, jpeg, "image/jpeg")
      : absoluteUrl(`/api/media/${slide.id}?format=jpg&v=${etag}`, req);

    if (!isPublicHttpsUrl(imageUrl)) {
      throw new Error(
        `Instagram butuh URL gambar HTTPS publik, sedangkan URL saat ini ${imageUrl}. Set APP_URL ke domain publik (mis. Vercel) atau aktifkan Supabase Storage.`,
      );
    }

    const { containerId, mediaId } = await publishInstagramStory(imageUrl);
    const now = new Date();
    await db
      .update(storySlides)
      .set({
        igPostedAt: now,
        igMediaId: mediaId,
        igLockAt: null,
        lastError: null,
        meta: sql`${storySlides.meta} || ${JSON.stringify({ igContainerId: containerId })}::jsonb`,
        updatedAt: now,
      })
      .where(eq(storySlides.id, slideId));
    await finalizeSlideStatus(slideId);
    return { ok: true, mediaId };
  } catch (err) {
    const message = (err as Error).message || "Gagal publish ke Instagram";
    await db
      .update(storySlides)
      .set({
        igLockAt: null,
        lastError: `Instagram: ${message.slice(0, 500)}`,
        ...(slide.status === "SCHEDULED" ? { status: "FAILED" as const } : {}),
        updatedAt: new Date(),
      })
      .where(eq(storySlides.id, slideId));
    return { ok: false, error: message };
  }
}
