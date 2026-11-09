/**
 * src/lib/ahmad-persona.ts
 * Persona Engine & Language Filter for Ahmad Jawahir Zain (Dokter Pikiran Makassar).
 *
 * Rules:
 * 1. Strictly bans Jakarta/street slang ("ngga", "ngira", "lu", "gue", "banget", etc.).
 * 2. Enforces warm, dignified, and professional Makassar persona (santai tapi formal).
 * 3. Enforces 1-slide word count limits (max 120 words total) to guarantee 3-5 second readability.
 * 4. Enforces Ruang Pulih soft-promo empathy guidelines (zero hard-selling).
 */

import type { StoryDraft, PersonaValidationResult } from "./types";

export const BANNED_JAKARTA_SLANG = [
  "ngga",
  "nggak",
  "ngga'",
  "nggaak",
  "ngira",
  "ngirain",
  "lu",
  "gue",
  "gw",
  "lo",
  "loe",
  "banget",
  "bgt",
  "udah",
  "udh",
  "bikin pusing lu",
  "gila ini",
  "keles",
  "bray",
  "cuy",
  "mager",
  "mageran",
  "baper",
  "baperan",
  "bocil",
  "santuy",
  "kepo",
  "kepoan",
  "lebay",
];

export const ALLOWED_PROMO_DAYS = [2, 4, 6]; // 2 = Selasa, 4 = Kamis, 6 = Sabtu

/**
 * Validates text against banned street/Jakarta slang.
 * Returns a list of offending words found.
 */
export function detectBannedSlang(text: string): string[] {
  const normalized = text.toLowerCase();
  const found: string[] = [];

  for (const slang of BANNED_JAKARTA_SLANG) {
    // Match whole words or boundary
    const regex = new RegExp(`\\b${slang}\\b`, "i");
    if (regex.test(normalized)) {
      found.push(slang);
    }
  }

  return found;
}

/**
 * Calculates total word count across title, body, steps, and highlights.
 */
export function calculateStoryWordCount(draft: StoryDraft): number {
  const parts: string[] = [draft.title, ...draft.body];

  if (draft.highlightBox?.content) {
    parts.push(draft.highlightBox.content);
  }

  if (draft.steps) {
    draft.steps.forEach((s) => parts.push(s.text));
  }

  const fullText = parts.join(" ");
  return fullText.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validates a single StoryDraft against all persona and editorial criteria.
 */
export function validateStoryDraft(draft: StoryDraft): PersonaValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Slang check
  const allText = [
    draft.title,
    ...draft.body,
    draft.highlightBox?.content || "",
    draft.steps?.map((s) => s.text).join(" ") || "",
  ].join(" ");

  const bannedFound = detectBannedSlang(allText);
  if (bannedFound.length > 0) {
    errors.push(
      `Ditemukan slang gaul Jakarta yang dilarang: [${bannedFound.join(
        ", "
      )}]. Gunakan bahasa Indonesia bersih dan santun khas Makassar (Anda/kita, tidak, mengira, sering kali).`
    );
  }

  // 2. Word count check (1-slide safety)
  const wordCount = calculateStoryWordCount(draft);
  const isWordCountSafe = wordCount <= 130;
  if (!isWordCountSafe) {
    errors.push(
      `Jumlah kata melebihi batas 1-slide (${wordCount} kata, maksimal 130 kata). Konten harus ringkas agar terbaca tuntas dalam 3-5 detik.`
    );
  } else if (wordCount > 105) {
    warnings.push(
      `Panjang naskah (${wordCount} kata) mendekati batas atas. Pastikan spasi tetap lega pada rasio 9:16.`
    );
  }

  // 3. Title length check
  const titleWords = draft.title.trim().split(/\s+/).length;
  if (titleWords < 3) {
    errors.push("Judul terlalu pendek (minimal 3 kata).");
  } else if (titleWords > 14) {
    errors.push("Judul terlalu panjang untuk 1 slide (maksimal 14 kata).");
  }

  // 4. Ruang Pulih promo day compliance
  if (draft.isRuangPulihPromo) {
    if (draft.slot !== "12:00") {
      errors.push("Promosi Ruang Pulih hanya diperbolehkan pada slot siang (12:00 WITA).");
    }

    if (!ALLOWED_PROMO_DAYS.includes(draft.dayOfWeek)) {
      warnings.push(
        `Promosi Ruang Pulih dijadwalkan pada hari ke-${draft.dayOfWeek}. Standar 3x seminggu adalah Selasa (2), Kamis (4), dan Sabtu (6).`
      );
    }

    // Check soft-selling tone
    const promoText = (draft.highlightBox?.content || "").toLowerCase();
    if (promoText.includes("diskon") || promoText.includes("murah") || promoText.includes("promo terbatas")) {
      errors.push(
        "Promosi Ruang Pulih dilarang menggunakan hard-selling murahan ('diskon', 'murah'). Gunakan formula Jembatan Empati."
      );
    }
  }

  // 5. Tone check: ensure polite pronouns
  const hasPolitePronouns = /\b(anda|kita|diri|kami)\b/i.test(allText);
  if (!hasPolitePronouns) {
    warnings.push("Disarankan menyertakan sapaan hangat seperti 'Anda' atau 'kita' untuk menjaga keakraban.");
  }

  const isMakassarCompliant = bannedFound.length === 0;
  const valid = errors.length === 0;

  return {
    valid,
    bannedSlangFound: bannedFound,
    isMakassarCompliant,
    isWordCountSafe,
    errors,
    warnings,
  };
}
