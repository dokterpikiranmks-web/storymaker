import { NextRequest, NextResponse } from "next/server";
import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { getCampaign, getCampaignRowByDate, getLatestCampaign } from "@/lib/campaigns";
import { getAppTimezone, getPublicBaseUrl, todayInTimezone } from "@/lib/env";
import { generateProtocolPdf } from "@/lib/pdf/generator";
import { getPersona } from "@/lib/settings";
import { buildDefaultLeadMagnetProtocol } from "@/lib/stories/offline";
import type { LeadMagnetProtocol } from "@/lib/stories/types";
import { isSupabaseStorageConfigured, uploadLeadMagnetPdf } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const campaignId = searchParams.get("campaignId")?.trim();
    const dateParam = searchParams.get("date")?.trim();
    const wantsJson = searchParams.get("json") === "1" || searchParams.get("json") === "true";
    const wantsUpload = searchParams.get("upload") === "1" || searchParams.get("upload") === "true";

    let campaign = null;

    if (campaignId) {
      campaign = await getCampaign(campaignId);
    } else if (dateParam) {
      const row = await getCampaignRowByDate(dateParam, "DAILY_AUTONOMOUS");
      if (row) {
        campaign = await getCampaign(row.id);
      }
    } else {
      // Ambil campaign aktif hari ini, fallback ke latest
      const today = todayInTimezone(getAppTimezone());
      const row = await getCampaignRowByDate(today, "DAILY_AUTONOMOUS");
      if (row) {
        campaign = await getCampaign(row.id);
      } else {
        campaign = await getLatestCampaign();
      }
    }

    const persona = await getPersona();
    const protocol: LeadMagnetProtocol =
      campaign?.leadMagnetProtocol ??
      buildDefaultLeadMagnetProtocol(campaign?.themeTopic || "Regulasi Saraf Vagus & Totok Saraf Suboksipital");

    const campaignDate = campaign?.campaignDate || todayInTimezone(getAppTimezone());
    const themeTopic = campaign?.themeTopic || "Regulasi Sistem Saraf Otonom";

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
          const fileName = `protokol-${campaignDate}-${campaign?.id ? campaign.id.slice(0, 8) : "default"}.pdf`;
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
        target_issue: protocol.target_issue,
        campaignId: campaign?.id ?? null,
        campaignDate,
        stepsCount: protocol.steps?.length ?? 0,
      });
    }

    // Default: streaming response buffer PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Length": String(pdfBuffer.length),
        "Content-Disposition": `inline; filename="protokol-${campaignDate}.pdf"`,
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    return handleRouteError(err, "api/protocol/pdf");
  }
}
