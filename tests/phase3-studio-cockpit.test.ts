/**
 * tests/phase3-studio-cockpit.test.ts
 * Comprehensive Automated Test Suite for Tahap 3: Studio Cockpit UI & Integration.
 */

import { NextRequest } from "next/server";
import { WEEKLY_CONTENT_MATRIX, getStoryForSlot, parseDayIndex } from "../src/lib/content-matrix";
import { detectBannedSlang, calculateStoryWordCount, validateStoryDraft } from "../src/lib/ahmad-persona";
import { POST, GET } from "../src/app/api/render/route";
import type { SlotTime, StoryDraft, ContentPillar } from "../src/lib/types";

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

// Helper simulating Studio Cockpit Caption Generation
function generateCaption(draft: StoryDraft, editedTitle: string, editedBody: string, highlightLabel?: string, highlightContent?: string): string {
  const lines: string[] = [];
  lines.push(`✨ ${draft.tag} · ${draft.slot} WITA`);
  lines.push("");
  lines.push(`"${editedTitle}"`);
  lines.push("");
  lines.push(editedBody);

  if (highlightLabel && highlightContent) {
    lines.push("");
    lines.push(`💡 [${highlightLabel}]`);
    lines.push(highlightContent);
  }

  lines.push("");
  lines.push("---");
  lines.push("Ahmad Jawahir Zain");
  lines.push("Dokter Pikiran Makassar");

  if (draft.isRuangPulihPromo) {
    lines.push("");
    lines.push("Konsultasi & Terapi: Hubungi Ruang Pulih Dokter Pikiran Makassar.");
  }

  lines.push("");
  lines.push("#DokterPikiran #KesehatanMental #HipnoterapiMakassar #HolisticMedicine #RuangPulih");

  return lines.join("\n");
}

// Helper simulating Studio Cockpit Filename Generation
function generateDownloadFilename(dayName: string, slot: string, pillar: ContentPillar): string {
  const cleanSlot = slot.replace(":", "");
  return `DokterPikiran-${dayName}-${cleanSlot}-${pillar}.png`;
}

