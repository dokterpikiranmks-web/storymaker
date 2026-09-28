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
  const [campaign, campaigns, persona, engine, worker] = await Promise.all([
    getLatestCampaign(),
    listCampaigns(30),
    getPersona(),
    buildEngineStatus({ discover: false }),
    getWorkerHeartbeat(),
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
