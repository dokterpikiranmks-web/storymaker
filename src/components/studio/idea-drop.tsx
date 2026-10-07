"use client";

import type { EngineStatusDTO, CampaignDTO, GenerationInfo } from "@/lib/stories/types";
import { RemoteStudio } from "./remote-studio";
import type { Notify } from "./toaster";

export interface IdeaDropProps {
  today?: string;
  engine?: EngineStatusDTO;
  onGenerated?: (campaign: CampaignDTO, info: GenerationInfo) => void;
  notify?: Notify;
}

/**
 * IdeaDrop V2 - Replaced by RemoteStudio Single-Screen Dashboard
 */
export function IdeaDrop(_props: IdeaDropProps) {
  return <RemoteStudio />;
}
