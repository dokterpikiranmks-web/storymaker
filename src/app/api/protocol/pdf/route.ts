import { NextRequest, NextResponse } from "next/server";
import { jsonOk } from "@/lib/api";
import { getCampaign, getCampaignRowByDate, getLatestCampaign } from "@/lib/campaigns";
import { getAppTimezone, getPublicBaseUrl, todayInTimezone } from "@/lib/env";
import { DEFAULT_OFFICIAL_PROTOCOL, generateProtocolPdf, type DynamicStoryPdfData } from "@/lib/pdf/generator";
import { defaultPersona, getPersona } from "@/lib/settings";
import { buildDefaultLeadMagnetProtocol } from "@/lib/stories/offline";
import type { LeadMagnetProtocol, PersonaSettings } from "@/lib/stories/types";
import { isSupabaseStorageConfigured, uploadLeadMagnetPdf } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dataParam = searchParams.get("data")?.trim();
    const payloadParam = searchParams.get("payload")?.trim();
    const campaignId = searchParams.get("campaignId")?.trim();
    const dateParam = searchParams.get("date")?.trim();
    const topic = searchParams.get("topic")?.trim() || searchParams.get("t")?.trim();
    const pillar = searchParams.get("pillar")?.trim() || searchParams.get("l")?.trim();
    const keyword = searchParams.get("keyword")?.trim() || searchParams.get("k")?.trim();
    const somaticStep1 = searchParams.get("step1")?.trim() || searchParams.get("s1")?.trim();
    const somaticStep2 = searchParams.get("step2")?.trim() || searchParams.get("s2")?.trim();
    const somaticStep3 = searchParams.get("step3")?.trim() || searchParams.get("s3")?.trim();
    const edukasiParam = searchParams.get("edukasi")?.trim() || searchParams.get("e")?.trim();
    const praktikParam = searchParams.get("praktik")?.trim() || searchParams.get("p")?.trim();
    const buktiParam = searchParams.get("bukti")?.trim() || searchParams.get("b")?.trim();
    const wantsJson = searchParams.get("json") === "1" || searchParams.get("json") === "true";
    const wantsUpload = searchParams.get("upload") === "1" || searchParams.get("upload") === "true";

    const campaignDate = dateParam || todayInTimezone(getAppTimezone());

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const {
      getCuratedStoryForDate,
      CURATED_STORIES,
      resolvePillar,
      resolvePillarKeyword,
      getActiveDailyStory,
      generateStoryV2,
    } = require("../../../../../lib/story-engine-v2");

    let dynamicStory: DynamicStoryPdfData | null = null;

    // Helper untuk membangun langkah somatik kustom jika step1..step3 tersedia
    const customSomaticSteps = (somaticStep1 || somaticStep2 || somaticStep3)
      ? [
          {
            step: 1,
            title: "Langkah 1: Manuver Awal",
            desc: somaticStep1 || "Renggangkan rahang, relaksasi otot wajah dan leher secara santai.",
          },
          {
            step: 2,
            title: "Langkah 2: Stimulasi Saraf",
            desc: somaticStep2 || "Lakukan peregangan mikro dan atur napas tenang secara teratur.",
          },
          {
            step: 3,
            title: "Langkah 3: Pemulihan Otonom",
            desc: somaticStep3 || "Rasakan sinyal aman masuk ke sistem saraf dan detak jantung melambat.",
          },
        ]
      : undefined;

    // ─────────────────────────────────────────────────────────────────────────────
    // PRIORITAS 1: Ekstrak data langsung dari URL searchParams
    // ─────────────────────────────────────────────────────────────────────────────

    // 1A. Jika ada payload atau data base64/base64url
    const rawPayload = payloadParam || dataParam;
    if (rawPayload) {
      try {
        let decodedStr = "";
        try {
          decodedStr = Buffer.from(rawPayload, "base64url").toString("utf-8");
        } catch {
          decodedStr = Buffer.from(rawPayload, "base64").toString("utf-8");
        }
        const parsed = JSON.parse(decodedStr);
        if (parsed && typeof parsed === "object") {
          const pil = resolvePillar(parsed.l || parsed.pillar || pillar, campaignDate);
          const defaultKw = resolvePillarKeyword(pil, campaignDate);
          const curatedFallback = typeof getCuratedStoryForDate === "function"
            ? getCuratedStoryForDate(pil, campaignDate)
            : (CURATED_STORIES[pil] || CURATED_STORIES.TUBUH);

          const parsedSteps = parsed.steps || customSomaticSteps;

          dynamicStory = {
            topic: parsed.t || parsed.topic || topic || curatedFallback.topic,
            edukasi: parsed.e || parsed.edukasi || edukasiParam || curatedFallback.stories[1]?.text || "",
            praktik: parsed.p || parsed.praktik || praktikParam || curatedFallback.stories[2]?.text || "",
            bukti: parsed.b || parsed.bukti || buktiParam || curatedFallback.stories[3]?.text || "",
            keyword: (parsed.k || parsed.keyword || keyword || defaultKw).toUpperCase(),
            pillar: pil,
            date: campaignDate,
            somaticSteps: parsedSteps,
          };
        }
      } catch (err) {
        console.warn("[protocol/pdf] Gagal decode base64 payload:", err);
      }
    }

    // 1B. Jika ada topic, pillar, keyword, atau step di searchParams
    if (!dynamicStory && (topic || pillar || keyword || customSomaticSteps)) {
      const pil = resolvePillar(pillar, campaignDate);
      const defaultKw = resolvePillarKeyword(pil, campaignDate);
      const curated = typeof getCuratedStoryForDate === "function"
        ? getCuratedStoryForDate(pil, campaignDate)
        : (CURATED_STORIES[pil] || CURATED_STORIES.TUBUH);

      dynamicStory = {
        topic: topic || curated.topic,
        edukasi: edukasiParam || curated.stories[1]?.text || "",
        praktik: praktikParam || curated.stories[2]?.text || "",
        bukti: buktiParam || curated.stories[3]?.text || "",
        keyword: (keyword || defaultKw || curated.keyword || "RESET").toUpperCase(),
        pillar: pil,
        date: campaignDate,
        somaticSteps: customSomaticSteps,
      };
    }

    // ─────────────────────────────────────────────────────────────────────────────
    // PRIORITAS 2 (Fallback Tanpa Parameter): Ambil dari Engine Dinamis Makassar On-The-Fly
    // Mencegah pembacaan file disk kadaluarsa di Vercel Serverless
    // ─────────────────────────────────────────────────────────────────────────────
    if (!dynamicStory) {
      // Cek naskah aktif hari ini jika tanggalnya persis sama
      const activeDaily = typeof getActiveDailyStory === "function"
        ? getActiveDailyStory(campaignDate)
        : null;

      if (activeDaily && Array.isArray(activeDaily.stories) && activeDaily.date === campaignDate) {
        dynamicStory = {
          topic: activeDaily.topic || "",
          edukasi: activeDaily.stories.find((s: any) => (s.act || "").toUpperCase().includes("EDUKASI"))?.text || "",
          praktik: activeDaily.stories.find((s: any) => (s.act || "").toUpperCase().includes("PRAKTIK"))?.text || "",
          bukti: activeDaily.stories.find((s: any) => (s.act || "").toUpperCase().includes("BUKTI"))?.text || "",
          keyword: (activeDaily.keyword || resolvePillarKeyword(activeDaily.pillar, campaignDate)).toUpperCase(),
          pillar: (activeDaily.pillar || resolvePillar(null, campaignDate)).toUpperCase(),
          date: activeDaily.date || campaignDate,
        };
      } else {
        // Generate on-the-fly menggunakan generator engine resmi WITA
        const onTheFly = await generateStoryV2({ date: campaignDate });
        if (onTheFly && Array.isArray(onTheFly.stories)) {
          dynamicStory = {
            topic: onTheFly.topic || "",
            edukasi: onTheFly.stories.find((s: any) => (s.act || "").toUpperCase().includes("EDUKASI"))?.text || "",
            praktik: onTheFly.stories.find((s: any) => (s.act || "").toUpperCase().includes("PRAKTIK"))?.text || "",
            bukti: onTheFly.stories.find((s: any) => (s.act || "").toUpperCase().includes("BUKTI"))?.text || "",
            keyword: (onTheFly.keyword || resolvePillarKeyword(onTheFly.pillar, campaignDate)).toUpperCase(),
            pillar: (onTheFly.pillar || resolvePillar(null, campaignDate)).toUpperCase(),
            date: onTheFly.date || campaignDate,
          };
        }
      }
    }

    // Safety guard
    if (!dynamicStory) {
      const pil = resolvePillar(null, campaignDate);
      const curated = getCuratedStoryForDate(pil, campaignDate);
      dynamicStory = {
        topic: curated.topic,
        edukasi: curated.stories[1].text,
        praktik: curated.stories[2].text,
        bukti: curated.stories[3].text,
        keyword: resolvePillarKeyword(pil, campaignDate),
        pillar: pil,
        date: campaignDate,
      };
    }

    // 4. Data Persona Brand Resmi Dokter Pikiran Makassar
    let persona: PersonaSettings = {
      ...defaultPersona(),
      creatorName: "Dokter Pikiran (Ahmad Jawahir Zain)",
      signature: "Klinik Hipnoterapi & Pemulihan Sistem Saraf Bawah Sadar • Makassar, WITA (UTC+8)",
    };
    try {
      const fetched = await getPersona();
      if (fetched) {
        persona = {
          ...fetched,
          creatorName: fetched.creatorName || "Dokter Pikiran (Ahmad Jawahir Zain)",
          signature: "Klinik Hipnoterapi & Pemulihan Sistem Saraf Bawah Sadar • Makassar, WITA (UTC+8)",
        };
      }
    } catch {
      // ignore
    }

    // 5. Cek jika ada campaign DB khusus
    let campaign: Awaited<ReturnType<typeof getCampaign>> = null;
    if (campaignId) {
      try {
        campaign = await getCampaign(campaignId);
      } catch {
        // ignore
      }
    }

    const activeKeyword = (dynamicStory.keyword || keyword || "RESET").trim().toUpperCase().replace(/[^A-Za-z0-9]/g, "");
    const pdfFilename = `Panduan_${activeKeyword}_DokterPikiran_Makassar.pdf`;

    // 6. Generate binary PDF buffer
    const pdfBuffer = await generateProtocolPdf({
      storyData: dynamicStory,
      persona,
      campaignDate,
      themeTopic: dynamicStory.topic,
    });

    // Jika dipanggil dengan ?upload=1 atau ?json=1
    if (wantsUpload || wantsJson) {
      let publicPdfUrl = `${getPublicBaseUrl(req)}/api/protocol/pdf?keyword=${activeKeyword}&pillar=${dynamicStory.pillar || "TUBUH"}`;

      if (isSupabaseStorageConfigured()) {
        try {
          const fileName = `panduan-${campaignDate}-${activeKeyword}.pdf`;
          publicPdfUrl = await uploadLeadMagnetPdf(`lead-magnets/${fileName}`, pdfBuffer);
        } catch (storageErr: unknown) {
          const errMessage = storageErr instanceof Error ? storageErr.message : String(storageErr);
          console.warn("[protocol/pdf] Gagal mengunggah ke Supabase Storage, menggunakan URL API:", errMessage);
        }
      }

      return jsonOk({
        ok: true,
        url: publicPdfUrl,
        title: dynamicStory.topic,
        keyword: activeKeyword,
        pillar: dynamicStory.pillar,
        campaignDate,
      });
    }

    const dateSlug = (campaignDate || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, "");

    // 7. Streaming response binary PDF dengan headers resmi anti-cache
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `inline; filename="panduan-somatik-${dateSlug}.pdf"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (fatalErr) {
    console.error("[protocol/pdf] Fatal error in route handler, generating emergency standalone PDF:", fatalErr);
    try {
      const emergencyBuffer = await generateProtocolPdf({
        protocol: DEFAULT_OFFICIAL_PROTOCOL,
        campaignDate: new Date().toISOString().slice(0, 10),
        themeTopic: "Reset Somatik & Regulasi Sistem Saraf",
      });

      return new NextResponse(new Uint8Array(emergencyBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(emergencyBuffer.length),
          "Content-Disposition": 'inline; filename="Panduan_Protokol_DokterPikiran_Makassar.pdf"',
          "Cache-Control": "no-store",
        },
      });
    } catch {
      const minimalPdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF";
      return new NextResponse(minimalPdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="Panduan_Protokol_DokterPikiran_Makassar.pdf"',
        },
      });
    }
  }
}
