/**
 * tests/phase1-content-engine.test.ts
 * Comprehensive Automated Test Suite for Tahap 1: Content Matrix & Persona Engine.
 */

import { detectBannedSlang, validateStoryDraft, calculateStoryWordCount } from "../src/lib/ahmad-persona";
import { WEEKLY_CONTENT_MATRIX, getDailyEdition } from "../src/lib/content-matrix";
import { validateDailyEdition, getWeeklyScheduleAudit, searchStoryMatrix } from "../src/lib/story-curator";
import type { StoryDraft, SlotTime, ContentPillar } from "../src/lib/types";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ FAIL: ${testName}${detail ? ` -> ${detail}` : ""}`);
    failedCount++;
  }
}

async function runAllTests() {
  console.log("===============================================================================");
  console.log("  TAHAP 1: CONTENT MATRIX & AHMAD PERSONA ENGINE AUTOMATED TEST SUITE");
  console.log("===============================================================================\n");

  // ---------------------------------------------------------------------------
  // SUITE 1: BANNED JAKARTA SLANG DETECTION & PERSONA COMPLIANCE
  // ---------------------------------------------------------------------------
  console.log("▶ SUITE 1: Banned Jakarta Slang Detection & Makassar Persona");
  {
    const badText1 = "Gue ngga ngira kalau lambung lu bisa kena asam lambung parah banget.";
    const detected1 = detectBannedSlang(badText1);
    assert(
      detected1.includes("gue") && detected1.includes("ngga") && detected1.includes("ngira") && detected1.includes("lu") && detected1.includes("banget"),
      "Mendeteksi slang gaul Jakarta (gue, ngga, ngira, lu, banget)",
      `Found: ${detected1.join(", ")}`
    );

    const badText2 = "Udah mager, baperan lagi, santuy aja cuy.";
    const detected2 = detectBannedSlang(badText2);
    assert(
      detected2.includes("udah") &&
        detected2.includes("mager") &&
        detected2.some((w) => w.startsWith("baper")) &&
        detected2.includes("santuy") &&
        detected2.includes("cuy"),
      "Mendeteksi slang gaul modern (udah, mager, baper/baperan, santuy, cuy)",
      `Found: ${detected2.join(", ")}`
    );

    const goodMakassarText =
      "Banyak orang mengira asam lambung yang naik murni karena telat makan. Padahal ketika Anda memendam cemas, usus seketika terkunci.";
    const detectedGood = detectBannedSlang(goodMakassarText);
    assert(detectedGood.length === 0, "Bahasa santai-formal Makassar yang bersih bebas dari deteksi slang");

    // Validation rejection test
    const dummyDraftBad: StoryDraft = {
      id: "bad-draft",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 1,
      theme: "Slang Test",
      tag: "TEST",
      title: "Lu ngga usah overthinking banget deh",
      body: ["Gue rasa hidup lu udah capek banget."],
      signature: "Ahmad",
      subSignature: "Dokter Pikiran",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    };
    const resBad = validateStoryDraft(dummyDraftBad);
    assert(!resBad.valid, "Draft dengan slang gaul Jakarta wajib DITOLAK (!valid)");
    assert(resBad.bannedSlangFound.length >= 3, "Ditemukan multiple banned slang pada draft uji");
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: WORD COUNT & 1-SLIDE READABILITY CONSTRAINTS
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 2: 1-Slide Word Count & Readability Limits");
  {
    const shortDraft: StoryDraft = {
      id: "short-draft",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 1,
      theme: "Short Test",
      tag: "TEST",
      title: "Ketenangan Hidup Hakiki",
      body: [
        "Ketenangan bukan berarti tidak ada masalah.",
        "Ketenangan adalah ketika Anda memilih untuk tidak membiarkan keributan di luar masuk ke dalam kepala Anda.",
      ],
      signature: "Ahmad",
      subSignature: "Dokter Pikiran",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    };
    const wordCount = calculateStoryWordCount(shortDraft);
    assert(wordCount > 10 && wordCount < 50, `Word count pendek terhitung akurat (${wordCount} kata)`);
    assert(validateStoryDraft(shortDraft).isWordCountSafe, "Draft ringkas lolos isWordCountSafe");

    // Overly long text (> 130 words)
    const longDraft: StoryDraft = {
      ...shortDraft,
      body: Array(10).fill(
        "Ini adalah kalimat yang sangat panjang dan sengaja diulang berkali-kali untuk menguji batas ketahanan sistem terhadap teks berlebihan yang tidak layak ditampilkan dalam satu slide layar ponsel sembilan banding enam belas."
      ),
    };
    const resLong = validateStoryDraft(longDraft);
    assert(!resLong.isWordCountSafe, "Draft kepanjangan (> 130 kata) ditolak oleh isWordCountSafe");
    assert(!resLong.valid, "Draft kepanjangan berstatus !valid");
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: MULTI-PILLAR STRUCTURE & TOPIC DIVERSITY (35 SLIDES)
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 3: Multi-Pillar Diversity Across 7 Days (35 Slides)");
  {
    const scheduleAudit = getWeeklyScheduleAudit();
    assert(scheduleAudit.totalDays === 7, "Total hari dalam seminggu adalah 7");
    assert(scheduleAudit.totalStories === 35, "Total materi mingguan adalah 35 slide tunggal (5 slot x 7 hari)");

    // Check pillars for every single day
    const expectedSlots: SlotTime[] = ["07:00", "10:00", "12:00", "19:00", "21:00"];
    const expectedPillars: ContentPillar[] = [
      "MOTIVASI_PAGI",
      "KESEHATAN_FUNGSIONAL",
      "MENTAL_NEUROSAINS",
      "SELF_TERAPI",
      "INSPIRASI_MALAM",
    ];

    let allDaysStructured = true;
    for (let d = 0; d < 7; d++) {
      const dayEdition = WEEKLY_CONTENT_MATRIX[d];
      for (let i = 0; i < expectedSlots.length; i++) {
        const slot = expectedSlots[i];
        const story = dayEdition[slot];
        if (!story || story.pillar !== expectedPillars[i]) {
          allDaysStructured = false;
        }
      }
    }
    assert(allDaysStructured, "Setiap hari memiliki struktur 5 slot dan 5 pilar yang konsisten dan tepat");
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: RUANG PULIH PROMOTIONAL CADENCE (EXACTLY 3X A WEEK)
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 4: Ruang Pulih Promotion Cadence (3x Seminggu)");
  {
    const scheduleAudit = getWeeklyScheduleAudit();
    assert(
      scheduleAudit.totalPromoStories === 3,
      `Promosi Ruang Pulih tepat 3 kali dalam seminggu (terhitung: ${scheduleAudit.totalPromoStories}x)`
    );
    assert(scheduleAudit.isPromoCadenceCorrect, "isPromoCadenceCorrect berstatus true");

    // Verify promo days are Tuesday (2), Thursday (4), Saturday (6)
    const tuesdayStory = WEEKLY_CONTENT_MATRIX[2]["12:00"];
    const thursdayStory = WEEKLY_CONTENT_MATRIX[4]["12:00"];
    const saturdayStory = WEEKLY_CONTENT_MATRIX[6]["12:00"];

    assert(tuesdayStory.isRuangPulihPromo, "Promosi aktif di hari Selasa (Slot 12:00)");
    assert(thursdayStory.isRuangPulihPromo, "Promosi aktif di hari Kamis (Slot 12:00)");
    assert(saturdayStory.isRuangPulihPromo, "Promosi aktif di hari Sabtu (Slot 12:00)");

    // Verify other days DO NOT have promo
    const mondayStory = WEEKLY_CONTENT_MATRIX[1]["12:00"];
    const wednesdayStory = WEEKLY_CONTENT_MATRIX[3]["12:00"];
    const fridayStory = WEEKLY_CONTENT_MATRIX[5]["12:00"];
    const sundayStory = WEEKLY_CONTENT_MATRIX[0]["12:00"];

    assert(!mondayStory.isRuangPulihPromo, "Hari Senin tidak ada promosi Ruang Pulih");
    assert(!wednesdayStory.isRuangPulihPromo, "Hari Rabu tidak ada promosi Ruang Pulih");
    assert(!fridayStory.isRuangPulihPromo, "Hari Jumat tidak ada promosi Ruang Pulih");
    assert(!sundayStory.isRuangPulihPromo, "Hari Minggu tidak ada promosi Ruang Pulih");
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: VALIDASI SELURUH 35 KONTEN PRODUKSI (ZERO ERRORS)
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 5: Full 35-Card Production Matrix Quality Validation");
  {
    let totalErrors = 0;
    let totalSlangDetected = 0;
    let totalWordCountIssues = 0;

    for (let d = 0; d < 7; d++) {
      const edition = getDailyEdition(new Date(2026, 10, 2 + d)); // Sample week dates
      const summary = validateDailyEdition(edition);

      if (!summary.valid) {
        totalErrors += summary.totalErrors;
      }

      Object.values(summary.slotResults).forEach((res) => {
        if (!res.isMakassarCompliant) totalSlangDetected += res.bannedSlangFound.length;
        if (!res.isWordCountSafe) totalWordCountIssues++;
      });
    }

    assert(totalErrors === 0, `Seluruh 35 konten produksi lolos validasi (0 error ditemukan)`);
    assert(totalSlangDetected === 0, "Nol slang gaul Jakarta ditemukan pada seluruh 35 materi");
    assert(totalWordCountIssues === 0, "Semua 35 materi memenuhi batas kata aman 1-slide");
  }

  // ---------------------------------------------------------------------------
  // SUITE 6: SEARCH & DISCOVERY MATRIX
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 6: Topic Diversity & Discovery Matrix");
  {
    const parentingMatches = searchStoryMatrix("anak");
    assert(parentingMatches.length >= 1, `Topik parenting/anak ditemukan (${parentingMatches.length} materi)`);

    const gutBrainMatches = searchStoryMatrix("asam lambung");
    assert(gutBrainMatches.length >= 1, `Topik gut-brain/asam lambung ditemukan (${gutBrainMatches.length} materi)`);

    const rezekiMatches = searchStoryMatrix("rezeki");
    assert(rezekiMatches.length >= 1, `Topik rezeki/tawakkal ditemukan (${rezekiMatches.length} materi)`);

    const herbalMatches = searchStoryMatrix("kurkumin");
    assert(herbalMatches.length >= 1, `Solusi herbal berbasis sains (kurkumin) ditemukan (${herbalMatches.length} materi)`);

    const akupresurMatches = searchStoryMatrix("akupresur");
    assert(akupresurMatches.length >= 1, `Solusi akupresur fungsional ditemukan (${akupresurMatches.length} materi)`);
  }

  // ---------------------------------------------------------------------------
  // FINAL SCORE SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  HASIL AKHIR TAHAP 1: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("===============================================================================");

  if (failedCount > 0) {
    console.error("\n❌ TAHAP 1 GAGAL: Masih ada test yang belum lolos!");
    process.exit(1);
  } else {
    console.log("\n🏆 TAHAP 1 TEST-PASS: Seluruh kriteria berhasil diverifikasi 100%!");
    console.log("Siap melangkah ke Tahap 2: Satori High-Speed Renderer API & Visual Integration.");
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error("Test runner crashed:", err);
  process.exit(1);
});
