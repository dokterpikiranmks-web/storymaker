import { z } from "zod";
import { ACT_TYPES, THEME_NAMES } from "@/lib/stories/constants";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD")
  .refine((v) => !Number.isNaN(new Date(`${v}T00:00:00Z`).getTime()), "Tanggal tidak valid");

const timeString = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "Format waktu harus HH:MM");

export const campaignTypeSchema = z.enum(["DAILY_AUTONOMOUS", "FLASH_PROMO"]);
export const flashPromoSubtypeSchema = z.enum(["THERAPY_SLOT", "APP_SHOWCASE"]);

export const generateStorySchema = z
  .object({
    topic: z.string().trim().max(240).optional(),
    raw_thought: z.string().trim().max(6000).optional(),
    campaign_date: dateString.optional(),
    campaign_type: campaignTypeSchema.optional().default("DAILY_AUTONOMOUS"),
    flash_promo_subtype: flashPromoSubtypeSchema.optional(),
    remaining_slots: z.coerce.number().int().min(1).max(100).optional(),
    practice_date: z.string().trim().max(100).optional(),
    therapy_type: z.enum(["TOTOK_SARAF", "HIPNOTERAPI", "KOMBINASI"]).optional(),
    app_name: z.string().trim().max(100).optional(),
    app_solution: z.string().trim().max(600).optional(),
    target_user: z.string().trim().max(200).optional(),
    overwrite: z.boolean().optional(),
    auto_schedule: z.boolean().optional(),
  })
  .refine(
    (v) => {
      if (v.campaign_type === "FLASH_PROMO") {
        if (v.flash_promo_subtype === "THERAPY_SLOT") {
          return Boolean(v.remaining_slots && v.practice_date);
        }
        if (v.flash_promo_subtype === "APP_SHOWCASE") {
          return Boolean(v.app_name && v.app_solution);
        }
        return Boolean(v.topic?.length || v.raw_thought?.length);
      }
      return Boolean(v.topic?.length || v.raw_thought?.length);
    },
    {
      message: "Lengkapi data kampanye (topic/raw_thought untuk story harian, atau detail slot/aplikasi untuk Flash Promo)",
    },
  );

export const renderSlideSchema = z.object({
  headline: z.string().trim().min(1).max(300),
  body: z.string().trim().max(1200).default(""),
  cta: z.string().trim().max(200).optional().nullable(),
  actType: z.enum(ACT_TYPES),
  themeName: z.enum(THEME_NAMES),
  handle: z.string().trim().max(60).optional(),
  signature: z.string().trim().max(120).optional(),
  slideId: z.string().uuid().optional(),
  store: z.boolean().optional(),
  format: z.enum(["png", "jpeg"]).optional(),
});

export const updateSlideSchema = z
  .object({
    headline: z.string().trim().min(1).max(300),
    bodyText: z.string().trim().min(1).max(1200),
    callToAction: z.string().trim().max(200).nullable(),
    caption: z.string().trim().max(2200).nullable(),
    visualTheme: z.enum(THEME_NAMES),
    targetTime: timeString,
    postToWhatsapp: z.boolean(),
    postToInstagram: z.boolean(),
  })
  .partial();

export const scheduleSchema = z.object({
  mode: z.enum(["schedule", "now", "cancel"]),
  slideIds: z.array(z.string().uuid()).max(4).optional(),
  channels: z
    .object({
      whatsapp: z.boolean(),
      instagram: z.boolean(),
    })
    .optional(),
});

export const personaSchema = z.object({
  creatorName: z.string().trim().min(1).max(80),
  handle: z.string().trim().max(60),
  ctaKeyword: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[\p{L}\p{N}_-]+$/u, "Kata kunci hanya huruf/angka tanpa spasi"),
  whatsappNumber: z
    .string()
    .trim()
    .max(20)
    .regex(/^[0-9+\s-]*$/, "Nomor hanya angka"),
  audience: z.string().trim().max(400),
  signature: z.string().trim().max(120),
  voiceNotes: z.string().trim().max(800),
});

export const workerAckSchema = z.object({
  slideId: z.string().uuid(),
  channel: z.enum(["whatsapp"]),
  ok: z.boolean(),
  error: z.string().max(1000).optional(),
});

export const dispatchInstagramSchema = z.object({
  slideId: z.string().uuid(),
});

export const loginSchema = z.object({
  passcode: z.string().min(1).max(200),
});

export const uuidSchema = z.string().uuid();

export function zodMessage(error: z.ZodError): string {
  return error.issues.map((i) => `${i.path.join(".") || "input"}: ${i.message}`).join("; ");
}
