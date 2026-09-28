import "server-only";
import { db } from "@/db";
import { storyAssets } from "@/db/schema";
import { isSupabaseStorageConfigured, removeAssets, uploadPublicAsset } from "@/lib/supabase/server";

export interface StoredAsset {
  url: string;
  storage: "supabase" | "database";
  etag: string;
  path?: string;
}

/**
 * PRD Task 3.3 — persist a rendered PNG and return its public URL.
 * 1) Supabase Storage bucket `story-assets` when configured.
 * 2) Otherwise Postgres (`story_assets`, served by /api/assets/[id]).
 */
export async function storeRenderedImage(opts: {
  png: Buffer;
  etag: string;
  slideId?: string;
  campaignId?: string;
  previousPath?: string;
}): Promise<StoredAsset> {
  if (isSupabaseStorageConfigured()) {
    try {
      const folder = opts.campaignId ? `campaigns/${opts.campaignId}` : "adhoc";
      const path = `${folder}/${opts.slideId ?? "slide"}-${opts.etag}.png`;
      const url = await uploadPublicAsset(path, opts.png, "image/png");
      if (opts.previousPath && opts.previousPath !== path) {
        removeAssets([opts.previousPath]).catch(() => undefined);
      }
      return { url, storage: "supabase", etag: opts.etag, path };
    } catch (err) {
      console.warn("[storage] Supabase upload failed — falling back to Postgres:", (err as Error).message);
    }
  }

  const values = {
    slideId: opts.slideId ?? null,
    contentType: "image/png",
    data: opts.png,
    byteSize: opts.png.length,
    etag: opts.etag,
  };
  const [row] = opts.slideId
    ? await db
        .insert(storyAssets)
        .values(values)
        .onConflictDoUpdate({
          target: storyAssets.slideId,
          set: { data: opts.png, byteSize: opts.png.length, etag: opts.etag, contentType: "image/png", updatedAt: new Date() },
        })
        .returning({ id: storyAssets.id })
    : await db.insert(storyAssets).values(values).returning({ id: storyAssets.id });

  return { url: `/api/assets/${row.id}?v=${opts.etag}`, storage: "database", etag: opts.etag };
}