async function runPhase3Tests() {
  console.log("===============================================================================");
  console.log("  TAHAP 3: STUDIO COCKPIT UI & INTERACTIVE LOGIC TEST SUITE");
  console.log("===============================================================================\n");

  // ---------------------------------------------------------------------------
  // SUITE 1: 7-DAY & 5-SLOT MATRIX NAVIGATION READINESS
  // ---------------------------------------------------------------------------
  console.log("▶ SUITE 1: Navigation Data Integrity (7 Days x 5 Slots)");
  {
    const expectedDays = [
      { index: 1, name: "Senin", isPromo: false },
      { index: 2, name: "Selasa", isPromo: true },
      { index: 3, name: "Rabu", isPromo: false },
      { index: 4, name: "Kamis", isPromo: true },
      { index: 5, name: "Jumat", isPromo: false },
      { index: 6, name: "Sabtu", isPromo: true },
      { index: 0, name: "Minggu", isPromo: false },
    ];

    const slots: SlotTime[] = ["07:00", "10:00", "12:00", "19:00", "21:00"];

    for (const day of expectedDays) {
      for (const slot of slots) {
        const draft = getStoryForSlot(slot, day.index);
        assert(draft !== null, `Materi tersedia untuk hari ${day.name} slot ${slot}`);
        assert(draft?.slot === slot, `Slot cocok untuk hari ${day.name} (${draft?.slot} === ${slot})`);
      }

      const noonStory = getStoryForSlot("12:00", day.index)!;
      assert(
        noonStory.isRuangPulihPromo === day.isPromo,
        `Status promo hari ${day.name} jam 12:00 tepat (${noonStory.isRuangPulihPromo} === ${day.isPromo})`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: STUDIO COCKPIT CAPTION & FILENAME FORMATTER
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 2: Studio Caption & Download Filename Generator");
  {
    // Test Filename Generator
    const fn1 = generateDownloadFilename("Senin", "07:00", "MOTIVASI_PAGI");
    assert(
      fn1 === "DokterPikiran-Senin-0700-MOTIVASI_PAGI.png",
      `Filename konsisten dan rapi: ${fn1}`
    );

    const fn2 = generateDownloadFilename("Selasa", "12:00", "MENTAL_NEUROSAINS");
    assert(
      fn2 === "DokterPikiran-Selasa-1200-MENTAL_NEUROSAINS.png",
      `Filename promo Selasa rapi: ${fn2}`
    );

    // Test Caption Formatter - Non-Promo Day (Senin)
    const draftMon = getStoryForSlot("07:00", 1)!;
    const captionMon = generateCaption(draftMon, draftMon.title, draftMon.body.join("\n\n"));
    assert(captionMon.includes("Ahmad Jawahir Zain"), "Caption menyertakan tanda tangan Ahmad");
    assert(captionMon.includes("Dokter Pikiran Makassar"), "Caption menyertakan identitas Dokter Pikiran");
    assert(captionMon.includes("07:00 WITA"), "Caption menyertakan jam WITA");
    assert(!captionMon.includes("Konsultasi & Terapi: Hubungi Ruang Pulih"), "Caption Senin tidak memuat promo");

    // Test Caption Formatter - Promo Day (Selasa 12:00)
    const draftTue = getStoryForSlot("12:00", 2)!;
    const captionTue = generateCaption(
      draftTue,
      draftTue.title,
      draftTue.body.join("\n\n"),
      draftTue.highlightBox?.label,
      draftTue.highlightBox?.content
    );
    assert(captionTue.includes("Konsultasi & Terapi: Hubungi Ruang Pulih"), "Caption Selasa 12:00 memuat ajakan Ruang Pulih");
    assert(captionTue.includes(draftTue.highlightBox!.label), "Caption memuat label highlight box");
    assert(detectBannedSlang(captionTue).length === 0, "Caption bebas dari slang Jakarta");
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: REAL-TIME EDITOR & SLANG GUARD REACTIVITY
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 3: Real-Time Editor Slang Guard & Word Count");
  {
    const cleanMonTitle = "Rezeki Anda Sudah Tertakar, Jangan Habiskan Energi Mencemaskannya";
    const cleanMonBody = "Tidak ada satu helai daun pun yang gugur tanpa izin Allah.";
    const slangInput = `${cleanMonTitle} Gue ngga ngira kalau masalah lu bisa bikin mager baperan parah banget.`;

    const detected = detectBannedSlang(slangInput);
    assert(
      detected.length >= 6,
      `Detektor slang menangkap pelanggaran input real-time (${detected.join(", ")})`
    );

    const testDraftSafe: StoryDraft = {
      ...getStoryForSlot("07:00", 1)!,
      title: cleanMonTitle,
      body: [cleanMonBody],
    };
    const count = calculateStoryWordCount(testDraftSafe);
    assert(count <= 130, `Kalkulasi kata ringkas aman 1-slide (${count} kata <= 130 kata)`);

    const tooLongBody = Array(40).fill("Kalimat ini diulang-ulang agar melebihi batas satu slide yang diizinkan.").join(" ");
    const testDraftTooLong: StoryDraft = {
      ...testDraftSafe,
      body: [tooLongBody],
    };
    const validationLong = validateStoryDraft(testDraftTooLong);
    assert(!validationLong.valid, "Naskah yang melebihi batas 130 kata berhasil ditolak oleh validator");
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: END-TO-END RENDER PIPELINE IN STUDIO COCKPIT
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 4: Live Render Integration for Studio Edits");
  {
    // Simulate user editing a draft in the studio cockpit and clicking "Perbarui Visual Mockup"
    const liveEditedDraft: StoryDraft = {
      id: "live-edit-senin-0700",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 1,
      theme: "Ketenangan Hati & Tawakkal",
      tag: "MOTIVASI PAGI",
      title: "Hati yang Tenang Lahir dari Kepasrahan Penuh Kepada Allah",
      quoteMark: true,
      body: [
        "Ketika Anda merasa lelah dengan segala ketidakpastian duniawi, ingatlah bahwa Allah tidak pernah terlambat menolong hamba-Nya.",
        "Lepaskan keinginan untuk mengontrol segalanya. Cukup tunaikan ikhtiar terbaik Anda dengan ikhlas.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar",
      isRuangPulihPromo: false,
      visualModePreferred: "illustrated",
    };

    const reqPost = new NextRequest("http://localhost:3000/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: liveEditedDraft,
        mode: "illustrated",
        format: "json",
      }),
    });

    const resPost = await POST(reqPost);
    assert(resPost.status === 200, "POST /api/render untuk draft editan studio berhasil HTTP 200");

    const jsonRes = await resPost.json();
    assert(jsonRes.success === true, "Response memuat success === true");
    assert(
      typeof jsonRes.imageBase64 === "string" && jsonRes.imageBase64.startsWith("data:image/png;base64,"),
      "Response memuat base64 PNG yang dapat langsung ditampilkan di mockup smartphone"
    );
    assert(
      typeof jsonRes.renderTimeMs === "number" && jsonRes.renderTimeMs < 2500,
      `Waktu render editan instan (${jsonRes.renderTimeMs} ms)`
    );

    // Test text_only mode render for editan
    const reqTextOnly = new NextRequest("http://localhost:3000/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: liveEditedDraft,
        mode: "text_only",
        format: "json",
      }),
    });
    const resTextOnly = await POST(reqTextOnly);
    assert(resTextOnly.status === 200, "POST /api/render untuk mode Text-Only Luxury berhasil HTTP 200");
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  HASIL AKHIR TAHAP 3 TEST SUITE:`);
  console.log(`  Total Lolos (PASS): ${passedCount}`);
  console.log(`  Total Gagal (FAIL): ${failedCount}`);
  console.log("===============================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error("Fatal Phase 3 Test Runner Error:", err);
  process.exit(1);
});
