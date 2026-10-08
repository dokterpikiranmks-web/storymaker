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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dataParam = searchParams.get("data")?.trim();
    const campaignId = searchParams.get("campaignId")?.trim();
    const dateParam = searchParams.get("date")?.trim();
    const keywordParam = searchParams.get("keyword")?.trim();
    const pillarParam = searchParams.get("pillar")?.trim();
    const topicParam = searchParams.get("topic")?.trim();
    const wantsJson = searchParams.get("json") === "1" || searchParams.get("json") === "true";
    const wantsUpload = searchParams.get("upload") === "1" || searchParams.get("upload") === "true";

    const campaignDate = dateParam || todayInTimezone(getAppTimezone());

    // 1. Ekstraksi Data Story Dinamis (Priority 1: dataParam base64url)
    let dynamicStory: DynamicStoryPdfData | null = null;

    if (dataParam) {
      try {
        const decodedStr = Buffer.from(dataParam, "base64url").toString("utf-8");
        const parsed = JSON.parse(decodedStr);
        if (parsed) {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { getCuratedStoryForDate, CURATED_STORIES } = require("../../../../../lib/story-engine-v2");
          const pil = (parsed.l || parsed.pillar || pillarParam || "TUBUH").toUpperCase();
          const curatedFallback = typeof getCuratedStoryForDate === "function"
            ? getCuratedStoryForDate(pil, campaignDate)
            : (CURATED_STORIES[pil] || CURATED_STORIES.TUBUH);

          dynamicStory = {
            topic: parsed.t || parsed.topic || topicParam || curatedFallback.topic,
            edukasi: parsed.e || parsed.edukasi || curatedFallback.stories[1].text,
            praktik: parsed.p || parsed.praktik || curatedFallback.stories[2].text,
            bukti: parsed.b || parsed.bukti || curatedFallback.stories[3].text,
            keyword: (parsed.k || parsed.keyword || keywordParam || curatedFallback.keyword || "RESET").toUpperCase(),
            pillar: pil,
            date: campaignDate,
          };
        }
      } catch {
        try {
          const decodedStr = Buffer.from(dataParam, "base64").toString("utf-8");
          const parsed = JSON.parse(decodedStr);
          if (parsed) {
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const { getCuratedStoryForDate, CURATED_STORIES } = require("../../../../../lib/story-engine-v2");
            const pil = (parsed.l || parsed.pillar || pillarParam || "TUBUH").toUpperCase();
            const curatedFallback = typeof getCuratedStoryForDate === "function"
              ? getCuratedStoryForDate(pil, campaignDate)
              : (CURATED_STORIES[pil] || CURATED_STORIES.TUBUH);

            dynamicStory = {
              topic: parsed.t || parsed.topic || topicParam || curatedFallback.topic,
              edukasi: parsed.e || parsed.edukasi || curatedFallback.stories[1].text,
              praktik: parsed.p || parsed.praktik || curatedFallback.stories[2].text,
              bukti: parsed.b || parsed.bukti || curatedFallback.stories[3].text,
              keyword: (parsed.k || parsed.keyword || keywordParam || curatedFallback.keyword || "RESET").toUpperCase(),
              pillar: pil,
              date: campaignDate,
            };
          }
        } catch (e) {
          console.warn("[protocol/pdf] Gagal decode dataParam:", e);
        }
      }
    }

    // 2. Jika dataParam tidak ada, coba baca cache data/latest-story.json (Priority 2)
    if (!dynamicStory) {
      try {
        const fs = await import("node:fs");
        const path = await import("node:path");
        const targetPillar = (pillarParam || (keywordParam === "RESET" ? "PIKIRAN" : keywordParam === "FOKUS" ? "TEKNOLOGI" : "TUBUH")).toLowerCase();
        const pillarCache = path.join(process.cwd(), "data", `story-${targetPillar}.json`);
        const latestCache = path.join(process.cwd(), "data", "latest-story.json");

        const targetFile = fs.existsSync(pillarCache) ? pillarCache : fs.existsSync(latestCache) ? latestCache : null;
        if (targetFile) {
          const fileContent = fs.readFileSync(targetFile, "utf-8");
          const cached = JSON.parse(fileContent);
          // Hanya gunakan cache jika tanggalnya persis hari ini (mencegah topik basi kemarin)
          if (cached && cached.stories && cached.date === campaignDate) {
            dynamicStory = {
              topic: topicParam || cached.topic || "",
              edukasi: cached.stories.find((s: any) => (s.act || "").toUpperCase().includes("EDUKASI"))?.text || "",
              praktik: cached.stories.find((s: any) => (s.act || "").toUpperCase().includes("PRAKTIK"))?.text || "",
              bukti: cached.stories.find((s: any) => (s.act || "").toUpperCase().includes("BUKTI"))?.text || "",
              keyword: (keywordParam || cached.keyword || "RESET").toUpperCase(),
              pillar: (pillarParam || cached.pillar || "TUBUH").toUpperCase(),
              date: cached.date || campaignDate,
            };
          }
        }
      } catch {
        // Abaikan kegagalan baca file cache
      }
    }

    // 3. Fallback ke Curated Stories Dinamis V2.3 Makassar (Priority 3)
    if (!dynamicStory) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getCuratedStoryForDate, CURATED_STORIES } = require("../../../../../lib/story-engine-v2");
      const pil = (pillarParam || (keywordParam === "RESET" ? "PIKIRAN" : keywordParam === "FOKUS" ? "TEKNOLOGI" : "TUBUH")).toUpperCase();
      const curated = typeof getCuratedStoryForDate === "function" 
        ? getCuratedStoryForDate(pil, campaignDate) 
        : (CURATED_STORIES[pil] || CURATED_STORIES.TUBUH);

      dynamicStory = {
        topic: topicParam || curated.topic,
        edukasi: curated.stories[1].text,
        praktik: curated.stories[2].text,
        bukti: curated.stories[3].text,
        keyword: (keywordParam || curated.keyword || "RESET").toUpperCase(),
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

    const activeKeyword = (dynamicStory.keyword || keywordParam || "RESET").trim().toUpperCase().replace(/[^A-Za-z0-9]/g, "");
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

    // 7. Streaming response binary PDF dengan headers resmi
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `inline; filename="${pdfFilename}"`,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
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
