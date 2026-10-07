import path from "node:path";
import dotenv from "dotenv";
import { createRequire } from "node:module";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { generateHeroPhoto } from "../lib/imagen.ts";
import { renderSingleFlyerPng } from "../lib/single-flyer-renderer.ts";

const require = createRequire(import.meta.url);
const { sendPhotoCard } = require("../lib/telegram-publisher.js");

async function runVerification() {
  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("🧪 STARTING VERIFICATION: 3 DISTINCT TEMPLATES & DYNAMIC IMAGEN");
  console.log("═══════════════════════════════════════════════════════════════════");

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || "785378199";

  console.log(`Telegram Chat Target: ${chatId} (Bot token available: ${!!botToken})\n`);

  // ─────────────────────────────────────────────────────────────────
  // TEST 1: Flyer Promo - template 'bright-botanical' & prompt terapi rileks
  // ─────────────────────────────────────────────────────────────────
  console.log("▶ [TEST 1/3] Merender Flyer Promo: 'bright-botanical' + Prompt Terapi Rileks...");
  const prompt1 = "terapi rileks somatik sentuhan lembut di klinik alami dengan pencahayaan hangat";
  const photo1 = await generateHeroPhoto(prompt1, { preset: "PROMO_KLINIK", aspectRatio: "9:16" });
  console.log(`   Photo 1 Result Source: ${photo1.source} | Model: ${photo1.model || "n/a"}`);

  const pngBuffer1 = await renderSingleFlyerPng({
    preset: "PROMO_KLINIK",
    templateId: "bright-botanical",
    customPrompt: prompt1,
    title: "Totok Saraf Makassar",
    price: "Rp 150.000",
    duration: "± 1 Jam",
    address: "Jl. Batua Raya 10 B No.9 Makassar",
    schedule: "Senin – Sabtu 16.00 – 21.00 WITA",
    notes: "Maksimal 5 pasien per hari",
    heroPhotoBase64: photo1.base64,
  });
  console.log(`   Flyer 1 PNG Rendered: ${pngBuffer1.length} bytes (Ultra HD 2K 2160x3840)`);

  const caption1 =
    `🌿 [UJI TEMPLATE 1/3] BRIGHT BOTANICAL SPA 🌿\n\n` +
    `🎯 Template ID: bright-botanical\n` +
    `💡 Prompt: "${prompt1}"\n` +
    `💰 Biaya: Rp 150.000 (Durasi ± 1 Jam)\n` +
    `📍 Alamat: Jl. Batua Raya 10 B No.9 Makassar\n` +
    `⏰ Jadwal: Senin – Sabtu 16.00 – 21.00 WITA\n` +
    `📌 Catatan: Wajib buat janji min. sehari sebelum datang • Maksimal 5 pasien per hari\n\n` +
    `"Tubuh lebih rileks, pikiran lebih tenang"\n` +
    `📱 Single Flyer 2K Ultra HD siap WhatsApp Story.`;

  const send1 = await sendPhotoCard(
    botToken,
    chatId,
    pngBuffer1,
    `verify-bright-botanical-${Date.now()}.png`,
    caption1
  );
  console.log(`   ✅ Test 1 Terkirim ke Telegram: ${send1.ok ? "SUKSES" : JSON.stringify(send1)}\n`);

  // ─────────────────────────────────────────────────────────────────
  // TEST 2: Flyer Promo - template 'warm-sand' & prompt akupresur leher
  // ─────────────────────────────────────────────────────────────────
  console.log("▶ [TEST 2/3] Merender Flyer Promo: 'warm-sand' + Prompt Akupresur Leher...");
  const prompt2 = "akupresur leher dan bahu rileks di ruang klinik minimalis bernuansa pasir hangat";
  const photo2 = await generateHeroPhoto(prompt2, { preset: "PROMO_KLINIK", aspectRatio: "9:16" });
  console.log(`   Photo 2 Result Source: ${photo2.source} | Model: ${photo2.model || "n/a"}`);

  const pngBuffer2 = await renderSingleFlyerPng({
    preset: "PROMO_KLINIK",
    templateId: "warm-sand",
    customPrompt: prompt2,
    title: "Totok Saraf Makassar",
    price: "Rp 150.000",
    duration: "± 1 Jam",
    address: "Jl. Batua Raya 10 B No.9 Makassar",
    schedule: "Senin – Sabtu 16.00 – 21.00 WITA",
    notes: "Khusus 5 sesi privat per hari • Reservasi H-1",
    heroPhotoBase64: photo2.base64,
  });
  console.log(`   Flyer 2 PNG Rendered: ${pngBuffer2.length} bytes (Ultra HD 2K 2160x3840)`);

  const caption2 =
    `🏛️ [UJI TEMPLATE 2/3] WARM SAND EDITORIAL 🏛️\n\n` +
    `🎯 Template ID: warm-sand\n` +
    `💡 Prompt: "${prompt2}"\n` +
    `💰 Biaya: Rp 150.000 (Durasi ± 1 Jam)\n` +
    `📍 Alamat: Jl. Batua Raya 10 B No.9 Makassar\n` +
    `⏰ Jadwal: Senin – Sabtu 16.00 – 21.00 WITA\n` +
    `📌 Catatan: Khusus 5 sesi privat per hari • Reservasi H-1\n\n` +
    `"Vol. 01 — Restorasi Somatik & Keseimbangan Vagus"\n` +
    `📱 Single Flyer 2K Ultra HD Editorial Kinfolk Style.`;

  const send2 = await sendPhotoCard(
    botToken,
    chatId,
    pngBuffer2,
    `verify-warm-sand-${Date.now()}.png`,
    caption2
  );
  console.log(`   ✅ Test 2 Terkirim ke Telegram: ${send2.ok ? "SUKSES" : JSON.stringify(send2)}\n`);

  // ─────────────────────────────────────────────────────────────────
  // TEST 3: Quote Card - template 'cinematic' & teks kustom
  // ─────────────────────────────────────────────────────────────────
  console.log("▶ [TEST 3/3] Merender Quote Card: 'cinematic' + Teks Kustom...");
  const prompt3 = "suasana hening pagi hari dengan pencahayaan sinematik temaram menembus tirai kayu alami";
  const customQuoteText =
    "Ketenangan batin bukan tentang hilangnya semua badai di luar sana, melainkan kesadaran penuh bahwa tubuhmu memiliki jangkar yang kokoh di dalamnya.";
  const photo3 = await generateHeroPhoto(prompt3, { preset: "QUOTES", aspectRatio: "9:16" });
  console.log(`   Photo 3 Result Source: ${photo3.source} | Model: ${photo3.model || "n/a"}`);

  const pngBuffer3 = await renderSingleFlyerPng({
    preset: "QUOTES",
    templateId: "cinematic",
    customPrompt: prompt3,
    title: customQuoteText,
    quoteAuthor: "Ahmad Jawahir Zain",
    notes: "Refleksi Meja Terapi Makassar • Sistem Saraf Otonom & Somatik",
    heroPhotoBase64: photo3.base64,
  });
  console.log(`   Quote 3 PNG Rendered: ${pngBuffer3.length} bytes (Ultra HD 2K 2160x3840)`);

  const caption3 =
    `✨ [UJI TEMPLATE 3/3] CINEMATIC DEEP ATMOSPHERE ✨\n\n` +
    `🎯 Template ID: cinematic\n` +
    `"${customQuoteText}"\n\n` +
    `— Ahmad Jawahir Zain\n` +
    `Hipnoterapis Klinis & Solo AI Dev • Makassar, WITA\n\n` +
    `💡 Refleksi Meja Terapi Makassar • Sistem Saraf Otonom & Somatik\n` +
    `📱 Quote Card 2K Ultra HD siap WhatsApp Story.`;

  const send3 = await sendPhotoCard(
    botToken,
    chatId,
    pngBuffer3,
    `verify-cinematic-quote-${Date.now()}.png`,
    caption3
  );
  console.log(`   ✅ Test 3 Terkirim ke Telegram: ${send3.ok ? "SUKSES" : JSON.stringify(send3)}\n`);

  console.log("═══════════════════════════════════════════════════════════════════");
  console.log("🎉 PENGUJIAN SELESAI: SEMUA 3 GAMBAR BERHASIL DIRENDER & DIKIRIM!");
  console.log("═══════════════════════════════════════════════════════════════════");
}

runVerification().catch((err) => {
  console.error("❌ Fatal verification error:", err);
  process.exit(1);
});
