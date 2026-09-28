import { handleRouteError, isUuid, jsonError, jsonOk, requireDashboard } from "@/lib/api";
import { deleteCampaign, getCampaign } from "@/lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Ctx) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  const { id } = await params;
  if (!isUuid(id)) return jsonError("ID tidak valid", 400);
  try {
    const campaign = await getCampaign(id);
    if (!campaign) return jsonError("Campaign tidak ditemukan", 404);
    return jsonOk({ campaign });
  } catch (err) {
    return handleRouteError(err, "campaigns:get");
  }
}

export async function DELETE(req: Request, { params }: Ctx) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  const { id } = await params;
  if (!isUuid(id)) return jsonError("ID tidak valid", 400);
  try {
    const ok = await deleteCampaign(id);
    if (!ok) return jsonError("Campaign tidak ditemukan", 404);
    return jsonOk({ ok: true });
  } catch (err) {
    return handleRouteError(err, "campaigns:delete");
  }
}
