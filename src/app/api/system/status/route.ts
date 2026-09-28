import { handleRouteError, jsonOk, requireDashboard } from "@/lib/api";
import { getFeatureFlags } from "@/lib/env";
import { buildEngineStatus } from "@/lib/gemini/status";
import { getWorkerHeartbeat } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dashboard sidebar poll: engine snapshot + feature flags + WhatsApp daemon heartbeat. */
export async function GET(req: Request) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  try {
    const discover = new URL(req.url).searchParams.get("discover") === "1";
    const [engine, worker] = await Promise.all([buildEngineStatus({ discover }), getWorkerHeartbeat()]);
    return jsonOk({ engine, worker, flags: getFeatureFlags() });
  } catch (err) {
    return handleRouteError(err, "system:status");
  }
}
