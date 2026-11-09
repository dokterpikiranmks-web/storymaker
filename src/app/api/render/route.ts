/**
 * src/app/api/render/route.ts
 * High-Speed Satori + Resvg Rendering API Route.
 *
 * Supports:
 * - GET  /api/render?slot=07:00&day=senin&mode=illustrated&format=png
 * - POST /api/render (accepts StoryDraft or slot query, returns JSON or binary PNG)
 */

import { NextRequest, NextResponse } from "next/server";
import { renderStoryToPng } from "@/lib/renderer";
import { getStoryForSlot, parseDayIndex } from "@/lib/content-matrix";
import { validateStoryDraft } from "@/lib/ahmad-persona";
import type { SlotTime, VisualMode, StoryDraft } from "@/lib/types";

const VALID_SLOTS: SlotTime[] = ["07:00", "10:00", "12:00", "19:00", "21:00"];

/**
 * GET /api/render
 * Primary endpoint for direct <img> tags or quick previews.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slot = (searchParams.get("slot") || "07:00") as SlotTime;
    const day = searchParams.get("day");
    const requestedMode = searchParams.get("mode") as VisualMode | null;
    const format = searchParams.get("format") || "png"; // Default to direct PNG for <img>
    const width = searchParams.get("width") ? parseInt(searchParams.get("width")!, 10) : 1080;
    const height = searchParams.get("height") ? parseInt(searchParams.get("height")!, 10) : 1920;

    if (!VALID_SLOTS.includes(slot)) {
      return NextResponse.json(
        {
          success: false,
          error: `Slot tidak valid: '${slot}'. Slot yang diizinkan: ${VALID_SLOTS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    const draft = getStoryForSlot(slot, day);
    if (!draft) {
      return NextResponse.json(
        {
          success: false,
          error: `Materi story untuk slot ${slot} pada hari tersebut tidak ditemukan.`,
        },
        { status: 404 }
      );
    }

    const mode: VisualMode =
      requestedMode === "text_only" || requestedMode === "illustrated"
        ? requestedMode
        : draft.visualModePreferred || "illustrated";

    const result = await renderStoryToPng(draft, { mode, width, height });

    if (format === "json") {
      return NextResponse.json({
        success: true,
        slot: draft.slot,
        pillar: draft.pillar,
        title: draft.title,
        mode: result.mode,
        width: result.width,
        height: result.height,
        renderTimeMs: result.renderTimeMs,
        imageBase64: result.imageBase64,
        draft,
      });
    }

    // Direct binary PNG output
    return new Response(new Uint8Array(result.pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": result.pngBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Render-Time-Ms": result.renderTimeMs.toString(),
      },
    });
  } catch (error: any) {
    console.error("[API /api/render GET Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memproses render visual story.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/render
 * Endpoint for custom drafts, studio cockpit previews, or matrix slot rendering.
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const body = await request.json().catch(() => ({}));

    let draft: StoryDraft | null = null;
    let mode: VisualMode = "text_only";

    if (body.draft) {
      draft = body.draft as StoryDraft;

      // Validate Ahmad Persona & Banned Slang
      const validation = validateStoryDraft(draft);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: "Validasi persona Ahmad / gaya bahasa gagal.",
            issues: validation.errors,
            warnings: validation.warnings,
            bannedSlangFound: validation.bannedSlangFound,
          },
          { status: 400 }
        );
      }

      mode =
        body.mode === "illustrated" || body.mode === "text_only"
          ? body.mode
          : draft.visualModePreferred || "text_only";
    } else if (body.slot) {
      const slot = body.slot as SlotTime;
      if (!VALID_SLOTS.includes(slot)) {
        return NextResponse.json(
          {
            success: false,
            error: `Slot tidak valid: '${slot}'. Slot yang diizinkan: ${VALID_SLOTS.join(", ")}`,
          },
          { status: 400 }
        );
      }

      draft = getStoryForSlot(slot, body.day);
      if (!draft) {
        return NextResponse.json(
          {
            success: false,
            error: `Materi story untuk slot ${slot} tidak ditemukan.`,
          },
          { status: 404 }
        );
      }

      mode =
        body.mode === "illustrated" || body.mode === "text_only"
          ? body.mode
          : draft.visualModePreferred || "illustrated";
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Wajib menyertakan objek 'draft' atau 'slot' dalam request body.",
        },
        { status: 400 }
      );
    }

    const width = body.width ? parseInt(body.width, 10) : 1080;
    const height = body.height ? parseInt(body.height, 10) : 1920;
    const customIllustrationPath = body.customIllustrationPath;

    const result = await renderStoryToPng(draft, {
      mode,
      width,
      height,
      customIllustrationPath,
    });

    const wantsPng =
      searchParams.get("format") === "png" ||
      body.format === "png" ||
      request.headers.get("accept") === "image/png";

    if (wantsPng) {
      return new Response(new Uint8Array(result.pngBuffer), {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Content-Length": result.pngBuffer.length.toString(),
          "Cache-Control": "no-store",
          "X-Render-Time-Ms": result.renderTimeMs.toString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      slot: draft.slot,
      pillar: draft.pillar,
      title: draft.title,
      mode: result.mode,
      width: result.width,
      height: result.height,
      renderTimeMs: result.renderTimeMs,
      imageBase64: result.imageBase64,
      draft,
    });
  } catch (error: any) {
    console.error("[API /api/render POST Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Gagal memproses render visual story.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
