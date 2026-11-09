/**
 * src/app/api/dispatch/route.ts
 * Telegram Dispatcher API Route for Dokter Pikiran Makassar.
 *
 * Exclusively triggered by explicit human authorization in Studio Cockpit.
 * Automatically validates against banned Jakarta slang before dispatching.
 */

import { NextRequest, NextResponse } from "next/server";
import { dispatchStoryToTelegram } from "@/lib/telegram-dispatcher";
import { getStoryForSlot } from "@/lib/content-matrix";
import { validateStoryDraft } from "@/lib/ahmad-persona";
import type { SlotTime, StoryDraft, VisualMode } from "@/lib/types";

const VALID_SLOTS: SlotTime[] = ["07:00", "10:00", "12:00", "19:00", "21:00"];

/**
 * GET /api/dispatch
 * Status & Health check endpoint.
 */
export async function GET() {
  const hasToken = Boolean(
    process.env.TELEGRAM_BOT_TOKEN || process.env.DISABLED_TELEGRAM_BOT_TOKEN
  );
  const hasChatId = Boolean(
    process.env.TELEGRAM_CHAT_ID || process.env.DISABLED_TELEGRAM_CHAT_ID
  );

  return NextResponse.json({
    service: "Dokter Pikiran Makassar Telegram Dispatcher",
    status: "active",
    mode: "human-in-the-loop (strictly non-automated)",
    configured: hasToken && hasChatId,
    guidelines: [
      "No unauthorized background auto-posting",
      "Strict Ahmad persona & Jakarta slang gate",
      "Sub-second Satori visual rendering before dispatch",
    ],
  });
}

/**
 * POST /api/dispatch
 * Dispatches a single verified story flyer + caption to Telegram.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    let draft: StoryDraft | null = null;
    let mode: VisualMode = "illustrated";

    if (body.draft) {
      draft = body.draft as StoryDraft;

      // Validate Ahmad Persona & Banned Slang
      const validation = validateStoryDraft(draft);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: "Validasi persona Ahmad gagal. Naskah ditolak oleh Anti-Slang Guard.",
            issues: validation.errors,
            warnings: validation.warnings,
            bannedSlangFound: validation.bannedSlangFound,
          },
          { status: 400 }
        );
      }

      mode =
        body.mode === "text_only" || body.mode === "illustrated"
          ? body.mode
          : draft.visualModePreferred || "illustrated";
    } else if (body.slot) {
      const slot = body.slot as SlotTime;
      if (!VALID_SLOTS.includes(slot)) {
        return NextResponse.json(
          {
            success: false,
            error: `Slot '${slot}' tidak valid. Pilihan slot: ${VALID_SLOTS.join(", ")}`,
          },
          { status: 400 }
        );
      }

      draft = getStoryForSlot(slot, body.day);
      if (!draft) {
        return NextResponse.json(
          {
            success: false,
            error: `Materi untuk slot ${slot} pada hari tersebut tidak ditemukan.`,
          },
          { status: 404 }
        );
      }

      mode =
        body.mode === "text_only" || body.mode === "illustrated"
          ? body.mode
          : draft.visualModePreferred || "illustrated";
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Wajib menyertakan 'draft' atau 'slot' dalam request body.",
        },
        { status: 400 }
      );
    }

    const result = await dispatchStoryToTelegram(draft, {
      mode,
      dryRun: body.dryRun,
      botToken: body.botToken,
      chatId: body.chatId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Gagal mengirim story ke Telegram.",
          details: result.details,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: result.dryRun
        ? "Simulasi pengiriman story berhasil diverifikasi (Dry-Run Mode)."
        : "Flyer visual story & caption berhasil dipublikasikan ke Telegram!",
      result,
    });
  } catch (err: any) {
    console.error("[API /api/dispatch POST Error]:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi kesalahan internal saat memproses dispatch Telegram.",
        details: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
