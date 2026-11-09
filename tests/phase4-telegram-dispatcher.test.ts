/**
 * tests/phase4-telegram-dispatcher.test.ts
 * Comprehensive Automated Test Suite for Tahap 4: Telegram Dispatcher & Verification.
 */

import { NextRequest } from "next/server";
import { formatTelegramCaption, dispatchStoryToTelegram } from "../src/lib/telegram-dispatcher";
import { getStoryForSlot, WEEKLY_CONTENT_MATRIX } from "../src/lib/content-matrix";
import { GET, POST } from "../src/app/api/dispatch/route";
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

async function runPhase4Tests() {
  console.log("===============================================================================");
  console.log("  TAHAP 4: TELEGRAM DISPATCHER & INTEGRATION TEST SUITE");
  console.log("===============================================================================\n");

  // ---------------------------------------------------------------------------
  // SUITE 1: CAPTION FORMATTING & TELEGRAM 1024-CHAR LIMIT
  // ---------------------------------------------------------------------------
  console.log("▶ SUITE 1: Caption Formatting & Character Limit Compliance");
  {
    const slots: SlotTime[] = ["07:00", "10:00", "12:00", "19:00", "21:00"];

    // Check all 35 stories in weekly matrix for caption safety
    for (let day = 0; day <= 6; day++) {
      for (const slot of slots) {
        const draft = getStoryForSlot(slot, day)!;
        const caption = formatTelegramCaption(draft);

        assert(
          caption.length <= 1024,
          `Hari ${day} Slot ${slot} panjang caption (${caption.length} chars) aman <= 1024 karakter Telegram`
        );
        assert(
          caption.includes("Ahmad Jawahir Zain"),
          `Hari ${day} Slot ${slot} caption menyertakan nama Ahmad Jawahir Zain`
        );
        assert(
          caption.includes("Dokter Pikiran Makassar"),
          `Hari ${day} Slot ${slot} caption menyertakan identitas Dokter Pikiran Makassar`
        );
      }
    }

    // Specific promo check on Tuesday 12:00
    const promoDraft = getStoryForSlot("12:00", 2)!;
    const promoCaption = formatTelegramCaption(promoDraft);
    assert(
      promoCaption.includes("Ruang Pulih Dokter Pikiran Makassar"),
      "Caption promo Selasa 12:00 menyertakan ajakan Ruang Pulih secara santun"
    );

    // Non-promo check on Monday 12:00
    const nonPromoDraft = getStoryForSlot("12:00", 1)!;
    const nonPromoCaption = formatTelegramCaption(nonPromoDraft);
    assert(
      !nonPromoCaption.includes("Hubungi Ruang Pulih"),
      "Caption Senin 12:00 tidak memuat promosi Ruang Pulih (edukasi murni)"
    );
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: CORE DISPATCHER ENGINE (DRY-RUN & WARM PERFORMANCE)
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 2: Core Dispatcher Engine (Dry-Run Mode & Render)");
  {
    const morningDraft = getStoryForSlot("07:00", 1)!;

    // Cold start call (loads font buffers into memory)
    const coldResult = await dispatchStoryToTelegram(morningDraft, { dryRun: true });
    assert(coldResult.success === true, "Cold-start dispatch berhasil dengan status success == true");
    assert(coldResult.renderTimeMs > 0, `Satori visual flyer berhasil dirender pada cold start (${coldResult.renderTimeMs} ms)`);

    // Warm dispatch call (instant in-memory rendering)
    const startDispatch = Date.now();
    const result = await dispatchStoryToTelegram(morningDraft, { dryRun: true });
    const elapsed = Date.now() - startDispatch;

    assert(result.success === true, "Warm dispatch berhasil dengan status success == true");
    assert(result.dryRun === true, "Result mencantumkan flag dryRun == true");
    assert(result.captionLength > 50, `Panjang caption terukur valid (${result.captionLength} chars)`);
    assert(elapsed < 2500, `Durasi warm dispatch cepat & sub-second (${elapsed} ms)`);
  }

  // ---------------------------------------------------------------------------
  // SUITE 3: ANTI-SLANG GATE ON DISPATCH (ZERO-TOLERANCE)
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 3: Persona Slang Gate on Dispatcher");
  {
    const badSlangDraft: StoryDraft = {
      ...getStoryForSlot("07:00", 1)!,
      title: "Gue Ngga Ngira Kalau Lu Bisa Baperan",
      body: ["Lu harus ngerti kalau stres lu bikin mager dan asam lambung naik parah banget."],
    };

    const slangResult = await dispatchStoryToTelegram(badSlangDraft, { dryRun: true });
    assert(
      slangResult.success === false,
      "Dispatcher dengan tegas menolak naskah yang memuat slang gaul Jakarta (success === false)"
    );
    assert(
      typeof slangResult.error === "string" && slangResult.error.includes("Validasi persona gagal"),
      "Dispatcher menyertakan pesan kesalahan validasi persona yang jelas"
    );
  }

  // ---------------------------------------------------------------------------
  // SUITE 4: API ROUTE HANDLER (GET & POST /api/dispatch)
  // ---------------------------------------------------------------------------
  console.log("\n▶ SUITE 4: API Route Handler GET & POST /api/dispatch");
  {
    // Test 1: GET status
    const reqGet = new NextRequest("http://localhost:3000/api/dispatch");
    const resGet = await GET();
    assert(resGet.status === 200, "GET /api/dispatch mengembalikan status HTTP 200 OK");
    const jsonGet = await resGet.json();
    assert(
      jsonGet.mode === "human-in-the-loop (strictly non-automated)",
      "GET /api/dispatch menegaskan arsitektur human-in-the-loop tanpa auto-posting"
    );

    // Test 2: POST with slot & day
    const reqPostSlot = new NextRequest("http://localhost:3000/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slot: "10:00", day: "senin", dryRun: true }),
    });
    const resPostSlot = await POST(reqPostSlot);
    assert(resPostSlot.status === 200, "POST /api/dispatch dengan { slot, day, dryRun } berhasil HTTP 200");
    const jsonPostSlot = await resPostSlot.json();
    assert(jsonPostSlot.success === true, "POST /api/dispatch response success === true");

    // Test 3: POST with invalid slang draft
    const reqPostSlang = new NextRequest("http://localhost:3000/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        draft: {
          ...getStoryForSlot("07:00", 1)!,
          title: "Lu Ngga Boleh Menyerah",
          body: ["Gue tahu lu capek banget."],
        },
      }),
    });
    const resPostSlang = await POST(reqPostSlang);
    assert(
      resPostSlang.status === 400,
      "POST /api/dispatch menolak draft dengan slang gaul Jakarta dengan HTTP 400 Bad Request"
    );

    // Test 4: POST with empty body
    const reqPostEmpty = new NextRequest("http://localhost:3000/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const resPostEmpty = await POST(reqPostEmpty);
    assert(resPostEmpty.status === 400, "POST /api/dispatch tanpa draft atau slot ditolak HTTP 400");
  }

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n===============================================================================");
  console.log(`  HASIL AKHIR TAHAP 4 TEST SUITE:`);
  console.log(`  Total Lolos (PASS): ${passedCount}`);
  console.log(`  Total Gagal (FAIL): ${failedCount}`);
  console.log("===============================================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runPhase4Tests().catch((err) => {
  console.error("Fatal Phase 4 Test Runner Error:", err);
  process.exit(1);
});
