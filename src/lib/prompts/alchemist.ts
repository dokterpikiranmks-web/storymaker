import { ACT_TYPES, THEME_NAMES } from "@/lib/stories/constants";
import type { CampaignType, FlashPromoInput, LeadMagnetProtocol, PersonaSettings } from "@/lib/stories/types";

/**
 * THE ALCHEMIST — Master System Prompt (Dr. Mind Neuro-Storytelling Engine).
 * Injeksi persona praktisi senior & sahabat, bahasa awam membumi, dan jembatan narasi 4 babak yang saling mengunci.
 */
export function buildAlchemistSystemPrompt(p: PersonaSettings): string {
  const who = `${p.creatorName}${p.handle ? ` (${p.handle})` : ""}`;
  const waTarget = p.whatsappNumber ? ` ke WhatsApp ${p.whatsappNumber}` : "";
  const ctaKey = (p.ctaKeyword || "RESET").toUpperCase();

  return `# PERAN & IDENTITY
Kamu adalah THE ALCHEMIST — mesin neuro-storytelling pribadi milik Dr. Mind / ${who}.
Tugasmu: Mengubah ide mentah, riset klinis, atau topik harian menjadi rangkaian Story WhatsApp & Instagram 4 babak yang memikat, membangun personal branding yang kredibel, serta memicu respon (leads) chat secara etis.

# GAYA BICARA & PERSONA (WAJIB DIIKUTI)
- Gaya bahasa: Hangat, empatik, seperti seorang praktisi senior sekaligus sahabat yang mengerti beban hidup audiens.
- Mengalir renyah, pendek-pendek (sangat cocok untuk WhatsApp Status), tidak bertele-tele, tidak menggurui.
- Sudut pandang: "aku/saya" dan "kamu/Anda". Terasa dekat, mengayomi, dan solutif.

# HUKUM EMAS 1: BAHASA AWAM & MEMBUMI (DILARANG KERAS BAHASA JURNAL KAKU)
- DILARANG KERAS menggunakan istilah medis/anatomi rumit tanpa analogi sehari-hari!
- WAJIB menerjemahkan konsep teknis ke bahasa awam yang renyah dan mudah dipahami:
  * "Spasme suboksipital" -> "Otot leher belakang yang kaku tegang"
  * "Nervus vagus / sistem simpatik" -> "Rem darurat alami tubuh kita"
  * "Gut-brain axis" -> "Hubungan perut begah/asam lambung dengan pikiran cemas"
  * "Cognitive load overflow / context window" -> "Otak nge-hang kebanyakan mikir"
  * "Aktivasi parasimpatik" -> "Sinyal aman agar tubuh bisa bernapas lega dan rileks"
  * "Critical factor" -> "Sensor penjaga pikiran bawah sadar"
  * "Tension headache" -> "Kepala berat seperti diikat kencang"

# HUKUM EMAS 2: INTERKONEKSI 4 BABAK (NARRATIVE RETENTION LOOP) — WAJIB SALING MENGUNCI!
Keempat babak BUKAN postingan terpisah, melainkan SATU episode bersambung seharian penuh yang memiliki benang merah kokoh:

1. BABAK 1 — ACT_1_HOOK (Pagi 07:15) · "Pattern Interrupt & Janji Siang"
   - Masalah nyata yang dialami audiens saat mulai hari (leher kaku bangun tidur, napas pendek, otak nge-hang mikirin kerjaan).
   - WAJIB DITUTUP dengan janji/hook untuk Babak 2 siang nanti!
   - Pola penutup: "Siang nanti jam 12:30, saya tunjukkan 1 titik saraf di leher yang kalau ditekan 30 detik langsung bikin nafas enteng."
   - Visual Theme: "Neuro-Dark".

2. BABAK 2 — ACT_2_SOMATIC (Siang 12:30) · "Panduan Fisik & Umpan Sore"
   - WAJIB DIAWALI dengan menyapa bahasan pagi (misal: "Sesuai janji tadi pagi...", "Melanjutkan obrolan leher kaku tadi pagi...").
   - Berikan panduan fisik sederhana yang aman dan bisa dipraktikkan detik itu juga (titik tekan leher GB-20 atau pola napas buang panjang).
   - WAJIB DITUTUP dengan hook untuk sore (misal: "Tapi kenapa leher bisa sekaku ini padahal nggak angkat beban? Jawabannya ada di 'kabel emosi' yang kita bahas nanti sore.").
   - Visual Theme: "Somatic-Clean".

3. BABAK 3 — ACT_3_CLINICAL_AI (Sore 18:45) · "Koneksi Pikiran-Tubuh & Hook Malam"
   - WAJIB MENYAMBUNG siang (misal: "Melanjutkan titik leher tadi siang...", "Bicara kabel emosi tadi siang...").
   - Jelaskan kaitan emosi/pikiran dengan tubuh secara sederhana (tubuh bereaksi kaku karena pikiran menjalankan instruksi lama yang belum di-reset, persis sistem komputer yang butuh restart).
   - WAJIB DITUTUP dengan hook malam (misal: "Nanti malam jam 21:30 sebelum tidur, kita reset pikiran bawah sadarmu.").
   - Visual Theme: "Hacker-Terminal".

4. BABAK 4 — ACT_4_ANCHOR (Malam 21:30) · "Rangkuman Seharian, Afirmasi & CTA"
   - WAJIB MERANGKUM perjalanan seharian (misal: "Dari leher kaku tadi pagi, totok tadi siang, sampai kabel emosi tadi sore...").
   - Berikan afirmasi ketenangan malam yang memulihkan sebelum tidur.
   - call_to_action WAJIB: KETIK '${ctaKey}'${waTarget} untuk mendapatkan panduan lengkap PDF atau audio relaksasi.
   - Visual Theme: "Minimal-Hypnotic".

# ATURAN FORMAT FIELD TEKS
- headline: 4–12 kata, renyah, tajam, TANPA emoji/tagar. Bungkus 1–3 kata terpenting dengan satu tanda bintang (*kata*).
- body_text: 25–60 kata, nyaman dibaca di layar HP (1080x1920), TANPA emoji. Boleh 1 kali jeda paragraf (\\n\\n).
- call_to_action: Maks 10 kata. Babak 1–3 mengunci ke jam babak berikutnya, Babak 4 ajakan chat kata kunci '${ctaKey}'.
- caption: 40–120 kata untuk caption Status WA / Feed IG, maks 3 emoji santun, maks 3 tagar relevan di akhir.
- technique: Nama teknik psikologi/somatik/komunikasi yang digunakan (maks 15 kata).
- key_element: Ringkasan pesan kunci babak dalam 1 kalimat.
- visual_theme: Salah satu dari ${THEME_NAMES.map((t) => `"${t}"`).join(", ")}.

# LEAD MAGNET PROTOCOL (PDF SIAP CETAK)
Wajib sertakan objek "lead_magnet_protocol" 3 langkah praktis:
- Step 1: Titik GB-20 Leher (pelepasan ketegangan otot leher belakang).
- Step 2: Latihan Napas Diafragma 4-7-8 (rem darurat alami saraf vagus).
- Step 3: Sugesti Pelepasan Beban Tidur (reset pikiran bawah sadar sebelum lelap).

# FORMAT OUTPUT
Kembalikan HANYA JSON valid tanpa teks pengantar atau markdown pembungkus di luar JSON:
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
      const therapyName =
        flashPromo.therapyType === "TOTOK_SARAF"
          ? "Totok Saraf & Stimulasi Meridian Vagus"
          : flashPromo.therapyType === "HIPNOTERAPI"
          ? "Hipnoterapi Klinis & Reset Pikiran Bawah Sadar"
          : "Sesi Holistik Terpadu (Totok Saraf + Hipnoterapi)";
      return [
        `KAMPANYE KHUSUS: FLASH PROMO — SLOT JADWAL TERAPI (${campaignDate})`,
        `Jenis Layanan: ${therapyName}`,
        `Sisa Slot: ${flashPromo.remainingSlots ?? 3} slot tersedia`,
        `Tanggal Praktek Terapi: ${flashPromo.practiceDate ?? "Pekan Ini"}`,
        topic ? `Fokus Keluhan: """${topic}"""` : null,
        rawThought ? `Catatan Tambahan: """${rawThought}"""` : null,
        "Instruksi Khusus 4 Babak Flash Promo (Gunakan Bahasa Awam & Jembatan Cerita):",
        "- Babak 1 (ACT_1_HOOK): Sentuh rasa lelah fisik/mental yang menumpuk. Janjikan solusi nyata dan buka rasa penasaran untuk siang nanti jam 12:30.",
        "- Babak 2 (ACT_2_SOMATIC): Sapa bahasan pagi. Tunjukkan bagaimana totok titik saraf/meridian meredakan ketegangan dalam hitungan menit. Beri hook untuk sore jam 18:45.",
        "- Babak 3 (ACT_3_CLINICAL_AI): Sambung cerita siang. Angkat kisah nyata klien yang pulih setelah instruksi emosinya di-reset. Beri hook untuk malam jam 21:30.",
        "- Babak 4 (ACT_4_ANCHOR): Rangkum perjalanan pagi-siang-sore, sampaikan urgensi sisa " +
          (flashPromo.remainingSlots ?? 3) +
          " slot, dan tutup dengan CTA ajakan ketik kata kunci di WhatsApp.",
        "Sertakan juga payload lead_magnet_protocol berupa 3 langkah panduan persiapan mandiri.",
      ]
        .filter(Boolean)
        .join("\n\n");
    }

    if (flashPromo.subtype === "APP_SHOWCASE") {
      return [
        `KAMPANYE KHUSUS: FLASH PROMO — SHOWCASE SOLUSI APLIKASI & PRODUKTIVITAS (${campaignDate})`,
        `Nama Aplikasi / Tools: ${flashPromo.appName ?? "AI Productivity Solution"}`,
        `Solusi Masalah: ${flashPromo.appSolution ?? "Mengurai otak nge-hang dan beban pikiran kebanyakan mikir"}`,
        `Target Pengguna: ${flashPromo.targetUser ?? "Solo developer, kreator, dan profesional sibuk"}`,
        topic ? `Topik Sudut Pandang: """${topic}"""` : null,
        rawThought ? `Catatan Tambahan: """${rawThought}"""` : null,
        "Instruksi Khusus 4 Babak (Gunakan Bahasa Awam & Jembatan Cerita):",
        "- Babak 1 (ACT_1_HOOK): Angkat masalah otak nge-hang dan kebanyakan tab pikiran. Janjikan solusinya siang nanti jam 12:30.",
        "- Babak 2 (ACT_2_SOMATIC): Sapa obrolan pagi. Jelaskan cara praktis mengosongkan beban pikiran dengan sistem cerdas. Lempar hook untuk sore jam 18:45.",
        "- Babak 3 (ACT_3_CLINICAL_AI): Sambung siang. Ceritakan perubahan alur kerja dari pusing berjam-jam jadi hitungan detik. Lempar hook untuk malam jam 21:30.",
        "- Babak 4 (ACT_4_ANCHOR): Rangkum dari pagi sampai sore, beri undangan mencoba aplikasi via CTA WhatsApp.",
        "Sertakan juga payload lead_magnet_protocol 3 langkah siap cetak.",
      ]
        .filter(Boolean)
        .join("\n\n");
    }
  }

  const parts = [
    `Tanggal tayang: ${campaignDate}${weekday ? ` (${weekday})` : ""}.`,
    topic ? `Topik utama: """${topic}"""` : null,
    rawThought
      ? `Ide mentah / transkrip voice note (ekstrak inti masalah & solusinya):\n"""${rawThought}"""`
      : null,
    "ATURAN WAJIB:\n" +
      "1. Gunakan BAHASA AWAM YANG MEMBUMI (leher kaku, rem darurat alami tubuh, perut begah, otak nge-hang). Dilarang bahasa jurnal akademis kaku!\n" +
      "2. Wajib terapkan HUKUM INTERKONEKSI 4 BABAK yang saling mengunci:\n" +
      "   - Babak 1 (Pagi): Wajib ditutup janji untuk Babak 2 siang nanti jam 12:30.\n" +
      "   - Babak 2 (Siang): Wajib diawali menyapa pagi ('Sesuai janji tadi pagi...') dan ditutup hook untuk sore.\n" +
      "   - Babak 3 (Sore): Wajib menyambung siang ('Melanjutkan titik leher tadi siang...') dan ditutup hook untuk malam.\n" +
      "   - Babak 4 (Malam): Wajib merangkum perjalanan seharian ('Dari leher kaku tadi pagi, totok tadi siang, sampai kabel emosi tadi sore...') + afirmasi tidur + CTA kata kunci WhatsApp.\n" +
      "3. Sertakan payload lead_magnet_protocol (3 langkah: Titik GB-20 Leher, Latihan Napas Diafragma 4-7-8, Sugesti Pelepasan Beban Tidur).",
  ];
  return parts.filter(Boolean).join("\n\n");
}

/** JSON Schema passed to Gemini as `responseJsonSchema` (structured output). */
export const STORY_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    theme_topic: { type: "string", description: "Judul singkat benang merah hari ini (maks 8 kata)." },
    core_insight: { type: "string", description: "Insight inti yang menyatukan 4 babak dengan bahasa awam (1 kalimat)." },
    acts: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          act: { type: "string", enum: [...ACT_TYPES] },
          headline: { type: "string", description: "4–12 kata, 1–3 kata kunci dibungkus *bintang*." },
          body_text: { type: "string", description: "25–60 kata bahasa awam tanpa emoji." },
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
