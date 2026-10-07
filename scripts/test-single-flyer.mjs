import path from "node:path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { generateHeroPhoto } from "../lib/imagen.ts";
import { renderSingleFlyerPng } from "../lib/single-flyer-renderer.ts";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { sendPhotoCard } = require("../lib/telegram-publisher.js");

async function main() {
  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🚀 TESTING SINGLE FLYER STUDIO (1 STORY 9:16)");
  console.log("   Preset: Totok Saraf Makassar (PROMO_KLINIK)");
  console.log("═══════════════════════════════════════════════════════════════");

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || "785378199";

  console.log("1. Generating Hero Photo (Imagen 3 / Fallback)...");
  const photo = await generateHeroPhoto(undefined, { preset: "PROMO_KLINIK" });
  console.log(`   Photo source: ${photo.source} (${photo.model || "default"})`);

  console.log("2. Rendering 1080x1920 PNG Single Flyer via Satori...");
  const pngBuffer = await renderSingleFlyerPng({
    preset: "PROMO_KLINIK",
    title: "Totok Saraf Makassar",
    price: "Rp 150.000",
    duration: "± 1 Jam",
    address: "Jl. Batua Raya 10 B No.9 Makassar",
    schedule: "Senin – Sabtu 16.00 – 21.00 WITA",
    notes: "Maksimal 5 pasien per hari",
    heroPhotoBase64: photo.base64,
  });
  console.log(`   PNG generated successfully! Size: ${pngBuffer.length} bytes`);

  console.log(`3. Sending 1 Photo to Telegram Chat ${chatId}...`);
  const caption =
    `🌿 FLYER PROMOSI KLINIK • DOKTER PIKIRAN MAKASSAR 🌿\n\n` +
    `🎯 Layanan: Totok Saraf Makassar\n` +
    `💰 Biaya: Rp 150.000 (Durasi ± 1 Jam)\n` +
    `📍 Alamat: Jl. Batua Raya 10 B No.9 Makassar\n` +
    `⏰ Jadwal: Senin – Sabtu 16.00 – 21.00 WITA\n` +
    `📌 Catatan: Wajib reservasi min. sehari sebelum datang • Maksimal 5 pasien per hari\n\n` +
    `"Tubuh lebih rileks, pikiran lebih tenang"\n` +
    `Terapi Alami • Tanpa Obat • Tanpa Efek Samping\n\n` +
    `📲 Konsultasi & Reservasi Jadwal: Hubungi WhatsApp klinik atau balas pesan ini.\n` +
    `📱 Flyer 1-Story 9:16 siap dibagikan ke WhatsApp Story.`;

  const result = await sendPhotoCard(
    botToken,
    chatId,
    pngBuffer,
    "totok-saraf-makassar-flyer.png",
    caption
  );

  console.log("═══════════════════════════════════════════════════════════════");
  console.log("🎉 BERHASIL! 1 Flyer Promosi terkirim ke Telegram!", result.ok ? "OK" : result);
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
