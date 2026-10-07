import path from "node:path";
import dotenv from "dotenv";
import { createRequire } from "node:module";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { generateHeroPhoto, HIGH_END_TOTOK_SARAF_PROMPT } from "../lib/imagen.ts";
import { renderSingleFlyerPng } from "../lib/single-flyer-renderer.ts";

const require = createRequire(import.meta.url);
const { sendPhotoCard } = require("../lib/telegram-publisher.js");

async function main() {
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("🧪 TESTING IMAGEN 3 CALL & HIGH-END TOTOK SARAF FLYER PIPELINE");
  console.log("═══════════════════════════════════════════════════════════════════\n");

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || "785378199";

  console.log(`[Target] Telegram Chat ID: ${chatId}`);
  console.log(`[Target] Bot Token Present: ${!!botToken}`);
  console.log(`[Target] Gemini API Key Present: ${!!process.env.GEMINI_API_KEY}\n`);

  console.log("▶ Menguji generateHeroPhoto dengan high-end clinical acupressure prompt...");
  const heroPhoto = await generateHeroPhoto(undefined, {
    preset: "PROMO_KLINIK",
    aspectRatio: "9:16",
  });

  console.log("\n--- HASIL HERO PHOTO ---");
  console.log(`Source: ${heroPhoto.source}`);
  console.log(`Model: ${heroPhoto.model || "none"}`);
  console.log(`MimeType: ${heroPhoto.mimeType}`);
  console.log(`Buffer Size: ${heroPhoto.buffer.length} bytes`);
  console.log("-------------------------\n");

  console.log("▶ Merender flyer single promo 2K (template: 'bright-botanical')...");
  const flyerPngBuffer = await renderSingleFlyerPng({
    preset: "PROMO_KLINIK",
    templateId: "bright-botanical",
    title: "Totok Saraf Makassar",
    price: "Rp 150.000",
    duration: "± 1 Jam",
    address: "Jl. Batua Raya 10 B No.9 Makassar",
    schedule: "Senin – Sabtu 16.00 – 21.00 WITA",
    notes: "Maksimal 5 pasien per hari",
    heroPhotoBase64: heroPhoto.base64,
  });

  console.log(`✅ Flyer PNG Rendered: ${flyerPngBuffer.length} bytes (Ultra HD 2K 2160x3840)\n`);

  console.log(`▶ Mengirim flyer ke Telegram Chat ID ${chatId}...`);
  const caption =
    `🌿 [HASIL AUDIT IMAGEN & HERO CURATION] TOTOK SARAF MAKASSAR 🌿\n\n` +
    `📸 Foto Hero: Akupresur Titik Saraf Wajah & Dahi (Realistis & Autentik)\n` +
    `🎯 Template ID: bright-botanical (Replika Standar Target Image 1)\n` +
    `🤖 Status Engine: ${heroPhoto.source.toUpperCase()} (${heroPhoto.model})\n` +
    `💰 Biaya: Rp 150.000 (Durasi ± 1 Jam)\n` +
    `📍 Alamat: Jl. Batua Raya 10 B No.9 Makassar\n` +
    `⏰ Jadwal: Senin – Sabtu 16.00 – 21.00 WITA\n` +
    `📌 Catatan: Wajib buat janji min. sehari sebelum datang • Maksimal 5 pasien per hari\n\n` +
    `"Tubuh lebih rileks, pikiran lebih tenang"\n` +
    `📱 Ultra HD 2K Single Flyer siap WhatsApp Story.`;

  const sendResult = await sendPhotoCard(
    botToken,
    chatId,
    flyerPngBuffer,
    `totok-saraf-audit-${Date.now()}.png`,
    caption
  );

  if (sendResult.ok) {
    console.log("✅ SUKSES: Flyer berhasil dikirim ke Telegram!");
  } else {
    console.error("❌ Gagal mengirim ke Telegram:", sendResult);
  }

  console.log("\n═══════════════════════════════════════════════════════════════════");
  console.log("🏁 TESTING COMPLETE");
  console.log("═══════════════════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Fatal Test Error:", err);
  process.exit(1);
});
