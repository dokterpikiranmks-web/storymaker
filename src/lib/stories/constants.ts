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
    title: "Pattern Interrupt & Open Loop",
    shortTitle: "Pattern Interrupt",
    goal: "Paradoks pikiran/tubuh yang memicu rasa penasaran — loop dibiarkan terbuka.",
    defaultTheme: "Neuro-Dark",
  },
  ACT_2_SOMATIC: {
    act: "ACT_2_SOMATIC",
    index: 2,
    slot: "Siang",
    slotEmoji: "☀️",
    time: "12:30",
    title: "Somatic & Logic Breakthrough",
    shortTitle: "Somatic Breakthrough",
    goal: "Solusi fisik totok saraf / biologi fungsional yang bisa langsung dicoba.",
    defaultTheme: "Somatic-Clean",
  },
  ACT_3_CLINICAL_AI: {
    act: "ACT_3_CLINICAL_AI",
    index: 3,
    slot: "Sore",
    slotEmoji: "🌇",
    time: "18:45",
    title: "The Clinical & AI Parallel",
    shortTitle: "Clinical × AI",
    goal: "Kisah meja terapi yang dianalogikan dengan rekayasa prompt / kode AI.",
    defaultTheme: "Hacker-Terminal",
  },
  ACT_4_ANCHOR: {
    act: "ACT_4_ANCHOR",
    index: 4,
    slot: "Malam",
    slotEmoji: "🌙",
    time: "21:30",
    title: "Subconscious Anchor & CTA",
    shortTitle: "Subconscious Anchor",
    goal: "Sugesti relaksasi Alpha/Theta + kata kunci pemicu chat WhatsApp.",
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
    tagline: "Deep Emerald & Cream Warm — Checklist Pagi",
    bg: "#061A14",
    fg: "#FBF7EE",
    accent: "#34D399",
    accent2: "#F5EEDB",
  },
  "Somatic-Clean": {
    name: "Somatic-Clean",
    tagline: "Slate Grey & Ice Clinical Blue — 3-Step Action",
    bg: "#0B1120",
    fg: "#F8FAFC",
    accent: "#38BDF8",
    accent2: "#94A3B8",
  },
  "Hacker-Terminal": {
    name: "Hacker-Terminal",
    tagline: "Deep Earth Charcoal & Warm Ochre — Split Comparison",
    bg: "#161412",
    fg: "#FAF5EF",
    accent: "#F59E0B",
    accent2: "#D97706",
  },
  "Minimal-Hypnotic": {
    name: "Minimal-Hypnotic",
    tagline: "Midnight Obsidian & Gold Accent — Lead Magnet Card",
    bg: "#09090B",
    fg: "#FAFAF9",
    accent: "#FBBF24",
    accent2: "#D4AF37",
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
