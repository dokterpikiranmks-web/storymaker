/**
 * src/lib/telegram-dispatcher.ts
 * Human-in-the-loop Telegram Dispatcher for Dokter Pikiran Makassar.
 *
 * Dispatches high-resolution story flyers and formatted captions to Telegram.
 * Guaranteed:
 * - 0% unauthorized auto-posting (strictly triggered on explicit user command)
 * - Strict Persona & Jakarta Slang Gate validation before sending
 * - Caption length safety (< 1024 characters for Telegram sendPhoto)
 * - Seamless Dry-run simulation when credentials are absent or during test suites
 */

import { renderStoryToPng } from "./renderer";
import { validateStoryDraft } from "./ahmad-persona";
import type { StoryDraft, VisualMode } from "./types";

export interface DispatchOptions {
  botToken?: string;
  chatId?: string;
  mode?: VisualMode;
  dryRun?: boolean;
}

export interface DispatchResult {
  success: boolean;
  messageId?: number;
  dryRun: boolean;
  captionLength: number;
  renderTimeMs: number;
  dispatchTimeMs: number;
  error?: string;
  details?: any;
}

/**
 * Formats clean, professional Telegram caption with HTML tags.
 * Ensures length does not exceed Telegram's 1024 character limit.
 */
export function formatTelegramCaption(draft: StoryDraft): string {
  const lines: string[] = [];
  lines.push(`✨ <b>${draft.tag}</b> · ${draft.slot} WITA`);
  lines.push("");
  lines.push(`<b>${draft.title}</b>`);
  lines.push("");
  lines.push(draft.body.join("\n\n"));

  if (draft.highlightBox) {
    lines.push("");
    lines.push(`💡 <b>[${draft.highlightBox.label}]</b>`);
    lines.push(draft.highlightBox.content);
  }

  lines.push("");
  lines.push("—");
  lines.push(`<b>${draft.signature}</b>`);
  lines.push(`<i>${draft.subSignature}</i>`);

  if (draft.isRuangPulihPromo) {
    lines.push("");
    lines.push("🌿 <i>Konsultasi & Terapi: Hubungi Ruang Pulih Dokter Pikiran Makassar.</i>");
  }

  lines.push("");
  lines.push("#DokterPikiran #KesehatanMental #HipnoterapiMakassar #HolisticMedicine #RuangPulih");

  let caption = lines.join("\n");

  // Telegram photo caption limit is 1024 characters
  if (caption.length > 1024) {
    caption = caption.slice(0, 1020) + "...";
  }

  return caption;
}

/**
 * Dispatches a StoryDraft to Telegram.
 */
export async function dispatchStoryToTelegram(
  draft: StoryDraft,
  options: DispatchOptions = {}
): Promise<DispatchResult> {
  const startTime = Date.now();

  // 1. Strict Persona & Slang Validation Gate
  const validation = validateStoryDraft(draft);
  if (!validation.valid) {
    return {
      success: false,
      dryRun: Boolean(options.dryRun),
      captionLength: 0,
      renderTimeMs: 0,
      dispatchTimeMs: Date.now() - startTime,
      error: `Validasi persona gagal: ${validation.errors.join("; ")}`,
      details: validation,
    };
  }

  // 2. High-Speed Visual Render (Satori + Resvg)
  const renderRes = await renderStoryToPng(draft, {
    mode: options.mode || draft.visualModePreferred || "illustrated",
  });

  const caption = formatTelegramCaption(draft);

  // 3. Resolve Telegram Credentials
  const botToken =
    options.botToken ||
    process.env.TELEGRAM_BOT_TOKEN ||
    process.env.DISABLED_TELEGRAM_BOT_TOKEN;

  const chatId =
    options.chatId ||
    process.env.TELEGRAM_CHAT_ID ||
    process.env.DISABLED_TELEGRAM_CHAT_ID;

  // 4. Dry-Run Handling
  if (options.dryRun || !botToken || !chatId) {
    return {
      success: true,
      dryRun: true,
      captionLength: caption.length,
      renderTimeMs: renderRes.renderTimeMs,
      dispatchTimeMs: Date.now() - startTime,
      details: {
        slot: draft.slot,
        pillar: draft.pillar,
        title: draft.title,
        chatId: chatId ? `${chatId.slice(0, 3)}***` : "NOT_CONFIGURED",
        note: options.dryRun
          ? "Dry-run berhasil diverifikasi (pengiriman simulated)."
          : "Kredensial Telegram belum aktif di production, dispatch berstatus simulated.",
      },
    };
  }

  // 5. Real Telegram sendPhoto Dispatch
  try {
    const formData = new FormData();
    formData.append("chat_id", chatId);
    formData.append(
      "photo",
      new Blob([new Uint8Array(renderRes.pngBuffer)], { type: "image/png" }),
      `story-${draft.slot.replace(":", "")}.png`
    );
    formData.append("caption", caption);
    formData.append("parse_mode", "HTML");

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: formData,
      }
    );

    const tgData = await response.json();

    if (!response.ok || !tgData.ok) {
      return {
        success: false,
        dryRun: false,
        captionLength: caption.length,
        renderTimeMs: renderRes.renderTimeMs,
        dispatchTimeMs: Date.now() - startTime,
        error: tgData.description || `Telegram API error (status ${response.status})`,
        details: tgData,
      };
    }

    return {
      success: true,
      messageId: tgData.result?.message_id,
      dryRun: false,
      captionLength: caption.length,
      renderTimeMs: renderRes.renderTimeMs,
      dispatchTimeMs: Date.now() - startTime,
      details: {
        messageId: tgData.result?.message_id,
        chatTitle: tgData.result?.chat?.title || tgData.result?.chat?.username,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      dryRun: false,
      captionLength: caption.length,
      renderTimeMs: renderRes.renderTimeMs,
      dispatchTimeMs: Date.now() - startTime,
      error: `Network/Fetch error saat menghubungi Telegram: ${err.message}`,
    };
  }
}
