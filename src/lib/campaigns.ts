import "server-only";
import { and, asc, desc, eq, inArray, isNull, lt, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { dailyCampaigns, storySlides, type DailyCampaign, type SlideMeta, type StorySlide } from "@/db/schema";
import { getAppTimezone } from "@/lib/env";
import { contentEtag, renderSlidePng, type SlideRenderInput } from "@/lib/render/renderer";
import { storeRenderedImage } from "@/lib/render/storage";
import { getPersona } from "@/lib/settings";
import { ACT_TYPES, ACTS, normalizeTheme, POST_STATUSES, type PostStatus, type ThemeName } from "@/lib/stories/constants";
import type {
  CampaignDTO,
  CampaignSummaryDTO,
  CampaignType,
  GeneratedStory,
  GenerationInfo,
  LeadMagnetProtocol,
  PersonaSettings,
  SlideDTO,
} from "@/lib/stories/types";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const actIndex = (act: string) => ACT_TYPES.indexOf(act as (typeof ACT_TYPES)[number]);

// ── DTO mappers ──────────────────────────────────────────────────────────
export function toSlideDTO(s: StorySlide): SlideDTO {
  const meta = (s.meta ?? {}) as SlideMeta;
  return {
    id: s.id,
    campaignId: s.campaignId,
    act: s.act,
    targetTime: s.targetTime.slice(0, 5),
    headline: s.headline,
    bodyText: s.bodyText,
    callToAction: s.callToAction,
    caption: s.caption,
    visualTheme: normalizeTheme(s.visualTheme, ACTS[s.act].defaultTheme),
    renderedImageUrl: s.renderedImageUrl,
    status: s.status,
    scheduledAt: iso(s.scheduledAt),
    postToWhatsapp: s.postToWhatsapp,
    postToInstagram: s.postToInstagram,
    waPostedAt: iso(s.waPostedAt),
    igPostedAt: iso(s.igPostedAt),
    igMediaId: s.igMediaId,
    lastError: s.lastError,
    technique: meta.technique ?? null,
    keyElement: meta.keyElement ?? null,
    updatedAt: s.updatedAt.toISOString(),
  };
}

export function toCampaignDTO(c: DailyCampaign, slides: StorySlide[]): CampaignDTO {
  let leadMagnetProtocol: LeadMagnetProtocol | null = null;
  if (c.rawInputNotes && c.rawInputNotes.includes("---LEAD_MAGNET_PROTOCOL_JSON---")) {
    try {
      const parts = c.rawInputNotes.split("---LEAD_MAGNET_PROTOCOL_JSON---");
      if (parts[1]) {
        leadMagnetProtocol = JSON.parse(parts[1].trim());
      }
    } catch {
      // ignore JSON parse error
    }
  }

  const triggerKeyword = c.triggerKeyword || leadMagnetProtocol?.keyword || null;
  if (leadMagnetProtocol && !leadMagnetProtocol.keyword && triggerKeyword) {
    leadMagnetProtocol.keyword = triggerKeyword;
  }

  return {
    id: c.id,
    campaignDate: c.campaignDate,
    campaignType: (c.campaignType as CampaignType) || "DAILY_AUTONOMOUS",
    themeTopic: c.themeTopic,
    triggerKeyword,
    rawInputNotes: c.rawInputNotes ? c.rawInputNotes.split("---LEAD_MAGNET_PROTOCOL_JSON---")[0].trim() : null,
    coreInsight: c.coreInsight,
    generationSource: c.generationSource,
    generationModel: c.generationModel,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    slides: [...slides].sort((a, b) => actIndex(a.act) - actIndex(b.act)).map(toSlideDTO),
    leadMagnetProtocol,
  };
}

// ── Queries ──────────────────────────────────────────────────────────────
export async function getCampaign(id: string): Promise<CampaignDTO | null> {
  const [campaign] = await db.select().from(dailyCampaigns).where(eq(dailyCampaigns.id, id)).limit(1);
  if (!campaign) return null;
  const slides = await db.select().from(storySlides).where(eq(storySlides.campaignId, id));
  return toCampaignDTO(campaign, slides);
}

export async function getCampaignByKeyword(keyword: string): Promise<CampaignDTO | null> {
  const clean = keyword.trim().toUpperCase();
  if (!clean) return null;

  // 1. Direct match on triggerKeyword column
  const [row] = await db
    .select()
    .from(dailyCampaigns)
    .where(sql`UPPER(${dailyCampaigns.triggerKeyword}) = ${clean}`)
    .orderBy(desc(dailyCampaigns.createdAt))
    .limit(1);

  if (row) {
    const slides = await db.select().from(storySlides).where(eq(storySlides.campaignId, row.id));
    return toCampaignDTO(row, slides);
  }

  // 2. Match rawInputNotes JSON containing the keyword
  const [jsonRow] = await db
    .select()
    .from(dailyCampaigns)
    .where(sql`${dailyCampaigns.rawInputNotes} ILIKE ${'%"keyword":"' + clean + '"%'}`)
    .orderBy(desc(dailyCampaigns.createdAt))
    .limit(1);

  if (jsonRow) {
    const slides = await db.select().from(storySlides).where(eq(storySlides.campaignId, jsonRow.id));
    return toCampaignDTO(jsonRow, slides);
  }

  // 3. Fallback match in themeTopic
  const [topicRow] = await db
    .select()
    .from(dailyCampaigns)
    .where(sql`UPPER(${dailyCampaigns.themeTopic}) LIKE ${'%' + clean + '%'}`)
    .orderBy(desc(dailyCampaigns.createdAt))
    .limit(1);

  if (topicRow) {
    const slides = await db.select().from(storySlides).where(eq(storySlides.campaignId, topicRow.id));
    return toCampaignDTO(topicRow, slides);
  }

  return null;
}

export async function getCampaignRowByDate(date: string, type: CampaignType = "DAILY_AUTONOMOUS"): Promise<DailyCampaign | null> {
  const [row] = await db
    .select()
    .from(dailyCampaigns)
    .where(and(eq(dailyCampaigns.campaignDate, date), eq(dailyCampaigns.campaignType, type)))
    .limit(1);
  return row ?? null;
}

export async function getLatestCampaign(): Promise<CampaignDTO | null> {
  const [row] = await db
    .select({ id: dailyCampaigns.id })
    .from(dailyCampaigns)
    .orderBy(desc(dailyCampaigns.updatedAt))
    .limit(1);
  return row ? getCampaign(row.id) : null;
}

export async function listCampaigns(limit = 30): Promise<CampaignSummaryDTO[]> {
  const rows = await db.select().from(dailyCampaigns).orderBy(desc(dailyCampaigns.campaignDate)).limit(limit);
  if (rows.length === 0) return [];
  const counts = await db
    .select({ campaignId: storySlides.campaignId, status: storySlides.status, count: sql<number>`count(*)::int` })
    .from(storySlides)
    .where(inArray(storySlides.campaignId, rows.map((r) => r.id)))
    .groupBy(storySlides.campaignId, storySlides.status);
  return rows.map((r) => {
    const base = Object.fromEntries(POST_STATUSES.map((s) => [s, 0])) as Record<PostStatus, number>;
    for (const c of counts) if (c.campaignId === r.id) base[c.status] = Number(c.count);
    return {
      id: r.id,
      campaignDate: r.campaignDate,
      campaignType: (r.campaignType as CampaignType) || "DAILY_AUTONOMOUS",
      themeTopic: r.themeTopic,
      generationSource: r.generationSource,
      generationModel: r.generationModel,
      createdAt: r.createdAt.toISOString(),
      counts: base,
    };
  });
}

export async function deleteCampaign(id: string): Promise<boolean> {
  const rows = await db.delete(dailyCampaigns).where(eq(dailyCampaigns.id, id)).returning({ id: dailyCampaigns.id });
  return rows.length > 0;
}

export async function getSlide(id: string): Promise<StorySlide | null> {
  const [row] = await db.select().from(storySlides).where(eq(storySlides.id, id)).limit(1);
  return row ?? null;
}

// ── Persist generated story ──────────────────────────────────────────────
export async function saveGeneratedCampaign(input: {
  campaignDate: string;
  topic?: string;
  rawThought?: string;
  story: GeneratedStory;
  info: GenerationInfo;
  campaignType?: CampaignType;
}): Promise<string> {
  const campaignType = input.campaignType ?? "DAILY_AUTONOMOUS";
  const protocolKeyword = input.story.lead_magnet_protocol?.keyword?.trim().toUpperCase();
  const triggerKeyword = protocolKeyword || "RESET";
  if (input.story.lead_magnet_protocol && !input.story.lead_magnet_protocol.keyword) {
    input.story.lead_magnet_protocol.keyword = triggerKeyword;
  }
  const protocolNote = input.story.lead_magnet_protocol
    ? `\n\n---LEAD_MAGNET_PROTOCOL_JSON---\n${JSON.stringify(input.story.lead_magnet_protocol)}`
    : "";
  const baseNotes = [input.topic ? `Topik: ${input.topic}` : null, input.rawThought || null].filter(Boolean).join("\n\n");
  const rawNotes = (baseNotes ? baseNotes + protocolNote : protocolNote ? protocolNote.trim() : null);
  const themeTopic = input.story.theme_topic || input.topic || (campaignType === "FLASH_PROMO" ? "Flash Promo" : "Story harian");

  return db.transaction(async (tx) => {
    const now = new Date();
    let campaignId: string;

    if (campaignType === "FLASH_PROMO") {
      // FLASH_PROMO: Always insert as an independent separate entry without overwriting or blocking daily queue
      const [campaign] = await tx
        .insert(dailyCampaigns)
        .values({
          campaignDate: input.campaignDate,
          campaignType: "FLASH_PROMO",
          themeTopic,
          triggerKeyword,
          rawInputNotes: rawNotes,
          coreInsight: input.story.core_insight || null,
          generationSource: input.info.source,
          generationModel: input.info.model,
          createdAt: now,
          updatedAt: now,
        })
        .returning();
      campaignId = campaign.id;
    } else {
      // DAILY_AUTONOMOUS: Check if daily autonomous campaign already exists for this date
      const [existing] = await tx
        .select()
        .from(dailyCampaigns)
        .where(
          and(
            eq(dailyCampaigns.campaignDate, input.campaignDate),
            eq(dailyCampaigns.campaignType, "DAILY_AUTONOMOUS"),
          ),
        )
        .limit(1);

      if (existing) {
        const [updated] = await tx
          .update(dailyCampaigns)
          .set({
            themeTopic,
            triggerKeyword,
            rawInputNotes: rawNotes,
            coreInsight: input.story.core_insight || null,
            generationSource: input.info.source,
            generationModel: input.info.model,
            updatedAt: now,
          })
          .where(eq(dailyCampaigns.id, existing.id))
          .returning();
        campaignId = updated.id;
        await tx.delete(storySlides).where(eq(storySlides.campaignId, campaignId));
      } else {
        const [campaign] = await tx
          .insert(dailyCampaigns)
          .values({
            campaignDate: input.campaignDate,
            campaignType: "DAILY_AUTONOMOUS",
            themeTopic,
            triggerKeyword,
            rawInputNotes: rawNotes,
            coreInsight: input.story.core_insight || null,
            generationSource: input.info.source,
            generationModel: input.info.model,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        campaignId = campaign.id;
      }
    }

    await tx.insert(storySlides).values(
      input.story.acts.map((a) => ({
        campaignId,
        act: a.act,
        targetTime: `${ACTS[a.act].time}:00`,
        headline: a.headline,
        bodyText: a.body_text,
        callToAction: a.call_to_action || null,
        caption: a.caption || null,
        visualTheme: a.visual_theme,
        meta: { technique: a.technique, keyElement: a.key_element, source: input.info.source, model: input.info.model } satisfies SlideMeta,
      })),
    );
    return campaignId;
  });
}

// ── Rendering ────────────────────────────────────────────────────────────
export function slideRenderInput(
  slide: Pick<StorySlide, "headline" | "bodyText" | "callToAction" | "act" | "visualTheme">,
  persona: PersonaSettings,
): SlideRenderInput {
  return {
    headline: slide.headline,
    body: slide.bodyText,
    cta: slide.callToAction,
    actType: slide.act,
    themeName: normalizeTheme(slide.visualTheme, ACTS[slide.act].defaultTheme),
    handle: persona.handle,
    signature: persona.signature,
  };
}

export async function renderSlideToStorage(slide: StorySlide, persona?: PersonaSettings): Promise<StorySlide> {
  const p = persona ?? (await getPersona());
  const png = await renderSlidePng(slideRenderInput(slide, p));
  if (!png || png.length === 0) {
    throw new Error(`Buffer gambar PNG kosong saat merender slide ${slide.act} (${slide.id})`);
  }
  const etag = contentEtag(png);
  const meta = (slide.meta ?? {}) as SlideMeta;
  const stored = await storeRenderedImage({ png, etag, slideId: slide.id, campaignId: slide.campaignId, previousPath: meta.storagePath });
  if (!stored.url) {
    throw new Error(`Gagal mendapatkan public URL gambar untuk slide ${slide.act} (${slide.id})`);
  }
  const nextMeta: SlideMeta = { ...meta, imageEtag: etag, storage: stored.storage, renderedAt: new Date().toISOString() };
  if (stored.path) nextMeta.storagePath = stored.path;
  const [updated] = await db
    .update(storySlides)
    .set({ renderedImageUrl: stored.url, meta: nextMeta, updatedAt: new Date() })
    .where(eq(storySlides.id, slide.id))
    .returning();
  return updated ?? slide;
}

/** Renders every slide of a campaign; returns human readable errors (non-fatal). */
export async function renderCampaignSlides(campaignId: string, onlyMissing = false): Promise<string[]> {
  const persona = await getPersona();
  const slides = await db.select().from(storySlides).where(eq(storySlides.campaignId, campaignId));
  const errors: string[] = [];
  for (const slide of slides) {
    if (onlyMissing && slide.renderedImageUrl) continue;
    try {
      await renderSlideToStorage(slide, persona);
    } catch (err) {
      console.error("[render] slide failed", slide.id, err);
      errors.push(`${ACTS[slide.act].slot}: ${(err as Error).message}`);
    }
  }
  return errors;
}

// ── Editing ──────────────────────────────────────────────────────────────
export interface SlidePatch {
  headline?: string;
  bodyText?: string;
  callToAction?: string | null;
  caption?: string | null;
  visualTheme?: ThemeName;
  targetTime?: string;
  postToWhatsapp?: boolean;
  postToInstagram?: boolean;
}

export const VISUAL_FIELDS: Array<keyof SlidePatch> = ["headline", "bodyText", "callToAction", "visualTheme"];

export async function updateSlide(id: string, patch: SlidePatch): Promise<StorySlide | null> {
  const existing = await getSlide(id);
  if (!existing) return null;
  const set: Partial<typeof storySlides.$inferInsert> = { updatedAt: new Date() };
  if (patch.headline !== undefined) set.headline = patch.headline;
  if (patch.bodyText !== undefined) set.bodyText = patch.bodyText;
  if (patch.callToAction !== undefined) set.callToAction = patch.callToAction || null;
  if (patch.caption !== undefined) set.caption = patch.caption || null;
  if (patch.visualTheme !== undefined) set.visualTheme = patch.visualTheme;
  if (patch.postToWhatsapp !== undefined) set.postToWhatsapp = patch.postToWhatsapp;
  if (patch.postToInstagram !== undefined) set.postToInstagram = patch.postToInstagram;
  if (patch.targetTime !== undefined) {
    const time = patch.targetTime.length === 5 ? `${patch.targetTime}:00` : patch.targetTime;
    set.targetTime = time;
    if (existing.status === "SCHEDULED") {
      const [campaign] = await db.select().from(dailyCampaigns).where(eq(dailyCampaigns.id, existing.campaignId)).limit(1);
      if (campaign) {
        set.scheduledAt = sql`((${campaign.campaignDate}::date + ${time}::time) AT TIME ZONE ${getAppTimezone()})` as unknown as Date;
      }
    }
  }
  const [row] = await db.update(storySlides).set(set).where(eq(storySlides.id, id)).returning();
  return row ?? null;
}

// ── Scheduling ───────────────────────────────────────────────────────────
export async function scheduleSlides(
  campaignId: string,
  opts: { mode: "schedule" | "now" | "cancel"; slideIds?: string[]; channels?: { whatsapp: boolean; instagram: boolean } },
): Promise<{ slides: StorySlide[]; pastDue: number }> {
  const [campaign] = await db.select().from(dailyCampaigns).where(eq(dailyCampaigns.id, campaignId)).limit(1);
  if (!campaign) throw new NotFoundError("Campaign tidak ditemukan");
  const all = await db.select().from(storySlides).where(eq(storySlides.campaignId, campaignId));
  let targets: StorySlide[];
  if (opts.slideIds?.length) {
    targets = all.filter((s) => opts.slideIds!.includes(s.id));
  } else if (opts.mode === "now") {
    // Mode "now" tanpa slideIds: tandai slide berikutnya yang berstatus SCHEDULED (atau DRAFT)
    const sorted = [...all].sort((a, b) => actIndex(a.act) - actIndex(b.act));
    const nextTarget = sorted.find((s) => s.status === "SCHEDULED") || sorted.find((s) => s.status === "DRAFT");
    targets = nextTarget ? [nextTarget] : [];
  } else {
    targets = all;
  }
  const tz = getAppTimezone();
  const channelSet = opts.channels
    ? { postToWhatsapp: opts.channels.whatsapp, postToInstagram: opts.channels.instagram }
    : {};
  const updated: StorySlide[] = [];
  let pastDue = 0;

  for (const s of targets.sort((a, b) => actIndex(a.act) - actIndex(b.act))) {
    const now = new Date();
    if (opts.mode === "cancel") {
      if (s.status !== "SCHEDULED" && s.status !== "FAILED") {
        updated.push(s);
        continue;
      }
      const [row] = await db
        .update(storySlides)
        .set({ status: "DRAFT", scheduledAt: null, waLockAt: null, igLockAt: null, lastError: null, updatedAt: now })
        .where(eq(storySlides.id, s.id))
        .returning();
      updated.push(row);
      continue;
    }
    if (opts.mode === "now") {
      const nowTime = new Intl.DateTimeFormat("en-GB", {
        timeZone: tz,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(now);

      const [row] = await db
        .update(storySlides)
        .set({
          ...channelSet,
          status: "SCHEDULED",
          targetTime: nowTime,
          scheduledAt: now,
          waPostedAt: null,
          igPostedAt: null,
          igMediaId: null,
          waLockAt: null,
          igLockAt: null,
          lastError: null,
          meta: sql`coalesce(${storySlides.meta}, '{}'::jsonb) || ${JSON.stringify({ forcePost: true, forcedAt: now.toISOString() })}::jsonb`,
          updatedAt: now,
        })
        .where(eq(storySlides.id, s.id))
        .returning();
      updated.push(row);
      pastDue += 1;
      continue;
    }
    if (s.status === "POSTED") {
      updated.push(s);
      continue;
    }
    const [row] = await db
      .update(storySlides)
      .set({
        ...channelSet,
        status: "SCHEDULED",
        scheduledAt: sql`((${campaign.campaignDate}::date + ${s.targetTime}::time) AT TIME ZONE ${tz})` as unknown as Date,
        waLockAt: null,
        igLockAt: null,
        lastError: null,
        updatedAt: now,
      })
      .where(eq(storySlides.id, s.id))
      .returning();
    if (row.scheduledAt && row.scheduledAt.getTime() <= Date.now()) pastDue += 1;
    updated.push(row);
  }
  return { slides: updated, pastDue };
}

// ── Dispatch queue (WhatsApp daemon / cron) ──────────────────────────────
function staleHours(): number {
  const h = Number(process.env.DISPATCH_STALE_HOURS);
  return Number.isFinite(h) && h > 0 ? h : 6;
}

export async function expireStaleSlides(): Promise<number> {
  const hours = staleHours();
  const rows = await db
    .update(storySlides)
    .set({ status: "FAILED", lastError: `Kedaluwarsa: tidak terkirim dalam ${hours} jam setelah jadwal`, updatedAt: new Date() })
    .where(
      and(
        eq(storySlides.status, "SCHEDULED"),
        lt(storySlides.scheduledAt, new Date(Date.now() - hours * 3_600_000)),
        or(isNull(sql`${storySlides.meta}->>'forcePost'`), sql`(${storySlides.meta}->>'forcePost')::text != 'true'`),
      ),
    )
    .returning({ id: storySlides.id });
  return rows.length;
}

export async function getDueSlides(limit = 10): Promise<StorySlide[]> {
  await expireStaleSlides();
  return db
    .select()
    .from(storySlides)
    .where(
      and(
        eq(storySlides.status, "SCHEDULED"),
        or(
          lte(storySlides.scheduledAt, new Date()),
          sql`(${storySlides.meta}->>'forcePost')::text = 'true'`,
        ),
      ),
    )
    .orderBy(asc(storySlides.scheduledAt))
    .limit(limit);
}

/** Atomically lease WhatsApp jobs so two daemons (or overlapping polls) never double-post. */
export async function leaseWhatsapp(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const cutoff = new Date(Date.now() - 3 * 60_000);
  const rows = await db
    .update(storySlides)
    .set({ waLockAt: new Date() })
    .where(
      and(
        inArray(storySlides.id, ids),
        eq(storySlides.status, "SCHEDULED"),
        eq(storySlides.postToWhatsapp, true),
        isNull(storySlides.waPostedAt),
        or(isNull(storySlides.waLockAt), lt(storySlides.waLockAt, cutoff)),
      ),
    )
    .returning({ id: storySlides.id });
  return new Set(rows.map((r) => r.id));
}

export async function finalizeSlideStatus(slideId: string): Promise<StorySlide | null> {
  const s = await getSlide(slideId);
  if (!s) return null;
  if (s.status !== "SCHEDULED" && s.status !== "DRAFT") return s;
  const waDone = !s.postToWhatsapp || Boolean(s.waPostedAt);
  const igDone = !s.postToInstagram || Boolean(s.igPostedAt);
  const anyChannel = s.postToWhatsapp || s.postToInstagram;
  if (anyChannel && waDone && igDone && (s.waPostedAt || s.igPostedAt)) {
    const [row] = await db
      .update(storySlides)
      .set({ status: "POSTED", lastError: null, updatedAt: new Date() })
      .where(eq(storySlides.id, slideId))
      .returning();
    return row ?? s;
  }
  return s;
}

export async function ackWhatsapp(slideId: string, ok: boolean, error?: string): Promise<StorySlide | null> {
  const now = new Date();
  if (ok) {
    await db
      .update(storySlides)
      .set({
        waPostedAt: now,
        waLockAt: null,
        meta: sql`coalesce(${storySlides.meta}, '{}'::jsonb) - 'forcePost'`,
        updatedAt: now,
      })
      .where(eq(storySlides.id, slideId));
  } else {
    await db
      .update(storySlides)
      .set({ waLockAt: null, status: "FAILED", lastError: `WhatsApp: ${(error || "gagal tanpa pesan").slice(0, 500)}`, updatedAt: now })
      .where(eq(storySlides.id, slideId));
  }
  return finalizeSlideStatus(slideId);
}
