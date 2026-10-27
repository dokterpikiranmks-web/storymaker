/**
 * Shared (client + server safe) constants for the 4-Act framework and visual themes.
 */

export const ACT_TYPES = ["ACT_1_HOOK", "ACT_2_SOMATIC", "ACT_3_CLINICAL_AI", "ACT_4_ANCHOR"] as const;
export type ActType = (typeof ACT_TYPES)[number];

export const THEME_NAMES = ["Neuro-Dark", "Somatic-Clean", "Hacker-Terminal", "Minimal-Hypnotic"] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export const POST_STATUSES = ["DRAFT", "SCHEDULED", "POSTED", "FAILED"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export interface ActDefinition {
  act: ActType;
  index: number;
  slot: string;
  slotEmoji: string;
  time: string;
  title: string;
  shortTitle: string;
  goal: string;
  defaultTheme: ThemeName;
}

export const ACTS: Record<ActType, ActDefinition> = {
  ACT_1_HOOK: {
    act: "ACT_1_HOOK",
    index: 1,
    slot: "Pagi",
    slotEmoji: "🌅",
    time: "07:15",
    title: "Morning Insight & Self-Check",
    shortTitle: "Morning Insight",
    goal: "Refleksi ringan & mind-body check pagi yang relevan dan melegakan.",
    defaultTheme: "Neuro-Dark",
  },
  ACT_2_SOMATIC: {
    act: "ACT_2_SOMATIC",
    index: 2,
    slot: "Siang",
    slotEmoji: "☀️",
    time: "12:30",
    title: "Mid-Day Somatic & Herbal Reset",
    shortTitle: "Physical Reset",
    goal: "Solusi fisik somatik / herbal 30 detik yang bisa langsung dicoba di meja kerja.",
    defaultTheme: "Somatic-Clean",
  },
  ACT_3_CLINICAL_AI: {
    act: "ACT_3_CLINICAL_AI",
    index: 3,
    slot: "Sore",
    slotEmoji: "🌇",
    time: "18:45",
    title: "Kisah Meja Terapi (Behind The Room)",
    shortTitle: "Meja Terapi",
    goal: "Studi kasus manusiawi: Gejala Pasien -> Akar Masalah Saraf -> Hasil Pemulihan.",
    defaultTheme: "Hacker-Terminal",
  },
  ACT_4_ANCHOR: {
    act: "ACT_4_ANCHOR",
    index: 4,
    slot: "Malam",
    slotEmoji: "🌙",
    time: "21:00",
    title: "Night Rest & Soft Lead Magnet",
    shortTitle: "Night Reset",
    goal: "Sugesti ketenangan tidur + ajakan chat WhatsApp santai klaim modul PDF gratis.",
    defaultTheme: "Minimal-Hypnotic",
  },
};

export const ACT_LIST: ActDefinition[] = ACT_TYPES.map((a) => ACTS[a]);

export interface ThemeDefinition {
  name: ThemeName;
  tagline: string;
  bg: string;
  fg: string;
  accent: string;
  accent2: string;
}

export const THEMES: Record<ThemeName, ThemeDefinition> = {
  "Neuro-Dark": {
    name: "Neuro-Dark",
    tagline: "Warm Botanical Sage — Morning Insight",
    bg: "#FAF7F2",
    fg: "#1B2E25",
    accent: "#2D6A4F",
    accent2: "#E8EFE9",
  },
  "Somatic-Clean": {
    name: "Somatic-Clean",
    tagline: "Porcelain Minimal & Clinical Blue — Physical Reset",
    bg: "#F8FAFC",
    fg: "#0F172A",
    accent: "#0284C7",
    accent2: "#E0F2FE",
  },
  "Hacker-Terminal": {
    name: "Hacker-Terminal",
    tagline: "Warm Linen & Terracotta — Meja Terapi",
    bg: "#FDFBF7",
    fg: "#26211C",
    accent: "#C25E38",
    accent2: "#F3EDE2",
  },
  "Minimal-Hypnotic": {
    name: "Minimal-Hypnotic",
    tagline: "Deep Twilight & Champagne Gold — Night Rest & PDF",
    bg: "#0B0F17",
    fg: "#F8FAFC",
    accent: "#F59E0B",
    accent2: "#FDE68A",
  },
};

export const SLIDE_WIDTH = 1080;
export const SLIDE_HEIGHT = 1920;

export function isActType(value: unknown): value is ActType {
  return typeof value === "string" && (ACT_TYPES as readonly string[]).includes(value);
}

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === "string" && (THEME_NAMES as readonly string[]).includes(value);
}

/** Tolerant theme matcher: "neuro dark", "NEURO_DARK", "hacker terminal" → canonical names. */
export function normalizeTheme(value: unknown, fallback: ThemeName): ThemeName {
  if (isThemeName(value)) return value;
  if (typeof value !== "string") return fallback;
  const key = value.toLowerCase().replace(/[^a-z]/g, "");
  const match = THEME_NAMES.find((t) => t.toLowerCase().replace(/[^a-z]/g, "") === key);
  if (match) return match;
  if (key.includes("neuro")) return "Neuro-Dark";
  if (key.includes("somatic") || key.includes("clean")) return "Somatic-Clean";
  if (key.includes("hacker") || key.includes("terminal")) return "Hacker-Terminal";
  if (key.includes("hypno") || key.includes("minimal")) return "Minimal-Hypnotic";
  return fallback;
}

/** "07:15:00" → "07:15" */
export function shortTime(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 5);
}
