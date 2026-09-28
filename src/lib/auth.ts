/**
 * Lightweight auth helpers (Web Crypto — works in proxy.ts and route handlers).
 * - Dashboard: optional passcode (DASHBOARD_PASSCODE) → signed, expiring session cookie.
 * - Worker/cron: bearer shared secrets (WORKER_SECRET / CRON_SECRET).
 */

export const SESSION_COOKIE = "sm_session";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function isDashboardAuthEnabled(): boolean {
  return Boolean(process.env.DASHBOARD_PASSCODE?.trim());
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionToken(now = Date.now()): Promise<string | null> {
  const passcode = process.env.DASHBOARD_PASSCODE?.trim();
  if (!passcode) return null;
  const expires = now + SESSION_TTL_MS;
  return `${expires}.${await hmacHex(passcode, `story-maker:v1:${expires}`)}`;
}

export async function verifySessionToken(token: string | null | undefined): Promise<boolean> {
  const passcode = process.env.DASHBOARD_PASSCODE?.trim();
  if (!passcode) return true; // open mode
  if (!token) return false;
  const [expiresRaw, signature] = token.split(".");
  const expires = Number(expiresRaw);
  if (!signature || !Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = await hmacHex(passcode, `story-maker:v1:${expires}`);
  return safeEqual(signature, expected);
}

export function verifyPasscode(input: string): boolean {
  const passcode = process.env.DASHBOARD_PASSCODE?.trim();
  return Boolean(passcode) && safeEqual(input.trim(), passcode!);
}

export function readCookie(req: Request, name: string): string | null {
  const header = req.headers.get("cookie");
  if (!header) return null;
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export async function hasDashboardAccess(req: Request): Promise<boolean> {
  return verifySessionToken(readCookie(req, SESSION_COOKIE));
}

export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export function isWorkerAuthorized(req: Request): boolean {
  const secret = process.env.WORKER_SECRET?.trim();
  const token = bearerToken(req);
  return Boolean(secret && token && safeEqual(token, secret));
}

export function isCronAuthorized(req: Request): boolean {
  const token = bearerToken(req);
  if (!token) return false;
  const cron = process.env.CRON_SECRET?.trim();
  const worker = process.env.WORKER_SECRET?.trim();
  return Boolean((cron && safeEqual(token, cron)) || (worker && safeEqual(token, worker)));
}
