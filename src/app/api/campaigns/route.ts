import { handleRouteError, jsonOk, requireDashboard } from "@/lib/api";
import { listCampaigns } from "@/lib/campaigns";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  try {
    const limit = Math.min(Math.max(Number(new URL(req.url).searchParams.get("limit")) || 30, 1), 100);
    return jsonOk({ campaigns: await listCampaigns(limit) });
  } catch (err) {
    return handleRouteError(err, "campaigns:list");
  }
}
