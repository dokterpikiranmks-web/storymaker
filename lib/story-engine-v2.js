/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2.1 — AI Engine (lib/story-engine-v2.js)
 *  Brand: Dokter Pikiran (Ahmad Jawahir Zain)
 * ════════════════════════════════════════════════════════════════════════════
 *  Revisi V2.1:
 *  - Bahasa Manusiawi, hangat, empati tinggi, membumi (anti-teoritis).
 *  - Hapus istilah teknis rumit (ganti dengan sensasi fisik nyata:
 *    dada sesak, leher kaku, nafas pendek, perut perih/begah, tidur gak nyenyak).
 *  - Analogi AI sederhana ala kehidupan sehari-hari (autofill HP, tab kebanyakan).
 *  - 5 Babak Story format vertikal 9:16 untuk WA Story.
 * ════════════════════════════════════════════════════════════════════════════
 */

const { GoogleGenAI } = require("@google/genai");

// Identitas Brand & Persona Resmi Dokter Pikiran
const BRAND_IDENTITY = {
  creator: "Ahmad Jawahir Zain",
  brand: "Dokter Pikiran",
  location: "Parepare, Sulawesi Selatan (WITA)",
  persona:
    "Sahabat ngobrol sekaligus hipnoterapis & solo developer AI di Parepare yang menemani teman-teman yang capek hati, cemas, dan overthinking.",
  audience:
    "Pria & wanita usia 25-45 tahun yang sering lelah mental, overthinking malam hari, dada sesak, perut begah saat stres kerja, dan susah tidur lelap.",
  tone:
    "Hangat, tulus, merangkul, seperti sahabat dekat yang paham rasa lelahmu. Tidak menggurui, tidak pakai bahasa medis rumit, tidak ada janji mukjizat instan, tanpa gambar mistis.",
};

// 3 Pilar Konten Mutlak (1 pilar per hari, tidak boleh campur)
const PILLARS = {
  PIKIRAN: {
    key: "PIKIRAN",
    title: "Beban Pikiran, Rasa Cemas & Luka Bawah Sadar",
    description: "Mengurai overthinking, rasa takut salah, luka masa lalu, dan kebiasaan menyalahkan diri sendiri.",
    defaultKeyword: "RESET",
    themeColor: "#1E293B", // Muted Dark Slate
    accentColor: "#FDE047", // Warm Gold
  },
  TUBUH: {
    key: "TUBUH",
    title: "Tubuh Lelah, Lambung Begah & Nafas Sesak",
    description: "Hubungan pikiran dengan perut perih, pundak kaku, dada sesak, dan tidur yang tidak nyenyak.",
    defaultKeyword: "LAMBUNG",
    themeColor: "#1B2E24", // Deep Forest Sage
    accentColor: "#86EFAC", // Soft Mint Green
  },
  TEKNOLOGI: {
    key: "TEKNOLOGI",
    title: "Otak Nge-hang, Kebanyakan Tab & Burnout",
    description: "Analogi sederhana sistem AI & smartphone untuk merapikan isi kepala yang berisik tanpa bikin pusing.",
    defaultKeyword: "FOKUS",
    themeColor: "#17202A", // Deep Charcoal Slate
    accentColor: "#93C5FD", // Soft Blue Ice
  },
};

