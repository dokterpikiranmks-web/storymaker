import "server-only";
import { desc, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { geminiModelTelemetry } from "@/db/schema";
import type { TelemetryDTO } from "@/lib/stories/types";

export interface TelemetryEvent {
  modelName: string;
  statusCode: number;
  latencyMs?: number | null;
  errorMessage?: string | null;
  requestId?: string | null;
}

/** Remove anything that looks like a credential before persisting error text. */
export function sanitizeErrorMessage(message: string | null | undefined, max = 600): string | null {
  if (!message) return null;
  return message
    .replace(/key=[A-Za-z0-9_\-]+/g, "key=***")
    .replace(/AIza[0-9A-Za-z_\-]{20,}/g, "AIza***")
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, "Bearer ***")
    .slice(0, max);
}

/** Fire-and-forget: telemetry must never break a user request. */
export async function recordTelemetry(event: TelemetryEvent): Promise<void> {
  try {
    await db.insert(geminiModelTelemetry).values({
      modelName: event.modelName,
      statusCode: event.statusCode,
      latencyMs: event.latencyMs == null ? null : Math.round(event.latencyMs),
      errorMessage: sanitizeErrorMessage(event.errorMessage),
      requestId: event.requestId ?? null,
    });
  } catch (err) {
    console.warn("[gemini-telemetry] failed to persist event", (err as Error).message);
  }
}

export async function getTelemetrySince(sinceMs: number, limit = 400) {
  const since = new Date(Date.now() - sinceMs);
  return db
    .select()
    .from(geminiModelTelemetry)
    .where(gte(geminiModelTelemetry.timestamp, since))
    .orderBy(desc(geminiModelTelemetry.timestamp))
    .limit(limit);
}

export async function getRecentTelemetry(limit = 12): Promise<TelemetryDTO[]> {
  const rows = await db
    .select()
    .from(geminiModelTelemetry)
    .orderBy(desc(geminiModelTelemetry.timestamp))
    .limit(limit);
  return rows.map((r) => ({
    id: r.id,
    modelName: r.modelName,
    statusCode: r.statusCode,
    latencyMs: r.latencyMs,
    errorMessage: r.errorMessage,
    requestId: r.requestId,
    timestamp: r.timestamp.toISOString(),
  }));
}

export async function getTelemetryStats(hours = 24) {
  const since = new Date(Date.now() - hours * 3_600_000);
  return db
    .select({
      modelName: geminiModelTelemetry.modelName,
      statusCode: geminiModelTelemetry.statusCode,
      count: sql<number>`count(*)::int`,
      avgLatency: sql<number | null>`round(avg(${geminiModelTelemetry.latencyMs}))::int`,
    })
    .from(geminiModelTelemetry)
    .where(gte(geminiModelTelemetry.timestamp, since))
    .groupBy(geminiModelTelemetry.modelName, geminiModelTelemetry.statusCode);
}
