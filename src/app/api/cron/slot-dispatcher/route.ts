export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60; // Max duration 60 detik untuk serverless Vercel

import { NextResponse } from "next/server";

// Menggunakan require untuk interoperabilitas dengan modul lib CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  generateStoryV2,
  getActiveDailyStory,
  saveActiveDailyStory,
  PILLARS,
} = require("../../../../../lib/story-engine-v2");

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  publishSlotToTelegram,
  publishToTelegram,
} = require("../../../../../lib/telegram-publisher");

/**
 * Menghitung slot aktif berdasarkan zona waktu WITA (Asia/Makassar, UTC+8)
 * Jadwal Tayang:
 * - Slot 1 (07:00 WITA): Hook Pagi (Window: 06:30 - 07:29)
 * - Slot 2 (07:45 - 08:00 WITA): Edukasi Skema (Window: 07:30 - 10:29)
 * - Slot 3 (13:00 WITA): Praktik Somatik Siang (Window: 10:30 - 16:29)
 * - Slot 4 (20:00 WITA): Bukti Kasus Terapi Malam (Window: 16:30 - 20:29)
 * - Slot 5 (21:00 WITA): Refleksi Tenang & PDF (Window: 20:30 - 06:29)
 */
function getActiveWitaSlot(date: Date = new Date()): {
  slot: number;
  slotName: string;
  timeLabel: string;
  witaTime: string;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Makassar",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);

  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "7", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  const totalMinutes = hour * 60 + minute;
  const witaTime = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} WITA`;

  if (totalMinutes >= 390 && totalMinutes < 450) {
    return { slot: 1, slotName: "HOOK", timeLabel: "07:00 WITA", witaTime };
  }
  if (totalMinutes >= 450 && totalMinutes < 630) {
    return { slot: 2, slotName: "EDUKASI", timeLabel: "07:45 WITA", witaTime };
  }
  if (totalMinutes >= 630 && totalMinutes < 990) {
    return { slot: 3, slotName: "PRAKTIK", timeLabel: "13:00 WITA", witaTime };
  }
  if (totalMinutes >= 990 && totalMinutes < 1230) {
    return { slot: 4, slotName: "BUKTI", timeLabel: "20:00 WITA", witaTime };
  }
  return { slot: 5, slotName: "CTA HALUS", timeLabel: "21:00 WITA", witaTime };
}

/**
 * Mendapatkan atau menyusun naskah harian sinkron (data/active-daily-story.json)
 * Memastikan slot 1 sampai 5 dari pagi hingga malam selalu berada pada topik yang sama.
 */
async function resolveDailyStory(dateStr: string, forceFresh = false) {
  if (!forceFresh) {
    const cached = getActiveDailyStory(dateStr);
    if (cached && Array.isArray(cached.stories) && cached.stories.length === 5) {
      return { storyData: cached, fromCache: true };
    }
  }

  // Jika belum ada naskah hari ini atau dipaksa baru, generate naskah 5 story
  console.log(`[SlotDispatcher] Menyusun naskah harian baru untuk ${dateStr} WITA...`);
  const freshStory = await generateStoryV2({
    date: dateStr,
    seed: Date.now(),
    fresh: true,
  });

  saveActiveDailyStory(freshStory);
  return { storyData: freshStory, fromCache: false };
}

/**
 * GET /api/cron/slot-dispatcher
 * Endpoint cron untuk Vercel Cron (23:00, 00:00, 05:00, 12:00, 13:00 UTC) & GitHub Actions
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slotParam = searchParams.get("slot")?.trim();
    const modeParam = searchParams.get("mode")?.trim();
    const forceParam = searchParams.get("force") === "true";
    const secretParam = searchParams.get("secret")?.trim();

    // Verifikasi token rahasia opsional jika disetel di environment atau disuplai DOKTERPIKIRAN2026
    const expectedSecret = process.env.CRON_SECRET || process.env.WORKER_SECRET || "DOKTERPIKIRAN2026";
    if (secretParam && secretParam !== expectedSecret && secretParam !== "DOKTERPIKIRAN2026") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid secret token" },
        { status: 401 }
      );
    }

    const now = new Date();
    const todayDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Makassar",
    }).format(now);

    const activeInfo = getActiveWitaSlot(now);
    const targetSlot = (slotParam && slotParam !== "auto")
      ? Math.min(Math.max(parseInt(slotParam, 10) || 1, 1), 5)
      : activeInfo.slot;

    // 1. Muat atau buat naskah harian yang tersinkronisasi
    const { storyData, fromCache } = await resolveDailyStory(todayDateStr, forceParam);

    // 2. Mode Kirim Seluruh 5 Slot Sekaligus (Manual)
    if (modeParam === "all" || searchParams.get("all") === "true") {
      console.log(`[SlotDispatcher] Mengirim seluruh 5 slot sekaligus (Mode Batch)...`);
      const batchResult = await publishToTelegram(storyData);
      return NextResponse.json({
        success: batchResult.success,
        mode: "all",
        date: todayDateStr,
        witaTime: activeInfo.witaTime,
        topic: storyData.topic,
        pillar: storyData.pillar,
        fromCache,
        batchResult,
      });
    }

    // 3. Mode Real-Time Slot Dispatcher 1-per-1 (Default)
    console.log(`[SlotDispatcher] Memproses Slot ${targetSlot} (${activeInfo.slotName}) pada ${activeInfo.witaTime}...`);
    const slotResult = await publishSlotToTelegram(storyData, targetSlot);

    // Update dispatch log di cache
    try {
      const updatedData = {
        ...storyData,
        lastDispatchedSlot: targetSlot,
        dispatchedAt: new Date().toISOString(),
      };
      saveActiveDailyStory(updatedData);
    } catch {
      // non-blocking
    }

    const res = NextResponse.json({
      success: true,
      mode: "single-slot",
      slot: targetSlot,
      act: slotResult.act,
      time: slotResult.time,
      timeLabel: activeInfo.timeLabel,
      witaTime: activeInfo.witaTime,
      date: todayDateStr,
      topic: storyData.topic,
      headline: slotResult.headline,
      pillar: storyData.pillar,
      fromCache,
      renderTimeMs: slotResult.renderTimeMs,
      telegramMessageId: slotResult.messageId,
      pdfUrl: slotResult.pdfUrl,
    });

    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SlotDispatcher GET Error]:", message);
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
 * POST /api/cron/slot-dispatcher
 * Endpoint trigger dari Studio APK / CLI / Webhook
 */
export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body kosong diizinkan, akan menggunakan default slot aktif
    }

    const { slot, mode, force, pillar, custom_topic } = body;
    const now = new Date();
    const todayDateStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Makassar",
    }).format(now);

    const activeInfo = getActiveWitaSlot(now);
    let targetSlot = activeInfo.slot;

    if (slot !== undefined && slot !== null && slot !== "active") {
      targetSlot = Math.min(Math.max(Number(slot) || 1, 1), 5);
    }

    // Jika user menginput pilar atau topik khusus dari Studio APK, buat naskah baru
    let storyData: any;
    let fromCache = false;

    if (pillar || custom_topic) {
      storyData = await generateStoryV2({
        pillar: pillar ? String(pillar).toUpperCase() : undefined,
        topic: custom_topic,
        date: todayDateStr,
        seed: Date.now(),
        fresh: true,
      });
      saveActiveDailyStory(storyData);
    } else {
      const resolved = await resolveDailyStory(todayDateStr, Boolean(force));
      storyData = resolved.storyData;
      fromCache = resolved.fromCache;
    }

    // 1. Mode Kirim Seluruh 5 Slot Sekaligus
    if (mode === "all") {
      console.log(`[SlotDispatcher POST] Mengirim seluruh 5 slot sekaligus (Mode Batch)...`);
      const batchResult = await publishToTelegram(storyData);
      return NextResponse.json({
        success: batchResult.success,
        mode: "all",
        date: todayDateStr,
        witaTime: activeInfo.witaTime,
        topic: storyData.topic,
        pillar: storyData.pillar,
        fromCache,
        batchResult,
      });
    }

    // 2. Mode Real-Time Slot Dispatcher 1-per-1
    console.log(`[SlotDispatcher POST] Menerbitkan Slot ${targetSlot} ke Telegram...`);
    const slotResult = await publishSlotToTelegram(storyData, targetSlot);

    try {
      const updatedData = {
        ...storyData,
        lastDispatchedSlot: targetSlot,
        dispatchedAt: new Date().toISOString(),
      };
      saveActiveDailyStory(updatedData);
    } catch {
      // non-blocking
    }

    const res = NextResponse.json({
      success: true,
      mode: "single-slot",
      slot: targetSlot,
      act: slotResult.act,
      time: slotResult.time,
      timeLabel: activeInfo.timeLabel,
      witaTime: activeInfo.witaTime,
      date: todayDateStr,
      topic: storyData.topic,
      headline: slotResult.headline,
      pillar: storyData.pillar,
      fromCache,
      renderTimeMs: slotResult.renderTimeMs,
      telegramMessageId: slotResult.messageId,
      pdfUrl: slotResult.pdfUrl,
    });

    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    return res;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[SlotDispatcher POST Error]:", message);
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
