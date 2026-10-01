import { randomUUID } from "node:crypto";
import { handleRouteError, jsonError, jsonOk, readJson } from "@/lib/api";
import { hasDashboardAccess, isCronAuthorized } from "@/lib/auth";
import { getCampaign, getCampaignRowByDate, renderCampaignSlides, saveGeneratedCampaign, scheduleSlides } from "@/lib/campaigns";
import { getAppTimezone, todayInTimezone } from "@/lib/env";
import { isGeminiConfigured } from "@/lib/gemini/detector";
import { generateStructured } from "@/lib/gemini/generate";
import { getPersona } from "@/lib/settings";
import { generateFourActStory } from "@/lib/stories/engine";
import type { LeadMagnetProtocol, LeadMagnetProtocolStep } from "@/lib/stories/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RotatingPillar {
  domainKey: "DOMAIN_A_TOTOK_SARAF" | "DOMAIN_B_HIPNOTERAPI" | "DOMAIN_C_SOLUSI_AI" | "DOMAIN_RESET";
  category: string;
  pillar: string;
  focus: string;
  clinicalKnowledge: string;
  curatedCase: {
    topic: string;
    clinicalComplaint: string;
    coreInsight: string;
    lead_magnet_protocol: LeadMagnetProtocol;
  };
}

/**
 * Rotasi Kategori Harian Dr. Mind Scout (WITA / Asia/Makassar):
 * - Senin & Kamis : Domain A — Traditional Functional Medicine & Totok Saraf
 * - Selasa & Jumat: Domain B — Hipnoterapi Klinis & Subconscious Architecture
 * - Rabu & Sabtu  : Domain C — Solusi AI & Augmentasi Produktivitas
 * - Minggu        : Somatic Deep Rest & Neuro-Restoration
 */
