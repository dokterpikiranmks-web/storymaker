import "server-only";
import { ACT_TYPES, ACTS, normalizeTheme, type ActType } from "./constants";
import { buildDefaultLeadMagnetProtocol, buildOfflineAct, deriveTopicPhrase, generateOfflineStory } from "./offline";
import type {
  CampaignType,
  FlashPromoInput,
  GeneratedAct,
  GeneratedStory,
  GenerationInfo,
  LeadMagnetProtocol,
  LeadMagnetProtocolStep,
  PersonaSettings,
} from "./types";
import { GeminiCascadeError, GeminiNotConfiguredError, isGeminiConfigured, ModelOutputError } from "@/lib/gemini/detector";
import { generateStructured } from "@/lib/gemini/generate";
import { buildAlchemistSystemPrompt, buildAlchemistUserPrompt, STORY_RESPONSE_SCHEMA } from "@/lib/prompts/alchemist";
import { hashString, stripEmoji, truncate } from "@/lib/utils";

export interface StoryRequest {
  topic?: string;
  rawThought?: string;
  campaignDate: string;
  persona: PersonaSettings;
  requestId: string;
  campaignType?: CampaignType;
  flashPromo?: FlashPromoInput;
  leadMagnetProtocol?: LeadMagnetProtocol | null;
}

export interface StoryGenerationResult {
  story: GeneratedStory;
  info: GenerationInfo;
}