// Kurasi Editorial Berstandar Emas (Bahasa Manusiawi & Empati Tinggi)
const CURATED_STORIES = {
  PIKIRAN: {
    topic: "Kenapa Kita Sering Takut dan Cemas Tanpa Alasan yang Jelas?",
    keyword: "RESET",
    stories: [
      {
        slide: 1,
        time: "07:00",
        act: "HOOK",
        text: "Kamu tidak malas. Hatimu cuma capek menahan rasa takut yang tidak pernah sempat kamu ceritakan.",
        visualGuide: {
          headline: "Bukan Malas, Tapi Lelah Hati",
          palette: "Dark Slate & Warm Sand",
          elements: "Kartu 9:16 minimalis tenang, tipografi hangat tanpa gambar mistis",
        },
      },
      {
        slide: 2,
        time: "07:45",
        act: "EDUKASI MIKRO",
        text: "Pikiran bawah sadar itu persis fitur autofill di HP. Kalau terbiasa cemas, kata pertama yang disodorin otak pasti ketakutan.",
        visualGuide: {
          headline: "Autofill di Kepala Kita",
          palette: "Dark Slate dengan aksen Gold",
          elements: "Analogi teks ketikan HP sederhana yang langsung dipahami",
        },
      },
      {
        slide: 3,
        time: "13:00",
        act: "PRAKTIK",
        text: "Pelepas Cemas 60 Detik: Taruh tangan kananmu di dada. Tarik nafas pelan 4 hitungan, lalu hembuskan panjang lewat mulut seperti meniup lilin. Bisikkan pelan: 'Untuk detik ini, aku aman'.",
        visualGuide: {
          headline: "Lepas Sesak di Dada",
          palette: "Forest Slate & Linen",
          elements: "Langkah nafas sederhana 1-2-3 yang menenangkan",
        },
      },
      {
        slide: 4,
        time: "20:00",
        act: "BUKTI",
        text: "Ada teman curhat di ruang terapi Parepare: tiap malam dadanya berdebar takut besok gagal. Setelah ditelusuri, bukan harinya yang berat, tapi dia terlalu keras menuntut dirinya harus selalu sempurna.",
        visualGuide: {
          headline: "Cerita Ruang Terapi",
          palette: "Muted Slate hangat",
          elements: "Kutipan refleksi nyata yang relatable",
        },
      },
      {
        slide: 5,
        time: "21:00",
        act: "CTA HALUS",
        text: "Malam ini, izinkan kepalamu istirahat. Kamu sudah berjuang sehebat ini hari ini. Kalau kamu butuh panduan audio 3 menit untuk menenangkan pikiran sebelum tidur, balas story ini dengan kata: RESET.",
        visualGuide: {
          headline: "Rebahkan Diri dengan Damai",
          palette: "Night Deep Slate & Warm Sand",
          elements: "Pesan malam hangat dengan ajakan balas 'RESET'",
        },
      },
    ],
  },

  TUBUH: {
    topic: "Kenapa Asam Lambung Suka Naik Pas Lagi Banyak Beban Pikiran?",
    keyword: "LAMBUNG",
    stories: [
      {
        slide: 1,
        time: "07:00",
        act: "HOOK",
        text: "Dada terasa perih dan perut kembung? Lambungmu bukan rusak, dia cuma ikut panik pas pikiranmu stres.",
        visualGuide: {
          headline: "Saat Perut Ikut Panik",
          palette: "Forest Sage & Warm Linen",
          elements: "Kartu 9:16 sejuk, warna earthy ramah mata",
        },
      },
      {
        slide: 2,
        time: "07:45",
        act: "EDUKASI MIKRO",
        text: "Ada kabel langsung dari otak ke usus. Begitu pikiranmu tegang, katup lambung ikut terkunci rapat seperti pintu darurat ditutup paksa.",
        visualGuide: {
          headline: "Kabel Otak ke Lambung",
          palette: "Forest Sage & Mint",
          elements: "Ilustrasi hubungan pikiran dan perut yang simpel",
        },
      },
      {
        slide: 3,
        time: "13:00",
        act: "PRAKTIK",
        text: "Lega Perut 60 Detik: Tekan lembut titik tiga jari di atas pergelangan tangan bagian dalam. Sambil buang nafas panjang, bunyikan helaan nafas 'haaa' yang lega. Rasakan sesak di dada mulai mengendur.",
        visualGuide: {
          headline: "Tekan Titik Pereda Begah",
          palette: "Sage Green & Sand",
          elements: "Petunjuk titik pergelangan tangan yang mudah dipraktekkan",
        },
      },
      {
        slide: 4,
        time: "20:00",
        act: "BUKTI",
        text: "Seorang pasien bolak-balik minum obat lambung tapi tetap perih tiap sore. Pas diajak ngobrol, ternyata rasa perih itu muncul setiap kali dia menahan emosi kesal di tempat kerja.",
        visualGuide: {
          headline: "Bukan Cuma Soal Makanan",
          palette: "Deep Forest Muted",
          elements: "Kisah nyata keterkaitan emosi dan fisik",
        },
      },
      {
        slide: 5,
        time: "21:00",
        act: "CTA HALUS",
        text: "Lambung yang nyaman berawal dari hati yang melepaskan beban. Sebelum tidur, longgarkan rahang dan bahumu. Butuh resep seduhan rimpang hangat & latihan nafas pereda begah? Balas story ini: LAMBUNG.",
        visualGuide: {
          headline: "Tidur Lelap Tanpa Begah",
          palette: "Night Forest & Soft Sand",
          elements: "Pesan damai sebelum tidur dengan ajakan ketik 'LAMBUNG'",
        },
      },
    ],
  },

  TEKNOLOGI: {
    topic: "Kepala Penuh Kebanyakan Mikir? Ini Cara Matikan 'Tab' Mental",
    keyword: "FOKUS",
    stories: [
      {
        slide: 1,
        time: "07:00",
        act: "HOOK",
        text: "Otakmu tidak rusak. Kamu cuma membuka 40 tab urusan di kepalamu sekaligus tanpa pernah menekan tombol close.",
        visualGuide: {
          headline: "Kebanyakan Tab di Kepala",
          palette: "Deep Slate & Soft Blue",
          elements: "Desain kartu clean, visual analogi tab browser simpel",
        },
      },
      {
        slide: 2,
        time: "07:45",
        act: "EDUKASI MIKRO",
        text: "Aplikasi AI saja bisa lemot kalau kebanyakan input. Otak kita juga butuh dibersihkan dari sampah pikiran biar gak nge-hang terus.",
        visualGuide: {
          headline: "Biar Otak Gak Lemot",
          palette: "Dark Slate & Ice Blue",
          elements: "Analogi HP/AI yang langsung ngena ke anak muda & pekerja",
        },
      },
      {
        slide: 3,
        time: "13:00",
        act: "PRAKTIK",
        text: "Trik Buang Beban 60 Detik: Ambil kertas kecil, tulis 3 hal yang paling bikin kepalamu ruwet sekarang. Lipat kertas itu dan taruh di meja. Ucapkan ke diri sendiri: 'Urusan ini disimpan dulu, sekarang kerjakan satu hal saja'.",
        visualGuide: {
          headline: "Trik Kertas 60 Detik",
          palette: "Slate Clean & Sand",
          elements: "Langkah ringkas 1-2-3 meredakan overload",
        },
      },
      {
        slide: 4,
        time: "20:00",
        act: "BUKTI",
        text: "Sebagai solo dev AI sekaligus terapis di Parepare, polanya sama persis: prompt yang kusut bikin AI halusinasi, cara kita ngomong ke diri sendiri yang kasar bikin kepala kita panik.",
        visualGuide: {
          headline: "Catatan Dev & Terapis",
          palette: "Deep Slate hangat",
          elements: "Kutipan personal Ahmad Jawahir Zain yang jujur & membumi",
        },
      },
      {
        slide: 5,
        time: "21:00",
        act: "CTA HALUS",
        text: "Malam ini biarkan urusan besok dikerjakan besok. Sekarang waktunya matikan layar di kepalamu. Mau template jurnal refleksi malam 3 menit versi Dokter Pikiran? Balas story ini dengan ketik: FOKUS.",
        visualGuide: {
          headline: "Matikan Layar Pikiranmu",
          palette: "Dark Night & Warm White",
          elements: "Nuansa temaram santai penutup hari",
        },
      },
    ],
  },
};

