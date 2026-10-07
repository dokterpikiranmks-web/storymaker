"use client";

import type {
  CampaignDTO,
  CampaignSummaryDTO,
  EngineStatusDTO,
  FeatureFlags,
  PersonaSettings,
  WorkerHeartbeatDTO,
} from "@/lib/stories/types";
import { RemoteStudio } from "./remote-studio";

export interface StudioAppProps {
  initialCampaign: CampaignDTO | null;
  initialCampaigns: CampaignSummaryDTO[];
  initialPersona: PersonaSettings;
  initialFlags: FeatureFlags;
  initialEngine: EngineStatusDTO;
  initialWorker: WorkerHeartbeatDTO;
}

export function StudioApp({ initialFlags }: StudioAppProps) {
  return <RemoteStudio authEnabled={initialFlags?.dashboardAuthEnabled} />;
}
