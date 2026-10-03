import { NextRequest } from "next/server";
import { jsonError, jsonOk } from "@/lib/api";
import { getCampaignByKeyword } from "@/lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword")?.trim();

  if (!keyword) {
    return jsonError("Parameter 'keyword' diperlukan", 400);
  }

  try {
    const campaign = await getCampaignByKeyword(keyword);
    if (!campaign) {
      return jsonOk({ ok: false, matched: false, campaign: null });
    }

    return jsonOk({
      ok: true,
      matched: true,
      campaign: {
        id: campaign.id,
        trigger_keyword: campaign.triggerKeyword || campaign.leadMagnetProtocol?.keyword || keyword.toUpperCase(),
        topic: campaign.themeTopic,
        campaignDate: campaign.campaignDate,
        lead_magnet_protocol: campaign.leadMagnetProtocol,
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return jsonError(`Gagal mencari campaign berdasarkan kata kunci: ${msg}`, 500);
  }
}
