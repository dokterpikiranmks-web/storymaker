#!/usr/bin/env node

/**
 * ════════════════════════════════════════════════════════════════════════
 *  Story Maker — Emergency CLI Generator Script
 *  Usage: node scripts/generate-today.mjs  OR  npm run generate:today
 * ════════════════════════════════════════════════════════════════════════
 *  • Reads .env and .env.local
 *  • Detects current day (Selasa = Gut Health / PC-6 / Kunyit Temulawak)
 *  • Directly invokes Google Gemini AI (no Vercel serverless execution limits)
 *  • Graceful fallback to offline curated clinical templates if AI unavailable
 *  • Performs reliable UPSERT to Supabase Postgres (daily_campaigns & story_slides)
 * ════════════════════════════════════════════════════════════════════════
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";
import { GoogleGenAI } from "@google/genai";

const { Pool } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 1. Muat Environment Variables
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const TIMEZONE = process.env.APP_TIMEZONE || "Asia/Makassar";
const DATABASE_URL = process.env.DATABASE_URL;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log("═══════════════════════════════════════════════════════════════");
console.log("🚀 Story Maker — Emergency CLI Generator Fallback");
console.log("═══════════════════════════════════════════════════════════════");

if (!DATABASE_URL) {
  console.error("❌ ERROR: DATABASE_URL tidak ditemukan di .env atau .env.local!");
  process.exit(1);
}

// 2. Tentukan Tanggal & Hari Ini Berdasarkan Timezone
const now = new Date();
const dateStr = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(now);
const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, weekday: "long" }).format(now).toLowerCase();

console.log(`📅 Tanggal: ${dateStr} (${weekday.toUpperCase()}) | Timezone: ${TIMEZONE}`);

// Matriks 7 Pilar Klinis Harian Dokter Pikiran
const PILLARS = {
  monday: {
    category: "Metabolisme & Energi Harian",
    pillar: "Membangunkan Sistem Energi & Mengatasi Tubuh Lesu Bangun Tidur",
    focus: "Mengatasi kelelahan kronis saat bangun pagi dan mengaktifkan panas alami sel.",
    meridian: "Titik GB-20 Leher Belakang (Cekungan Suboksipital)",
    herbal: "Seduhan Hangat Jahe Merah & Lada Hitam 250ml (air panas 80°C tertutup 10 menit)",
    keyword: "ENERGI",
    topic: "Metabolisme & Energi Pagi: Bangun Segar Tanpa Ketergantungan Kopi",
    coreInsight: "Kopi memeras kelenjar adrenal. Stimulasi titik GB-20 dan seduhan jahe-lada hitam membakar energi alami sel dari dalam.",
    socialProof: "Klien lemas kronis 8 bulan membaik dalam 15 menit setelah stimulasi meridian leher dan seduhan jahe-lada hitam.",
    acts: [
      {
        act: "ACT_1_HOOK",
        time: "07:15:00",
        headline: "Bangun Tidur Masih *Lemas* dan Pundak Kaku Seperti Memikul Batu?",
        body_text: "Jangan buru-buru seduh cangkir kopi ketiga. Tubuhmu bukan kekurangan kafein, tapi sel-sel sarafmu belum menerima sinyal oksigen yang cukup. Siang nanti jam 12:30, saya tunjukkan 1 titik saraf di tengkuk leher yang langsung membuka aliran darah segar ke kepala.",
        call_to_action: "Lanjut jam 12:30 nanti siang",
        caption: "Bangun tidur kok malah capek? Simak cara alami bangunkan energi tubuh tanpa memeras adrenal. #EnergiPagi #DokterPikiran",
        visual_theme: "Neuro-Dark",
      },
      {
        act: "ACT_2_SOMATIC",
        time: "12:30:00",
        headline: "Titik *GB-20* & Seduhan Jahe Merah Hangat Pembakar Energi",
        body_text: "Sesuai janji tadi pagi: tekan lembut cekungan di bawah tengkorak leher belakang selama 60 detik sambil buang napas panjang. Dampingi dengan seduhan 2 iris jahe merah + sebutir lada hitam geprek dalam 250ml air panas 80°C tertutup 10 menit. Rasakan hangatnya menjalar ke seluruh pundak. Tapi kenapa leher bisa kaku begini? Jawabannya kita bedah nanti sore.",
        call_to_action: "Simak rahasianya jam 18:45 sore",
        caption: "Dua menit di meja kerja untuk melepas ketegangan leher dan mengaktifkan energi sel. #TotokSaraf #HerbalKlinis",
        visual_theme: "Somatic-Clean",
      },
      {
        act: "ACT_3_CLINICAL_AI",
        time: "18:45:00",
        headline: "Kisah Pasien: *Lemas Kronis* 8 Bulan yang Lenyap dalam 15 Menit",
        body_text: "Seorang pasien datang dengan leher terkunci dan harus minum 3 kopi sehari hanya untuk berpikir. Di meja terapi terungkap: saraf servikalnya tertekan karena kebiasaan napas dada yang dangkal. Setelah totok meridian dekompresi dan reset instruksi bawah sadar, napasnya langsung plong dan kepala enteng seketika. Nanti malam jam 21:30, ambil panduan lengkapnya.",
        call_to_action: "Malam ini jam 21:30 sebelum tidur",
        caption: "Pundak kaku adalah alarm tubuh yang meminta jeda. Simak rangkuman lengkapnya malam ini. #KasusKlinis #Hipnoterapi",
        visual_theme: "Hacker-Terminal",
      },
      {
        act: "ACT_4_ANCHOR",
        time: "21:30:00",
        headline: "Tutup Harimu dengan *Plong*: Panduan Protokol Energi 3 Menit",
        body_text: "Dari leher kaku tadi pagi sampai totok tadi siang: tubuhmu punya hak untuk pulih malam ini. Sentuh ulu hatimu, afirmasikan bahwa semua urusan hari ini telah tuntas. Ketik ENERGI di chat WhatsApp saya sekarang untuk menerima PDF Panduan Saku 3 Langkah Aktivasi Energi Alami. Khusus pekan ini, tersisa 2 slot konsultasi tatap muka klinik.",
        call_to_action: "Ketik ENERGI di chat WhatsApp saya sekarang",
        caption: "Malam ini izinkan tubuh beristirahat sejati. Ketik ENERGI di chat WhatsApp untuk modul gratis & reservasi slot klinik. #PemulihanMalam",
        visual_theme: "Minimal-Hypnotic",
      },
    ],
  },

  tuesday: {
    category: "Kesehatan Pencernaan, GERD & Gut Health",
    pillar: "Saraf Vagus Pencernaan, Titik PC-6 & Penyelarasan Katup Lambung Alami",
    focus: "Meredakan asam lambung naik (GERD), perut begah saat stres kerja, dan memulihkan gut-brain axis.",
    meridian: "Titik PC-6 (Neiguan) pergelangan tangan & Titik CV-12 Ulu Hati",
    herbal: "Seduhan Rimpang Kunyit & Temulawak Pelindung Mukosa 200ml (air panas 80°C tertutup 8 menit)",
    keyword: "LAMBUNG",
    topic: "Gut Health & GERD: Memutus Lingkaran Asam Lambung & Saraf Vagus",
    coreInsight: "Lambung adalah cermin pikiran emosional. Menekan titik PC-6 dan merangsang saraf vagus langsung menenangkan asam lambung dan katup esofagus.",
    socialProof: "Klien GERD 6 bulan pulih seketika setelah pelemasan diafragma dan seduhan kunyit-temulawak.",
    acts: [
      {
        act: "ACT_1_HOOK",
        time: "07:15:00",
        headline: "Dada Terasa *Panas Mengganjal* Setiap Kali Kepikiran Kerjaan?",
        body_text: "Itu bukan cuma masalah makanan pedas atau kopi pagi. Saat pikiranmu siaga dikejar deadline, otak membunyikan alarm bahaya yang memicu kejang katup lambung dan asam naik ke dada. Nanti siang jam 12:30, saya tunjukkan 1 titik saraf di pergelangan tangan (PC-6) yang langsung menenangkan lambung dalam hitungan menit.",
        call_to_action: "Lanjut jam 12:30 nanti siang",
        caption: "Asam lambung naik bukan cuma soal makanan, tapi sinyal stres yang tertahan di lambung. #GERD #GutHealth #DokterPikiran",
        visual_theme: "Neuro-Dark",
      },
      {
        act: "ACT_2_SOMATIC",
        time: "12:30:00",
        headline: "Titik *PC-6 Neiguan* & Seduhan Kunyit Temulawak Pelindung Mukosa",
        body_text: "Sesuai janji tadi pagi: ukur 3 jari dari garis pergelangan tangan bagian dalam, tekan titik tengahnya (PC-6) selama 60 detik sambil napas perut teratur. Dampingi dengan seduhan 1 ruas kunyit parut + temulawak geprek dalam 200ml air panas 80°C tertutup 8 menit. Kurkuminoidnya menyejukkan dinding lambung. Tapi kenapa lambung selalu bereaksi saat stres? Kita bahas sore nanti.",
        call_to_action: "Simak rahasianya jam 18:45 sore",
        caption: "Cara praktis meredakan perut begah dan mual di jam istirahat kantor. #TitikAkupresur #KunyitTemulawak",
        visual_theme: "Somatic-Clean",
      },
      {
        act: "ACT_3_CLINICAL_AI",
        time: "18:45:00",
        headline: "Kisah Pasien: *GERD Kronis 6 Bulan* yang Plong Setelah Saraf Rileks",
        body_text: "Seorang pasien datang dengan dada panas dan tenggorokan mengganjal menahun. Di meja terapi terungkap: diafragmanya kejang karena kebiasaan menahan cemas bawah sadar yang mengunci katup asam lambung. Setelah totok meridian vagus dan reset emosi bawah sadar, sensasi panas di dada langsung dingin dan plong seketika. Nanti malam jam 21:30, saya bagikan panduannya.",
        call_to_action: "Malam ini jam 21:30 sebelum tidur",
        caption: "Lambung dan otak terhubung oleh kabel saraf vagus. Ketika saraf tenang, lambung ikut damai. #StudiKasusKlinis",
        visual_theme: "Hacker-Terminal",
      },
      {
        act: "ACT_4_ANCHOR",
        time: "21:30:00",
        headline: "Bebaskan *Perut Begah*: Ambil Panduan Protokol Lambung 3 Menit",
        body_text: "Dari dada perih tadi pagi, totok PC-6 tadi siang, hingga saraf vagus tadi sore: lambungmu berhak tenang malam ini. Sentuh ulu hatimu, bernapaslah perlahan. Ketik LAMBUNG di chat WhatsApp saya sekarang untuk menerima PDF Panduan Saku Regulasi Katup Lambung 3 Menit. Tersedia 2 slot klinik totok saraf pekan ini untuk konsultasi langsung.",
        call_to_action: "Ketik LAMBUNG di chat WhatsApp saya sekarang",
        caption: "Tutup hari dengan perut nyaman dan tidur lelap. Ketik LAMBUNG di WhatsApp untuk modul gratis & reservasi sesi klinik. #PemulihanMalam",
        visual_theme: "Minimal-Hypnotic",
      },
    ],
  },

  wednesday: {
    category: "Postur Kerja & Tulang Belakang",
    pillar: "Dekompresi Servikal Leher, Belikat & Penyelarasan Tulang Belakang",
    focus: "Membebaskan leher kaku, nyeri belikat menjalar ke tangan, dan text neck.",
    meridian: "Titik GB-20 & Chin Tuck Servikal",
    herbal: "Seduhan Serai Wangi & Kayu Manis 250ml",
    keyword: "POSTUR",
    topic: "Leher Kaku & Belikat Terjepit: Menyelaraskan Postur Layar Komputer",
    coreInsight: "Kemiringan kepala menatap layar menambah beban 12kg pada leher. Traksi mandiri membuka kembali aliran darah.",
    socialProof: "Nyeri belikat tajam programmer lenyap seketika setelah dekompresi servikal.",
    acts: [],
  },

  thursday: {
    category: "Kognitif & Mental Burnout",
    pillar: "Mengosongkan Beban Otak Nge-hang & Mengurai Cognitive Overflow",
    focus: "Mengatasi otak nge-hang kebanyakan mikir, sulit fokus, dan kepala berat.",
    meridian: "Titik Yintang (Dahi Tengah) & Pelipis",
    herbal: "Seduhan Daun Pegagan & Jeruk Nipis 200ml",
    keyword: "FOKUS",
    topic: "Otak Nge-hang Kebanyakan Mikir: Mengembalikan Fokus Tajam & Jernih",
    coreInsight: "Memori kerja hanya sanggup menampung 4-7 hal. Matikan tab pikiran bawah sadar yang tidak relevan.",
    socialProof: "Kepala berat diikat lenyap setelah stimulasi titik hening dahi dan hipno-reset.",
    acts: [],
  },

  friday: {
    category: "Ritme Sirkadian & Insomnia",
    pillar: "Regulasi Gelombang Otak Menjelang Tidur & Pemulihan Insomnia Kronis",
    focus: "Memutus overthinking jam 11 malam dan memicu tidur lelap gelombang delta alami.",
    meridian: "Titik Shenmen (Pergelangan Tangan Dalam) & GB-20",
    herbal: "Seduhan Bunga Telang & Sejumput Biji Pala Murni 200ml",
    keyword: "INSOMNIA",
    topic: "Insomnia & Overthinking Malam: Cara Memprogram Ketenangan Sebelum Tidur",
    coreInsight: "Mendebat pikiran cemas di kasur bikin makin terjaga. Rangsang saraf vagus untuk masuk gelombang theta.",
    socialProof: "Insomnia 2 tahun tertidur lelap dalam 10 menit setelah stimulasi saraf vagus.",
    acts: [],
  },

  saturday: {
    category: "Studi Kasus Meja Terapi & Detoks Fungsional",
    pillar: "Pembersihan Ketegangan Fisik Menumpuk & Penyelarasan Meridian Tubuh",
    focus: "Membongkar timbunan ketegangan otot sepekan kerja dan memperlancar drainase limfatik.",
    meridian: "Titik Meridian Belikat & Pangkal Tengkorak",
    herbal: "Seduhan Daun Salam, Jahe Merah & Ketumbar 300ml",
    keyword: "TERAPI",
    topic: "Meja Terapi Holistik: Membongkar Ketegangan Tubuh yang Mengunci Sepekan",
    coreInsight: "Fascia otot punggung mengunci memori emosi beban tanggung jawab. Buka meridian untuk pelepasan total.",
    socialProof: "Punggung keras seperti papan seketika lemas rileks setelah rilis fascia limfatik.",
    acts: [],
  },

  sunday: {
    category: "Mindset Bawah Sadar & Batasan Mental",
    pillar: "Ketenangan Menghadapi Pekan Baru & Penataan Ulang Batasan Mental",
    focus: "Mengatasi cemas Minggu sore (Sunday Scaries) dan menetapkan batasan mental sehat.",
    meridian: "Titik CV-17 (Dada Tengah) & GB-20",
    herbal: "Seduhan Aromatik Daun Pandan & Kapulaga 250ml",
    keyword: "RESET",
    topic: "Sunday Scaries & Batasan Diri: Damai Menyambut Pekan Baru Tanpa Cemas",
    coreInsight: "Cemas hari Minggu tanda batasan mental bocor. Tanamkan instruksi aman di pikiran bawah sadar.",
    socialProof: "Panik menjelang Senin hilang setelah pemrograman ulang batas mental dan totok meridian dada.",
    acts: [],
  },
};

const todayPillar = PILLARS[weekday] || PILLARS.tuesday;
console.log(`📌 Domain Hari Ini: [${todayPillar.category}]`);
console.log(`🎯 Fokus: ${todayPillar.pillar}`);
console.log(`🌿 Formulasi Herbal: ${todayPillar.herbal}`);
console.log(`📍 Titik Meridian: ${todayPillar.meridian}`);
console.log(`🔑 Keyword Trigger: ${todayPillar.keyword}`);

// 3. Panggil Gemini AI Jika API Key Tersedia
async function generateWithGemini() {
  if (!GEMINI_API_KEY) {
    console.log("ℹ️ GEMINI_API_KEY tidak ditemukan, menggunakan kurasi klinis bawaan...");
    return null;
  }

  console.log("🤖 Menghubungi Google Gemini AI (Direct API, tanpa serverless timeout)...");
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = `Anda adalah Dokter Pikiran / The Alchemist. Buat 4 babak Story WhatsApp & Instagram untuk tanggal ${dateStr}.
Hari: ${weekday} (${todayPillar.category}).
Fokus: ${todayPillar.pillar}.
Masalah: ${todayPillar.focus}.
Titik Meridian: ${todayPillar.meridian}.
Resep Herbal: ${todayPillar.herbal}.
Trigger Keyword: ${todayPillar.keyword}.

HUKUM EMAS:
- Gunakan bahasa awam yang renyah dan empati sahabat (contoh: "leher kaku", "perut begah", "otak nge-hang", "rem alami tubuh").
- Babak 1 (ACT_1_HOOK, Pagi 07:15): Pola interrupt masalah bangun tidur + janji siang jam 12:30.
- Babak 2 (ACT_2_SOMATIC, Siang 12:30): Lanjutan pagi + panduan fisik titik meridian & herbal klinis + umpan sore.
- Babak 3 (ACT_3_CLINICAL_AI, Sore 18:45): Koneksi pikiran-tubuh + bukti sosial nyata meja terapi (gejala -> temuan -> hasil) + janji malam jam 21:30.
- Babak 4 (ACT_4_ANCHOR, Malam 21:30): Rangkuman seharian + afirmasi malam + dual CTA: Ketik ${todayPillar.keyword} di WhatsApp + kelangkaan 2 slot klinik pekan ini.

Format output WAJIB HANYA JSON valid:
{
  "theme_topic": "${todayPillar.topic}",
  "core_insight": "${todayPillar.coreInsight}",
  "acts": [
    { "act": "ACT_1_HOOK", "headline": "...", "body_text": "...", "call_to_action": "...", "caption": "...", "visual_theme": "Neuro-Dark" },
    { "act": "ACT_2_SOMATIC", "headline": "...", "body_text": "...", "call_to_action": "...", "caption": "...", "visual_theme": "Somatic-Clean" },
    { "act": "ACT_3_CLINICAL_AI", "headline": "...", "body_text": "...", "call_to_action": "...", "caption": "...", "visual_theme": "Hacker-Terminal" },
    { "act": "ACT_4_ANCHOR", "headline": "...", "body_text": "...", "call_to_action": "Ketik ${todayPillar.keyword} di chat WhatsApp saya sekarang", "caption": "...", "visual_theme": "Minimal-Hypnotic" }
  ]
}`;

  const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  for (const model of models) {
    try {
      console.log(`   Memanggil model: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.85,
        },
      });

      const text = response.text?.trim();
      if (text) {
        let cleanJson = text;
        const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
        if (match) cleanJson = match[1].trim();
        const parsed = JSON.parse(cleanJson);
        if (Array.isArray(parsed.acts) && parsed.acts.length === 4) {
          console.log(`✅ Berhasil di-generate oleh Gemini model ${model}!`);
          return { data: parsed, model };
        }
      }
    } catch (err) {
      console.warn(`   ⚠️ Model ${model} gagal: ${err.message}`);
    }
  }

  console.log("ℹ️ Gemini cascade selesai tanpa hasil valid, beralih ke kurasi klinis...");
  return null;
}

// 4. Siapkan Data Cerita Akhir
async function getFinalStory() {
  const geminiResult = await generateWithGemini();
  if (geminiResult) {
    const actTimes = {
      ACT_1_HOOK: "07:15:00",
      ACT_2_SOMATIC: "12:30:00",
      ACT_3_CLINICAL_AI: "18:45:00",
      ACT_4_ANCHOR: "21:30:00",
    };
    return {
      theme_topic: geminiResult.data.theme_topic || todayPillar.topic,
      core_insight: geminiResult.data.core_insight || todayPillar.coreInsight,
      acts: geminiResult.data.acts.map((a) => ({
        ...a,
        time: actTimes[a.act] || "12:00:00",
      })),
      source: "gemini",
      model: geminiResult.model,
    };
  }

  // Gunakan kurasi bawaan hari ini jika offline
  const fallbackActs = (todayPillar.acts && todayPillar.acts.length === 4)
    ? todayPillar.acts
    : PILLARS.tuesday.acts;

  return {
    theme_topic: todayPillar.topic,
    core_insight: todayPillar.coreInsight,
    acts: fallbackActs,
    source: "offline_curated",
    model: "DokterPikiran-Curated-v1",
  };
}

// 5. Simpan Hasil ke Supabase PostgreSQL
async function saveToDatabase(storyData) {
  console.log("📦 Menghubungkan ke Supabase PostgreSQL via pg Pool...");
  const isLocal = DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1");
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    console.log(`🔍 Memeriksa apakah campaign untuk tanggal ${dateStr} sudah ada...`);
    const checkRes = await client.query(
      `SELECT id FROM daily_campaigns WHERE campaign_date = $1 LIMIT 1`,
      [dateStr]
    );

    let campaignId;
    if (checkRes.rows.length > 0) {
      campaignId = checkRes.rows[0].id;
      console.log(`🔄 Campaign ditemukan (ID: ${campaignId}). Melakukan UPDATE (UPSERT)...`);

      await client.query(
        `UPDATE daily_campaigns
         SET campaign_type = 'DAILY_AUTONOMOUS',
             theme_topic = $1,
             trigger_keyword = $2,
             raw_input_notes = $3,
             core_insight = $4,
             generation_source = $5,
             generation_model = $6,
             updated_at = NOW()
         WHERE id = $7`,
        [
          storyData.theme_topic,
          todayPillar.keyword,
          `CLI Emergency Generator: ${todayPillar.category}\n${todayPillar.pillar}`,
          storyData.core_insight,
          storyData.source,
          storyData.model,
          campaignId,
        ]
      );

      console.log(`🗑️ Menghapus slide lama terkait (cascade replace)...`);
      await client.query(`DELETE FROM story_slides WHERE campaign_id = $1`, [campaignId]);
    } else {
      console.log(`✨ Membuat entri baru di tabel daily_campaigns...`);
      const insertCampaignRes = await client.query(
        `INSERT INTO daily_campaigns (
           campaign_date, campaign_type, theme_topic, trigger_keyword,
           raw_input_notes, core_insight, generation_source, generation_model,
           created_at, updated_at
         ) VALUES ($1, 'DAILY_AUTONOMOUS', $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING id`,
        [
          dateStr,
          storyData.theme_topic,
          todayPillar.keyword,
          `CLI Emergency Generator: ${todayPillar.category}\n${todayPillar.pillar}`,
          storyData.core_insight,
          storyData.source,
          storyData.model,
        ]
      );
      campaignId = insertCampaignRes.rows[0].id;
      console.log(`✅ Campaign dibuat dengan ID: ${campaignId}`);
    }

    console.log(`📥 Menyimpan 4 babak story ke tabel story_slides...`);
    for (const act of storyData.acts) {
      const scheduledTimestamp = `${dateStr}T${act.time}+08:00`; // Sesuai timezone WITA / Asia/Makassar
      await client.query(
        `INSERT INTO story_slides (
           campaign_id, act, target_time, headline, body_text,
           call_to_action, caption, visual_theme, status,
           scheduled_at, post_to_whatsapp, post_to_instagram,
           created_at, updated_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'DRAFT', $9, true, false, NOW(), NOW())`,
        [
          campaignId,
          act.act,
          act.time,
          act.headline,
          act.body_text,
          act.call_to_action,
          act.caption,
          act.visual_theme || "Neuro-Dark",
          scheduledTimestamp,
        ]
      );
      console.log(`   ✔️ Slide ${act.act} (${act.time}) berhasil disimpan`);
    }

    await client.query("COMMIT");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`🎉 SUKSES! Campaign harian untuk ${dateStr} berhasil di-generate & disimpan!`);
    console.log(`📌 ID Campaign: ${campaignId}`);
    console.log(`🏷️ Topik: ${storyData.theme_topic}`);
    console.log(`🔑 Kata Kunci WhatsApp: ${todayPillar.keyword}`);
    console.log(`⚡ Source: ${storyData.source} (${storyData.model})`);
    console.log("═══════════════════════════════════════════════════════════════");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Gagal menyimpan ke Supabase Database:", err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

async function main() {
  try {
    const story = await getFinalStory();
    await saveToDatabase(story);
    process.exit(0);
  } catch (err) {
    console.error("💥 Fatal CLI Error:", err);
    process.exit(1);
  }
}

main();
