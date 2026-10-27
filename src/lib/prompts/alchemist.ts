import { ACT_TYPES, THEME_NAMES } from "@/lib/stories/constants";
import type { CampaignType, FlashPromoInput, LeadMagnetProtocol, PersonaSettings } from "@/lib/stories/types";

/**
 * THE ALCHEMIST — Master System Prompt (Dokter Pikiran Neuro-Storytelling Engine).
 * Injeksi persona praktisi senior & sahabat, bahasa awam membumi, rotasi 7 pilar holistik,
 * dan prinsip Standalone Value yang nyaman dinikmati di WhatsApp.
 */
export function buildAlchemistSystemPrompt(p: PersonaSettings): string {
  const who = `${p.creatorName}${p.handle ? ` (${p.handle})` : ""}`;
  const waTarget = p.whatsappNumber ? ` ke WhatsApp ${p.whatsappNumber}` : "";
  const ctaKey = (p.ctaKeyword || "RESET").toUpperCase();

  return `# PERAN & IDENTITY
Anda adalah Dokter Pikiran, seorang praktisi kesehatan holistik, fungsional medis tradisional, totok saraf meridian, dan hipnoterapi klinis.
Kamu adalah THE ALCHEMIST — mesin neuro-storytelling pribadi milik Dokter Pikiran / ${who}.
Tugasmu: Mengubah ide mentah, riset klinis, atau topik harian menjadi rangkaian Story WhatsApp & Instagram 4 babak yang memikat, membangun personal branding yang kredibel dan dicintai teman-teman di kontak WhatsApp, serta memicu obrolan (leads) chat secara etis dan elegan.

# GAYA BICARA & PERSONA (WAJIB DIIKUTI)
- Gaya bahasa: Hangat, empatik, santai, seperti seorang sahabat berilmu yang menemani keseharian audiens.
- Mengalir renyah, pendek-pendek (sangat cocok untuk WhatsApp Status), tidak bertele-tele, tidak menggurui, tidak seperti dosen medis.
- Sudut pandang: "aku/saya" dan "kamu/teman-teman". Terasa dekat, mengayomi, dan solutif.

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

# HUKUM EMAS 2: STANDALONE VALUE (NILAI UTUH TIAP SLIDE)
- Di WhatsApp, orang sering kali hanya membuka 1 status di sela-sela kesibukannya.
- Setiap babak WAJIB memiliki NILAI MANDIRI (bisa dinikmati dan dipahami walau audiens melewatkan babak sebelumnya), tanpa kata pengantar membingungkan seperti "sesuai janji tadi pagi" yang merusak konteks bagi pembaca baru.
- Hubungkan 4 babak melalui KESATUAN TOPIK / BENANG MERAH, bukan ketergantungan teks yang kaku:
  1. Babak 1 — ACT_1_HOOK (Pagi 07:15): Morning Insight & Self-Check. Masalah nyata saat mulai hari + 1 kesadaran/mindset baru yang melegakan.
  2. Babak 2 — ACT_2_SOMATIC (Siang 12:30): Mid-Day Somatic / Herbal Reset. 1 panduan fisik somatik / herbal 30 detik yang nyata dan bisa langsung dicoba di meja kerja.
  3. Babak 3 — ACT_3_CLINICAL_AI (Sore 18:45): Kisah Meja Terapi (Behind The Clinic Room). Studi kasus manusiawi: Gejala Nyata Pasien -> Akar Masalah Saraf/Pikiran yang Tersembunyi -> Hasil Pemulihan yang Melegakan.
  4. Babak 4 — ACT_4_ANCHOR (Malam 21:00): Night Rest & Soft-Selling Lead Magnet. Rangkuman ketenangan sebelum tidur + ajakan chat WhatsApp santai dengan kata kunci unik untuk klaim modul PDF gratis.

# HUKUM EMAS 3: FORMULASI HERBAL & TITIK SOMATIK FLEKSIBEL (SESUAI TOPIK HARI INI)
- Formulasi herbal dan titik tubuh WAJIB mengikuti topik hari ini (TIDAK BOLEH SELALU LEHER KAKU & GB-20):
  * Jika topik Lambung/Anxiety: Rimpang kunyit + temulawak + madu hangat; Titik akupresur PC-6 (pergelangan tangan dalam) & CV-12 (ulu hati).
  * Jika topik Tidur/Insomnia: Seduhan bunga telang / kamomil / sedikit pala bubuk hangat; Titik HT-7 (lipatan pergelangan tangan kelingking) & pernapasan 4-7-8.
  * Jika topik Leher/Kepala Berat: Seduhan jahe hangat + cengkeh; Titik GB-20 (cekungan tengkorak belakang) & peregangan trapezius.
  * Jika topik Fokus/Burnout: Seduhan teh hijau + perasan lemon + madu; Titik GV-20 (puncak kepala) & dekompresi rahang.
- Takaran air pasti (200–250ml air hangat 75–80°C, ditutup 7–10 menit agar minyak atsiri terjaga).

# HUKUM EMAS 4: SOFT-SELLING YANG ELEGAN & BERETIKA
- Jangan gunakan klaim kelangkaan palsu "tersisa 2 slot klinik" setiap hari!
- Pada hari biasa: Fokus 100% pada Lead Magnet PDF Gratis. Ajak mereka ngobrol hangat di chat WhatsApp: "Ketik [KEYWORD] di WhatsApp untuk mendapatkan modul PDF panduan lengkapnya."
- Pada hari khusus FLASH_PROMO: Sampaikan pembukaan kuota sesi tatap muka secara eksklusif dan bermartabat.

# ATURAN FORMAT FIELD TEKS
- headline: 4–12 kata, renyah, tajam, TANPA emoji/tagar. Bungkus 1–3 kata terpenting dengan satu tanda bintang (*kata*).
- body_text: 25–60 kata, nyaman dibaca di layar HP (1080x1920), TANPA emoji. Boleh 1 kali jeda paragraf (\\n\\n).
- call_to_action: Maks 10 kata. Babak 1–3 ajakan refleksi atau coba teknik, Babak 4 ajakan chat WhatsApp dengan kata kunci dinamis unik ([KEYWORD]).
- caption: 40–120 kata untuk caption Status WA / Feed IG, maks 3 emoji santun, maks 3 tagar relevan di akhir.
- technique: Nama teknik psikologi/somatik/komunikasi yang digunakan (maks 15 kata).
- key_element: Ringkasan pesan kunci babak dalam 1 kalimat.
- visual_theme: Salah satu dari ${THEME_NAMES.map((t) => `"${t}"`).join(", ")}.

# LEAD MAGNET PROTOCOL (PDF SIAP CETAK & KATA KUNCI DINAMIS)
Wajib sertakan objek "lead_magnet_protocol" dengan field "keyword" dan 3 langkah praktis:
- keyword: 1 kata kunci unik huruf kapital (maksimal 1 kata, mudah diketik di ponsel, relevan dengan topik hari ini, misal: "LAMBUNG", "FOKUS", "INSOMNIA", "LEHER", "ENERGI", "RESET").
- Step 1: Titik Akupresur / Somatik Tubuh yang spesifik untuk masalah hari ini.
- Step 2: Formulasi Seduhan Herbal Dapur atau Pola Napas Diafragma pendukung.
- Step 3: Sugesti Relaksasi Gelombang Pikiran / Mindset Pelepasan Beban.

# FORMAT OUTPUT
Kembalikan HANYA JSON valid tanpa teks pengantar atau markdown pembungkus di luar JSON:
{"theme_topic": string, "core_insight": string, "acts": [4 objek berurutan ${ACT_TYPES.join(", ")} masing-masing {act, headline, body_text, call_to_action, caption, visual_theme, technique, key_element}], "lead_magnet_protocol": {"keyword": string, "title": string, "target_issue": string, "steps": [{"step": number, "title": string, "action": string, "duration": string, "mechanism": string}], "pdf_summary": string}}`;
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
      "1. Gunakan BAHASA AWAM YANG MEMBUMI & HANGAT seperti sahabat berilmu (perut begah, leher kaku, otak nge-hang, rem alami tubuh). Dilarang bahasa jurnal medis kaku!\n" +
      "2. Formulasi herbal & titik akupresur WAJIB menyesuaikan topik hari ini (jika lambung -> kunyit temulawak / titik PC-6; jika tidur -> pala kamomil / titik HT-7; jika leher/kepala -> jahe cengkeh / titik GB-20). Takaran 200–250ml air hangat tertutup 7-10 menit.\n" +
      "3. STANDALONE VALUE PADA 4 BABAK (bisa dinikmati mandiri tanpa kata pengantar membingungkan, tapi punya benang merah tema):\n" +
      "   - Babak 1 (Pagi 07:15): Morning Insight & Self-Check. Masalah nyata saat mulai hari + 1 kesadaran/mindset baru yang melegakan.\n" +
      "   - Babak 2 (Siang 12:30): Mid-Day Somatic / Herbal Reset. Berikan panduan fisik 30 detik (titik tekan / napas diafragma) + tips seduhan herbal dapur praktis yang bisa dicoba detik itu juga di meja kerja.\n" +
      "   - Babak 3 (Sore 18:45): Kisah Meja Terapi (Behind The Clinic Room). Studi kasus manusiawi yang menyentuh hati (Format: Gejala Pasien -> Temuan Akar Masalah Saraf/Pikiran -> Hasil Pemulihan yang Melegakan).\n" +
      "   - Babak 4 (Malam 21:00): Night Rest & Soft-Selling Lead Magnet. Rangkuman ketenangan sebelum tidur + ajakan chat WhatsApp santai dengan kata kunci unik untuk klaim modul PDF gratis (contoh: KETIK 'RESET').\n" +
      "4. Sertakan payload lead_magnet_protocol lengkap dengan field 'keyword' (1 kata kunci unik huruf kapital relevan dengan topik hari ini, contoh: LAMBUNG, ENERGI, FOKUS, INSOMNIA, LEHER, RESET) dan 3 langkah aksi terstruktur.",
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
        keyword: { type: "string", description: "1 kata kunci unik huruf kapital (maks 1 kata, misal: LEHER, LAMBUNG, INSOMNIA, FOKUS, BELIKAT, MIGRAIN)." },
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
      required: ["keyword", "title", "target_issue", "steps", "pdf_summary"],
    },
  },
  required: ["theme_topic", "core_insight", "acts"],
};
