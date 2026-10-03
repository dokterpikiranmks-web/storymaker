import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appState } from "@/db/schema";
import type { PersonaSettings, WorkerHeartbeatDTO } from "@/lib/stories/types";
import { personaSchema } from "@/lib/validation";

export const PERSONA_KEY = "persona";
export const WORKER_HEARTBEAT_KEY = "worker:whatsapp";

export function defaultPersona(): PersonaSettings {
  return {
    creatorName: process.env.CREATOR_NAME?.trim() || "Dokter Pikiran",
    handle: process.env.CREATOR_HANDLE?.trim() || "@dokterpikiran",
    ctaKeyword: (process.env.CTA_KEYWORD?.trim() || "RESET").toUpperCase(),
    whatsappNumber: "",
    audience:
      "Profesional & pebisnis usia 25–45 tahun yang lelah mental, sulit tidur, overthinking, dan ingin performa tinggi tanpa burnout.",
    signature: "Klinik & Edukasi Kesehatan Holistik Dokter Pikiran",
    voiceNotes: "",
  };
}

export async function getAppState<T extends Record<string, unknown>>(key: string): Promise<{ value: T; updatedAt: Date } | null> {
  const [row] = await db.select().from(appState).where(eq(appState.key, key)).limit(1);
  return row ? { value: row.value as T, updatedAt: row.updatedAt } : null;
}

export async function setAppState(key: string, value: Record<string, unknown>): Promise<void> {
  await db
    .insert(appState)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: appState.key, set: { value, updatedAt: new Date() } });
}

export async function getPersona(): Promise<PersonaSettings> {
  const defaults = defaultPersona();
  try {
    const row = await getAppState<Record<string, unknown>>(PERSONA_KEY);
    if (!row) return defaults;
    const parsed = personaSchema.partial().safeParse(row.value);
    if (!parsed.success) return defaults;
    const merged: PersonaSettings = { ...defaults };
    for (const [k, v] of Object.entries(parsed.data)) {
      if (typeof v === "string") (merged as unknown as Record<string, string>)[k] = v;
    }
    merged.ctaKeyword = merged.ctaKeyword.toUpperCase();
    return merged;
  } catch {
    return defaults;
  }
}

export async function savePersona(persona: PersonaSettings): Promise<PersonaSettings> {
  const normalized = { ...persona, ctaKeyword: persona.ctaKeyword.toUpperCase() };
  await setAppState(PERSONA_KEY, normalized as unknown as Record<string, unknown>);
  return normalized;
}

export async function getWorkerHeartbeat(): Promise<WorkerHeartbeatDTO> {
  try {
    const row = await getAppState<{ connected?: boolean; me?: string | null; version?: string | null }>(WORKER_HEARTBEAT_KEY);
    if (!row) return { lastSeen: null, connected: false, me: null, version: null };
    return {
      lastSeen: row.updatedAt.toISOString(),
      connected: Boolean(row.value.connected),
      me: row.value.me ?? null,
      version: row.value.version ?? null,
    };
  } catch {
    return { lastSeen: null, connected: false, me: null, version: null };
  }
}
