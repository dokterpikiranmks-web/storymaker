import { handleRouteError, isUuid, jsonError, jsonOk, requireDashboard } from "@/lib/api";
import { getCampaign, renderCampaignSlides } from "@/lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST /api/campaigns/:id/render → re-render all 4 slides (e.g. after persona/handle change). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  const { id } = await params;
  if (!isUuid(id)) return jsonError("ID tidak valid", 400);
  try {
    const errors = await renderCampaignSlides(id);
    const campaign = await getCampaign(id);
    if (!campaign) return jsonError("Campaign tidak ditemukan", 404);
    return jsonOk({ campaign, errors });
  } catch (err) {
    return handleRouteError(err, "campaigns:render");
  }
}
