import "server-only";
import { hasDashboardAccess } from "@/lib/auth";
import { NotFoundError } from "@/lib/campaigns";

/** Defense in depth: proxy.ts already guards, route handlers verify again. */
export async function requireDashboard(req: Request): Promise<Response | null> {
  if (await hasDashboardAccess(req)) return null;
  return jsonError("Unauthorized — silakan login dulu", 401);
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function jsonError(message: string, status = 400, extra?: Record<string, unknown>): Response {
  return Response.json({ success: false, error: message, ...extra }, { status, headers: { "Cache-Control": "no-store" } });
}

export function jsonOk<T extends Record<string, unknown>>(data: T, init?: ResponseInit): Response {
  return Response.json({ success: true, ...data }, { ...init, headers: { "Cache-Control": "no-store", ...(init?.headers ?? {}) } });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export function handleRouteError(err: unknown, context: string): Response {
  if (err instanceof NotFoundError) return jsonError(err.message, 404);
  console.error(`[${context}]`, err);

  const msg = err instanceof Error ? err.message : String(err);
  const cause = (err as { cause?: { code?: string; message?: string } })?.cause;
  if (
    cause?.code === "ECONNREFUSED" ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("DATABASE_URL") ||
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes("127.0.0.1")
  ) {
    return jsonError(
      "Koneksi database gagal. Pastikan variabel DATABASE_URL (Supabase Postgres) sudah dimasukkan di Vercel Environment Variables.",
      503
    );
  }

  if (msg.includes("duplicate key") || msg.includes("unique constraint") || (err as { code?: string })?.code === "23505") {
    return jsonError(`Konflik database (duplicate key): ${msg}`, 409);
  }

  if (msg.includes("503") || msg.includes("overloaded") || msg.includes("UNAVAILABLE")) {
    return jsonError(`Gemini AI service unavailable (503): ${msg}. Silakan coba beberapa saat lagi atau jalankan CLI generator.`, 503);
  }

  if (msg.includes("timeout") || msg.includes("timed out") || msg.includes("ETIMEDOUT") || msg.includes("DEADLINE_EXCEEDED")) {
    return jsonError(`Waktu tunggu terlampaui (timeout): ${msg}. Gunakan skrip CLI 'npm run generate:today' sebagai fallback.`, 504);
  }

  return jsonError(msg || "Terjadi kesalahan internal pada server.", 500);
}

export function pngResponse(buffer: Buffer, opts: { filename?: string; download?: boolean; cache?: string; contentType?: string } = {}): Response {
  const headers: Record<string, string> = {
    "Content-Type": opts.contentType ?? "image/png",
    "Content-Length": String(buffer.length),
    "Cache-Control": opts.cache ?? "no-store",
  };
  if (opts.filename) {
    headers["Content-Disposition"] = `${opts.download ? "attachment" : "inline"}; filename="${opts.filename}"`;
  }
  return new Response(new Uint8Array(buffer), { headers });
}
