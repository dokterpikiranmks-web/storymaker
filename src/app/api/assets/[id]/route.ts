import { eq } from "drizzle-orm";
import { db } from "@/db";
import { storyAssets } from "@/db/schema";
import { isUuid } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public: serves PNGs stored in Postgres (fallback when Supabase Storage is not configured). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });
  const [row] = await db
    .select({ data: storyAssets.data, contentType: storyAssets.contentType, etag: storyAssets.etag })
    .from(storyAssets)
    .where(eq(storyAssets.id, id))
    .limit(1);
  if (!row) return new Response("Not found", { status: 404 });

  const etag = `"${row.etag}"`;
  const versioned = new URL(req.url).searchParams.get("v") === row.etag;
  const cache = versioned ? "public, max-age=31536000, immutable" : "public, max-age=30";
  if (req.headers.get("if-none-match") === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": cache } });
  }
  return new Response(new Uint8Array(row.data), {
    headers: { "Content-Type": row.contentType, "Content-Length": String(row.data.length), ETag: etag, "Cache-Control": cache },
  });
}