export function extractJson(text: string): unknown {
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  try {
    return JSON.parse(t);
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(t.slice(start, end + 1));
      } catch {
        /* fallthrough */
      }
    }
  }
  throw new ModelOutputError("Output model bukan JSON yang valid");
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Convert markdown bold (**x**) to accent markup (*x*), drop hashtags/emoji for on-image text. */
function cleanVisualText(value: string, max: number): string {
  const cleaned = stripEmoji(value.replace(/\*\*(.+?)\*\*/g, "*$1*").replace(/(^|\s)#[\p{L}\p{N}_]+/gu, "$1"))
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return truncate(cleaned, max);
}

function matchAct(raw: Record<string, unknown>, index: number): ActType | null {
  const value = str(raw.act).toUpperCase();
  const direct = ACT_TYPES.find((a) => a === value);
  if (direct) return direct;
  if (/1|HOOK/.test(value)) return "ACT_1_HOOK";
  if (/2|SOMATIC/.test(value)) return "ACT_2_SOMATIC";
  if (/3|CLINICAL|AI/.test(value)) return "ACT_3_CLINICAL_AI";
  if (/4|ANCHOR/.test(value)) return "ACT_4_ANCHOR";
  return ACT_TYPES[index] ?? null;
}

export function normalizeStory(raw: unknown, req: Omit<StoryRequest, "requestId">): GeneratedStory {
  if (!raw || typeof raw !== "object") throw new ModelOutputError("JSON tidak berbentuk objek");
  const obj = raw as Record<string, unknown>;
  const actsRaw = Array.isArray(obj.acts) ? obj.acts : [];
  const byAct = new Map<ActType, Record<string, unknown>>();
  actsRaw.forEach((a, i) => {
    if (!a || typeof a !== "object") return;
    const act = matchAct(a as Record<string, unknown>, i);
    if (act && !byAct.has(act)) byAct.set(act, a as Record<string, unknown>);
  });

  const phrase = deriveTopicPhrase(req.topic, req.rawThought);
  const seed = hashString(`${req.topic ?? ""}|${req.rawThought ?? ""}`);

  // Extract dynamic keyword from lead_magnet_protocol, req, or persona
  let dynamicKeyword = (req.persona.ctaKeyword || "RESET").toUpperCase();
  if (obj.lead_magnet_protocol && typeof obj.lead_magnet_protocol === "object") {
    const lmpObj = obj.lead_magnet_protocol as Record<string, unknown>;
    const rawK = str(lmpObj.keyword).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (rawK) dynamicKeyword = rawK.slice(0, 20);
  } else if (req.leadMagnetProtocol?.keyword) {
    const rawK = req.leadMagnetProtocol.keyword.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (rawK) dynamicKeyword = rawK.slice(0, 20);
  }
  const keyword = dynamicKeyword;
  let missing = 0;

  const acts: GeneratedAct[] = ACT_TYPES.map((act) => {
    const a = byAct.get(act);
    const headline = a ? cleanVisualText(str(a.headline), 140) : "";
    const body = a ? cleanVisualText(str(a.body_text), 520) : "";
    if (!a || headline.length < 3 || body.length < 10) {
      missing += 1;
      return buildOfflineAct(act, phrase, req.persona, seed);
    }
    let cta = cleanVisualText(str(a.call_to_action), 120);
    if (act === "ACT_4_ANCHOR") {
      if (!cta.toUpperCase().includes(keyword.toUpperCase())) {
        cta = `Ketik ${keyword} di chat WhatsApp saya sekarang untuk modul lengkapnya`;
      }
    }
    return {
      act,
      headline,
      body_text: body,
      call_to_action: cta,
      caption: truncate(str(a.caption).replace(/\*\*(.+?)\*\*/g, "$1"), 2000) || `${headline.replace(/\*/g, "")}\n\n${body}`,
      visual_theme: normalizeTheme(a.visual_theme, ACTS[act].defaultTheme),
      technique: truncate(str(a.technique), 160),
      key_element: truncate(str(a.key_element), 240),
    };
  });

  if (missing >= 2) throw new ModelOutputError(`Output model tidak lengkap (${missing} babak hilang)`);

  let leadMagnetProtocol: LeadMagnetProtocol | null = req.leadMagnetProtocol ?? null;
  if (obj.lead_magnet_protocol && typeof obj.lead_magnet_protocol === "object") {
    const lmp = obj.lead_magnet_protocol as Record<string, unknown>;
    const rawSteps = Array.isArray(lmp.steps) ? lmp.steps : [];
    const steps: LeadMagnetProtocolStep[] = rawSteps.slice(0, 3).map((st, idx) => {
      const s = (st && typeof st === "object" ? st : {}) as Record<string, unknown>;
      return {
        step: idx + 1,
        title: truncate(str(s.title) || `Langkah ${idx + 1}`, 100),
        action: truncate(str(s.action), 400),
        duration: truncate(str(s.duration) || "60 detik", 40),
        mechanism: truncate(str(s.mechanism), 300),
      };
    });

    if (steps.length === 3) {
      leadMagnetProtocol = {
        keyword,
        title: truncate(str(lmp.title) || `Protokol 3 Langkah: ${phrase}`, 120),
        target_issue: truncate(str(lmp.target_issue) || phrase, 200),
        steps,
        pdf_summary: truncate(str(lmp.pdf_summary), 500) || `Panduan 3 langkah berbasis somatik dan neuro-arsitektur untuk mengatasi ${phrase}.`,
      };
    }
  }

  if (!leadMagnetProtocol) {
    leadMagnetProtocol = buildDefaultLeadMagnetProtocol(phrase);
    leadMagnetProtocol.keyword = keyword;
  } else if (!leadMagnetProtocol.keyword) {
    leadMagnetProtocol.keyword = keyword;
  }

  return {
    theme_topic: truncate(stripEmoji(str(obj.theme_topic)) || req.topic || phrase, 120),
    core_insight: truncate(str(obj.core_insight), 300),
    acts,
    lead_magnet_protocol: leadMagnetProtocol,
  };
}

/**
 * Orchestrates the 4-Act generation: Gemini cascade first, offline Alchemist
 * template as the last-resort fallback so the request never fails.
 */
export async function generateFourActStory(req: StoryRequest): Promise<StoryGenerationResult> {
  const started = Date.now();
  const offline = (reason: string, attempts: GenerationInfo["attempts"] = []): StoryGenerationResult => ({
    story: generateOfflineStory({
      topic: req.topic,
      rawThought: req.rawThought,
      persona: req.persona,
      campaignType: req.campaignType,
      flashPromo: req.flashPromo,
    }),
    info: { source: "offline", model: null, attempts, latencyMs: Date.now() - started, fallbackReason: reason },
  });

  if (!isGeminiConfigured()) {
    return offline("GEMINI_API_KEY belum diisi — memakai Offline Alchemist Template.");
  }

  try {
    const result = await generateStructured(
      buildAlchemistUserPrompt({
        topic: req.topic,
        rawThought: req.rawThought,
        campaignDate: req.campaignDate,
        campaignType: req.campaignType,
        flashPromo: req.flashPromo,
        leadMagnetProtocol: req.leadMagnetProtocol,
      }),
      buildAlchemistSystemPrompt(req.persona),
      (text) => normalizeStory(extractJson(text), req),
      { json: true, responseSchema: STORY_RESPONSE_SCHEMA, temperature: 0.95, requestId: req.requestId },
    );
    return {
      story: result.data,
      info: { source: "gemini", model: result.model, attempts: result.attempts, latencyMs: Date.now() - started },
    };
  } catch (err) {
    if (err instanceof GeminiNotConfiguredError) return offline(err.message);
    const attempts = err instanceof GeminiCascadeError ? err.attempts : [];
    const reason = err instanceof Error ? err.message : "Gemini tidak tersedia";
    console.warn("[alchemist] Gemini cascade exhausted, using offline template:", reason);
    return offline(`Gemini tidak tersedia (${truncate(reason, 220)}) — memakai Offline Alchemist Template.`, attempts);
  }
}
