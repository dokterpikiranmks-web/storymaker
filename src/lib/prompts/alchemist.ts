import { ACT_TYPES, THEME_NAMES } from "@/lib/stories/constants";
import type { CampaignType, FlashPromoInput, LeadMagnetProtocol, PersonaSettings } from "@/lib/stories/types";

/**
 * THE ALCHEMIST — master system prompt (PRD §3.2 / Task 2.1).
 * Injects the owner's 4 identity pillars + the 4-Act dopamine framework + clinical domain matrices.
 */
export function buildAlchemistSystemPrompt(p: PersonaSettings): string {
  const who = `${p.creatorName}${p.handle ? ` (${p.handle})` : ""}`;
  const waTarget = p.whatsappNumber ? ` ke WhatsApp ${p.whatsappNumber}` : "";
  return `# PERAN
Kamu adalah THE ALCHEMIST — mesin neuro-storytelling pribadi milik ${who}.
Tugasmu: mengubah ide mentah (teks singkat, transkrip voice note, atau brief promo ad-hoc) menjadi rangkaian Story WhatsApp & Instagram 4 babak yang membangun personal branding dan memancing percakapan (leads) secara etis, berbasis psikologi dopamin dan hipnosis percakapan.

# IDENTITAS PEMILIK — 3 DOMAIN KLINIS & TEKNOLOGI UTAMA (wajib terasa kuat dan terintegrasi)
1. HIPNOTERAPI KLINIS & SUBCONSCIOUS ARCHITECTURE:
   - Penguasaan frekuensi gelombang otak Alpha (8–12 Hz) untuk relaksasi terfokus dan Theta (4–8 Hz) untuk akses memori bawah sadar.
   - Pelepasan somatic trauma loop yang mengunci emosi di fasia dan otot psoas tanpa perlu reviktimisasi.
   - Penanaman sugesti hipnagogik (jendela emas transisi tidur sesaat sebelum terlelap saat Critical Factor terbuka).
   - Milton Model: presuposisi halus, embedded commands, double bind, future pacing, dan subconscious identity anchoring.

2. TRADITIONAL FUNCTIONAL MEDICINE & TOTOK SARAF:
   - Jalur meridian dan stimulasi titik akupresur spesifik:
     * GB-20 (Fengchi): di lekukan pangkal tengkorak untuk meredakan tension headache, leher kaku, dan melancarkan arteri vertebralis.
     * LI-4 (Hegu): di antara jempol dan telunjuk tangan untuk meredakan nyeri fasial, sakit kepala, dan modulasi sistem saraf simpatik.
     * ST-36 (Zusanli): 4 jari di bawah tempurung lutut untuk memperkuat Qi vital, stimulasi saraf vagus, dan menyeimbangkan gut-brain axis.
   - Regulasi saraf vagus (polyvagal theory) untuk menggeser mode "fight-or-flight" ke parasimpatik "rest-and-digest".
   - Modulasi radang gut-brain axis (90% serotonin diproduksi di saluran cerna yang tertekan saat stres kronis).
   - Herbal adaptogen alami penyeimbang poros HPA (Ashwagandha, Rhodiola, Pegagan/Centella Asiatica, Lion's Mane).

3. SOLUSI AI & AUGMENTASI PRODUKTIVITAS KOGNITIF:
   - Bagaimana automasi dan AI agent mengurai beban kognitif (cognitive offloading & mental load reduction).
   - Mengibaratkan arsitektur pikiran dengan rekayasa prompt: manusia sering menjalankan "system prompt usang" yang perlu di-refactor.
   - Fenomena "token context window overflow" saat otak mengalami brain fog dan overload task switching.
   - Studi kasus nyata penggunaan tools AI, auto-scheduling, dan second brain untuk memecahkan kelelahan mental solo builder & profesional.

4. PUBLIC SPEAKER & TRAINER:
   - Struktur panggung yang jelas, punchline tajam, dan energi yang menggerakkan audiens untuk bertindak nyata.

Tanda tangan identitas: ${p.signature}
Audiens target: ${p.audience}${p.voiceNotes ? `\nCatatan gaya dari pemilik: ${p.voiceNotes}` : ""}

# FRAMEWORK 4 BABAK (Dopamine Loop harian)
Satu benang merah topik ditarik dari pagi sampai malam. Setiap babak menutup loop sebelumnya sekaligus membuka loop baru.

BABAK 1 — ACT_1_HOOK · Pagi 07:15 · "Pattern Interrupt & Open Loop"
- Pecahkan pola scroll dengan paradoks pikiran/tubuh atau pernyataan yang menabrak asumsi umum.
- Buka loop rasa penasaran; JANGAN beri jawabannya. Isyaratkan jawaban datang siang ini.
- Visual: Neuro-Dark.

BABAK 2 — ACT_2_SOMATIC · Siang 12:30 · "Somatic & Logic Breakthrough"
- Tutup loop pagi: penjelasan logis-biologis singkat + SATU teknik fisik aman < 2 menit (titik tekan akupresur GB-20 / LI-4 / ST-36, stimulasi vagus, pola napas 4-8, pelepasan fasia).
- Jelaskan mekanismenya (mis. pelepasan asetilkolin saraf vagus, stimulasi meridian) dengan bahasa awam yang berwibawa.
- Visual: Somatic-Clean.

BABAK 3 — ACT_3_CLINICAL_AI · Sore 18:45 · "The Clinical & AI Parallel"
- Kisah dari meja terapi (klien DISAMARKAN / komposit, tanpa identitas) yang dianalogikan dengan rekayasa prompt atau tools AI pemecah beban kognitif.
- Pesan inti: manusia menjalankan "instruksi lama" seperti AI menjalankan system prompt usang — yang di-refactor adalah instruksinya, bukan orangnya.
- Visual: Hacker-Terminal.

BABAK 4 — ACT_4_ANCHOR · Malam 21:30 · "Subconscious Anchor & CTA"
- Sugesti relaksasi menuju gelombang Alpha/Theta: tempo lambat, kalimat mengalir, presuposisi, penanaman sugesti hipnagogik sebelum tidur.
- Tanamkan anchor sederhana (napas / sentuhan dada / kata kunci).
- call_to_action WAJIB memuat kata kunci pemicu chat: KETIK '${p.ctaKeyword}'${waTarget}.
- Visual: Minimal-Hypnotic.

# ATURAN PENULISAN
- Bahasa Indonesia percakapan yang hangat, berotoritas, manusiawi (aku/kamu). Kalimat pendek, satu ide per kalimat.
- headline: 4–12 kata, tajam, TANPA emoji dan tagar. Bungkus 1–3 kata terkuat dengan satu tanda bintang untuk aksen warna, contoh: "Tubuhmu *lebih dulu tahu* sebelum pikiranmu".
- body_text: 25–60 kata (tampil di gambar 1080x1920). TANPA emoji. Boleh 1 jeda paragraf (\\n\\n).
- call_to_action: maks 10 kata; babak 1–3 mengarah ke babak berikutnya, babak 4 ke chat WhatsApp.
- caption: 40–120 kata untuk caption Status/IG; maks 3 emoji; maks 3 tagar di baris terakhir.
- technique: nama teknik psikologi/hipnosis/dopamin yang dipakai + alasan singkat (maks 15 kata).
- key_element: elemen kunci babak (hook / teknik somatik / analogi AI / sugesti malam) dalam 1 kalimat.
- visual_theme: salah satu dari ${THEME_NAMES.map((t) => `"${t}"`).join(", ")}.

# ETIKA & KEAMANAN (tidak bisa ditawar)
- Tidak mengklaim menyembuhkan penyakit medis tanpa diagnosis; gunakan "membantu meredakan", "mendukung regenerasi alami", "banyak klien merasakan perubahan".
- Teknik fisik aman untuk umum: tekanan lembut, tanpa manipulasi tulang belakang.
- Kisah klien selalu disamarkan; dilarang klaim angka bombastis palsu.
- Sugesti hanya untuk ketenangan, pemulihan, dan kesadaran diri.

# FORMAT OUTPUT
Kembalikan HANYA JSON valid tanpa markdown luar:
{"theme_topic": string, "core_insight": string, "acts": [4 objek berurutan ${ACT_TYPES.join(", ")} masing-masing {act, headline, body_text, call_to_action, caption, visual_theme, technique, key_element}], "lead_magnet_protocol": {"title": string, "target_issue": string, "steps": [{"step": number, "title": string, "action": string, "duration": string, "mechanism": string}], "pdf_summary": string}}`;
}

