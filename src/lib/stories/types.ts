import type { ActType, PostStatus, ThemeName } from "./constants";

/** Persona / brand identity injected into every prompt and rendered footer. */
export interface PersonaSettings {
  creatorName: string;
  handle: string;
  ctaKeyword: string;
  whatsappNumber: string;
  audience: string;
  signature: string;
  voiceNotes: string;
}

/** One act as produced by the Alchemist engine (Gemini or offline template). */
export interface GeneratedAct {
  act: ActType;
  headline: string;
  body_text: string;
  call_to_action: string;
  caption: string;
  visual_theme: ThemeName;
  technique: string;
  key_element: string;
}

export type CampaignType = "DAILY_AUTONOMOUS" | "FLASH_PROMO";
export type FlashPromoSubtype = "THERAPY_SLOT" | "APP_SHOWCASE";

export interface LeadMagnetProtocolStep {
  step: number;
  title: string;
  action: string;
  duration?: string;
  mechanism: string;
}

export interface LeadMagnetProtocol {
  title: string;
  target_issue: string;
  steps: LeadMagnetProtocolStep[];
  pdf_summary: string;
  keyword?: string;
}

export interface FlashPromoInput {
  subtype: FlashPromoSubtype;
  remainingSlots?: number;
  practiceDate?: string;
  therapyType?: "TOTOK_SARAF" | "HIPNOTERAPI" | "KOMBINASI";
  appName?: string;
  appSolution?: string;
  targetUser?: string;
}

export interface GeneratedStory {
  theme_topic: string;
  core_insight: string;
  acts: GeneratedAct[];
  lead_magnet_protocol?: LeadMagnetProtocol | null;
}

export interface AttemptLogDTO {
  model: string;
  status: number;
  kind: string;
  latencyMs: number;
  message?: string;
}

export interface GenerationInfo {
  source: "gemini" | "offline";
  model: string | null;
  attempts: AttemptLogDTO[];
  latencyMs: number;
  fallbackReason?: string;
  renderErrors?: string[];
}

/** JSON-serialisable slide passed to the client. */
export interface SlideDTO {
  id: string;
  campaignId: string;
  act: ActType;
  targetTime: string;
  headline: string;
  bodyText: string;
  callToAction: string | null;
  caption: string | null;
  visualTheme: ThemeName;
  renderedImageUrl: string | null;
  status: PostStatus;
  scheduledAt: string | null;
  postToWhatsapp: boolean;
  postToInstagram: boolean;
  waPostedAt: string | null;
  igPostedAt: string | null;
  igMediaId: string | null;
  lastError: string | null;
  technique: string | null;
  keyElement: string | null;
  updatedAt: string;
}

export interface CampaignDTO {
  id: string;
  campaignDate: string;
  campaignType: CampaignType;
  themeTopic: string;
  triggerKeyword?: string | null;
  rawInputNotes: string | null;
  coreInsight: string | null;
  generationSource: string;
  generationModel: string | null;
  createdAt: string;
  updatedAt: string;
  slides: SlideDTO[];
  leadMagnetProtocol?: LeadMagnetProtocol | null;
}

export interface CampaignSummaryDTO {
  id: string;
  campaignDate: string;
  campaignType: CampaignType;
  themeTopic: string;
  generationSource: string;
  generationModel: string | null;
  createdAt: string;
  counts: Record<PostStatus, number>;
}

export interface ModelHealthDTO {
  model: string;
  rank: number;
  state: "ready" | "cooldown" | "unavailable";
  cooldownRemainingMs: number;
  lastStatus: number | null;
  lastFailureKind: string | null;
  lastError: string | null;
  lastLatencyMs: number | null;
  successCount: number;
  failureCount: number;
  lastSuccessAt: string | null;
}

export interface TelemetryDTO {
  id: string;
  modelName: string;
  statusCode: number;
  latencyMs: number | null;
  errorMessage: string | null;
  requestId: string | null;
  timestamp: string;
}

export interface EngineStatusDTO {
  configured: boolean;
  discoverySource: string | null;
  discoveredAt: string | null;
  discoveredModels: string[];
  discoveryError: string | null;
  optimalModel: string | null;
  cascade: ModelHealthDTO[];
  prdCascade: string[];
  baseCooldownSeconds: number;
  telemetry: TelemetryDTO[];
}

export interface FeatureFlags {
  databaseConfigured: boolean;
  geminiConfigured: boolean;
  supabaseStorageConfigured: boolean;
  instagramConfigured: boolean;
  telegramConfigured?: boolean;
  workerSecretConfigured: boolean;
  dashboardAuthEnabled: boolean;
  timezone: string;
  appUrl: string;
  today: string;
}

export interface WorkerHeartbeatDTO {
  lastSeen: string | null;
  connected: boolean;
  me: string | null;
  version: string | null;
}
