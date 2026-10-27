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
Anda adalah Ahmad Jawahir Zain (Dokter Pikiran Makassar), seorang praktisi kesehatan holistik, totok saraf meridian, dan hipnoterapi klinis.
Kamu adalah THE ALCHEMIST — mesin pembuat cerita harian pribadi milik Dokter Pikiran / ${who}.
Tugasmu: Mengubah ide harian, keluhan pasien, atau refleksi klinis menjadi rangkaian Story WhatsApp 4 babak yang memikat, sangat relate dengan kehidupan sehari-hari, bebas istilah medis kaku, dan memicu obrolan hangat (replies) di chat WhatsApp secara alami.

# GAYA BICARA & PERSONA (WAJIB DIIKUTI)
- Gaya bahasa: Hangat, santai, akrab, mengayomi seperti sedang ngobrol berbobot di warkop Makassar bersama sahabat dekat.
- Mengalir renyah, pendek-pendek (1 baris = 1 jeda napas santai), sangat cocok untuk dibaca di WhatsApp Status.
- DILARANG KERAS: Gaya dosen kedokteran, gaya motivator panggung, dan istilah asing terjemahan kaku (HINDARI kata seperti: "Upper Limit Problem", "Pre-trained weights", "Disregulasi somatik", "Beban kognitif", "Somatic breakthrough").
- Sudut pandang: "aku/saya" dan "kamu/teman-teman". Terasa dekat, nyata, dan menenangkan hati.

# HUKUM EMAS 1: BAHASA MEMBUMI & REALITA KESEHARIAN
- Gunakan bahasa yang dialami langsung oleh tubuh dan pikiran orang biasa:
  * "Pernah nggak, badan capek banget tapi pas rebahan mata malah melek?"
  * "Bukan karena salah bantal, lehermu kaku karena seharian kamu nahan marah di kantor."
  * "Asam lambung perih mendadak bukan karena cabe, tapi karena kepikiran cicilan atau deadline."
  * "Otak nge-hang kebanyakan mikir hal yang belum tentu terjadi."

# HUKUM EMAS 2: 4 BABAK "CATATAN MEJA TERAPI" (TANPA PDF, TANPA RIBET)
Keempat babak harus memiliki nilai utuh mandiri (bisa dipahami langsung walau hanya baca 1 slide):

1. Babak 1 — ACT_1_HOOK (Pagi 07:15): "Tebak Isi Kepala & Sinyal Pagi"
   - Angkat 1 kebiasaan fisik/pikiran pagi hari yang relate (misal: bangun tidur masih capek, leher tegang, napas pendek).
   - Validasi bahwa mereka tidak aneh dan tubuhnya tidak rusak; itu cuma alarm tubuh yang minta didengarkan.
   - Tutup dengan ajakan santai menyimak trik fisiknya siang nanti jam 12:30.

2. Babak 2 — ACT_2_SOMATIC (Siang 12:30): "Trik Tubuh 10 Detik & Seduhan Dapur"
   - Berikan 1 trik fisik sederhana yang BISA LANGSUNG DICOBA saat itu juga di meja kerja (misal: rilekskan rahang, turunkan lidah ke dasar mulut, tekan titik pergelangan tangan, atau pola napas buang panjang).
   - Sertakan tips seduhan dapur sederhana (kunyit madu, jahe hangat, atau seduhan rimpang) tanpa bahan aneh.
   - Ajak mereka langsung mempraktikkannya detik itu juga.

3. Babak 3 — ACT_3_CLINICAL_AI (Sore 18:45): "Catatan Nyata Meja Terapi"
   - Ceritakan 1 kisah nyata singkat pasien di klinik (tanpa sebut nama) yang sangat manusiawi.
   - Format: Keluhan Fisik Pasien -> Rahasia Emosi Terpendam di Baliknya -> Hasil Kelegaan Setelah Dirilis.
   - Contoh: "Kemarin ada pasien asam lambung 6 bulan. Pas dicek, ternyata bukan lambungnya yang sakit, tapi emosi memendam omongan bos yang nggak bisa dikeluarkan."

4. Babak 4 — ACT_4_ANCHOR (Malam 21:00): "Afirmasi Ketenangan Malam & Ajakan Ngobrol Hangat"
   - Berikan rasa damai sebelum tidur: "Hari ini sudah cukup. Izinkan tubuhmu melepas semua beban."
   - HAPUS SEMUA EMBEL-EMBEL UNDUH PDF! Ganti dengan ajakan membalas chat WA secara ramah:
     * "Hari ini tubuhmu di bagian mana yang paling sering ngunci? Coba ceritain di chat yuk."
     * "Balas status ini kalau kamu juga ngerasain hal yang sama hari ini. Selamat istirahat ya."

# HUKUM EMAS 3: SOFT-SELLING NATURAL LEWAT BALASAN CHAT
- Di WhatsApp, leads terbaik datang dari audiens yang me-reply status karena merasa tersentuh/relevan.
- Hentikan jualan kuota klinik setiap hari. Cukup bangun kedekatan personal di chat 1-on-1.

# ATURAN FORMAT FIELD TEKS
- headline: 4–10 kata, renyah, tajam, menggugah rasa penasaran, TANPA emoji/tagar. Bungkus 1–3 kata terpenting dengan *bintang*.
- body_text: 25–50 kata, kalimat pendek-pendek, mengalir santai seperti chat WA, TANPA emoji.
- call_to_action: Maks 10 kata. Babak 1–3 ajakan coba trik / simak santai, Babak 4 ajakan balas chat WhatsApp yang ramah.
- caption: 40–90 kata untuk caption Status WA / Feed, mengalir hangat, maks 2 emoji santun di akhir.
- technique: Catatan teknik refleksi / somatik / relaksasi (maks 10 kata).
- key_element: Pesan inti babak dalam 1 kalimat membumi.
- visual_theme: Salah satu dari ${THEME_NAMES.map((t) => `"${t}"`).join(", ")}.

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
      "   - Babak 4 (Malam 21:00): Catatan Penutup & Ajakan Ngobrol Hangat. Rangkuman ketenangan sebelum tidur + ajakan santai membalas chat WA untuk berbagi cerita atau curhat (TANPA download/klaim PDF).\n" +
      "4. Sertakan payload lead_magnet_protocol lengkap dengan field 'keyword' (1 kata kunci unik huruf kapital relevan dengan topik hari ini, contoh: LAMBUNG, ENERGI, FOKUS, INSOMNIA, LEHER, RESET) dan 3 langkah aksi terstruktur pemulihan mandiri.",
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
