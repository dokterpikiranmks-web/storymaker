import { randomUUID } from "node:crypto";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api";
import { hasDashboardAccess, isCronAuthorized } from "@/lib/auth";
import { getCampaign, getCampaignRowByDate, renderCampaignSlides, saveGeneratedCampaign, scheduleSlides } from "@/lib/campaigns";
import { getAppTimezone, todayInTimezone } from "@/lib/env";
import { isGeminiConfigured } from "@/lib/gemini/detector";
import { generateStructured } from "@/lib/gemini/generate";
import { getPersona } from "@/lib/settings";
import { generateFourActStory } from "@/lib/stories/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RotatingPillar {
  category: string;
  pillar: string;
  focus: string;
  curatedCase: {
    topic: string;
    clinicalComplaint: string;
    coreInsight: string;
  };
}

/**
 * Rotasi Kategori Harian Dr. Mind Scout (WIB / Asia/Jakarta):
 * - Senin & Kamis : Somatik & Regulasi Sistem Saraf (Totok Saraf, Vagus Nerve)
 * - Selasa & Jumat: Pola Pikir & Arsitektur Pikiran Bawah Sadar (Hipnoterapi Klinis)
 * - Rabu & Sabtu  : Metafora AI vs Otak Manusia (Solo AI Dev / Produktivitas)
 * - Minggu        : Deep Rest & Reset Mental
 */
function getPillarForDate(date: Date, tz: string): RotatingPillar {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" });
  const weekday = formatter.format(date).toLowerCase();

  switch (weekday) {
    case "monday":
    case "thursday":
      return {
        category: "Somatik & Regulasi Sistem Saraf",
        pillar: "Totok Saraf & Vagus Nerve",
        focus: "Regulasi sistem saraf otonom (parasimpatik), stimulasi saraf vagus, pelepasan ketegangan otot leher, tension headache, rahang kaku karena stres, dan somatisasi kecemasan.",
        curatedCase: {
          topic: "Ketegangan Leher & Sinyal Bahaya Saraf Vagus Saat Deadline Menumpuk",
          clinicalComplaint:
            "Klien datang dengan keluhan pundak seperti memikul beban 20 kg dan napas pendek setiap kali membuka laptop. Secara medis tidak ada kelainan otot, namun sistem saraf otonomnya terkunci di mode 'fight-or-flight'. Otot suboksipital di pangkal tengkorak mengunci aliran darah ke otak.",
          coreInsight:
            "Tubuh fisik tidak bisa membedakan antara kejaran deadline dan kejaran predator. Menekan titik tenang di belakang telinga dan pelepasan diafragma mengirim sinyal aman langsung ke saraf vagus dalam 90 detik.",
        },
      };

    case "tuesday":
    case "friday":
      return {
        category: "Pola Pikir & Arsitektur Pikiran Bawah Sadar",
        pillar: "Hipnoterapi Klinis & Subconscious Scripting",
        focus: "Reframing program bawah sadar, memutus mental loop overthinking malam hari, sabotase diri (impostor syndrome), membuka resistensi mental, dan instalasi keyakinan diri dengan sugesti presisi.",
        curatedCase: {
          topic: "Memutus Mental Loop Jam 11 Malam & Scripting Bawah Sadar",
          clinicalComplaint:
            "Klien selalu terjaga jam 11 malam memikirkan skenario terburuk proyek besok, padahal siangnya bekerja keras. Pikiran sadarnya ingin tidur, tetapi pikiran bawah sadarnya menjalankan loop proteksi kuno: 'kalau kamu rileks, kamu tidak waspada'.",
          coreInsight:
            "Afirmasi positif gagal karena ditolak oleh Critical Factor. Diperlukan reframing bawah sadar: memberi 'tugas baru' pada bagian diri yang cemas agar bertransformasi menjadi penjaga istirahat malam yang damai.",
        },
      };

    case "wednesday":
    case "saturday":
      return {
        category: "Metafora AI vs Otak Manusia",
        pillar: "Solo AI Dev & Produktivitas Kognitif",
        focus: "Mengibaratkan arsitektur pikiran dengan rekayasa prompt AI, debugging bugs kebiasaan, merapikan cognitive context window yang mengalami token overflow, dan otomasi sistem mental.",
        curatedCase: {
          topic: "Pikiranmu Tidak Lambat: Cognitive Context Window Mengalami Token Overflow",
          clinicalComplaint:
            "Klien merasa 'otak hang' dan tidak bisa fokus setelah membuka 30 tab browser serta pesan chat pekerjaan. Dia menyalahkan dirinya lambat, padahal otaknya hanya mengalami overload kapasitas working memory.",
          coreInsight:
            "Seperti LLM dengan konteks berlebih yang mulai halusinasi, otak manusia butuh 'context clear' dan prompt grounding berkala. Membuang memory dump ke catatan eksternal langsung mengembalikan throughput berpikir.",
        },
      };

    case "sunday":
    default:
      return {
        category: "Deep Rest & Reset Mental",
        pillar: "Deep Rest & Subconscious Renewal",
        focus: "Pelepasan beban mental sepekan, transisi gelombang otak Beta ke Alpha/Theta, pembersihan residu emosi, dan persiapan ketenangan mendalam untuk menyambut pekan baru.",
        curatedCase: {
          topic: "Ketenangan Radikal: Transisi Gelombang Otak dari Beban Sepekan Menuju Alpha",
          clinicalComplaint:
            "Klien merasa bersalah jika hari Minggu tidak produktif, akibatnya libur tetap tegang dan bangun hari Senin dalam kondisi baterai emosional 10%. Tubuh tidak pernah masuk fase pemulihan parasimpatik mendalam.",
          coreInsight:
            "Pemulihan sejati bukan pasif di depan layar HP, melainkan mengizinkan sistem saraf masuk ke gelombang hening Alpha dan Theta. Sugesti pelepasan total sebelum tidur mengaktifkan regenerasi neuroplastisitas alami.",
        },
      };
  }
}