/**
 * Menentukan pilar harian secara otomatis
 */
function resolvePillar(requestedPillar, date = new Date()) {
  if (requestedPillar && PILLARS[requestedPillar.toUpperCase()]) {
    return requestedPillar.toUpperCase();
  }
  const day = date.getDay();
  if (day === 0 || day === 3) return "PIKIRAN";
  if (day === 1 || day === 4) return "TUBUH";
  return "TEKNOLOGI";
}

/**
 * Validasi batas kata pada story
 */
function enforceStoryWordLimits(stories) {
  return stories.map((s) => {
    const copy = { ...s };
    if (copy.act === "HOOK") {
      const words = copy.text.trim().split(/\s+/);
      if (words.length > 15) {
        copy.text = words.slice(0, 15).join(" ") + "...";
      }
    } else if (copy.act === "EDUKASI MIKRO" || copy.act === "EDUKASI") {
      const words = copy.text.trim().split(/\s+/);
      if (words.length > 25) {
        copy.text = words.slice(0, 25).join(" ") + "...";
      }
    }
    return copy;
  });
}

/**
 * System prompt dengan aturan bahasa manusiawi & empati tinggi
 */
function buildSystemPrompt(pillarKey) {
  const pilar = PILLARS[pillarKey];
  return `Anda adalah ${BRAND_IDENTITY.creator}, pendiri brand ${BRAND_IDENTITY.brand} di Parepare, Sulawesi Selatan.
Persona Anda: ${BRAND_IDENTITY.persona}
Target Audiens: ${BRAND_IDENTITY.audience}
Gaya Bahasa: ${BRAND_IDENTITY.tone}

HUKUM MUTLAK GAYA BAHASA (REVISI V2.1):
1. BAHASA MANUSIAWI & MEMBUMI: Gunakan bahasa obrolan santai, hangat, empati tinggi, seperti sahabat dekat yang tulus mendengarkan. HINDARI bahasa buku teks atau akademis yang kaku!
2. HAPUS SEMUA JARGON MEDIS RUMIT: DILARANG menggunakan kata seperti "stimulasi saraf vagus", "regulasi somatik", "dysregulation", "neurotransmiter", "parasimpatis".
   GANTI DENGAN SENSASI FISIK NYATA: dada sesak, leher kaku, nafas pendek, lambung perih/begah, pundak berat, tidur gak nyenyak, kepala penuh.
3. ANALOGI AI / HP SEDERHANA: Buat analogi yang langsung dipahami orang awam (contoh: fitur autofill keyboard di HP, buka 40 tab kebanyakan sampai nge-hang, tombol restart).
4. TANPA MISTIS: Jangan gunakan gambar mata spiral, sugesti supranatural, atau klaim sembuh 100% instan.

FORMULA 5 STORY WA (Format Kartu 9:16):
- Story 1 (07:00 WITA) - HOOK: Pertanyaan menusuk atau rasa "Ini gue banget". MAKSIMAL 15 KATA (STRICT).
- Story 2 (07:45 WITA) - EDUKASI MIKRO: 1 penjelasan sederhana + analogi HP/AI yang gampang dicerna. MAKSIMAL 25 KATA (STRICT).
- Story 3 (13:00 WITA) - PRAKTIK: 1 trik pelepasan rasa sesak/tegang 60 detik (bisa nafas tenang, letak tangan, atau nulis di kertas).
- Story 4 (20:00 WITA) - BUKTI: Kisah nyata teman curhat / meja terapi di Parepare yang bikin pembaca merasa "Ternyata bukan cuma aku yang ngerasain ini".
- Story 5 (21:00 WITA) - CTA HALUS: Refleksi hangat penutup malam + ajakan balas dengan 1 KATA KUNCI (${pilar.defaultKeyword}).

Visual Guide:
Sertakan headline singkat (3-5 kata), palet warna yang tenang, dan elemen visual minimalis.

Keluaran WAJIB HANYA JSON valid:
{
  "topic": "Judul Obrolan Hari Ini",
  "keyword": "${pilar.defaultKeyword}",
  "stories": [
    {
      "slide": 1,
      "time": "07:00",
      "act": "HOOK",
      "text": "Teks naskah hook max 15 kata",
      "visualGuide": {
        "headline": "Judul Singkat Menusuk",
        "palette": "Dark Slate & Warm Sand",
        "elements": "Desain minimalis 9:16 tenang"
      }
    },
    {
      "slide": 2,
      "time": "07:45",
      "act": "EDUKASI MIKRO",
      "text": "Teks edukasi mikro max 25 kata dengan analogi HP/AI",
      "visualGuide": {
        "headline": "Judul Konsep Sederhana",
        "palette": "Dark Slate & Warm Gold",
        "elements": "Ruang negatif lega"
      }
    },
    {
      "slide": 3,
      "time": "13:00",
      "act": "PRAKTIK",
      "text": "Langkah praktis 60 detik yang gampang dilakukan",
      "visualGuide": {
        "headline": "Judul Latihan 60 Detik",
        "palette": "Forest Sage & Sand",
        "elements": "Instruksi bernafas teratur"
      }
    },
    {
      "slide": 4,
      "time": "20:00",
      "act": "BUKTI",
      "text": "Cerita nyata meja terapi Parepare yang menghangatkan hati",
      "visualGuide": {
        "headline": "Judul Kisah Nyata",
        "palette": "Muted Slate hangat",
        "elements": "Format kutipan reflektif"
      }
    },
    {
      "slide": 5,
      "time": "21:00",
      "act": "CTA HALUS",
      "text": "Pesan malam hangat dan ajakan balas ketik ${pilar.defaultKeyword}",
      "visualGuide": {
        "headline": "Judul Malam Damai",
        "palette": "Deep Night Slate & Soft Sand",
        "elements": "Ajakan interaktif ramah"
      }
    }
  ]
}`;
}

