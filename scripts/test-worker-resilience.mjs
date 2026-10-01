#!/usr/bin/env node
import assert from "node:assert/strict";
import {
  checkDue,
  getLocalDateString,
  extractMessageText,
  isKeywordMatched,
  KEYWORDS,
} from "../worker/index.mjs";

console.log("🧪 Memulai Pengujian Otomatis Worker Resilience & Inbound Parser...\n");

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(`   Alasan: ${err.message}\n`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SKENARIO 1: Deep Unwrapping Struktur Pesan WhatsApp
// ─────────────────────────────────────────────────────────────────────────────
console.log("📋 Kategori 1: Ekstraksi Naskah Berlapis (Deep Unwrapping)");

runTest("1.1 Ekstraksi format conversation standar", () => {
  const msg = { conversation: "RESET" };
  const text = extractMessageText(msg);
  assert.equal(text, "RESET");
});

runTest("1.2 Ekstraksi format extendedTextMessage", () => {
  const msg = { extendedTextMessage: { text: "Saya ingin panduan RESET vagus" } };
  const text = extractMessageText(msg);
  assert.equal(text, "Saya ingin panduan RESET vagus");
});

runTest("1.3 Ekstraksi format ephemeralMessage (Disappearing Messages)", () => {
  const msg1 = {
    ephemeralMessage: {
      message: {
        conversation: "RESET",
      },
    },
  };
  assert.equal(extractMessageText(msg1), "RESET");

  const msg2 = {
    ephemeralMessage: {
      message: {
        extendedTextMessage: {
          text: "Minta panduan protokol somatik dong dok",
        },
      },
    },
  };
  assert.equal(extractMessageText(msg2), "Minta panduan protokol somatik dong dok");
});

runTest("1.4 Ekstraksi format viewOnceMessage / media caption", () => {
  const viewOnce = {
    viewOnceMessage: {
      message: {
        extendedTextMessage: { text: "KONSUL DOKTER" },
      },
    },
  };
  assert.equal(extractMessageText(viewOnce), "KONSUL DOKTER");

  const imgMsg = { imageMessage: { caption: "KATA KUNCI: RESET" } };
  assert.equal(extractMessageText(imgMsg), "KATA KUNCI: RESET");

  const vidMsg = { videoMessage: { caption: "VAGUS PROTOKOL" } };
  assert.equal(extractMessageText(vidMsg), "VAGUS PROTOKOL");
});

runTest("1.5 Filter Ketat JID (Personal, Group, Broadcast, fromMe)", () => {
  function shouldProcess(m) {
    if (m.key.fromMe) return false;
    const remoteJid = m.key.remoteJid || "";
    if (remoteJid.endsWith("@g.us") || remoteJid.endsWith("@broadcast")) return false;
    if (!remoteJid.endsWith("@s.whatsapp.net") && !remoteJid.endsWith("@lid")) return false;
    return true;
  }

  // Personal chats
  assert.equal(shouldProcess({ key: { fromMe: false, remoteJid: "62811443327@s.whatsapp.net" } }), true);
  assert.equal(shouldProcess({ key: { fromMe: false, remoteJid: "1234567890123@lid" } }), true);

  // Group chats (wajib diabaikan)
  assert.equal(shouldProcess({ key: { fromMe: false, remoteJid: "120363024829@g.us" } }), false);

  // Status broadcast (wajib diabaikan)
  assert.equal(shouldProcess({ key: { fromMe: false, remoteJid: "status@broadcast" } }), false);

  // Pesan dari diri sendiri (wajib diabaikan)
  assert.equal(shouldProcess({ key: { fromMe: true, remoteJid: "62811443327@s.whatsapp.net" } }), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SKENARIO 2: Deteksi Kata Kunci
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Kategori 2: Deteksi Kata Kunci Trigger (RESET, VAGUS, dll)");

runTest("2.1 Deteksi kata kunci 'RESET' (case-insensitive)", () => {
  assert.equal(isKeywordMatched("RESET"), true);
  assert.equal(isKeywordMatched("reset"), true);
  assert.equal(isKeywordMatched("  Reset  "), true);
  assert.equal(isKeywordMatched("Halo dokter, saya mau minta panduan RESET saraf"), true);
});

runTest("2.2 Deteksi seluruh varian KEYWORDS resmi", () => {
  for (const kw of KEYWORDS) {
    assert.equal(isKeywordMatched(`Saya ingin ${kw.toLowerCase()} sekarang`), true, `Gagal mencocokkan: ${kw}`);
  }
});

runTest("2.3 Abaikan percakapan biasa tanpa kata kunci", () => {
  assert.equal(isKeywordMatched("Halo selamat pagi"), false);
  assert.equal(isKeywordMatched("Apakah besok ada jadwal buka klinik?"), false);
  assert.equal(isKeywordMatched(""), false);
  assert.equal(isKeywordMatched(null), false);
});

// ─────────────────────────────────────────────────────────────────────────────
// SKENARIO 3: Logika Evaluasi checkDue() dan Catch-Up Babak 1 (07:15 WITA vs 07:40 WITA)
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n📋 Kategori 3: Evaluasi checkDue() & Catch-Up Babak 1 (07:15 WITA)");

// Simulasi waktu saat ini: Jumat 2 Okt 2026, 07:40:00 WITA (Asia/Makassar, UTC+8)
// 07:40:00 WITA = 2026-10-01T23:40:00.000Z
const SIMULATED_NOW_MS = new Date("2026-10-01T23:40:00.000Z").getTime();

runTest("3.1 Babak 1 (07:15 WITA hari ini) wajib terdeteksi due & isCatchUp = true", () => {
  // Babak 1: 07:15 WITA = 2026-10-01T23:15:00.000Z
  const babak1Slide = {
    id: "slide-babak-1",
    label: "Babak 1 · Fajar 07:15 · The Tension",
    status: "SCHEDULED",
    scheduledAt: "2026-10-01T23:15:00.000Z",
    campaignDate: "2026-10-02",
    targetTime: "07:15:00",
    postToWhatsapp: true,
  };

  const result = checkDue(babak1Slide, SIMULATED_NOW_MS);
  assert.equal(result.due, true, "Babak 1 harus due");
  assert.equal(result.isCatchUp, true, "Babak 1 harus ditandai isCatchUp");
  assert.match(result.reason, /catch-up hari ini \(25 menit lewat jadwal/i);
});

runTest("3.2 Babak 2 (11:30 WITA hari ini) belum waktu tayang (due = false)", () => {
  // Babak 2: 11:30 WITA = 2026-10-02T03:30:00.000Z
  const babak2Slide = {
    id: "slide-babak-2",
    label: "Babak 2 · Siang 11:30 · The Logic Shift",
    status: "SCHEDULED",
    scheduledAt: "2026-10-02T03:30:00.000Z",
    campaignDate: "2026-10-02",
    targetTime: "11:30:00",
    postToWhatsapp: true,
  };

  const result = checkDue(babak2Slide, SIMULATED_NOW_MS);
  assert.equal(result.due, false, "Babak 2 tidak boleh due sekarang");
  assert.equal(result.isCatchUp, false);
  assert.match(result.reason, /belum waktu tayang/i);
});

runTest("3.3 Slide campaign kemarin yang tertinggal tidak boleh dikirim hari ini", () => {
  const yesterdaySlide = {
    id: "slide-yesterday",
    label: "Babak 1 · Kemarin 07:15",
    status: "SCHEDULED",
    scheduledAt: "2026-09-30T23:15:00.000Z", // 07:15 WITA pada 2026-10-01
    campaignDate: "2026-10-01",
    targetTime: "07:15:00",
    postToWhatsapp: true,
  };

  const result = checkDue(yesterdaySlide, SIMULATED_NOW_MS);
  assert.equal(result.due, false, "Slide sisa kemarin tidak boleh due");
  assert.match(result.reason, /bukan jadwal hari ini/i);
});

runTest("3.4 Slide dengan instruksi forcePost diproses seketika tanpa cek jam", () => {
  const forceSlide = {
    id: "slide-force",
    label: "Babak 3 · Sore 15:45 · The Protocol",
    status: "SCHEDULED",
    scheduledAt: "2026-10-02T07:45:00.000Z", // 15:45 WITA
    campaignDate: "2026-10-02",
    forcePost: true,
  };

  const result = checkDue(forceSlide, SIMULATED_NOW_MS);
  assert.equal(result.due, true);
  assert.equal(result.isForce, true);
});

runTest("3.5 Fallback targetTime 07:15 jika scheduledAt null", () => {
  const fallbackSlide = {
    id: "slide-fallback",
    label: "Babak 1 · Fajar 07:15",
    status: "SCHEDULED",
    scheduledAt: null,
    targetTime: "07:15",
  };

  const result = checkDue(fallbackSlide, SIMULATED_NOW_MS);
  assert.equal(result.due, true);
  assert.equal(result.isCatchUp, true);
  assert.match(result.reason, /targetTime 07:15:00 <= 07:40:00/i);
});

// ─────────────────────────────────────────────────────────────────────────────
// REKAPITULASI HASIL TES
// ─────────────────────────────────────────────────────────────────────────────
console.log("\n" + "═".repeat(60));
console.log(`📊 Hasil Pengujian: ${passedTests} / ${totalTests} pengujian berhasil [PASS]`);
console.log("═".repeat(60) + "\n");

if (passedTests === totalTests) {
  console.log("🎉 SELURUH SKENARIO RESILIENCE & CATCH-UP BERHASIL 100% [PASS]!\n");
  process.exit(0);
} else {
  console.error("❌ ADA PENGUJIAN YANG GAGAL. Periksa log di atas.\n");
  process.exit(1);
}