async function researchWithGemini(pillar: RotatingPillar, campaignDate: string, customTopic?: string) {
  if (!isGeminiConfigured()) return pillar.curatedCase;

  const prompt = `Kamu adalah "Dr. Mind Scout", agen riset klinis otonom untuk "Sang Alchemist" (Hipnoterapis Klinis, Praktisi Totok Saraf, dan Solo AI Developer).
Tugasmu: Merumuskan 1 studi kasus keluhan klinis harian yang sangat nyata dan tajam untuk tanggal ${campaignDate}.

Pilar Tema Hari Ini:
- Kategori: ${pillar.category}
- Fokus Klinis: ${pillar.focus}
${customTopic ? `- Topik Arahan: "${customTopic}"` : ""}

Kriteria:
1. "topic": Topik/judul tajam provokatif tentang paradoks pikiran-tubuh (maks 12 kata, tanpa emoji/hashtag).
2. "clinicalComplaint": Narasi keluhan nyata klien di meja terapi yang emosional dan detail (sensasi tubuh somatis + konflik pikiran bawah sadar).
3. "coreInsight": Terobosan wawasan (the "aha!" moment) yang menghubungkan tubuh fisik dan reprogram pikiran bawah sadar / metafora AI.

Hasilkan JSON valid dengan format:
{
  "topic": "...",
  "clinicalComplaint": "...",
  "coreInsight": "..."
}`;

  try {
    const res = await generateStructured<{ topic: string; clinicalComplaint: string; coreInsight: string }>(
      prompt,
      "Hasilkan hanya JSON valid sesuai schema tanpa teks pembuka atau markdown di luar json.",
      (text) => {
        let t = text.trim();
        const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fence) t = fence[1].trim();
        const parsed = JSON.parse(t);
        return {
          topic: String(parsed.topic || pillar.curatedCase.topic).trim(),
          clinicalComplaint: String(parsed.clinicalComplaint || pillar.curatedCase.clinicalComplaint).trim(),
          coreInsight: String(parsed.coreInsight || pillar.curatedCase.coreInsight).trim(),
        };
      },
      { json: true, temperature: 0.8 },
    );
    return res.data;
  } catch (err) {
    console.warn("[Dr. Mind Scout] Gemini research fallback to curated case:", (err as Error).message);
    return pillar.curatedCase;
  }
}