/**
 * Generate 5 Story V2.1
 */
async function generateStoryV2(options = {}) {
  const targetDate = options.date ? new Date(options.date) : new Date();
  const pillarKey = resolvePillar(options.pillar, targetDate);
  const pilar = PILLARS[pillarKey];
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Makassar",
  }).format(targetDate);

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(pillarKey);
    const userPrompt = `Buatkan 5 babak Story WhatsApp Dokter Pikiran untuk hari ini tanggal ${dateStr} dengan pilar ${pillarKey}. Wajib pakai bahasa manusiawi yang hangat dan empati, tanpa istilah medis rumit. Hook maksimal 15 kata, Edukasi maksimal 25 kata.`;

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.85,
          },
        });

        const rawText = response.text ? response.text.trim() : "";
        if (rawText) {
          let cleaned = rawText;
          const match = rawText.match(/```(?:json)?\s*([\s\S]*?)```/i);
          if (match) cleaned = match[1].trim();

          const parsed = JSON.parse(cleaned);
          if (Array.isArray(parsed.stories) && parsed.stories.length === 5) {
            const sanitizedStories = enforceStoryWordLimits(parsed.stories);
            return {
              success: true,
              date: dateStr,
              pillar: pillarKey,
              pillarTitle: pilar.title,
              themeColor: pilar.themeColor,
              accentColor: pilar.accentColor,
              topic: parsed.topic || pilar.title,
              keyword: parsed.keyword || pilar.defaultKeyword,
              source: "gemini",
              model,
              stories: sanitizedStories,
            };
          }
        }
      } catch (err) {
        console.warn(`[StoryEngineV2] Model ${model} gagal:`, err.message || err);
      }
    }
  }

  // Fallback Kurasi Editorial Berkualitas Tinggi
  const curated = CURATED_STORIES[pillarKey] || CURATED_STORIES.PIKIRAN;
  const sanitizedFallback = enforceStoryWordLimits(curated.stories);

  return {
    success: true,
    date: dateStr,
    pillar: pillarKey,
    pillarTitle: pilar.title,
    themeColor: pilar.themeColor,
    accentColor: pilar.accentColor,
    topic: curated.topic,
    keyword: curated.keyword,
    source: "curated_fallback",
    model: "DokterPikiran-Curated-V2.1",
    stories: sanitizedFallback,
  };
}

module.exports = {
  BRAND_IDENTITY,
  PILLARS,
  CURATED_STORIES,
  resolvePillar,
  enforceStoryWordLimits,
  generateStoryV2,
};
