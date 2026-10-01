import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase admin client (service-role key — NEVER import from client code).
 * Used for the `story-assets` Storage bucket (PRD Task 3.3). Database access
 * itself goes through Drizzle + DATABASE_URL (Supabase Postgres compatible).
 */
const globalForSupabase = globalThis as typeof globalThis & {
  __storyMakerSupabaseAdmin?: SupabaseClient;
  __storyMakerBucketReady?: boolean;
};

export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET?.trim() || "rendered-slides";
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (!isSupabaseStorageConfigured()) return null;
  if (!globalForSupabase.__storyMakerSupabaseAdmin) {
    globalForSupabase.__storyMakerSupabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
      process.env.SUPABASE_SERVICE_ROLE_KEY!.trim(),
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }
  return globalForSupabase.__storyMakerSupabaseAdmin;
}

/** Creates the public bucket on first use (idempotent). */
export async function ensureStorageBucket(): Promise<void> {
  if (globalForSupabase.__storyMakerBucketReady) return;
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase Storage belum dikonfigurasi");
  const bucket = getStorageBucket();
  const { data } = await supabase.storage.getBucket(bucket);
  if (!data) {
    const { error } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: "10MB",
      allowedMimeTypes: ["image/png", "image/jpeg"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  }
  globalForSupabase.__storyMakerBucketReady = true;
}

export async function uploadPublicAsset(path: string, data: Buffer, contentType: string): Promise<string> {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase Storage belum dikonfigurasi");
  await ensureStorageBucket();
  const bucket = getStorageBucket();
  const { error } = await supabase.storage.from(bucket).upload(path, data, {
    contentType,
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function removeAssets(paths: string[]): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase || paths.length === 0) return;
  await supabase.storage.from(getStorageBucket()).remove(paths);
}
