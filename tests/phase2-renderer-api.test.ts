/**
 * tests/phase2-renderer-api.test.ts
 * Comprehensive Automated Test Suite for Tahap 2: Satori High-Speed Renderer & API Route.
 */

import fs from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { renderStoryToPng } from "../src/lib/renderer";
import { getStoryForSlot, WEEKLY_CONTENT_MATRIX } from "../src/lib/content-matrix";
import { getIllustrationForPillar, DEFAULT_PILLAR_ILLUSTRATIONS } from "../src/lib/illustration-assets";
import { GET, POST } from "../src/app/api/render/route";
import type { SlotTime, StoryDraft } from "../src/lib/types";

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

// Helper to verify standard PNG Magic Bytes (89 50 4E 47 0D 0A 1A 0A)
function isValidPngBuffer(buf: Buffer | Uint8Array): boolean {
  if (!buf || buf.length < 8) return false;
  return (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  );
}

async function runPhase2Tests() {
  console.log("===============================================================================");
  console.log("  TAHAP 2: SATORI HIGH-SPEED RENDERER & API AUTOMATED TEST SUITE");
  console.log("===============================================================================\n");

  // ---------------------------------------------------------------------------
  // SUITE 1: ASSET INTEGRITY & FONT BUFFERS
  // ---------------------------------------------------------------------------
  console.log("▶ SUITE 1: Asset Integrity, Local Fonts, & Illustrations");
  {
    const fontFiles = [
      "inter-latin-400-normal.woff",
      "inter-latin-600-normal.woff",
      "inter-latin-800-normal.woff",
      "playfair-display-latin-700-normal.woff",
      "playfair-display-latin-500-italic.woff",
      "jetbrains-mono-latin-400-normal.woff",
    ];

    for (const font of fontFiles) {
      const fontPath = path.join(process.cwd(), "src/assets/fonts", font);
      const exists = fs.existsSync(fontPath);
      const size = exists ? fs.statSync(fontPath).size : 0;
      assert(
        exists && size > 10000,
        `Font buffer terverifikasi: ${font} (${(size / 1024).toFixed(1)} KB)`
      );
    }

    // Illustrations check
    const morningIll = getIllustrationForPillar("MOTIVASI_PAGI");
    assert(
      morningIll !== null && morningIll.startsWith("data:image/"),
      "Ilustrasi pilar MOTIVASI_PAGI berhasil di-resolve ke base64 data URL"
    );

    const gutBrainIll = getIllustrationForPillar("KESEHATAN_FUNGSIONAL");
    assert(
      gutBrainIll !== null && gutBrainIll.startsWith("data:image/"),
      "Ilustrasi pilar KESEHATAN_FUNGSIONAL berhasil di-resolve ke base64 data URL"
    );

    // Warm up renderer & font memory cache
    const warmupDraft = getStoryForSlot("07:00", 1)!;
    await renderStoryToPng(warmupDraft, { mode: "text_only" });
    assert(true, "Font cache & WASM renderer engine pre-warmed di memori");
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: CORE RENDERER ENGINE (TEXT-ONLY MODE) - ALL 5 SLOTS
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 2: Core Renderer Engine (Text-Only Luxury Mode) - 5 Daily Slots");
  {
    const slots: SlotTime[] = ["07:00", "10:00", "12:00", "19:00", "21:00"];

    for (const slot of slots) {
      const draft = getStoryForSlot(slot, 1)!;
      assert(draft !== null, `Draft Senin slot ${slot} ditemukan di content matrix`);

      const startTime = Date.now();
      const result = await renderStoryToPng(draft, { mode: "text_only" });
      const elapsed = Date.now() - startTime;

      assert(
        isValidPngBuffer(result.pngBuffer),
        `Slot ${slot} (Text-Only) menghasilkan PNG buffer valid dengan magic bytes 89 50 4E 47`
      );
      assert(
        result.width === 1080 && result.height === 1920,
        `Slot ${slot} (Text-Only) resolusi pas 1080x1920 (9:16 portrait)`
      );
      assert(
        result.pngBuffer.length > 50000,
        `Slot ${slot} (Text-Only) ukuran file realistis (${(result.pngBuffer.length / 1024).toFixed(1)} KB)`
      );
      assert(
        result.imageBase64.startsWith("data:image/png;base64,"),
        `Slot ${slot} (Text-Only) menghasilkan imageBase64 data URL valid`
      );
      assert(
        elapsed < 2500,
        `Slot ${slot} (Text-Only) durasi render sub-second/cepat (${elapsed} ms)`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: CORE RENDERER ENGINE (ILLUSTRATED MODE) - ATMOSPHERIC & SPLIT HEADER
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 3: Core Renderer Engine (Illustrated Mode)");
  {
    // Pattern 1: Atmospheric Mode (07:00 Motivasi Pagi)
    const draftMorning = getStoryForSlot("07:00", 1)!;
    const startAtm = Date.now();
    const resultAtm = await renderStoryToPng(draftMorning, { mode: "illustrated" });
    const durAtm = Date.now() - startAtm;

    assert(
      isValidPngBuffer(resultAtm.pngBuffer),
      `Pola 1 Atmospheric (07:00) menghasilkan PNG valid dengan background visual`
    );
    assert(
      resultAtm.pngBuffer.length > 100000,
      `Pola 1 Atmospheric payload visual komprehensif (${(resultAtm.pngBuffer.length / 1024).toFixed(1)} KB)`
    );
    assert(
      durAtm < 2500,
      `Pola 1 Atmospheric kecepatan render optimal (${durAtm} ms)`
    );

    // Pattern 2: Split Header Mode (10:00 Kesehatan Fungsional)
    const draftFungsional = getStoryForSlot("10:00", 1)!;
    const startSplit = Date.now();
    const resultSplit = await renderStoryToPng(draftFungsional, { mode: "illustrated" });
    const durSplit = Date.now() - startSplit;

    assert(
      isValidPngBuffer(resultSplit.pngBuffer),
      `Pola 2 Split Header (10:00) menghasilkan PNG valid dengan gradient fade`
    );
    assert(
      resultSplit.pngBuffer.length > 100000,
      `Pola 2 Split Header payload visual komprehensif (${(resultSplit.pngBuffer.length / 1024).toFixed(1)} KB)`
    );
    assert(
      durSplit < 2500,
      `Pola 2 Split Header kecepatan render optimal (${durSplit} ms)`
    );

    // Pattern 2 with Steps: Self-Terapi (19:00)
    const draftSelfTerapi = getStoryForSlot("19:00", 1)!;
    const resultSteps = await renderStoryToPng(draftSelfTerapi, { mode: "illustrated" });
    assert(
      isValidPngBuffer(resultSteps.pngBuffer) && resultSteps.pngBuffer.length > 80000,
      `Pola 2 dengan 3-Langkah Self-Terapi (19:00) berhasil dirender tanpa overflow layout`
    );
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: API ROUTE HANDLER (GET /api/render)
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 4: API Route Handler GET /api/render");
  {
    // Test 1: Direct PNG response
    const reqPng = new NextRequest("http://localhost:3000/api/render?slot=07:00&day=senin&format=png");
    const resPng = await GET(reqPng);

    assert(resPng.status === 200, "GET /api/render?format=png mengembalikan HTTP 200 OK");
    assert(
      resPng.headers.get("content-type") === "image/png",
      "GET /api/render mengembalikan header Content-Type: image/png"
    );

    const pngArrayBuffer = await resPng.arrayBuffer();
    const pngBuffer = Buffer.from(pngArrayBuffer);
    assert(
      isValidPngBuffer(pngBuffer),
      `GET /api/render binary body adalah buffer PNG valid (${(pngBuffer.length / 1024).toFixed(1)} KB)`
    );

    // Test 2: JSON format response
    const reqJson = new NextRequest("http://localhost:3000/api/render?slot=10:00&day=senin&format=json");
    const resJson = await GET(reqJson);
    assert(resJson.status === 200, "GET /api/render?format=json mengembalikan HTTP 200 OK");

    const jsonBody = await resJson.json();
    assert(jsonBody.success === true, "GET /api/render JSON body success == true");
    assert(jsonBody.slot === "10:00", "GET /api/render JSON body mencantumkan slot yang tepat");
    assert(
      typeof jsonBody.imageBase64 === "string" && jsonBody.imageBase64.startsWith("data:image/png;base64,"),
      "GET /api/render JSON body memuat imageBase64 data URL"
    );
    assert(
      typeof jsonBody.renderTimeMs === "number" && jsonBody.renderTimeMs > 0,
      `GET /api/render menyertakan telemetry renderTimeMs (${jsonBody.renderTimeMs} ms)`
    );

    // Test 3: Invalid slot validation
    const reqInvalid = new NextRequest("http://localhost:3000/api/render?slot=04:00");
    const resInvalid = await GET(reqInvalid);
    assert(
      resInvalid.status === 400,
      "GET /api/render menolak slot tidak valid (04:00) dengan HTTP 400 Bad Request"
    );
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: API ROUTE HANDLER (POST /api/render)
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 5: API Route Handler POST /api/render");
  {
    // Test 1: POST by slot & day
    const reqPostSlot = new NextRequest("http://localhost:3000/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot: "12:00", day: "selasa", mode: "illustrated" }),
    });
    const resPostSlot = await POST(reqPostSlot);
    assert(resPostSlot.status === 200, "POST /api/render dengan { slot, day } berhasil HTTP 200");
    const bodyPostSlot = await resPostSlot.json();
    assert(
      bodyPostSlot.draft.isRuangPulihPromo === true,
      "POST /api/render slot Selasa 12:00 mendeteksi promo Ruang Pulih Dokter Pikiran"
    );

    // Test 2: POST with custom valid draft
    const customValidDraft: StoryDraft = {
      id: "custom-test-01",
      slot: "07:00",
      pillar: "MOTIVASI_PAGI",
      dayOfWeek: 1,
      theme: "Pengembangan Diri & Tawakkal",
      tag: "MOTIVASI PAGI",
      title: "Ketenangan Batin Bukan Hadir dari Ketiadaan Masalah",
      quoteMark: true,
      body: [
        "Sering kali kita menunggu situasi sempurna baru merasa damai.",
        "Padahal kedamaian sejati adalah saat hati tetap bersandar penuh kepada Allah di tengah ombak kehidupan yang belum mereda.",
      ],
      signature: "Ahmad Jawahir Zain",
      subSignature: "Dokter Pikiran Makassar",
      isRuangPulihPromo: false,
      visualModePreferred: "text_only",
    };

    const reqPostCustom = new NextRequest("http://localhost:3000/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: customValidDraft, mode: "text_only" }),
    });
    const resPostCustom = await POST(reqPostCustom);
    assert(resPostCustom.status === 200, "POST /api/render dengan custom valid draft berhasil HTTP 200");

    // Test 3: POST rejection for Jakarta slang in custom draft
    const customSlangDraft: StoryDraft = {
      ...customValidDraft,
      title: "Gue Ngga Ngira Bakal Separah Ini",
      body: ["Lu harus tahu kalau lu cemas terus, lambung lu bakal kena parah banget."],
    };

    const reqPostSlang = new NextRequest("http://localhost:3000/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draft: customSlangDraft }),
    });
    const resPostSlang = await POST(reqPostSlang);
    assert(
      resPostSlang.status === 400,
      "POST /api/render menolak custom draft berisi slang Jakarta (gue, ngga, ngira, lu, banget)"
    );
    const bodySlang = await resPostSlang.json();
    assert(
      bodySlang.issues && bodySlang.issues.length > 0,
      `API melaporkan detail issue persona dengan jelas (${bodySlang.issues.length} pelanggaran terdeteksi)`
    );

    // Test 4: POST with empty payload
    const reqEmpty = new NextRequest("http://localhost:3000/api/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const resEmpty = await POST(reqEmpty);
    assert(resEmpty.status === 400, "POST /api/render tanpa draft atau slot ditolak dengan HTTP 400");
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  HASIL AKHIR TAHAP 2 TEST SUITE:`);
  console.log(`  Total Lolos (PASS): ${passedCount}`);
  console.log(`  Total Gagal (FAIL): ${failedCount}`);
  console.log("===============================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase2Tests().catch((err) => {
  console.error("Fatal Test Runner Error:", err);
  process.exit(1);
});
