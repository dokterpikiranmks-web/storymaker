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
 * - Senin & Kamis : Domain A — Totok Saraf & Stimulasi Titik Leher (GB-20) & Rem Alami Tubuh
 * - Selasa & Jumat: Domain B — Hipnoterapi Klinis & Ketenangan Bawah Sadar Menjelang Tidur
 * - Rabu & Sabtu  : Domain C — Solusi AI & Mengurai Otak Nge-hang Kebanyakan Mikir
 * - Minggu        : Deep Rest — Melepaskan Beban Tubuh & Pikiran Sepekan
 */
function getPillarForDate(date: Date, tz: string): RotatingPillar {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long" });
  const weekday = formatter.format(date).toLowerCase();

  switch (weekday) {
    case "monday":
    case "thursday":
      return {
        domainKey: "DOMAIN_A_TOTOK_SARAF",
        category: "Totok Saraf & Rem Darurat Alami Tubuh",
        pillar: "Pelepasan Otot Leher Kaku (Titik GB-20) & Hubungan Perut Begah dengan Pikiran Cemas",
        focus:
          "Meredakan otot leher belakang yang kaku tegang, mengatasi sakit kepala berat seperti diikat, mengaktifkan rem darurat alami tubuh (saraf vagus), dan menenangkan asam lambung/perut begah saat banyak pikiran.",
        clinicalKnowledge:
          "Saat stres dan dikejar beban kerjaan, otot leher belakang kita mengunci kencang dan rem darurat alami tubuh (saraf vagus) mati. Akibatnya, kepala terasa berat dan perut ikut begah. Menekan lembut cekungan di pangkal leher (titik GB-20) dan menghela napas panjang mengirim sinyal aman langsung ke tubuh, membuat nafas kembali enteng dan otot lemas seketika.",
        curatedCase: {
          topic: "Otot Leher Kaku & Perut Begah: Rahasia Titik Leher GB-20 dan Rem Darurat Alami Tubuh",
          clinicalComplaint:
            "Klien datang dengan keluhan pundak seperti memikul beban berat, otot leher belakang kaku mengunci, dan perut sering begah atau kembung saat pekerjaan menumpuk. Tubuhnya terkunci di mode siaga sehingga pencernaan terganggu dan kepala terasa berat.",
          coreInsight:
            "Tubuh kita tidak bisa membedakan antara kejaran deadline pekerjaan dengan bahaya sungguhan. Menekan titik GB-20 di cekungan leher belakang dan bernapas panjang langsung mengaktifkan rem darurat alami tubuh kita, memberi tahu tubuh bahwa segalanya aman.",
          lead_magnet_protocol: {
            title: "Panduan Saku Reset Somatik & Saraf Vagus 3 Menit",
            target_issue: "Otot leher kaku, kepala berat akibat layar, dan perut begah saat cemas",
            steps: [
              {
                step: 1,
                title: "Titik GB-20 Leher: Pelepasan Ketegangan Suboksipital",
                action:
                  "Letakkan kedua jempol di cekungan pangkal tengkorak belakang leher. Berikan tekanan lembut mengarah ke atas selama 60 detik sambil memejamkan mata dan bernapas santai.",
                duration: "60 detik",
                mechanism:
                  "Mengendurkan otot leher belakang yang kaku tegang, melancarkan aliran darah ke otak, dan mematikan alarm siaga tubuh.",
              },
              {
                step: 2,
                title: "Latihan Napas Diafragma 4-7-8: Rem Darurat Saraf Vagus",
                action:
                  "Tarik napas lembut lewat hidung 4 detik, tahan santai 7 detik, lalu hembuskan perlahan lewat mulut seperti meniup lilin selama 8 detik. Ulangi 4 hingga 5 siklus.",
                duration: "60 detik",
                mechanism:
                  "Hembusan napas yang panjang merangsang rem alami tubuh untuk menurunkan denyut jantung dan memicu rasa rileks seketika.",
              },
              {
                step: 3,
                title: "Sugesti Pelepasan Beban Tidur: Reset Pikiran Bawah Sadar",
                action:
                  "Letakkan telapak tangan kanan di tengah dada. Rasakan kehangatan napasmu, turunkan bahu santai, dan katakan dalam hati: 'Hari ini sudah selesai, tubuhku aman untuk beristirahat.'",
                duration: "60 detik",
                mechanism:
                  "Menanamkan rasa aman di pikiran bawah sadar dan memindahkan gelombang otak ke status tenang untuk istirahat optimal.",
              },
            ],
            pdf_summary:
              "Protokol 3 langkah mandiri untuk meredakan ketegangan leher, mengaktifkan rem darurat alami tubuh, dan menenangkan perut begah dalam 3 menit.",
          },
        },
      };

    case "tuesday":
    case "friday":
      return {
        domainKey: "DOMAIN_B_HIPNOTERAPI",
        category: "Hipnoterapi Klinis & Ketenangan Bawah Sadar",
        pillar: "Melepaskan Beban Pikiran Menjelang Tidur & Pemrograman Ulang Ketenangan",
        focus:
          "Memutus kebiasaan overthinking malam hari, meredakan dada berdebar cemas saat terbangun malam, dan menanamkan sugesti ketenangan sebelum tidur.",
        clinicalKnowledge:
          "Pikiran sadar kita sering kali lelah mendebat kecemasan di kepala. Saat tubuh rileks dan mata mulai mengantuk, sensor kritis pikiran kita melunak. Di momen transisi inilah sugesti ketenangan bisa masuk langsung ke pikiran bawah sadar tanpa bantahan.",
        curatedCase: {
          topic: "Melepaskan Beban Pikiran Jam 11 Malam & Ketenangan Menjelang Tidur",
          clinicalComplaint:
            "Klien selalu terjaga jam 11 malam dihantui skenario terburuk proyek esok hari dan terbangun dengan dada berdebar cemas jam 3 pagi. Pikiran sadarnya tahu semuanya aman, tetapi pikiran bawah sadarnya masih menjalankan instruksi lama: 'jangan rileks dulu, nanti ada masalah'.",
          coreInsight:
            "Mendebat pikiran cemas saat mau tidur hanya bikin semakin terjaga. Kuncinya adalah menenangkan fisik terlebih dahulu lewat titik leher dan napas lambat, lalu memberi izin pada pikiran bawah sadar bahwa hari ini sudah tuntas.",
          lead_magnet_protocol: {
            title: "Panduan Saku Reset Somatik & Ketenangan Tidur 3 Menit",
            target_issue: "Overthinking malam hari, susah tidur, dan rasa cemas berlebih",
            steps: [
              {
                step: 1,
                title: "Titik GB-20 Leher: Pelepasan Ketegangan Suboksipital",
                action:
                  "Rebahkan kepala, letakkan kedua jempol di cekungan pangkal tengkorak belakang leher. Berikan tekanan lembut mengarah ke atas selama 60 detik sambil bernapas perlahan.",
                duration: "60 detik",
                mechanism:
                  "Mengendurkan otot leher belakang yang kaku tegang dan menghentikan loop sinyal bahaya ke otak.",
              },
              {
                step: 2,
                title: "Latihan Napas Diafragma 4-7-8: Rem Darurat Saraf Vagus",
                action:
                  "Tarik napas lembut lewat hidung 4 detik, tahan santai 7 detik, lalu hembuskan perlahan lewat mulut selama 8 detik. Ulangi 4 kali.",
                duration: "60 detik",
                mechanism:
                  "Mengaktifkan rem darurat alami tubuh untuk menurunkan ritme detak jantung dan menenangkan pikiran yang gelisah.",
              },
              {
                step: 3,
                title: "Sugesti Pelepasan Beban Tidur: Reset Pikiran Bawah Sadar",
                action:
                  "Letakkan telapak tangan kanan di dada. Saat kelopak mata mulai memberat, ucapkan lembut dalam hati: 'Hari ini sudah selesai sempurna. Tubuhku aman beristirahat, pikiranku pulih malam ini.'",
                duration: "60 detik",
                mechanism:
                  "Menanamkan rasa aman di pikiran bawah sadar tepat sebelum terlelap agar tidur nyenyak berkualitas.",
              },
            ],
            pdf_summary:
              "Panduan praktis 3 langkah untuk menuntaskan overthinking malam hari dan memprogram ulang ketenangan pikiran bawah sadar sebelum tidur.",
          },
        },
      };

    case "wednesday":
    case "saturday":
      return {
        domainKey: "DOMAIN_C_SOLUSI_AI",
        category: "Solusi AI & Mengurai Otak Nge-hang",
        pillar: "Bongkar Beban Pikiran Kebanyakan Mikir & Reset Instruksi Lama",
        focus:
          "Bagaimana automasi dan teknologi AI mengosongkan beban pikiran yang menumpuk, analogi otak manusia seperti sistem komputer yang butuh restart, dan cara cerdas mengembalikan fokus tajam.",
        clinicalKnowledge:
          "Kapasitas memori kerja otak kita sangat terbatas. Ketika kita membuka 30 tab di laptop dan 50 urusan di kepala sekaligus, otak mengalami gejala 'nge-hang'. Memindahkan isi kepala ke catatan luar dan merestart instruksi lama adalah cara biologis mengembalikan energi mental.",
        curatedCase: {
          topic: "Otak Nge-hang Kebanyakan Mikir: Saat Kapasitas Pikiran Perlu Di-Reset",
          clinicalComplaint:
            "Klien merasa otaknya seperti komputer nge-hang setelah membuka puluhan tab kerjaan dan pesan chat tanpa henti. Dia merasa bersalah dan mengira dirinya lambat, padahal otaknya hanya kelebihan beban informasi yang belum dibongkar.",
          coreInsight:
            "Pikiran kita seperti sistem yang menjalankan instruksi lama. Saat beban kerjaan berlebih, kita perlu me-reset instruksinya, memindahkan catatan ke luar kepala, dan mengistirahatkan saraf leher agar kepala kembali enteng.",
          lead_magnet_protocol: {
            title: "Panduan Saku Reset Somatik & Kognitif 3 Menit",
            target_issue: "Otak nge-hang, kepala berat kebanyakan mikir, dan kelelahan mental",
            steps: [
              {
                step: 1,
                title: "Titik GB-20 Leher: Pelepasan Ketegangan Suboksipital",
                action:
                  "Duduk tegak, letakkan kedua jempol di cekungan pangkal tengkorak belakang leher. Berikan dorongan lembut ke atas selama 60 detik sambil memejamkan mata.",
                duration: "60 detik",
                mechanism:
                  "Mengendurkan otot leher belakang yang kaku tegang akibat menatap layar dan melancarkan aliran darah ke otak.",
              },
              {
                step: 2,
                title: "Latihan Napas Diafragma 4-7-8: Rem Darurat Saraf Vagus",
                action:
                  "Tarik napas lembut lewat hidung 4 detik, tahan 7 detik, lalu hembuskan perlahan lewat mulut selama 8 detik. Ulangi 4 kali.",
                duration: "60 detik",
                mechanism:
                  "Mengaktifkan rem darurat alami tubuh untuk menghentikan kebiasaan panik multitasking dan memulihkan fokus jernih.",
              },
              {
                step: 3,
                title: "Sugesti Pelepasan Beban Tidur: Reset Pikiran Bawah Sadar",
                action:
                  "Sentuh telapak tangan di dada tengah, ambil jeda hening, dan katakan dalam hati: 'Saya melepaskan semua tab yang terbuka di kepala. Satu hal pada satu waktu.'",
                duration: "60 detik",
                mechanism:
                  "Menanamkan fokus mono-tasking di pikiran bawah sadar dan memulihkan kapasitas berpikir optimal.",
              },
            ],
            pdf_summary:
              "Protokol ergonomi pikiran 3 langkah untuk mengosongkan beban kepala yang nge-hang dan memulihkan fokus tajam dalam 3 menit.",
          },
        },
      };

    case "sunday":
    default:
      return {
        domainKey: "DOMAIN_RESET",
        category: "Deep Rest & Pemulihan Menyeluruh",
        pillar: "Melepaskan Ketegangan Tubuh & Pikiran Menjelang Pekan Baru",
        focus:
          "Integrasi totok titik leher, pelepasan beban cemas menghadapi hari Senin (Sunday Scaries), dan istirahat berkualitas untuk memulihkan energi.",
        clinicalKnowledge:
          "Istirahat sejati bukan sekadar rebahan pasif sambil terus menatap layar HP, melainkan mengizinkan tubuh melepaskan leher yang kaku dan memberi tahu pikiran bawah sadar bahwa hari ini adalah waktu pemulihan penuh.",
        curatedCase: {
          topic: "Ketenangan Utuh: Menuntaskan Lelah Fisik dan Pikiran Menjelang Pekan Baru",
          clinicalComplaint:
            "Klien merasa libur akhir pekan tidak terasa karena pikiran tetap tegang memikirkan hari Senin. Tubuh tidak pernah benar-benar masuk mode istirahat mendalam dan bangun dengan leher kaku.",
          coreInsight:
            "Istirahat sejati bukan pasif di depan layar HP, melainkan mengizinkan tubuh melepaskan leher yang kaku dan memberi tahu pikiran bawah sadar bahwa hari ini adalah waktu pemulihan penuh.",
          lead_magnet_protocol: {
            title: "Panduan Saku Reset Somatik Akhir Pekan 3 Menit",
            target_issue: "Kelelahan fisik sepekan dan cemas menghadapi hari Senin",
            steps: [
              {
                step: 1,
                title: "Titik GB-20 Leher: Pelepasan Ketegangan Suboksipital",
                action:
                  "Berbaring santai, letakkan kedua jempol di cekungan pangkal tengkorak belakang leher. Berikan tekanan lembut mengarah ke atas selama 60 detik sambil bernapas perlahan.",
                duration: "60 detik",
                mechanism:
                  "Mengendurkan otot leher belakang yang kaku tegang dan menguras ketegangan fisik sisa sepekan.",
              },
              {
                step: 2,
                title: "Latihan Napas Diafragma 4-7-8: Rem Darurat Saraf Vagus",
                action:
                  "Tarik napas lembut lewat hidung 4 detik, tahan santai 7 detik, lalu hembuskan perlahan lewat mulut selama 8 detik. Ulangi 4 kali.",
                duration: "60 detik",
                mechanism:
                  "Mengaktifkan rem darurat alami tubuh untuk menurunkan hormon stres dan mengizinkan tubuh beristirahat penuh.",
              },
              {
                step: 3,
                title: "Sugesti Pelepasan Beban Tidur: Reset Pikiran Bawah Sadar",
                action:
                  "Letakkan telapak tangan di dada. Rasakan kehangatannya dan ucapkan dalam hati: 'Pekan lalu sudah tuntas. Tubuhku berhak istirahat, besok aku menyambut hari baru dengan tenang.'",
                duration: "60 detik",
                mechanism:
                  "Mengunci ketenangan di pikiran bawah sadar agar tidur lelap dan bangun dalam kondisi segar bertenaga.",
              },
            ],
            pdf_summary:
              "Protokol pemulihan mingguan 3 langkah untuk menguras kelelahan fisik sepekan dan mengisi ulang baterai pikiran menyambut hari baru.",
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

  const prompt = `Kamu adalah "Dr. Mind Scout", partner riset klinis dan sahabat pemulihan untuk Dr. Mind / Sang Alchemist (Hipnoterapis Klinis, Praktisi Totok Saraf, dan Solo AI Developer).
Tugasmu: Merumuskan 1 studi kasus keluhan harian yang sangat nyata dan membumi untuk tanggal ${campaignDate}, lengkap dengan protokol lead magnet 3 langkah yang siap di-render menjadi PDF.

# ATURAN EMAS BAHASA & PERSONA (WAJIB DIIKUTI):
- DILARANG KERAS menggunakan istilah medis/anatomi rumit tanpa analogi sehari-hari!
- WAJIB menerjemahkan konsep teknis ke bahasa awam yang renyah dan membumi:
  * "Spasme suboksipital" -> "Otot leher belakang yang kaku tegang"
  * "Nervus vagus / sistem simpatik" -> "Rem darurat alami tubuh kita"
  * "Gut-brain axis" -> "Hubungan perut begah/asam lambung dengan pikiran cemas"
  * "Cognitive load overflow" -> "Otak nge-hang kebanyakan mikir"
  * "Aktivasi parasimpatik" -> "Sinyal aman agar tubuh bisa bernapas lega dan rileks"
- Gaya bahasa: Hangat, empatik, seperti seorang praktisi senior sekaligus sahabat yang mengerti beban hidup audiens. Mengalir renyah, pendek-pendek (cocok untuk WhatsApp Status), tidak bertele-tele.

Matriks Inspirasi Hari Ini:
- Domain Utama: ${pillar.category}
- Fokus Bahasan: ${pillar.pillar}
- Intisari Solusi: ${pillar.focus}
${customTopic ? `- Topik Arahan Khusus: "${customTopic}"` : ""}

Kriteria Wajib Output:
1. "topic": Topik/judul memikat dalam bahasa awam tentang hubungan tubuh-pikiran (maks 12 kata, tanpa emoji/hashtag).
2. "clinicalComplaint": Narasi curhat keluhan nyata klien di meja terapi yang emosional dan manusiawi (misal leher kaku, perut begah, otak nge-hang kebanyakan mikir).
3. "coreInsight": Wawasan pencerahan yang menghubungkan rem darurat tubuh (saraf vagus), totok leher, dan reset instruksi lama di pikiran bawah sadar.
4. "lead_magnet_protocol": Protokol 3 langkah resmi siap cetak PDF:
   - "title": Judul panduan (misal: "Panduan Saku Reset Somatik & Saraf Vagus").
   - "target_issue": Masalah spesifik yang diatasi.
   - "steps": Array persis 3 objek langkah terstruktur:
       { "step": 1, "title": "Titik GB-20 Leher: Pelepasan Ketegangan Suboksipital", "action": "instruksi tekan titik leher belakang", "duration": "60 detik", "mechanism": "mengendurkan otot leher kaku & melancarkan aliran darah ke kepala" },
       { "step": 2, "title": "Latihan Napas Diafragma 4-7-8: Rem Darurat Saraf Vagus", "action": "tarik napas 4 detik, tahan 7 detik, hembus perlahan 8 detik", "duration": "60 detik", "mechanism": "mengaktifkan rem alami tubuh menurunkan detak jantung dan rasa cemas" },
       { "step": 3, "title": "Sugesti Pelepasan Beban Tidur: Reset Pikiran Bawah Sadar", "action": "sentuh dada tengah, afirmasi tubuh aman untuk istirahat", "duration": "60 detik", "mechanism": "menanamkan ketenangan di pikiran bawah sadar sebelum lelap" }
   - "pdf_summary": Ringkasan eksekutif 2-3 kalimat yang membumi dan siap dicetak ke halaman depan PDF panduan.

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
