import { StudioApp } from "@/components/studio/studio-app";
import { getLatestCampaign, listCampaigns } from "@/lib/campaigns";
import { getFeatureFlags } from "@/lib/env";
import { buildEngineStatus } from "@/lib/gemini/status";
import { getPersona, getWorkerHeartbeat } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard · Story Maker",
};

export default async function DashboardPage() {
  let campaign = null;
  let campaigns: Awaited<ReturnType<typeof listCampaigns>> = [];

  try {
    campaign = await getLatestCampaign();
  } catch (err) {
    console.warn("[DashboardPage] getLatestCampaign failed:", err);
  }

  try {
    campaigns = await listCampaigns(30);
  } catch (err) {
    console.warn("[DashboardPage] listCampaigns failed:", err);
  }

  const [persona, engine, worker] = await Promise.all([
    getPersona().catch(() => ({
      creatorName: "Sang Alchemist",
      handle: "@storymaker",
      ctaKeyword: "RESET",
      whatsappNumber: "",
      audience:
        "Profesional & pebisnis usia 25–45 tahun yang lelah mental, sulit tidur, overthinking, dan ingin performa tinggi tanpa burnout.",
      signature: "Hipnoterapis Klinis · Totok Saraf · Solo AI Agent Dev · Trainer",
      voiceNotes: "",
    })),
    buildEngineStatus({ discover: false }),
    getWorkerHeartbeat().catch(() => ({
      lastSeen: null,
      connected: false,
      me: null,
      version: null,
    })),
  ]);

  return (
    <StudioApp
      initialCampaign={campaign}
      initialCampaigns={campaigns}
      initialPersona={persona}
      initialFlags={getFeatureFlags()}
      initialEngine={engine}
      initialWorker={worker}
    />
  );
}
