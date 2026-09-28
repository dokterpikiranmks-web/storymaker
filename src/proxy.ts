import { NextResponse, type NextRequest } from "next/server";
import { isDashboardAuthEnabled, SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * Next.js 16 Proxy (formerly middleware). When DASHBOARD_PASSCODE is set, every
 * page + dashboard API requires a signed session cookie. Worker/cron/dispatch
 * routes authenticate with bearer secrets inside their handlers; /api/assets and
 * /api/media are intentionally public (unguessable UUIDs, needed by Meta).
 */
export async function proxy(request: NextRequest) {
  if (!isDashboardAuthEnabled()) return NextResponse.next();
  if (await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized — silakan login dulu" }, { status: 401 });
  }
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/health|api/assets|api/media|api/worker|api/cron|api/dispatch|api/auth).*)",
  ],
};
