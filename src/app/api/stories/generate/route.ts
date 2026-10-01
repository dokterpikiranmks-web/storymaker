import { randomUUID } from "node:crypto";
import { handleRouteError, jsonError, jsonOk, readJson, requireDashboard } from "@/lib/api";
import { getCampaign, getCampaignRowByDate, renderCampaignSlides, saveGeneratedCampaign } from "@/lib/campaigns";
import { todayInTimezone } from "@/lib/env";
import { getPersona } from "@/lib/settings";
import { generateFourActStory } from "@/lib/stories/engine";
import type { FlashPromoInput } from "@/lib/stories/types";
import { generateStorySchema, zodMessage } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/stories/generate
 * Supports both DAILY_AUTONOMOUS stories and FLASH_PROMO ad-hoc campaigns.
 * If FLASH_PROMO: saves as an independent entry without checking or blocking today's daily queue.
 */
export async function POST(req: Request) {
  const denied = await requireDashboard(req);
  if (denied) return denied;

  const parsed = generateStorySchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);

  const { topic, raw_thought: rawThought, overwrite } = parsed.data;
  const campaignType = parsed.data.campaign_type ?? "DAILY_AUTONOMOUS";
  const campaignDate = parsed.data.campaign_date ?? todayInTimezone();

  try {
    // Logika validasi: Jika DAILY_AUTONOMOUS, cek apakah campaign hari ini sudah ada.
    // Jika FLASH_PROMO, simpan sebagai entri terpisah tanpa memvalidasi atau memblokir antrean tanggal hari ini.
    if (campaignType === "DAILY_AUTONOMOUS") {
      const existing = await getCampaignRowByDate(campaignDate, "DAILY_AUTONOMOUS");
      if (existing && !overwrite) {
        return jsonError(`Campaign harian untuk tanggal ${campaignDate} sudah ada.`, 409, { existingCampaignId: existing.id });
      }
    }

    const persona = await getPersona();
    const requestId = randomUUID();

    const flashPromo: FlashPromoInput | undefined =
      campaignType === "FLASH_PROMO" && parsed.data.flash_promo_subtype
        ? {
            subtype: parsed.data.flash_promo_subtype,
            remainingSlots: parsed.data.remaining_slots,
            practiceDate: parsed.data.practice_date,
            therapyType: parsed.data.therapy_type,
            appName: parsed.data.app_name,
            appSolution: parsed.data.app_solution,
            targetUser: parsed.data.target_user,
          }
        : undefined;

    const topicFinal =
      topic ||
      (flashPromo
        ? flashPromo.subtype === "THERAPY_SLOT"
          ? `Slot Praktek Terapi (${flashPromo.practiceDate ?? "Pekan Ini"})`
          : `Showcase Solusi: ${flashPromo.appName ?? "AI Tool"}`
        : undefined);

    const { story, info } = await generateFourActStory({
      topic: topicFinal,
      rawThought,
      campaignDate,
      persona,
      requestId,
      campaignType,
      flashPromo,
    });

    const campaignId = await saveGeneratedCampaign({
      campaignDate,
      topic: topicFinal,
      rawThought,
      story,
      info,
      campaignType,
    });

    const renderErrors = await renderCampaignSlides(campaignId);
    const campaign = await getCampaign(campaignId);

    return jsonOk({ requestId, campaign, story, generation: { ...info, renderErrors } });
  } catch (err) {
    return handleRouteError(err, "stories/generate");
  }
}