function getPillarForDate(date: Date, tz: string): RotatingPillar {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" });
  const weekday = formatter.format(date).toLowerCase();

  switch (weekday) {
    case "monday":
    case "thursday":
      return {
        domainKey: "DOMAIN_A_TOTOK_SARAF",
        category: "Traditional Functional Medicine & Totok Saraf",
        pillar: "Jalur Meridian, Titik Akupresur (GB-20, LI-4, ST-36) & Regulasi Saraf Vagus",
        focus:
          "Regulasi sistem saraf otonom (simpatik vs parasimpatik), stimulasi saraf vagus, pelepasan ketegangan otot leher & tension headache via titik GB-20 (Fengchi), pereda stres & modulasi nyeri via titik LI-4 (Hegu), penguatan energi vital & motilitas lambung via titik ST-36 (Zusanli), penanganan radang gut-brain axis, serta herbal adaptogen (Ashwagandha, Rhodiola, Pegagan, Lion's Mane).",
        clinicalKnowledge:
          "Integrasi biologi fungsional barat dengan jalur meridian timur: Spasme suboksipital menjepit arteri vertebralis dan nervus vagus cranial, mengunci tubuh di mode survival. Stimulasi titik GB-20 di lekukan tengkorak belakang dan titik LI-4 meredakan hiperaktivitas simpatik seketika. Titik ST-36 menstimulasi motilitas saluran cerna dan modulasi serotonin usus (gut-brain axis). Herbal adaptogen menyeimbangkan aksis HPA untuk mencegah lonjakan kortisol kronis.",
        curatedCase: {
          topic: "Leher Mengunci & Gut-Brain Axis: Rahasia Titik GB-20 dan Saraf Vagus",
          clinicalComplaint:
            "Klien datang dengan keluhan pundak seperti memikul beban 20 kg, leher belakang kaku mengunci, dan perut kembung kronis saat tenggat proyek menumpuk. Secara anatomis ototnya mengalami spasme fasia suboksipital yang menghambat aliran mikrosirkulasi ke batang otak. Sistem saraf otonomnya terkunci di mode 'fight-or-flight' sehingga persarafan lambung mati rasa.",
          coreInsight:
            "Tubuh fisik tidak bisa membedakan antara kejaran deadline dan kejaran predator. Menekan titik GB-20 di cekungan tengkorak belakang dan titik ST-36 di bawah lutut selama 90 detik mengirim sinyal parasimpatik langsung ke nervus vagus: mengumumkan kondisi aman bagi tubuh untuk pulih dan mencerna.",
          lead_magnet_protocol: {
            title: "Protokol 3 Menit Reset Vagus & Meridian GB-20",
            target_issue: "Tension headache, leher kaku akibat layar, dan kembung stres gut-brain axis",
            steps: [
              {
                step: 1,
                title: "Akupresur Titik GB-20 (Fengchi)",
                action:
                  "Tempatkan kedua ibu jari di cekungan pangkal tengkorak belakang leher, sejajar cuping telinga. Tekan lembut mengarah ke atas sambil memejamkan mata selama 60 detik.",
                duration: "60 detik",
                mechanism:
                  "Mengendurkan spasme otot suboksipital, melancarkan sirkulasi arteri vertebralis ke otak, dan memutus sinyal panik ke batang otak.",
              },
              {
                step: 2,
                title: "Respirasi Sinus Saraf Vagus (Extended Exhale 4-8)",
                action:
                  "Tarik napas perlahan melalui hidung selama 4 detik, lalu hembuskan panjang dan halus melalui bibir seperti meniup sedotan selama 8 detik. Ulangi 5 kali.",
                duration: "60 detik",
                mechanism:
                  "Hembusan napas lambat menstimulasi cabang aferen nervus vagus, menurunkan denyut jantung, dan memicu pelepasan asetilkolin penenang.",
              },
              {
                step: 3,
                title: "Aktivasi Meridian ST-36 (Zusanli) & Herbal Adaptogen",
                action:
                  "Temukan titik ST-36 (4 jari di bawah tempurung lutut bagian luar). Pijat memutar searah jarum jam selama 30 detik tiap kaki, lalu minum segelas air hangat dengan ekstrak adaptogen (pegagan atau kunyit).",
                duration: "60 detik",
                mechanism:
                  "Mengaktifkan refleks vagal lambung-usus, meredakan neuro-inflamasi gut-brain axis, dan memulihkan peristaltik pencernaan.",
              },
            ],
            pdf_summary:
              "Protokol klinis 3 langkah mandiri untuk meredakan ketegangan leher, mengaktifkan saraf vagus, dan menenangkan poros gut-brain axis dalam waktu kurang dari 3 menit.",
          },
        },
      };

    case "tuesday":
    case "friday":
      return {
        domainKey: "DOMAIN_B_HIPNOTERAPI",
        category: "Hipnoterapi Klinis & Subconscious Architecture",
        pillar: "Gelombang Alpha/Theta, Pelepasan Somatic Trauma Loop & Sugesti Hipnagogik",
        focus:
          "Reframing program bawah sadar, pelepasan somatic trauma loop yang terkunci di otot psoas & fasia dada, penanaman sugesti hipnagogik pada fase transisi tidur, pembongkaran mental loop sabotase diri (impostor syndrome), dan pembukaan Critical Factor pikiran bawah sadar menggunakan frekuensi Alpha (8–12 Hz) dan Theta (4–8 Hz).",
        clinicalKnowledge:
          "Pikiran sadar hanya memproses 5% keputusan harian, sementara 95% otomatis dikendalikan arsitektur bawah sadar. Somatic trauma loop terbentuk ketika ancaman emosional masa lalu membekukan otot psoas dan dada dalam postur defensif. Membuka loop ini membutuhkan kombinasi pelepasan somatik dan sugesti di jendela hipnagogik (5–10 menit sebelum tertidur) saat gelombang otak turun ke Alpha/Theta sehingga presuposisi identitas baru diterima tanpa resistensi Critical Factor.",
        curatedCase: {
          topic: "Memutus Somatic Trauma Loop Jam 11 Malam & Sugesti Hipnagogik",
          clinicalComplaint:
            "Klien selalu terjaga jam 11 malam dihantui kecemasan skenario terburuk proyek esok hari dan terbangun dengan dada berdebar kencang jam 3 pagi. Pikiran sadarnya tahu semuanya terkendali, tetapi pikiran bawah sadarnya menjalankan loop proteksi traumatik kuno: 'jika kamu rileks, bencana akan datang'. Fasia dada dan otot psoasnya mengencang defensif.",
          coreInsight:
            "Afirmasi positif sadar gagal karena langsung ditolak oleh Critical Factor yang berjaga. Diperlukan intervensi hipnagogik: melunakkan sensor kritis di gelombang Alpha/Theta, lalu menugaskan bagian diri yang cemas untuk beralih peran menjadi penjaga ketenangan malam yang hening.",
          lead_magnet_protocol: {
            title: "Protokol Somatic Unwinding & Sugesti Hipnagogik 3 Langkah",
            target_issue: "Overthinking malam hari, terbangun cemas jam 3 pagi, dan sindrom waspada berlebih",
            steps: [
              {
                step: 1,
                title: "Somatic Psoas & Chest De-armoring",
                action:
                  "Berbaring telentang di kasur, tekuk kedua lutut. Goyangkan panggul ke kiri dan kanan dengan ritme sangat lambat selama 60 detik sambil meletakkan tangan di dada tengah.",
                duration: "60 detik",
                mechanism:
                  "Melepaskan mikrokontraksi kronis pada otot psoas (otot survival emosional) dan mengirim sinyal biofeedback ke amigdala bahwa bahaya telah berakhir.",
              },
              {
                step: 2,
                title: "Transisi Gelombang Alpha (Peripheral Softening)",
                action:
                  "Tatap satu titik di langit-langit kamar, lalu tanpa menggerakkan pupil mata, lebarkan kesadaran pandangan ke sudut kiri dan kanan ruangan secara bersamaan hingga pandangan terasa mengabur dan mengembang lembut.",
                duration: "60 detik",
                mechanism:
                  "Mengaktifkan sistem visual parasimpatik dan menurunkan ritme gelombang otak dari Beta (gelisah) langsung ke Alpha (tenang terfokus).",
              },
              {
                step: 3,
                title: "Scripting Sugesti Hipnagogik (Jendela Emas Tidur)",
                action:
                  "Saat kelopak mata mulai memberat ingin tertutup, bisikkan dalam hati 3 kali: 'Tugasku hari ini telah selesai sempurna. Tubuhku aman untuk beristirahat, dan pikiran bawah sadarku merawat kesembuhanku malam ini.'",
                duration: "60 detik",
                mechanism:
                  "Menanamkan sugesti restoratif tepat saat Critical Factor non-aktif menjelang gelombang Theta, mengunci rasa aman ke memori jangka panjang.",
              },
            ],
            pdf_summary:
              "Panduan arsitektur bawah sadar 3 langkah untuk memutus trauma loop fisik dan memprogram ulang ketenangan mental saat transisi tidur Alpha-Theta.",
          },
        },
      };

    case "wednesday":
    case "saturday":
      return {
        domainKey: "DOMAIN_C_SOLUSI_AI",
        category: "Solusi AI & Augmentasi Produktivitas Kognitif",
        pillar: "Cognitive Load Offloading, Rekayasa Prompt & AI Mental Tools",
        focus:
          "Bagaimana automasi dan AI agent mengurai beban kognitif (mental load), analogi arsitektur LLM dengan cara kerja otak manusia (context window overflow, memory dump, debugging bad habits, system prompt refactoring), serta studi kasus nyata integrasi tools AI dan otomasi sistem mental untuk memecahkan kelelahan kerja solo builder & profesional.",
        clinicalKnowledge:
          "Working memory korteks prefrontal manusia hanya sanggup menampung 4–7 chunks informasi aktif. Ketika tuntutan tugas melebihi kapasitas, otak mengalami cognitive context window overflow: gejala brain fog, executive paralysis, dan hilangnya fokus mendalam. Memanfaatkan AI sebagai 'second brain' dan automasi sistem tugas bukan sekadar trik produktivitas, melainkan dekompresi kognitif biologis agar energi mental dapat didedikasikan untuk keputusan strategis bernilai tinggi.",
        curatedCase: {
          topic: "Pikiranmu Tidak Lambat: Cognitive Context Window Mengalami Token Overflow",
          clinicalComplaint:
            "Klien merasa 'otaknya korslet' dan tidak bisa fokus setelah membuka 30 tab browser, puluhan pesan chat, dan daftar pekerjaan yang bercabang. Dia menyalahkan dirinya lambat dan mulai kehilangan percaya diri, padahal otaknya hanya mengalami overload kapasitas working memory yang tidak pernah di-purge.",
          coreInsight:
            "Seperti LLM dengan konteks berlebih yang mulai berhalusinasi, otak manusia butuh 'context clear' dan prompt grounding berkala. Membuang memory dump ke catatan eksternal dan mendelegasikan beban mental ke sistem AI terstruktur langsung mengembalikan kecepatan berpikir 10x lipat.",
          lead_magnet_protocol: {
            title: "Protokol 3 Langkah AI Cognitive Offloading (Bebas Brain Fog)",
            target_issue: "Brain fog, kelelahan mental akibat multitasking, dan cognitive context overflow",
            steps: [
              {
                step: 1,
                title: "External Memory Dump (Bongkar RAM Otak)",
                action:
                  "Buka aplikasi perekam suara atau AI transcription tool. Rekam voice note 90 detik tanpa sensor berisi SEMUA hal yang saat ini menggelayuti pikiranmu.",
                duration: "90 detik",
                mechanism:
                  "Memindahkan beban memori kerja (working memory) dari korteks prefrontal ke media eksternal, menghentikan loop kecemasan internal.",
              },
              {
                step: 2,
                title: "AI Context Filtering (Sistem 3 Kotak)",
                action:
                  "Minta AI membagi dump tadi menjadi 3 kolom: (1) Selesai dalam 2 menit, (2) Otomasi / simpan di database, (3) Eliminasi total yang di luar kendali.",
                duration: "60 detik",
                mechanism:
                  "Menghilangkan 'decision fatigue' dan kelumpuhan analisis dengan memberikan kejelasan hierarki kognitif instan.",
              },
              {
                step: 3,
                title: "Mono-Task Grounding Anchor",
                action:
                  "Pilih HANYA 1 tindakan kotak pertama. Tutup semua jendela browser lainnya, letakkan kedua telapak kaki rata di lantai, tarik 1 napas panjang, dan kerjakan selama 15 menit tanpa interupsi.",
                duration: "30 detik",
                mechanism:
                  "Mengembalikan jalur dopamin ke ritme mono-tasking dan memulihkan kapasitas pemrosesan kognitif optimal.",
              },
            ],
            pdf_summary:
              "Metode ergonomi kognitif 3 langkah menggabungkan AI dan neurosains untuk mengosongkan context window otak, mengeliminasi brain fog, dan memulihkan fokus tajam.",
          },
        },
      };

    case "sunday":
    default:
      return {
        domainKey: "DOMAIN_RESET",
        category: "Deep Rest & Neuro-Restoration",
        pillar: "Pembersihan Residu Emosi & Reset Sistem Saraf Sepekan",
        focus:
          "Integrasi menyeluruh dari somatik meridian GB-20/ST-36, pelepasan subconscious loop, dan digital detox untuk memulihkan neuroplastisitas alami tubuh menyambut pekan baru.",
        clinicalKnowledge:
          "Pemulihan sejati sistem saraf otonom bukan sekadar rebahan pasif di depan layar HP, melainkan mengizinkan sistem saraf masuk ke gelombang hening Alpha dan Theta. Pelepasan total residu emosi sepekan mengaktifkan regenerasi neuroplastisitas alami.",
        curatedCase: {
          topic: "Ketenangan Radikal: Transisi Gelombang Otak dari Beban Sepekan Menuju Alpha",
          clinicalComplaint:
            "Klien merasa bersalah jika hari Minggu tidak produktif, akibatnya libur tetap tegang dan bangun hari Senin dalam kondisi baterai emosional 10%. Tubuh tidak pernah masuk fase pemulihan parasimpatik mendalam.",
          coreInsight:
            "Pemulihan sejati bukan pasif di depan layar HP, melainkan mengizinkan sistem saraf masuk ke gelombang hening Alpha dan Theta. Sugesti pelepasan total sebelum tidur mengaktifkan regenerasi neuroplastisitas alami.",
          lead_magnet_protocol: {
            title: "Protokol Reset Holistik Mingguan 3 Langkah",
            target_issue: "Kelelahan emosional sepekan dan kecemasan menghadapi hari Senin (Sunday Scaries)",
            steps: [
              {
                step: 1,
                title: "Digital Fasting & Somatic Grounding",
                action:
                  "Matikan layar gawai 2 jam sebelum tidur. Berjalan tanpa alas kaki di atas lantai atau karpet sambil merasakan kontak gravitasi bumi pada telapak kaki.",
                duration: "60 detik",
                mechanism:
                  "Menghilangkan stimulasi dopamin artifisial cahaya biru dan memicu aktivasi reseptor mekanosensori relaksasi.",
              },
              {
                step: 2,
                title: "Pelepasan Beban Sepekan (Exhale Sweep)",
                action:
                  "Tarik napas sambil mengangkat bahu ke arah telinga, tahan 3 detik, lalu jatuhkan bahu seketika sambil menghembuskan napas kuat lewat mulut 'HAHH'. Ulangi 3 kali.",
                duration: "60 detik",
                mechanism:
                  "Pelepasan mendadak ketegangan tonus otot trapezius mengirim sinyal pembebasan beban ke sistem limbik.",
              },
              {
                step: 3,
                title: "Instalasi Sugesti Kesegaran Pekan Baru",
                action:
                  "Rebahkan diri, letakkan tangan di perut. Rasakan napas perut yang mengembang dan kempis, tanamkan keyakinan: 'Pekan lalu telah usai, pekan baru menyambutku dengan energi jernih dan utuh.'",
                duration: "60 detik",
                mechanism:
                  "Memandu gelombang otak masuk ke Theta restoratif untuk sintesis hormon pertumbuhan dan pemulihan seluler.",
              },
            ],
            pdf_summary:
              "Protokol restorasi mingguan 3 langkah untuk menguras residu stres emosional sepekan dan mengisi ulang baterai mental menyambut pekan baru.",
          },
        },
      };
  }
}

