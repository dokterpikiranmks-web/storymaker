import { handleRouteError, jsonOk, readJson, requireDashboard } from "@/lib/api";
import { resetCircuitBreakers } from "@/lib/gemini/detector";
import { buildEngineStatus } from "@/lib/gemini/status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/gemini/status?discover=1&force=1 — Quota Guard snapshot (cascade, cooldowns, telemetry). */
export async function GET(req: Request) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  try {
    const url = new URL(req.url);
    const discover = url.searchParams.get("discover") === "1";
    const force = url.searchParams.get("force") === "1";
    return jsonOk({ engine: await buildEngineStatus({ discover: discover || force, force }) });
  } catch (err) {
    return handleRouteError(err, "gemini:status");
  }
}

/** POST /api/gemini/status { action: "reset" } — close every circuit breaker. */
export async function POST(req: Request) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  try {
    const body = (await readJson(req)) as { action?: string } | null;
    if (body?.action === "reset") resetCircuitBreakers();
    return jsonOk({ engine: await buildEngineStatus({ discover: true, force: body?.action === "reset" }) });
  } catch (err) {
    return handleRouteError(err, "gemini:reset");
  }
}
