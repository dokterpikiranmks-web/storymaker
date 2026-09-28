import { randomUUID } from "node:crypto";
import { handleRouteError, jsonError, jsonOk, readJson, requireDashboard } from "@/lib/api";
import { getCampaign, getCampaignRowByDate, renderCampaignSlides, saveGeneratedCampaign } from "@/lib/campaigns";
import { todayInTimezone } from "@/lib/env";
import { getPersona } from "@/lib/settings";
import { generateFourActStory } from "@/lib/stories/engine";
import { generateStorySchema, zodMessage } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/stories/generate  (PRD Task 2.2)
 * Body: { topic?: string, raw_thought?: string, campaign_date?: "YYYY-MM-DD", overwrite?: boolean }
 * → 4-act structured story (Gemini cascade → offline fallback), persisted + rendered.
 */
export async function POST(req: Request) {
  const denied = await requireDashboard(req);
  if (denied) return denied;

  const parsed = generateStorySchema.safeParse(await readJson(req));
  if (!parsed.success) return jsonError(zodMessage(parsed.error), 400);
  const { topic, raw_thought: rawThought, overwrite } = parsed.data;
  const campaignDate = parsed.data.campaign_date ?? todayInTimezone();

  try {
    const existing = await getCampaignRowByDate(campaignDate);
    if (existing && !overwrite) {
      return jsonError(`Campaign untuk tanggal ${campaignDate} sudah ada.`, 409, { existingCampaignId: existing.id });
    }

    const persona = await getPersona();
    const requestId = randomUUID();
    const { story, info } = await generateFourActStory({ topic, rawThought, campaignDate, persona, requestId });
    const campaignId = await saveGeneratedCampaign({ campaignDate, topic, rawThought, story, info });
    const renderErrors = await renderCampaignSlides(campaignId);
    const campaign = await getCampaign(campaignId);

    return jsonOk({ requestId, campaign, story, generation: { ...info, renderErrors } });
  } catch (err) {
    return handleRouteError(err, "stories/generate");
  }
}
