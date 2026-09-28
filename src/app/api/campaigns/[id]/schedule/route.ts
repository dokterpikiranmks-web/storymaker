import { handleRouteError, isUuid, jsonError, jsonOk, readJson, requireDashboard } from "@/lib/api";
import { getCampaign, renderCampaignSlides, scheduleSlides } from "@/lib/campaigns";
import { dispatchInstagramForSlide, type InstagramDispatchResult } from "@/lib/dispatch";
import { isInstagramConfigured } from "@/lib/instagram";
import { scheduleSchema, zodMessage } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/campaigns/:id/schedule
 * { mode: "schedule" | "now" | "cancel", slideIds?: uuid[], channels?: { whatsapp, instagram } }
 * - schedule → status SCHEDULED at campaign_date + target_time (APP_TIMEZONE)
 * - now      → due immediately; Instagram is published inline, WhatsApp via the local daemon
 * - cancel   → back to DRAFT
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  const { id } = await params;
  if (!isUuid(id)) return jsonError("ID tidak valid", 400);

  const parsed = scheduleSchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { mode, slideIds, channels } = parsed.data;

  if (mode !== "cancel" && channels && !channels.whatsapp && !channels.instagram) {
    return jsonError("Pilih minimal satu channel (WhatsApp / Instagram)", 400);
  }
  if (mode !== "cancel" && channels?.instagram && !isInstagramConfigured()) {
    return jsonError("Instagram belum dikonfigurasi — isi IG_USER_ID & IG_ACCESS_TOKEN atau matikan channel Instagram.", 400);
  }

  try {
    if (mode !== "cancel") await renderCampaignSlides(id, true);
    const { slides, pastDue } = await scheduleSlides(id, { mode, slideIds, channels });

    const instagram: Array<{ slideId: string } & InstagramDispatchResult> = [];
    if (mode === "now" && isInstagramConfigured()) {
      for (const slide of slides) {
        if (!slide.postToInstagram) continue;
        instagram.push({ slideId: slide.id, ...(await dispatchInstagramForSlide(slide.id, req)) });
      }
    }

    const campaign = await getCampaign(id);
    return jsonOk({
      campaign,
      pastDue,
      instagram,
      workerRequired: mode !== "cancel" && slides.some((s) => s.postToWhatsapp),
      workerSecretConfigured: Boolean(process.env.WORKER_SECRET?.trim()),
    });
  } catch (err) {
    return handleRouteError(err, "campaigns:schedule");
  }
}