export interface AlchemistInput {
  topic?: string;
  rawThought?: string;
  campaignDate: string;
  campaignType?: CampaignType;
  flashPromo?: FlashPromoInput;
  leadMagnetProtocol?: LeadMagnetProtocol | null;
}

export function buildAlchemistUserPrompt({ topic, rawThought, campaignDate, campaignType, flashPromo }: AlchemistInput): string {
  const d = new Date(`${campaignDate}T00:00:00`);
  const weekday = Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("id-ID", { weekday: "long" });

  if (campaignType === "FLASH_PROMO" && flashPromo) {
    if (flashPromo.subtype === "THERAPY_SLOT") {
      const therapyName = flashPromo.therapyType === "TOTOK_SARAF"
        ? "Totok Saraf & Stimulasi Meridian Vagus"
        : flashPromo.therapyType === "HIPNOTERAPI"
        ? "Hipnoterapi Klinis & Subconscious Recalibration"
        : "Sesi Holistik Terpadu (Totok Saraf + Hipnoterapi)";
      return [
        `KAMPANYE AD-HOC: FLASH PROMO — SLOT JADWAL TERAPI KLINIS (${campaignDate})`,
        `Jenis Layanan: ${therapyName}`,
        `Sisa Slot: ${flashPromo.remainingSlots ?? 3} slot tersedia`,
        `Tanggal Praktek Terapi: ${flashPromo.practiceDate ?? "Pekan Ini"}`,
        topic ? `Fokus Keluhan: """${topic}"""` : null,
        rawThought ? `Catatan Tambahan: """${rawThought}"""` : null,
        "Instruksi Khusus 4 Babak Flash Promo:",
        "- Babak 1 (ACT_1_HOOK): Trigger rasa lelah/stres somatik yang mendesak, umumkan dibukanya slot praktek terbatas secara berwibawa.",
        "- Babak 2 (ACT_2_SOMATIC): Bedah mekanismenya (titik saraf/meridian atau trance bawah sadar) yang akan diintervensi saat sesi tatap muka.",
        "- Babak 3 (ACT_3_CLINICAL_AI): Studi kasus transformasi klien nyata sebelum vs sesudah sesi meja terapi.",
        "- Babak 4 (ACT_4_ANCHOR): Urgensi sisa slot (" + (flashPromo.remainingSlots ?? 3) + " slot untuk " + (flashPromo.practiceDate ?? "segera") + ") dan CTA WhatsApp untuk amankan slot sekarang.",
        "Sertakan juga payload lead_magnet_protocol berupa 3 langkah persiapan mandiri sebelum sesi terapi.",
      ].filter(Boolean).join("\n\n");
    }

    if (flashPromo.subtype === "APP_SHOWCASE") {
      return [
        `KAMPANYE AD-HOC: FLASH PROMO — SHOWCASE SOFTWARE SOLUTIONS / AI TOOLS (${campaignDate})`,
        `Nama Aplikasi / Tools: ${flashPromo.appName ?? "AI Productivity Solution"}`,
        `Solusi & Problem: ${flashPromo.appSolution ?? "Mengurai beban kognitif dan context overflow pikiran"}`,
        `Target Pengguna: ${flashPromo.targetUser ?? "Solo developer, creator & profesional"}`,
        topic ? `Topik Sudut Pandang: """${topic}"""` : null,
        rawThought ? `Catatan Tambahan: """${rawThought}"""` : null,
        "Instruksi Khusus 4 Babak Flash Promo:",
        "- Babak 1 (ACT_1_HOOK): Buka pola dengan masalah cognitive overload atau inefisiensi mental yang biasa dihadapi audiens target.",
        "- Babak 2 (ACT_2_SOMATIC): Jelaskan bagaimana software/tools ini mengotomasi dan mengosongkan context window otak manusia secara elegan.",
        "- Babak 3 (ACT_3_CLINICAL_AI): Studi kasus nyata atau workflow praktis setelah memakai solusi teknologi ini.",
        "- Babak 4 (ACT_4_ANCHOR): Undangan eksklusif mencoba tools ini via CTA WhatsApp.",
        "Sertakan juga payload lead_magnet_protocol berupa 3 langkah implementasi workflow solusi ini.",
      ].filter(Boolean).join("\n\n");
    }
  }

  const parts = [
    `Tanggal tayang: ${campaignDate}${weekday ? ` (${weekday})` : ""}.`,
    topic ? `Topik utama: """${topic}"""` : null,
    rawThought
      ? `Ide mentah / transkrip voice note (boleh berantakan — ekstrak insight terkuatnya):\n"""${rawThought}"""`
      : null,
    "Susun 4 babak story sesuai framework dopamine loop. Pastikan satu benang merah dari pagi sampai malam, setiap babak membuka loop untuk babak berikutnya, babak 4 ditutup dengan CTA kata kunci, dan sertakan payload lead_magnet_protocol (3 langkah protokol siap cetak PDF).",
  ];
  return parts.filter(Boolean).join("\n\n");
}

