import "server-only";
import type { FeatureFlags } from "@/lib/stories/types";

const DEFAULT_TZ = "Asia/Makassar";

export function getAppTimezone(): string {
  const tz = process.env.APP_TIMEZONE?.trim() || DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return tz;
  } catch {
    return DEFAULT_TZ;
  }
}

/** YYYY-MM-DD for "today" in the configured timezone. */
export function todayInTimezone(tz = getAppTimezone(), offsetDays = 0): string {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Public base URL — env first, then forwarded headers, then localhost. */
export function getPublicBaseUrl(req?: Request): string {
  const envUrl = process.env.APP_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  if (req) {
    const headers = req.headers;
    const host = headers.get("x-forwarded-host") || headers.get("host");
    if (host) {
      const proto = headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
      return `${proto}://${host}`;
    }
  }
  return "http://localhost:3000";
}

export function absoluteUrl(pathOrUrl: string, req?: Request): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${getPublicBaseUrl(req)}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function isPublicHttpsUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return false;
    const host = u.hostname;
    return !(
      host === "localhost" ||
      host.endsWith(".local") ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      host === "0.0.0.0"
    );
  } catch {
    return false;
  }
}

export function getFeatureFlags(): FeatureFlags {
  const tz = getAppTimezone();
  const dbUrl = process.env.DATABASE_URL?.trim();
  const isRealDb = Boolean(dbUrl && !dbUrl.includes("127.0.0.1") && !dbUrl.includes("localhost"));
  return {
    databaseConfigured: isRealDb,
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim()),
    supabaseStorageConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    ),
    instagramConfigured: Boolean(process.env.IG_USER_ID?.trim() && process.env.IG_ACCESS_TOKEN?.trim()),
    workerSecretConfigured: Boolean(process.env.WORKER_SECRET?.trim()),
    dashboardAuthEnabled: Boolean(process.env.DASHBOARD_PASSCODE?.trim()),
    timezone: tz,
    appUrl: getPublicBaseUrl(),
    today: todayInTimezone(tz),
  };
}
