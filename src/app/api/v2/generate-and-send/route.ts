import { NextResponse } from "next/server";

// Menggunakan require untuk interoperabilitas dengan lib CommonJS / Node.js
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateStoryV2, PILLARS } = require("../../../../../lib/story-engine-v2");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { publishToTelegram } = require("../../../../../lib/telegram-publisher");

export const dynamic = "force-dynamic";

interface GenerateAndSendPayload {
  pillar?: "PIKIRAN" | "TUBUH" | "TEKNOLOGI";
  date?: string;
  topic?: string;
  raw_thought?: string;
  custom_topic?: string;
}

/**
 * POST /api/v2/generate-and-send
 * Memicu generate naskah 5 babak Story V2 Dokter Pikiran dan langsung mengirimkannya ke Telegram.
 */
export async function POST(req: Request) {
  try {
    let payload: GenerateAndSendPayload = {};
    try {
      payload = await req.json();
    } catch {
      // Body kosong diperbolehkan, akan memakai default hari ini
    }

    const { pillar, date, topic, raw_thought, custom_topic } = payload;
    if (pillar && !PILLARS[pillar.toUpperCase()]) {
      return NextResponse.json(
        {
          success: false,
          error: `Pilar '${pillar}' tidak valid. Pilihan pilar: PIKIRAN, TUBUH, TEKNOLOGI.`,
        },
        { status: 400 }
      );
    }

    // 1. Generate Naskah 5 Story dengan dukungan Topik Kustom User
    const storyData = await generateStoryV2({
      pillar: pillar?.toUpperCase(),
      date,
      topic: topic || custom_topic,
      rawThought: raw_thought,
    });

    // 2. Publish ke Telegram Bot (Kirim 5 Gambar 9:16 + Link PDF Panduan)
    const telegramResult = await publishToTelegram(storyData);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: storyData.date,
      pillar: storyData.pillar,
      pillarTitle: storyData.pillarTitle,
      topic: storyData.topic,
      keyword: storyData.keyword,
      source: storyData.source,
      model: storyData.model,
      stories: storyData.stories,
      telegram: telegramResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API v2 generate-and-send] Error:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v2/generate-and-send
 * Endpoint alternatif untuk Vercel Cron subuh (06:00 WITA) atau pengujian browser.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pillarParam = searchParams.get("pillar")?.toUpperCase();
    const dateParam = searchParams.get("date") || undefined;

    let pillar: "PIKIRAN" | "TUBUH" | "TEKNOLOGI" | undefined;
    if (pillarParam && PILLARS[pillarParam]) {
      pillar = pillarParam as "PIKIRAN" | "TUBUH" | "TEKNOLOGI";
    }

    const storyData = await generateStoryV2({
      pillar,
      date: dateParam,
    });

    const telegramResult = await publishToTelegram(storyData);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      date: storyData.date,
      pillar: storyData.pillar,
      pillarTitle: storyData.pillarTitle,
      topic: storyData.topic,
      keyword: storyData.keyword,
      source: storyData.source,
      model: storyData.model,
      stories: storyData.stories,
      telegram: telegramResult,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[API v2 generate-and-send GET] Error:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