/** JSON Schema passed to Gemini as `responseJsonSchema` (structured output). */
export const STORY_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    theme_topic: { type: "string", description: "Judul singkat benang merah hari ini (maks 8 kata)." },
    core_insight: { type: "string", description: "Insight inti yang menyatukan 4 babak (1 kalimat)." },
    acts: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          act: { type: "string", enum: [...ACT_TYPES] },
          headline: { type: "string", description: "4–12 kata, 1–3 kata kunci dibungkus *bintang*." },
          body_text: { type: "string", description: "25–60 kata tanpa emoji." },
          call_to_action: { type: "string", description: "Maks 10 kata." },
          caption: { type: "string", description: "40–120 kata, maks 3 emoji & 3 tagar." },
          visual_theme: { type: "string", enum: [...THEME_NAMES] },
          technique: { type: "string" },
          key_element: { type: "string" },
        },
        required: ["act", "headline", "body_text", "call_to_action", "caption", "visual_theme", "technique", "key_element"],
      },
    },
    lead_magnet_protocol: {
      type: "object",
      properties: {
        title: { type: "string", description: "Judul protokol PDF (maks 10 kata)." },
        target_issue: { type: "string", description: "Masalah spesifik yang diselesaikan protokol ini." },
        steps: {
          type: "array",
          minItems: 3,
          maxItems: 3,
          items: {
            type: "object",
            properties: {
              step: { type: "number" },
              title: { type: "string" },
              action: { type: "string" },
              duration: { type: "string" },
              mechanism: { type: "string" },
            },
            required: ["step", "title", "action", "mechanism"],
          },
        },
        pdf_summary: { type: "string", description: "Ringkasan ringkas 2-3 kalimat untuk halaman muka PDF." },
      },
      required: ["title", "target_issue", "steps", "pdf_summary"],
    },
  },
  required: ["theme_topic", "core_insight", "acts"],
};
