/**
 * src/lib/story-curator.ts
 * Curator & Pipeline Orchestrator for Dokter Pikiran Makassar.
 */

import { WEEKLY_CONTENT_MATRIX, getDailyEdition } from "./content-matrix";
import { validateStoryDraft } from "./ahmad-persona";
import type { DailyEdition, SlotTime, PersonaValidationResult, StoryDraft } from "./types";

export interface EditionValidationSummary {
  valid: boolean;
  totalErrors: number;
  totalWarnings: number;
  slotResults: Record<SlotTime, PersonaValidationResult>;
}

/**
 * Validates an entire 5-slot DailyEdition against Ahmad Persona standards.
 */
export function validateDailyEdition(edition: DailyEdition): EditionValidationSummary {
  const slots: SlotTime[] = ["07:00", "10:00", "12:00", "19:00", "21:00"];
  const slotResults = {} as Record<SlotTime, PersonaValidationResult>;

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const slot of slots) {
    const draft = edition.stories[slot];
    if (!draft) {
      slotResults[slot] = {
        valid: false,
        bannedSlangFound: [],
        isMakassarCompliant: false,
        isWordCountSafe: false,
        errors: [`Slot ${slot} tidak ditemukan dalam edisi harian.`],
        warnings: [],
      };
      totalErrors++;
      continue;
    }

    const res = validateStoryDraft(draft);
    slotResults[slot] = res;
    totalErrors += res.errors.length;
    totalWarnings += res.warnings.length;
  }

  return {
    valid: totalErrors === 0,
    totalErrors,
    totalWarnings,
    slotResults,
  };
}

/**
 * Returns a weekly schedule overview with promo counts and theme breakdowns.
 */
export function getWeeklyScheduleAudit() {
  const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const weeklyData = [];
  let totalStories = 0;
  let totalPromoStories = 0;

  for (let d = 0; d < 7; d++) {
    const dayEdition = WEEKLY_CONTENT_MATRIX[d];
    const stories = Object.values(dayEdition);
    totalStories += stories.length;

    const promoInDay = stories.filter((s) => s.isRuangPulihPromo);
    totalPromoStories += promoInDay.length;

    weeklyData.push({
      dayOfWeek: d,
      dayName: dayNames[d],
      storyCount: stories.length,
      hasPromo: promoInDay.length > 0,
      themes: stories.map((s) => ({
        slot: s.slot,
        pillar: s.pillar,
        theme: s.theme,
        title: s.title,
        isPromo: s.isRuangPulihPromo,
      })),
    });
  }

  return {
    totalDays: 7,
    totalStories,
    totalPromoStories,
    isPromoCadenceCorrect: totalPromoStories === 3, // Exactly 3x per week
    weeklyData,
  };
}

/**
 * Searches across the entire 35-card content matrix by keyword.
 */
export function searchStoryMatrix(keyword: string): StoryDraft[] {
  const q = keyword.toLowerCase().trim();
  const matches: StoryDraft[] = [];

  for (let d = 0; d < 7; d++) {
    const dayStories = Object.values(WEEKLY_CONTENT_MATRIX[d]);
    for (const s of dayStories) {
      const matchInTitle = s.title.toLowerCase().includes(q);
      const matchInTheme = s.theme.toLowerCase().includes(q);
      const matchInBody = s.body.some((b) => b.toLowerCase().includes(q));
      const matchInHighlight = s.highlightBox?.content.toLowerCase().includes(q) ?? false;
      const matchInSteps = s.steps?.some((step) => step.text.toLowerCase().includes(q)) ?? false;

      if (matchInTitle || matchInTheme || matchInBody || matchInHighlight || matchInSteps) {
        matches.push(s);
      }
    }
  }

  return matches;
}
