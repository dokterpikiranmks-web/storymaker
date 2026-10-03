import { NextRequest, NextResponse } from "next/server";
import { jsonOk } from "@/lib/api";
import { getCampaign, getCampaignRowByDate, getLatestCampaign } from "@/lib/campaigns";
import { getAppTimezone, getPublicBaseUrl, todayInTimezone } from "@/lib/env";
import { DEFAULT_OFFICIAL_PROTOCOL, generateProtocolPdf } from "@/lib/pdf/generator";
import { defaultPersona, getPersona } from "@/lib/settings";
import { buildDefaultLeadMagnetProtocol } from "@/lib/stories/offline";
import type { LeadMagnetProtocol, PersonaSettings } from "@/lib/stories/types";
import { isSupabaseStorageConfigured, uploadLeadMagnetPdf } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId")?.trim();
    const dateParam = searchParams.get("date")?.trim();
    const keywordParam = searchParams.get("keyword")?.trim();
    const wantsJson = searchParams.get("json") === "1" || searchParams.get("json") === "true";
    const wantsUpload = searchParams.get("upload") === "1" || searchParams.get("upload") === "true";

    let campaign: Awaited<ReturnType<typeof getCampaign>> = null;

    // 1. Ambil data campaign dengan fail-safe DB try/catch
    try {
      if (campaignId) {
        campaign = await getCampaign(campaignId);
      } else if (keywordParam) {
        const { getCampaignByKeyword } = await import("@/lib/campaigns");
        campaign = await getCampaignByKeyword(keywordParam);
      } else if (dateParam) {
        const row = await getCampaignRowByDate(dateParam, "DAILY_AUTONOMOUS");
        if (row) {
          campaign = await getCampaign(row.id);
        }
      } else {
        const today = todayInTimezone(getAppTimezone());
        const row = await getCampaignRowByDate(today, "DAILY_AUTONOMOUS");
        if (row) {
          campaign = await getCampaign(row.id);
        } else {
          campaign = await getLatestCampaign();
        }
      }
    } catch (dbErr) {
      console.warn("[protocol/pdf] Database query failed or unavailable, using fallback protocol:", dbErr);
    }

    // 2. Ambil persona dengan fail-safe
    let persona: PersonaSettings = {
      ...defaultPersona(),
      creatorName: "Dokter Pikiran",
      signature: "Klinik & Edukasi Kesehatan Holistik Dokter Pikiran",
    };
    try {
      const fetched = await getPersona();
      if (fetched) {
        persona = {
          ...fetched,
          creatorName: fetched.creatorName || "Dokter Pikiran",
          signature: fetched.signature || "Klinik & Edukasi Kesehatan Holistik Dokter Pikiran",
        };
      }
    } catch (personaErr) {
      console.warn("[protocol/pdf] getPersona failed, using defaultPersona:", personaErr);
    }

    // 3. Standalone Fallback Data: JANGAN PERNAH throw error jika campaign null / kosong
    // Gunakan template protokol default somatik & vagus resmi yang lengkap (GB-20, 4-7-8, Sugesti Tidur)
    const protocol: LeadMagnetProtocol =
      campaign?.leadMagnetProtocol && campaign.leadMagnetProtocol.steps?.length
        ? campaign.leadMagnetProtocol
        : campaign?.themeTopic
        ? buildDefaultLeadMagnetProtocol(campaign.themeTopic)
        : DEFAULT_OFFICIAL_PROTOCOL;

    // Pastikan langkah minimal 3 langkah
    if (!protocol.steps || !Array.isArray(protocol.steps) || protocol.steps.length === 0) {
      protocol.steps = DEFAULT_OFFICIAL_PROTOCOL.steps;
    }

    const campaignDate = campaign?.campaignDate || todayInTimezone(getAppTimezone());
    const themeTopic = campaign?.themeTopic || protocol.target_issue || "Regulasi Sistem Saraf Otonom";
    const activeKeyword = (protocol.keyword || campaign?.triggerKeyword || keywordParam || "").trim().toUpperCase().replace(/[^A-Za-z0-9]/g, "");
    const pdfFilename = activeKeyword ? `Panduan_${activeKeyword}_DokterPikiran.pdf` : "Panduan_Protokol_DokterPikiran.pdf";

    // 4. Generate binary PDF buffer
    const pdfBuffer = await generateProtocolPdf({
      protocol,
      persona,
      campaignDate,
      themeTopic,
    });

    // Jika dipanggil dengan ?upload=1 atau ?json=1
    if (wantsUpload || wantsJson) {
      let publicPdfUrl = `${getPublicBaseUrl(req)}/api/protocol/pdf?campaignId=${campaign?.id || ""}`;

      if (isSupabaseStorageConfigured()) {
        try {
          const fileName = `protokol-${campaignDate}-${activeKeyword || (campaign?.id ? campaign.id.slice(0, 8) : "default")}.pdf`;
          publicPdfUrl = await uploadLeadMagnetPdf(`lead-magnets/${fileName}`, pdfBuffer);
        } catch (storageErr: unknown) {
          const errMessage = storageErr instanceof Error ? storageErr.message : String(storageErr);
          console.warn("[protocol/pdf] Gagal mengunggah ke Supabase Storage, menggunakan URL API:", errMessage);
        }
      }

      return jsonOk({
        ok: true,
        url: publicPdfUrl,
        title: protocol.title,
        keyword: activeKeyword || protocol.keyword || "RESET",
        target_issue: protocol.target_issue,
        campaignId: campaign?.id ?? null,
        campaignDate,
        stepsCount: protocol.steps?.length ?? 0,
      });
    }

    // 5. Default: streaming response binary PDF dengan headers resmi
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
    // 🛡️ CRITICAL SHIELD: JANGAN PERNAH lempar HTTP 500 ke klien/worker!
    console.error("[protocol/pdf] Fatal error in route handler, generating emergency standalone PDF:", fatalErr);
    try {
      const emergencyBuffer = await generateProtocolPdf({
        protocol: DEFAULT_OFFICIAL_PROTOCOL,
        persona: {
          ...defaultPersona(),
          creatorName: "Dokter Pikiran",
          signature: "Klinik & Edukasi Kesehatan Holistik Dokter Pikiran",
        },
        campaignDate: new Date().toISOString().slice(0, 10),
        themeTopic: "Regulasi Saraf Vagus & Reset Somatik",
      });

      return new NextResponse(new Uint8Array(emergencyBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Length": String(emergencyBuffer.length),
          "Content-Disposition": 'inline; filename="Panduan_Protokol_DokterPikiran.pdf"',
          "Cache-Control": "no-store",
        },
      });
    } catch {
      // Jika pdf-lib sekalipun gagal, kirim buffer PDF minimal statis
      const minimalPdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF";
      return new NextResponse(minimalPdf, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="Panduan_Protokol_DokterPikiran.pdf"',
        },
      });
    }
  }
}
