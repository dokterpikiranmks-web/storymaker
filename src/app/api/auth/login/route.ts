import { NextResponse } from "next/server";
import { createSessionToken, isDashboardAuthEnabled, SESSION_COOKIE, SESSION_TTL_MS, verifyPasscode } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Naive in-memory brute-force throttle (per instance): 8 attempts / 5 minutes / IP.
const attempts = new Map<string, { count: number; resetAt: number }>();

function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}

export async function POST(req: Request) {
  if (!isDashboardAuthEnabled()) return NextResponse.json({ ok: true, open: true });

  const ip = clientIp(req);
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.resetAt > now && entry.count >= 8) {
    return NextResponse.json({ error: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success || !verifyPasscode(parsed.data.passcode)) {
    attempts.set(ip, { count: (entry && entry.resetAt > now ? entry.count : 0) + 1, resetAt: entry && entry.resetAt > now ? entry.resetAt : now + 5 * 60_000 });
    await new Promise((r) => setTimeout(r, 400));
    return NextResponse.json({ error: "Passcode salah" }, { status: 401 });
  }

  attempts.delete(ip);
  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  const secure = new URL(req.url).protocol === "https:" || req.headers.get("x-forwarded-proto") === "https";
  res.cookies.set(SESSION_COOKIE, token ?? "", {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  });
  return res;
}
