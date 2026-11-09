/**
 * src/lib/types.ts
 * Core types for Dokter Pikiran Makassar Content Matrix & Persona Engine.
 */

export type SlotTime = "07:00" | "10:00" | "12:00" | "19:00" | "21:00";

export type ContentPillar =
  | "MOTIVASI_PAGI"
  | "KESEHATAN_FUNGSIONAL"
  | "MENTAL_NEUROSAINS"
  | "SELF_TERAPI"
  | "INSPIRASI_MALAM";

export type VisualMode = "illustrated" | "text_only";

export interface StoryStep {
  num: string;
  text: string;
}

export interface StoryHighlight {
  label: string;
  content: string;
}

export interface StoryDraft {
  id: string;
  slot: SlotTime;
  pillar: ContentPillar;
  dayOfWeek: number; // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
  theme: string;
  tag: string;
  title: string;
  quoteMark?: boolean;
  body: string[];
  highlightBox?: StoryHighlight | null;
  steps?: StoryStep[];
  signature: string;
  subSignature: string;
  isRuangPulihPromo: boolean;
  visualModePreferred: VisualMode;
  illustrationPrompt?: string;
}

export interface DailyEdition {
  date: string; // YYYY-MM-DD
  dayName: string; // "Senin", "Selasa", dll
  hasRuangPulihPromo: boolean;
  stories: Record<SlotTime, StoryDraft>;
}

export interface PersonaValidationResult {
  valid: boolean;
  bannedSlangFound: string[];
  isMakassarCompliant: boolean;
  isWordCountSafe: boolean;
  errors: string[];
  warnings: string[];
}
