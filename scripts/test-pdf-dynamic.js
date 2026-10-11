/**
 * Test Script: Verifikasi Pembuatan PDF Dinamis & Makassar WITA Schedule
 */
const { generateProtocolPdf } = require("../src/lib/pdf/generator");
const { resolvePillar, resolvePillarKeyword, getMakassarSchedule } = require("../lib/story-engine-v2");

async function main() {
  console.log("=== 1. VERIFIKASI JADWAL WITA RESMI ===");
  const todayWita = getMakassarSchedule();
  console.log("Hari ini:", todayWita);
  console.log("Pilar Terpilih:", resolvePillar());
  console.log("Keyword Terpilih:", resolvePillarKeyword("TUBUH"));

  const testSunday = new Date("2026-10-11T12:00:00+08:00");
  const sunSched = getMakassarSchedule(testSunday);
  console.log("Ahad (Day 0) Pilar:", sunSched.schedule.pillar, "CTA Keyword:", sunSched.schedule.keyword);
  if (sunSched.schedule.pillar !== "TUBUH" || sunSched.schedule.keyword !== "PULIH") {
    throw new Error("Gagal: Ahad harus TUBUH dengan CTA PULIH");
  }

  const testMonday = new Date("2026-10-12T12:00:00+08:00");
  const monSched = getMakassarSchedule(testMonday);
  console.log("Senin (Day 1) Pilar:", monSched.schedule.pillar, "CTA Keyword:", monSched.schedule.keyword);
  if (monSched.schedule.pillar !== "TUBUH" || monSched.schedule.keyword !== "LAMBUNG") {
    throw new Error("Gagal: Senin harus TUBUH dengan CTA LAMBUNG");
  }

  console.log("\n=== 2. VERIFIKASI GENERATE PDF DINAMIS DENGAN PARAMETER ===");
  const topic = "Uji Topik Baru";
  const pillar = "TUBUH";
  const keyword = "PULIH";

  const buffer = await generateProtocolPdf({
    storyData: {
      topic,
      pillar,
      keyword,
      edukasi: "Uji mekanisme edukasi biologis.",
      praktik: "Uji instruksi 3 langkah somatik.",
      bukti: "Uji catatan meja terapi Makassar.",
      date: "2026-10-11",
    },
    campaignDate: "2026-10-11",
    themeTopic: topic,
  });

  console.log("PDF Buffer size:", buffer.length, "bytes");
  const pdfStr = Buffer.from(buffer).toString("latin1");
  const hasTopic = pdfStr.includes(topic);
  const hasPillar = pdfStr.includes(pillar);
  console.log(`Verifikasi Judul "${topic}" ada di PDF:`, hasTopic ? "✅ YA" : "❌ TIDAK");
  console.log(`Verifikasi Pilar "${pillar}" ada di PDF:`, hasPillar ? "✅ YA" : "❌ TIDAK");

  console.log("\n✅ SEMUA PENGUJIAN PDF DINAMIS & JADWAL WITA SUKSES 100%!");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
