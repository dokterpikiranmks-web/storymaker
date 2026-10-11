#!/usr/bin/env node

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V3.0 — CLI Test Slot Dispatcher (scripts/test-slot.js)
 *  Usage:
 *    node scripts/test-slot.js 1
 *    node scripts/test-slot.js 2
 *    node scripts/test-slot.js 3
 *    node scripts/test-slot.js 4
 *    node scripts/test-slot.js 5
 *    node scripts/test-slot.js all
 * ════════════════════════════════════════════════════════════════════════════
 */

const dns = require("node:dns");
if (dns && typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

const path = require("node:path");
const dotenv = require("dotenv");

// Muat environment variables (.env.local & .env)
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const {
  generateStoryV2,
  getActiveDailyStory,
  saveActiveDailyStory,
} = require("../lib/story-engine-v2");

const {
  publishSlotToTelegram,
  publishToTelegram,
} = require("../lib/telegram-publisher");

async function main() {
  const arg = process.argv[2] ? process.argv[2].trim() : "1";

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🚀 STORYMAKER V3.0 — REAL-TIME SLOT DISPATCHER TEST");
  console.log("   Brand: Dokter Pikiran (Ahmad Jawahir Zain) • Makassar, WITA");
  console.log("═══════════════════════════════════════════════════════════════");

  const todayDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Makassar",
  }).format(new Date());

  console.log(`📅 Tanggal WITA: ${todayDateStr}`);

  // 1. Muat atau generate naskah harian aktif (data/active-daily-story.json)
  let storyData = getActiveDailyStory(todayDateStr);
  let fromCache = true;

  if (!storyData || !Array.isArray(storyData.stories) || storyData.stories.length !== 5) {
    console.log("📝 Menyusun naskah 5 babak Story harian baru untuk hari ini...");
    storyData = await generateStoryV2({
      date: todayDateStr,
      seed: Date.now(),
      fresh: true,
    });
    saveActiveDailyStory(storyData);
    fromCache = false;
  } else {
    console.log("✅ Menggunakan naskah aktif tersinkronisasi dari data/active-daily-story.json");
  }

  console.log(`🏛️ Pilar: ${storyData.pillar} (${storyData.pillarTitle})`);
  console.log(`🎯 Topik: "${storyData.topic}"`);
  console.log(`🔑 Keyword Trigger: ${storyData.keyword}`);
  console.log(`📡 Sumber Engine: ${storyData.source} (${storyData.model})`);

  // 2. Eksekusi Pengiriman
  if (arg.toLowerCase() === "all") {
    console.log("\n📦 Mode Kirim Seluruh 5 Slot Sekaligus...");
    const batchResult = await publishToTelegram(storyData);
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log(`✅ Berhasil mengirim ${batchResult.totalSent}/5 kartu ke Telegram!`);
    console.log(`📄 PDF Link: ${batchResult.pdfUrl}`);
    console.log("═══════════════════════════════════════════════════════════════");
    return;
  }

  const slotNum = Math.min(Math.max(parseInt(arg, 10) || 1, 1), 5);
  console.log(`\n🎯 Menguji Kirim Slot ${slotNum} (1-per-1)...`);

  const startTime = Date.now();
  const result = await publishSlotToTelegram(storyData, slotNum);
  const totalDuration = Date.now() - startTime;

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log(`✅ HASIL TEST SLOT ${slotNum}:`);
  console.log(`   - Babak: ${result.act} (${result.time} WITA)`);
  console.log(`   - Headline: ${result.headline || "-"}`);
  console.log(`   - Waktu Render Gambar: ${result.renderTimeMs} ms (< 1 detik: ${result.renderTimeMs < 1000 ? "YA ⚡" : "TIDAK"})`);
  console.log(`   - Total Waktu (Render + Upload Telegram): ${totalDuration} ms`);
  console.log(`   - File: ${result.filename}`);
  console.log(`   - Telegram Message ID: ${result.messageId}`);
  if (result.pdfUrl) {
    console.log(`   - Link Panduan PDF: ${result.pdfUrl}`);
  }
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("\n❌ Gagal menjalankan test slot:", err.message);
  process.exit(1);
});