/**
 * POST & GET /api/cron/research — Autonomous Clinical Research Agent ("Dr. Mind Scout")
 * 1. Amankan endpoint dengan Bearer Token (CRON_SECRET / WORKER_SECRET) ATAU Dashboard Session.
 * 2. Tentukan kategori tema otomatis berputar berdasarkan hari dalam sepekan.
 * 3. Dr. Mind Scout meriset keluhan klinis & generate naskah 4 babak lengkap.
 * 4. Render langsung ke visual poster 9:16 via Satori dan simpan ke Supabase Storage (rendered-slides).
 * 5. Simpan campaign dan set jadwal posting otomatis (07:15, 12:30, 18:45, 21:30).
 */
async function handleResearch(req: Request) {
  const authorized = isCronAuthorized(req) || (await hasDashboardAccess(req));
  if (!authorized) return jsonError("Unauthorized", 401);

  let body: { topic?: string; campaign_date?: string; overwrite?: boolean } = {};
  if (req.method === "POST") {
    body = ((await readJson(req).catch(() => ({}))) as typeof body) ?? {};
  }

  const tz = getAppTimezone();
  const campaignDate = body.campaign_date || todayInTimezone();
  const dateObj = new Date(campaignDate + "T12:00:00Z");
  const pillar = getPillarForDate(dateObj, tz);
  const overwrite = body.overwrite !== false;

  try {
    const existing = await getCampaignRowByDate(campaignDate);
    if (existing && !overwrite) {
      return jsonError(`Campaign untuk tanggal ${campaignDate} sudah ada.`, 409, { existingCampaignId: existing.id });
    }

    const persona = await getPersona();
    const requestId = randomUUID();

    // 1. Dr. Mind Scout riset keluhan klinis
    const scoutData = await researchWithGemini(pillar, campaignDate, body.topic);
    const rawThought = `${scoutData.clinicalComplaint}\n\nCore Insight: ${scoutData.coreInsight}`;

    // 2. Generate naskah 4 babak lengkap (Pattern Interrupt, Somatic, Clinical-AI, Anchor + CTA)
    const { story, info } = await generateFourActStory({
      topic: scoutData.topic,
      rawThought,
      campaignDate,
      persona,
      requestId,
    });

    // 3. Simpan campaign ke Supabase Database
    const campaignId = await saveGeneratedCampaign({
      campaignDate,
      topic: scoutData.topic,
      rawThought: scoutData.clinicalComplaint,
      story,
      info,
    });

    // 4. Render visual poster 9:16 melalui Satori dan simpan ke Supabase Storage (rendered-slides)
    const renderErrors = await renderCampaignSlides(campaignId);

    // 5. Set jadwal posting otomatis (07:15, 12:30, 18:45, 21:30) untuk WhatsApp
    const { slides: scheduledSlides, pastDue } = await scheduleSlides(campaignId, {
      mode: "schedule",
      channels: { whatsapp: true, instagram: false },
    });

    const campaign = await getCampaign(campaignId);

    return jsonOk({
      ok: true,
      agent: "Dr. Mind Scout",
      pillar: pillar.category,
      focus: pillar.focus,
      campaignDate,
      campaign,
      renderErrors,
      scheduledSlidesCount: scheduledSlides.length,
      pastDue,
      generation: info,
    });
  } catch (err) {
    return handleRouteError(err, "cron/research");
  }
}

export async function POST(req: Request) {
  return handleResearch(req);
}

export async function GET(req: Request) {
  return handleResearch(req);
}
