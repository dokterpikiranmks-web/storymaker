#!/usr/bin/env node

/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2 — CLI Trigger Telegram Publisher
 *  Usage:
 *    npm run generate:telegram
 *    node scripts/trigger-telegram.js
 *    node scripts/trigger-telegram.js PIKIRAN
 *    node scripts/trigger-telegram.js TUBUH
 *    node scripts/trigger-telegram.js TEKNOLOGI
 * ════════════════════════════════════════════════════════════════════════════
 */

const path = require("node:path");
const dotenv = require("dotenv");

// Muat environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { generateStoryV2, PILLARS } = require("../lib/story-engine-v2");
const { publishToTelegram } = require("../lib/telegram-publisher");

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🚀 STORYMAKER V2 — TELEGRAM STORY PUBLISHER PIPELINE");
  console.log("   Brand: Dokter Pikiran (Ahmad Jawahir Zain)");
  console.log("═══════════════════════════════════════════════════════════════");

  // Periksa argumen CLI untuk pilar dan topik custom
  const args = process.argv.slice(2);
  let requestedPillar = null;
  let customTopic = null;

  for (const arg of args) {
    if (arg.startsWith("--pillar=")) {
      const clean = arg.replace(/^--pillar=/, "").toUpperCase();
      if (PILLARS[clean]) requestedPillar = clean;
    } else if (arg.startsWith("--topic=")) {
      customTopic = arg.replace(/^--topic=/, "");
    } else if (PILLARS[arg.toUpperCase()]) {
      requestedPillar = arg.toUpperCase();
    } else if (!customTopic && arg.length > 2) {
      customTopic = arg;
    }
  }

  try {
    console.log("🤖 Menghasilkan naskah 5 babak Story...");
    const storyData = await generateStoryV2({
      pillar: requestedPillar,
      topic: customTopic,
    });

    console.log(`📅 Tanggal : ${storyData.date}`);
    console.log(`🏛️ Pilar   : ${storyData.pillar} (${storyData.pillarTitle})`);
    console.log(`🎯 Topik   : ${storyData.topic}`);
    console.log(`🔑 Keyword : ${storyData.keyword}`);
    console.log(`⚡ Source  : ${storyData.source} (${storyData.model})`);
    console.log(`📱 Stories : ${storyData.stories.length} slide siap publish\n`);

    console.log("📤 Mengirim ke Telegram Bot Publisher...");
    const publishResult = await publishToTelegram(storyData);

    if (publishResult.success) {
      console.log("═══════════════════════════════════════════════════════════════");
      console.log("🎉 SUKSES! Seluruh 5 story berhasil dikirim ke Telegram!");
      console.log(`📬 Total pesan terkirim : ${publishResult.totalSent}`);
      console.log("📱 Silakan periksa Telegram untuk menyalin naskah ke WA Story.");
      console.log("═══════════════════════════════════════════════════════════════");
      process.exit(0);
    } else {
      console.error("❌ Gagal mengirim pesan ke Telegram.");
      process.exit(1);
    }
  } catch (err) {
    console.error("💥 Terjadi kesalahan fatal:", err.message || err);
    process.exit(1);
  }
}

main();
