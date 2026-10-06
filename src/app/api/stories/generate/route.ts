import { randomUUID } from "node:crypto";
import { handleRouteError, jsonError, jsonOk, readJson, requireDashboard } from "@/lib/api";
import { getCampaign, getCampaignRowByDate, renderCampaignSlides, saveGeneratedCampaign, scheduleSlides } from "@/lib/campaigns";
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
    // UPSERT handling: jika campaign sudah ada, kita timpa (overwrite) slide lama terkait.
    // Hanya tolak jika caller secara eksplisit mengirimkan overwrite: false.
    if (campaignType === "DAILY_AUTONOMOUS" && overwrite === false) {
      const existing = await getCampaignRowByDate(campaignDate, "DAILY_AUTONOMOUS");
      if (existing) {
        return jsonError(`Campaign harian untuk tanggal ${campaignDate} sudah ada. Gunakan overwrite=true untuk memperbarui.`, 409, { existingCampaignId: existing.id });
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

    // Render 4 visual slide dan upload ke Supabase bucket story-assets
    const renderErrors = await renderCampaignSlides(campaignId);
    let campaign = await getCampaign(campaignId);

    // 🛡️ [VALIDASI VISUAL RENDER & UPLOAD KE BUCKET story-assets]
    // Pastikan buffer gambar berhasil di-generate dan di-upload ke Supabase bucket story-assets.
    // Jika upload gagal, kembalikan response error yang jelas, jangan biarkan status menggantung di DRAFT kosong.
    const missingSlides = campaign?.slides.filter((s) => !s.renderedImageUrl) ?? [];
    if (missingSlides.length > 0 || renderErrors.length > 0) {
      const errorDetail = renderErrors.length > 0 ? renderErrors.join("; ") : `${missingSlides.length} slide tidak memiliki gambar ter-render`;
      console.error(`[generate] Gagal merender visual untuk campaign ${campaignId}: ${errorDetail}`);
      return jsonError(
        `Gagal membuat visual story (${errorDetail}). Pastikan buffer gambar berhasil di-generate dan di-upload ke bucket story-assets.`,
        500,
        { campaignId, renderErrors, missingSlideCount: missingSlides.length }
      );
    }

    // Jika parameter auto_schedule aktif, picu penjadwalan otomatis langsung ke antrean siar WhatsApp
    if (parsed.data.auto_schedule) {
      await scheduleSlides(campaignId, { mode: "schedule", channels: { whatsapp: true, instagram: false } });
      campaign = await getCampaign(campaignId);
    }

    return jsonOk({ requestId, campaign, story, generation: { ...info, renderErrors } });
  } catch (err) {
    return handleRouteError(err, "stories/generate");
  }
}