async function researchWithGemini(
  pillar: RotatingPillar,
  campaignDate: string,
  customTopic?: string,
): Promise<{ topic: string; clinicalComplaint: string; coreInsight: string; lead_magnet_protocol: LeadMagnetProtocol }> {
  if (!isGeminiConfigured()) return pillar.curatedCase;

  const prompt = `Kamu adalah "Dr. Mind Scout", agen riset klinis otonom untuk "Sang Alchemist" (Hipnoterapis Klinis, Praktisi Totok Saraf & Functional Medicine, dan Solo AI Developer).
Tugasmu: Merumuskan 1 studi kasus keluhan klinis harian yang sangat nyata dan tajam untuk tanggal ${campaignDate}, lengkap dengan protokol lead magnet 3 langkah yang siap di-render menjadi PDF.

Matriks Pengetahuan Klinis Hari Ini:
- Domain Utama: ${pillar.category}
- Fokus Klinis: ${pillar.pillar}
- Detail Pengetahuan: ${pillar.focus}
- Basis Teori & Integrasi: ${pillar.clinicalKnowledge}
${customTopic ? `- Topik Arahan Spesifik: "${customTopic}"` : ""}

Kriteria Wajib:
1. "topic": Topik/judul tajam provokatif tentang paradoks pikiran-tubuh / metafora AI (maks 12 kata, tanpa emoji/hashtag).
2. "clinicalComplaint": Narasi keluhan nyata klien di meja terapi yang emosional dan detail (sensasi tubuh somatis + konflik pikiran bawah sadar + beban kognitif).
3. "coreInsight": Terobosan wawasan (the "aha!" moment) yang menghubungkan titik akupresur / regulasi vagus / hipnoterapi bawah sadar / metafora augmentasi AI.
4. "lead_magnet_protocol": Protokol 3 langkah fisik/mental yang sangat praktis dan bernilai tinggi:
   - "title": Judul protokol yang memikat (maks 10 kata).
   - "target_issue": Masalah spesifik yang diatasi protokol ini.
   - "steps": Array persis 3 objek langkah terstruktur:
       { "step": 1, "title": "...", "action": "instruksi fisik/mental yang jelas", "duration": "misal: 60 detik", "mechanism": "penjelasan biologis/bawah sadar mengapa cara ini bekerja" }
       { "step": 2, "title": "...", "action": "...", "duration": "...", "mechanism": "..." }
       { "step": 3, "title": "...", "action": "...", "duration": "...", "mechanism": "..." }
   - "pdf_summary": Ringkasan eksekutif 2-3 kalimat yang siap dicetak ke halaman depan PDF panduan.

Hasilkan JSON valid sesuai format persis:
{
  "topic": "...",
  "clinicalComplaint": "...",
  "coreInsight": "...",
  "lead_magnet_protocol": {
    "title": "...",
    "target_issue": "...",
    "steps": [
      { "step": 1, "title": "...", "action": "...", "duration": "...", "mechanism": "..." },
      { "step": 2, "title": "...", "action": "...", "duration": "...", "mechanism": "..." },
      { "step": 3, "title": "...", "action": "...", "duration": "...", "mechanism": "..." }
    ],
    "pdf_summary": "..."
  }
}`;

  try {
    const res = await generateStructured<{
      topic: string;
      clinicalComplaint: string;
      coreInsight: string;
      lead_magnet_protocol: LeadMagnetProtocol;
    }>(
      prompt,
      "Hasilkan hanya JSON valid sesuai schema tanpa teks pembuka atau markdown di luar json.",
      (text) => {
        let t = text.trim();
        const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (fence) t = fence[1].trim();
        const parsed = JSON.parse(t);

        const rawProtocol = (parsed.lead_magnet_protocol && typeof parsed.lead_magnet_protocol === "object"
          ? parsed.lead_magnet_protocol
          : pillar.curatedCase.lead_magnet_protocol) as Record<string, unknown>;

        const rawSteps = Array.isArray(rawProtocol.steps) ? rawProtocol.steps : pillar.curatedCase.lead_magnet_protocol.steps;
        const steps: LeadMagnetProtocolStep[] = rawSteps.slice(0, 3).map((st: unknown, idx: number) => {
          const s = (st && typeof st === "object" ? st : {}) as Record<string, unknown>;
          const fallbackStep = pillar.curatedCase.lead_magnet_protocol.steps[idx] ?? pillar.curatedCase.lead_magnet_protocol.steps[0];
          return {
            step: idx + 1,
            title: String(s.title || fallbackStep.title).trim(),
            action: String(s.action || fallbackStep.action).trim(),
            duration: String(s.duration || fallbackStep.duration || "60 detik").trim(),
            mechanism: String(s.mechanism || fallbackStep.mechanism).trim(),
          };
        });

        const leadMagnetProtocol: LeadMagnetProtocol = {
          title: String(rawProtocol.title || pillar.curatedCase.lead_magnet_protocol.title).trim(),
          target_issue: String(rawProtocol.target_issue || pillar.curatedCase.lead_magnet_protocol.target_issue).trim(),
          steps,
          pdf_summary: String(rawProtocol.pdf_summary || pillar.curatedCase.lead_magnet_protocol.pdf_summary).trim(),
        };

        return {
          topic: String(parsed.topic || pillar.curatedCase.topic).trim(),
          clinicalComplaint: String(parsed.clinicalComplaint || pillar.curatedCase.clinicalComplaint).trim(),
          coreInsight: String(parsed.coreInsight || pillar.curatedCase.coreInsight).trim(),
          lead_magnet_protocol: leadMagnetProtocol,
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
 * 2. Tentukan kategori tema otomatis berputar berdasarkan 3 domain klinis utama.
 * 3. Dr. Mind Scout meriset keluhan klinis & generate naskah 4 babak lengkap + payload lead_magnet_protocol.
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
    const existing = await getCampaignRowByDate(campaignDate, "DAILY_AUTONOMOUS");
    if (existing && !overwrite) {
      return jsonError(`Campaign untuk tanggal ${campaignDate} sudah ada.`, 409, { existingCampaignId: existing.id });
    }

    const persona = await getPersona();
    const requestId = randomUUID();

    // 1. Dr. Mind Scout riset keluhan klinis 3 domain + lead_magnet_protocol
    const scoutData = await researchWithGemini(pillar, campaignDate, body.topic);
    const rawThought = `${scoutData.clinicalComplaint}\n\nCore Insight: ${scoutData.coreInsight}`;

    // 2. Generate naskah 4 babak lengkap (Pattern Interrupt, Somatic, Clinical-AI, Anchor + CTA)
    const { story, info } = await generateFourActStory({
      topic: scoutData.topic,
      rawThought,
      campaignDate,
      persona,
      requestId,
      campaignType: "DAILY_AUTONOMOUS",
      leadMagnetProtocol: scoutData.lead_magnet_protocol,
    });

    if (!story.lead_magnet_protocol) {
      story.lead_magnet_protocol = scoutData.lead_magnet_protocol;
    }

    // 3. Simpan campaign ke Supabase Database sebagai DAILY_AUTONOMOUS
    const campaignId = await saveGeneratedCampaign({
      campaignDate,
      topic: scoutData.topic,
      rawThought: scoutData.clinicalComplaint,
      story,
      info,
      campaignType: "DAILY_AUTONOMOUS",
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
      domain: pillar.domainKey,
      pillar: pillar.category,
      focus: pillar.focus,
      campaignDate,
      campaign,
      lead_magnet_protocol: scoutData.lead_magnet_protocol,
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
