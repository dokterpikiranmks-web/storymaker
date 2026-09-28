import "server-only";
import { getEngineSnapshot } from "./detector";
import { getRecentTelemetry } from "./telemetry";
import type { EngineStatusDTO, TelemetryDTO } from "@/lib/stories/types";

export async function buildEngineStatus(opts: { discover?: boolean; force?: boolean } = {}): Promise<EngineStatusDTO> {
  const snap = await getEngineSnapshot(opts);
  let telemetry: TelemetryDTO[] = [];
  try {
    telemetry = await getRecentTelemetry(12);
  } catch {
    telemetry = [];
  }
  return {
    configured: snap.configured,
    discoverySource: snap.discoverySource,
    discoveredAt: snap.discoveredAt ? new Date(snap.discoveredAt).toISOString() : null,
    discoveredModels: snap.discoveredModels,
    discoveryError: snap.discoveryError,
    optimalModel: snap.optimalModel,
    cascade: snap.cascade.map((m) => ({
      ...m,
      lastSuccessAt: m.lastSuccessAt ? new Date(m.lastSuccessAt).toISOString() : null,
    })),
    prdCascade: snap.prdCascade,
    baseCooldownSeconds: snap.baseCooldownSeconds,
    telemetry,
  };
}
