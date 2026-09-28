import { strToU8, zipSync, type Zippable } from "fflate";
import { handleRouteError, isUuid, jsonError, requireDashboard } from "@/lib/api";
import { getCampaign, slideRenderInput } from "@/lib/campaigns";
import { renderSlidePng } from "@/lib/render/renderer";
import { getPersona } from "@/lib/settings";
import { ACTS } from "@/lib/stories/constants";
import { slugify } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/campaigns/:id/download → ZIP with 4 fresh 1080×1920 PNGs + captions.txt ("Download All Slides"). */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireDashboard(req);
  if (denied) return denied;
  const { id } = await params;
  if (!isUuid(id)) return jsonError("ID tidak valid", 400);

  try {
    const campaign = await getCampaign(id);
    if (!campaign) return jsonError("Campaign tidak ditemukan", 404);
    const persona = await getPersona();
    const files: Zippable = {};
    const captionLines: string[] = [
      `STORY MAKER — ${campaign.campaignDate}`,
      `Tema: ${campaign.themeTopic}`,
      campaign.coreInsight ? `Insight: ${campaign.coreInsight}` : "",
      "",
    ];

    for (const slide of campaign.slides) {
      const act = ACTS[slide.act];
      const png = await renderSlidePng(slideRenderInput(slide, persona));
      const name = `${String(act.index).padStart(2, "0")}_${act.slot.toLowerCase()}-${slide.targetTime.replace(":", "")}_${slugify(act.shortTitle)}.png`;
      files[name] = [new Uint8Array(png), { level: 0 }];
      captionLines.push(
        `── Babak ${act.index} · ${act.slot} ${slide.targetTime} · ${act.title}`,
        `Headline: ${slide.headline.replace(/\*/g, "")}`,
        `CTA: ${slide.callToAction ?? "-"}`,
        "",
        slide.caption ?? slide.bodyText,
        "",
      );
    }
    files["captions.txt"] = strToU8(captionLines.join("\n"));

    const zip = zipSync(files);
    return new Response(new Uint8Array(zip), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Length": String(zip.length),
        "Content-Disposition": `attachment; filename="story-maker_${campaign.campaignDate}.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return handleRouteError(err, "campaigns:download");
  }
}
