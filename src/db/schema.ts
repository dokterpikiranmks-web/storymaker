import { sql } from "drizzle-orm";
import {
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Story Maker — database schema (PostgreSQL / Supabase compatible).
 * Mirrors PRD v1.0 §4, extended with dispatch bookkeeping columns,
 * a binary asset fallback table and a small key/value state table.
 * The equivalent raw SQL lives in `supabase/schema.sql`.
 */

// ── Enums ────────────────────────────────────────────────────────────────
export const storyActType = pgEnum("story_act_type", [
  "ACT_1_HOOK",
  "ACT_2_SOMATIC",
  "ACT_3_CLINICAL_AI",
  "ACT_4_ANCHOR",
]);

export const postStatus = pgEnum("post_status", ["DRAFT", "SCHEDULED", "POSTED", "FAILED"]);

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

export interface SlideMeta {
  technique?: string;
  keyElement?: string;
  source?: "gemini" | "offline";
  model?: string | null;
  imageEtag?: string;
  storage?: "supabase" | "database";
  storagePath?: string;
  renderedAt?: string;
  igContainerId?: string;
  forcePost?: boolean;
  forcedAt?: string;
}

// ── Daily campaign (daily autonomous or flash promo) ─────────────────────
export const dailyCampaigns = pgTable(
  "daily_campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignDate: date("campaign_date").notNull(),
    campaignType: text("campaign_type").notNull().default("DAILY_AUTONOMOUS"),
    themeTopic: text("theme_topic").notNull(),
    rawInputNotes: text("raw_input_notes"),
    coreInsight: text("core_insight"),
    generationSource: text("generation_source").notNull().default("gemini"),
    generationModel: text("generation_model"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("daily_campaigns_date_idx").on(t.campaignDate),
    index("daily_campaigns_type_idx").on(t.campaignType),
  ],
);

// ── Slide per act ────────────────────────────────────────────────────────
export const storySlides = pgTable(
  "story_slides",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => dailyCampaigns.id, { onDelete: "cascade" }),
    act: storyActType("act").notNull(),
    targetTime: time("target_time").notNull(),
    headline: text("headline").notNull(),
    bodyText: text("body_text").notNull(),
    callToAction: text("call_to_action"),
    caption: text("caption"),
    visualTheme: text("visual_theme").notNull().default("Neuro-Dark"),
    renderedImageUrl: text("rendered_image_url"),
    status: postStatus("status").notNull().default("DRAFT"),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    postToWhatsapp: boolean("post_to_whatsapp").notNull().default(true),
    postToInstagram: boolean("post_to_instagram").notNull().default(false),
    waPostedAt: timestamp("wa_posted_at", { withTimezone: true }),
    igPostedAt: timestamp("ig_posted_at", { withTimezone: true }),
    igMediaId: text("ig_media_id"),
    waLockAt: timestamp("wa_lock_at", { withTimezone: true }),
    igLockAt: timestamp("ig_lock_at", { withTimezone: true }),
    lastError: text("last_error"),
    meta: jsonb("meta").$type<SlideMeta>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("story_slides_campaign_act_uq").on(t.campaignId, t.act),
    index("story_slides_dispatch_idx").on(t.status, t.scheduledAt),
  ],
);

// ── Rendered PNG fallback storage (used when Supabase Storage is not configured)
export const storyAssets = pgTable("story_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  slideId: uuid("slide_id")
    .unique()
    .references(() => storySlides.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull().default("image/png"),
  data: bytea("data").notNull(),
  byteSize: integer("byte_size").notNull(),
  etag: text("etag").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Gemini Quota Guard telemetry ─────────────────────────────────────────
export const geminiModelTelemetry = pgTable(
  "gemini_model_telemetry",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    modelName: text("model_name").notNull(),
    statusCode: integer("status_code").notNull(),
    latencyMs: integer("latency_ms"),
    errorMessage: text("error_message"),
    requestId: text("request_id"),
    timestamp: timestamp("timestamp", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("gemini_telemetry_ts_idx").on(t.timestamp),
    index("gemini_telemetry_model_ts_idx").on(t.modelName, t.timestamp),
  ],
);

// ── Generic key/value state (persona settings, worker heartbeat) ─────────
export const appState = pgTable("app_state", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// ── Baileys Multi-Device WhatsApp Auth Store (Koyeb / Cloud 24/7) ────────
export const waAuthStore = pgTable("wa_auth_store", {
  id: text("id").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DailyCampaign = typeof dailyCampaigns.$inferSelect;
export type StorySlide = typeof storySlides.$inferSelect;
export type NewStorySlide = typeof storySlides.$inferInsert;
export type GeminiTelemetryRow = typeof geminiModelTelemetry.$inferSelect;
export type WaAuthStoreRow = typeof waAuthStore.$inferSelect;

