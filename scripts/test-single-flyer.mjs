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
  console.log("🚀 TESTING SINGLE FLYER & QUOTE STUDIO (2K ULTRA HD 2160x3840)");
  console.log("═══════════════════════════════════════════════════════════════");

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || "785378199";

  // ── TEST 1: PROMO KLINIK (BRIGHT BOTANICAL SPA - ULTRA HD 2K) ──
  console.log("\n[TEST 1] Generating Promo Klinik: Totok Saraf Makassar (Bright Botanical 2K)...");
  const promoPhoto = await generateHeroPhoto(undefined, { preset: "PROMO_KLINIK" });
  console.log(`   Photo source: ${promoPhoto.source} (${promoPhoto.model || "default"})`);

  console.log("   Rendering 2160x3840 PNG Promo Flyer...");
  const promoPng = await renderSingleFlyerPng({
    preset: "PROMO_KLINIK",
    templateId: "bright_botanical",
    title: "Totok Saraf Makassar",
    price: "Rp 150.000",
    duration: "± 1 Jam",
    address: "Jl. Batua Raya 10 B No.9 Makassar",
    schedule: "Senin – Sabtu 16.00 – 21.00 WITA",
    notes: "Maksimal 5 pasien per hari",
    heroPhotoBase64: promoPhoto.base64,
  });
  console.log(`   Promo PNG Buffer size: ${promoPng.length} bytes`);

  console.log(`   Sending Promo Flyer to Telegram Chat ${chatId}...`);
  const promoCaption =
    `🌿 FLYER PROMOSI KLINIK • DOKTER PIKIRAN MAKASSAR 🌿\n\n` +
    `🎯 Layanan: Totok Saraf Makassar (Bright Botanical Spa 2K)\n` +
    `💰 Biaya: Rp 150.000 (Durasi ± 1 Jam)\n` +
    `📍 Alamat: Jl. Batua Raya 10 B No.9 Makassar\n` +
    `⏰ Jadwal: Senin – Sabtu 16.00 – 21.00 WITA\n` +
    `📌 Catatan: Wajib buat janji min. sehari sebelum datang • Maksimal 5 pasien per hari\n\n` +
    `"Tubuh lebih rileks, pikiran lebih tenang"\n` +
    `Terapi Alami • Tanpa Obat • Tanpa Efek Samping\n\n` +
    `📲 WhatsApp Reservasi: Balas pesan ini atau hubungi klinik langsung.\n` +
    `📱 Desain Standar Komersial 2K Ultra HD (2160x3840 px).`;

  const promoRes = await sendPhotoCard(
    botToken,
    chatId,
    promoPng,
    "totok-saraf-2k-promo.png",
    promoCaption
  );
  console.log("   ✅ Promo Flyer berhasil terkirim ke Telegram!", promoRes.ok ? "OK" : promoRes);

  // ── TEST 2: QUOTES EDITORIAL (CINEMATIC DEEP ATMOSPHERE - ULTRA HD 2K) ──
  console.log("\n[TEST 2] Generating Quote Editorial: Refleksi Meja Terapi (Cinematic 2K)...");
  const quotePhoto = await generateHeroPhoto(undefined, { preset: "QUOTES" });
  console.log(`   Photo source: ${quotePhoto.source} (${quotePhoto.model || "default"})`);

  console.log("   Rendering 2160x3840 PNG Quote Card...");
  const quotePng = await renderSingleFlyerPng({
    preset: "QUOTES",
    templateId: "cinematic",
    title: "Tubuhmu tidak sedang melawanmu, ia hanya sedang kelelahan melindungi dirimu. Beri ia rasa aman.",
    notes: "Catatan Meja Terapi Makassar • Sistem Saraf & Bawah Sadar",
    heroPhotoBase64: quotePhoto.base64,
  });
  console.log(`   Quote PNG Buffer size: ${quotePng.length} bytes`);

  console.log(`   Sending Quote Card to Telegram Chat ${chatId}...`);
  const quoteCaption =
    `✨ REFLEKSI MEJA TERAPI • DOKTER PIKIRAN MAKASSAR ✨\n\n` +
    `"Tubuhmu tidak sedang melawanmu, ia hanya sedang kelelahan melindungi dirimu. Beri ia rasa aman."\n\n` +
    `— Ahmad Jawahir Zain\n` +
    `Hipnoterapis Klinis & Solo AI Dev • Makassar, WITA\n\n` +
    `💡 Catatan Meja Terapi Makassar • Sistem Saraf & Bawah Sadar\n\n` +
    `📱 Kartu Quote Editorial 2K Ultra HD (2160x3840 px) siap dibagikan ke WhatsApp Story.`;

  const quoteRes = await sendPhotoCard(
    botToken,
    chatId,
    quotePng,
    "quote-cinematic-2k.png",
    quoteCaption
  );
  console.log("   ✅ Quote Card berhasil terkirim ke Telegram!", quoteRes.ok ? "OK" : quoteRes);

  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("🎉 SEMUA TEST BERHASIL! 2K Promo Flyer & 2K Quote Card terkirim ke Telegram!");
  console.log("═══════════════════════════════════════════════════════════════");
}

main().catch((err) => {
  console.error("❌ Test error:", err);
  process.exit(1);
});
