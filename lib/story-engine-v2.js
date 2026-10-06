/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2 — AI Engine (lib/story-engine-v2.js)
 *  Brand: Dokter Pikiran (Ahmad Jawahir Zain)
 * ════════════════════════════════════════════════════════════════════════════
 *  5-Act WhatsApp Story Framework:
 *  - Story 1 (07:00 WITA) HOOK: Pertanyaan menusuk / myth busting (Max 15 kata)
 *  - Story 2 (07:45 WITA) EDUKASI MIKRO: 1 konsep ilmiah + analogi AI (Max 25 kata)
 *  - Story 3 (13:00 WITA) PRAKTIK: 1 teknik somatik/regulasi 60 detik
 *  - Story 4 (20:00 WITA) BUKTI: Kasus mikro anonim / data / analogi AI
 *  - Story 5 (21:00 WITA) CTA HALUS: Refleksi malam + ajakan balas 1 kata kunci
 * ════════════════════════════════════════════════════════════════════════════
 */

const { GoogleGenAI } = require("@google/genai");

// Identitas Brand & Persona Resmi Dokter Pikiran
const BRAND_IDENTITY = {
  creator: "Ahmad Jawahir Zain",
  brand: "Dokter Pikiran",
  location: "Parepare, Sulawesi Selatan (WITA)",
  persona:
    "Hipnoterapis klinis, praktisi Functional Holistic Medicine, dan AI Agent Solo Developer berbasis di Parepare.",
  audience:
    "Pria & wanita usia 25-45 tahun (profesional, pebisnis, creator) yang mengalami overthinking, kecemasan, insomnia, GERD psikosomatik, dan burnout produktivitas.",
  tone:
    "Hangat, ilmiah namun membumi, analogi sistem AI & komputasi elegan, santai berwibawa, anti-generik, tanpa janji sembuh instan 100%, tanpa takhayul/mistis/mata spiral hipnosis kuno.",
  visualStyle:
    "Kartu editorial vertikal format 9:16. Tipografi clean sans-serif berpadu serif editorial lembut. Palet warna: Muted Slate (#2C3E50), Forest Sage (#4A6B5D), Sand / Linen Warm (#E8DFD8). Desain bernapas, minimalis, tenang.",
};

// 3 Pilar Konten Mutlak (1 pilar per hari, tidak boleh campur)
const PILLARS = {
  PIKIRAN: {
    key: "PIKIRAN",
    title: "Alam Bawah Sadar, Hipnoterapi & Belief System",
    description: "Hipnoterapi klinis, reprogram belief bawah sadar, trauma rilis, regulasi overthinking.",
    defaultKeyword: "RESET",
    palette: "Muted Slate (#2C3E50) & Warm Sand (#E8DFD8)",
  },
  TUBUH: {
    key: "TUBUH",
    title: "Functional Medicine, Gut-Brain Axis & Hormon",
    description: "Gut-brain axis, saraf vagus, lambung/GERD psikosomatik, ritme kortisol & tidur pemulihan.",
    defaultKeyword: "LAMBUNG",
    palette: "Forest Sage (#4A6B5D) & Sand (#F4EFEA)",
  },
  TEKNOLOGI: {
    key: "TEKNOLOGI",
    title: "AI Agent, Sistem Kognitif & Mental Productivity",
    description: "Analogi sistem AI Agent untuk kestabilan kognitif, pencegahan burnout, debugging mental.",
    defaultKeyword: "FOKUS",
    palette: "Muted Slate (#202830) & Forest Sage (#52796F)",
  },
};

// Kurasi Editorial Fallback Berstandar Emas (Dokter Pikiran High-Fidelity)
const CURATED_STORIES = {
  PIKIRAN: {
    topic: "Overthinking & Background Process Bawah Sadar",
    keyword: "RESET",
    stories: [
      {
        slide: 1,
        time: "07:00",
        act: "HOOK",
        text: "Kamu tidak malas. Pikiran bawah sadarmu cuma kelelahan memproses memori yang belum selesai.",
        visualGuide: {
          headline: "Bukan Malas, Tapi Lelah Batin",
          palette: "Muted Slate (#2C3E50) dan Sand (#E8DFD8)",
          elements: "Tipografi minimalis 9:16, ruang negatif lapang, aksen garis tipis linen lembut.",
        },
      },
      {
        slide: 2,
        time: "07:45",
        act: "EDUKASI MIKRO",
        text: "Otak bawah sadar bekerja seperti background task AI. Belief lama yang tak relevan menguras 70% energimu diam-diam.",
        visualGuide: {
          headline: "Background Task Pikiran",
          palette: "Muted Slate dengan aksen Sage",
          elements: "Diagram arsitektur alur sederhana: Memory Stack -> Processing Energy.",
        },
      },
      {
        slide: 3,
        time: "13:00",
        act: "PRAKTIK",
        text: "Teknik Grounding 60 Detik: Letakkan telapak tangan di dada tengah. Ambil napas 4 detik, buang 6 detik lewat bibir rileks. Ucapkan dalam hati: 'Saat ini saya aman'.",
        visualGuide: {
          headline: "Jeda Somatik 60 Detik",
          palette: "Forest Sage lembut dan Sand",
          elements: "Ikon napas ritmis melingkar, tata letak kartu tenang dengan instruksi jelas langkah demi langkah.",
        },
      },
      {
        slide: 4,
        time: "20:00",
        act: "BUKTI",
        text: "Klien eksekutif 36 tahun selalu cemas menjelang rapat. Di sesi hipnoterapi, kami me-reset belief takut dihakimi sejak masa sekolah. Sesak dadanya reda permanen.",
        visualGuide: {
          headline: "Catatan Meja Terapi #42",
          palette: "Muted Slate monokromatis elegan",
          elements: "Format kutipan klinis anonim, badge verifikasi kasus Parepare, tipografi serif hangat.",
        },
      },
      {
        slide: 5,
        time: "21:00",
        act: "CTA HALUS",
        text: "Malam ini tutup semua tab di kepalamu. Kamu berhak istirahat utuh. Mau panduan audio reset bawah sadar 3 menit sebelum tidur? Balas pesan ini dengan ketik: RESET.",
        visualGuide: {
          headline: "Mode Istirahat Malam",
          palette: "Deep Night Slate dan Warm Sand",
          elements: "Gradien gelap lembut, tombol virtual bertuliskan 'Ketik RESET', nuansa temaram menenangkan.",
        },
      },
    ],
  },

  TUBUH: {
    topic: "Saraf Vagus, Asam Lambung & Gut-Brain Axis",
    keyword: "LAMBUNG",
    stories: [
      {
        slide: 1,
        time: "07:00",
        act: "HOOK",
        text: "Dada terasa panas mengganjal setiap cemas? Lambungmu sedang merespons alarm bahaya di otak.",
        visualGuide: {
          headline: "Saat Lambung Bicara untuk Otak",
          palette: "Forest Sage (#4A6B5D) dan Sand (#F4EFEA)",
          elements: "Tampilan editorial kartu 9:16 elegan, palet herbal earthy, tipografi kontras bersih.",
        },
      },
      {
        slide: 2,
        time: "07:45",
        act: "EDUKASI MIKRO",
        text: "Saraf vagus adalah koneksi langsung otak ke usus. Kortisol tinggi mengunci katup lambung persis seperti server timeout.",
        visualGuide: {
          headline: "Gut-Brain Connection",
          palette: "Forest Sage dan Muted Sand",
          elements: "Ilustrasi anatomi minimalis sumbu vagus (otak menuju lambung) tanpa kesan mistis.",
        },
      },
      {
        slide: 3,
        time: "13:00",
        act: "PRAKTIK",
        text: "Rilis Katup Lambung 60 Detik: Pijat melingkar titik 3 jari di atas pergelangan tangan bagian dalam (PC-6). Hembuskan napas panjang dengan desah pelan 'haa'.",
        visualGuide: {
          headline: "Stimulasi Titik PC-6",
          palette: "Linen Sand dan Sage Green",
          elements: "Diagram titik akupresur titik pergelangan tangan bergaris rapi dengan penunjuk detik.",
        },
      },
      {
        slide: 4,
        time: "20:00",
        act: "BUKTI",
        text: "Klien 29 tahun mengeluh maag bolak-balik minum antasida tiap sore. Ternyata dipicu kebiasaan menahan emosi marah di kantor. Lambung membaik seiring regulasi saraf vagal.",
        visualGuide: {
          headline: "Resolusi Kasus Psikosomatik",
          palette: "Muted Slate dan Forest Sage",
          elements: "Kotak narasi studi kasus profesional, tipografi bersih dengan spasi lebar.",
        },
      },
      {
        slide: 5,
        time: "21:00",
        act: "CTA HALUS",
        text: "Perut nyaman mengantarkan tidur lelap. Malam ini, kendurkan rahang dan bahumu. Butuh protokol seduhan herbal & napas lambung? Balas story ini dengan ketik: LAMBUNG.",
        visualGuide: {
          headline: "Malam Tenang, Lambung Sejuk",
          palette: "Forest Sage Gelap dan Sand Lembut",
          elements: "Visual kartu minimalis 9:16 dengan ajakan santai interaktif 'Ketik LAMBUNG'.",
        },
      },
    ],
  },

  TEKNOLOGI: {
    topic: "AI Agent Analogy: Cognitive Cache & Mental Garbage Collection",
    keyword: "FOKUS",
    stories: [
      {
        slide: 1,
        time: "07:00",
        act: "HOOK",
        text: "Otakmu tidak rusak. Kamu cuma menjalankan puluhan tab mental tanpa pernah melakukan restart.",
        visualGuide: {
          headline: "Mental RAM yang Penuh",
          palette: "Deep Slate (#202830) dan Soft Sand (#E8DFD8)",
          elements: "Desain kartu clean, font modern tech-minimalist, tanpa visual cyberpunk norak.",
        },
      },
      {
        slide: 2,
        time: "07:45",
        act: "EDUKASI MIKRO",
        text: "AI Agent butuh context memory bersih agar tidak halusinasi. Pikiran manusia pun butuh garbage collection kognitif berkala.",
        visualGuide: {
          headline: "Garbage Collection Kognitif",
          palette: "Muted Slate dengan aksen Sage Line",
          elements: "Skema logis sederhana: Cache Overload -> Context Pruning -> Fresh Output.",
        },
      },
      {
        slide: 3,
        time: "13:00",
        act: "PRAKTIK",
        text: "Protokol Cache Dump 60 Detik: Tulis 3 pikiran yang mengganggu di kertas, lipat, dan taruh di meja. Katakan: 'State ini aman tersimpan, memori kerja sekarang bebas'.",
        visualGuide: {
          headline: "Protokol Cache Dump",
          palette: "Sand Linen dan Muted Charcoal",
          elements: "Langkah terstruktur 1-2-3 dengan batas visual tegas dan penanda waktu.",
        },
      },
      {
        slide: 4,
        time: "20:00",
        act: "BUKTI",
        text: "Sebagai solo developer AI sekaligus terapis di Parepare, polanya identik: prompt buruk memicu bot error, self-talk kusut memicu manusia cemas akut.",
        visualGuide: {
          headline: "Catatan Developer & Terapis",
          palette: "Muted Slate dan Forest Sage",
          elements: "Kutipan reflektif dari Ahmad Jawahir Zain, kredensial ganda dokter pikiran & solo dev.",
        },
      },
      {
        slide: 5,
        time: "21:00",
        act: "CTA HALUS",
        text: "Malam ini biarkan kodemu dikompilasi besok. Istirahatkan prosesormu malam ini. Ingin panduan prompt AI self-reflection Dokter Pikiran? Balas story ini dengan ketik: FOKUS.",
        visualGuide: {
          headline: "Shutdown Mode Malam Hari",
          palette: "Deep Night Slate dan Warm Linen",
          elements: "Tampilan kartu malam dengan aksen glow redup, ajakan interaksi jelas 'Ketik FOKUS'.",
        },
      },
    ],
  },
};

/**
 * Menentukan pilar harian secara otomatis (rotasi seimbang atau parameter eksplisit)
 * @param {string} [requestedPillar] - PIKIRAN | TUBUH | TEKNOLOGI
 * @param {Date} [date]
 * @returns {string}
 */
function resolvePillar(requestedPillar, date = new Date()) {
  if (requestedPillar && PILLARS[requestedPillar.toUpperCase()]) {
    return requestedPillar.toUpperCase();
  }
  // Rotasi berdasarkan hari:
  // Minggu (0) & Rabu (3) => PIKIRAN
  // Senin (1) & Kamis (4) => TUBUH
  // Selasa (2) & Jumat (5) => TEKNOLOGI
  // Sabtu (6) => Rotasi hari
  const day = date.getDay();
  if (day === 0 || day === 3) return "PIKIRAN";
  if (day === 1 || day === 4) return "TUBUH";
  return "TEKNOLOGI";
}

/**
 * Validasi batas kata pada story
 * @param {Array} stories
 * @returns {Array} stories yang sudah dirapikan jika melewati batas
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
 * Menghasilkan prompt ketat untuk Google Gemini
 */
function buildSystemPrompt(pillarKey) {
  const pilar = PILLARS[pillarKey];
  return `Anda adalah ${BRAND_IDENTITY.creator}, pendiri brand ${BRAND_IDENTITY.brand} berbasis di Parepare, Sulawesi Selatan (WITA).
Persona Anda: ${BRAND_IDENTITY.persona}
Target Audiens: ${BRAND_IDENTITY.audience}
Tone: ${BRAND_IDENTITY.tone}
Gaya Visual: ${BRAND_IDENTITY.visualStyle}

ATURAN PILAR HARI INI:
Wajib HANYA membahas pilar [${pilar.key}: ${pilar.title}]. JANGAN mencampur pilar lain.

FORMULA WAJIB 5 STORY (9:16 Vertikal):
1. Story 1 (07:00 WITA) - HOOK: Pertanyaan menusuk atau myth-busting. MAKSIMAL 15 KATA (STRICT).
2. Story 2 (07:45 WITA) - EDUKASI MIKRO: 1 konsep ilmiah mendalam + analogi arsitektur AI/komputasi. MAKSIMAL 25 KATA (STRICT).
3. Story 3 (13:00 WITA) - PRAKTIK: 1 teknik somatik/regulasi pernapasan/stimulasi vagal praktis 60 detik.
4. Story 4 (20:00 WITA) - BUKTI: Kasus mikro anonim meja terapi di Parepare / analogi sistem AI nyata yang menyelesaikan masalah.
5. Story 5 (21:00 WITA) - CTA HALUS: Refleksi penutup malam hari + ajakan membalas WhatsApp dengan 1 KATA KUNCI PEMICU (${pilar.defaultKeyword}).

Visual Guide:
Sertakan headline singkat, palet warna (Muted Slate / Forest Sage / Sand), dan deskripsi elemen visual minimalis tanpa unsur mistis.

Output WAJIB berupa JSON murni dengan format persis:
{
  "topic": "Judul Topik Hari Ini",
  "keyword": "${pilar.defaultKeyword}",
  "stories": [
    {
      "slide": 1,
      "time": "07:00",
      "act": "HOOK",
      "text": "Teks naskah story max 15 kata",
      "visualGuide": {
        "headline": "...",
        "palette": "Muted Slate / Sand",
        "elements": "..."
      }
    },
    {
      "slide": 2,
      "time": "07:45",
      "act": "EDUKASI MIKRO",
      "text": "Teks naskah story max 25 kata",
      "visualGuide": {
        "headline": "...",
        "palette": "Forest Sage / Sand",
        "elements": "..."
      }
    },
    {
      "slide": 3,
      "time": "13:00",
      "act": "PRAKTIK",
      "text": "Panduan teknik 60 detik",
      "visualGuide": {
        "headline": "...",
        "palette": "Forest Sage / Linen Sand",
        "elements": "..."
      }
    },
    {
      "slide": 4,
      "time": "20:00",
      "act": "BUKTI",
      "text": "Studi kasus mikro nyata meja terapi",
      "visualGuide": {
        "headline": "...",
        "palette": "Muted Slate monokrom",
        "elements": "..."
      }
    },
    {
      "slide": 5,
      "time": "21:00",
      "act": "CTA HALUS",
      "text": "Refleksi malam dan ajakan balas ketik ${pilar.defaultKeyword}",
      "visualGuide": {
        "headline": "...",
        "palette": "Deep Night Slate / Sand",
        "elements": "..."
      }
    }
  ]
}`;
}

/**
 * Generate 5 Story V2 via Gemini AI dengan Fallback Cerdas
 * @param {Object} [options]
 * @param {string} [options.pillar] - 'PIKIRAN' | 'TUBUH' | 'TEKNOLOGI'
 * @param {string} [options.date] - YYYY-MM-DD
 * @returns {Promise<Object>}
 */
async function generateStoryV2(options = {}) {
  const targetDate = options.date ? new Date(options.date) : new Date();
  const pillarKey = resolvePillar(options.pillar, targetDate);
  const pilar = PILLARS[pillarKey];
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Makassar",
  }).format(targetDate);

  // Jika ada API Key, gunakan Google GenAI dengan cascade model
  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(pillarKey);
    const userPrompt = `Buatkan 5 babak Story WhatsApp & Instagram untuk Dokter Pikiran hari ini tanggal ${dateStr} dengan pilar ${pillarKey}. Patuhi batas kata untuk Hook (max 15 kata) dan Edukasi (max 25 kata).`;

    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

    for (const model of models) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            temperature: 0.8,
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
              topic: parsed.topic || pilar.title,
              keyword: parsed.keyword || pilar.defaultKeyword,
              source: "gemini",
              model,
              stories: sanitizedStories,
            };
          }
        }
      } catch (err) {
        // Lanjutkan ke model berikutnya dalam cascade jika terjadi error
        console.warn(`[StoryEngineV2] Model ${model} gagal:`, err.message || err);
      }
    }
  }

  // Fallback Kurasi Editorial Berkualitas Tinggi (Dokter Pikiran High-Fidelity)
  const curated = CURATED_STORIES[pillarKey] || CURATED_STORIES.PIKIRAN;
  const sanitizedFallback = enforceStoryWordLimits(curated.stories);

  return {
    success: true,
    date: dateStr,
    pillar: pillarKey,
    pillarTitle: pilar.title,
    topic: curated.topic,
    keyword: curated.keyword,
    source: "curated_fallback",
    model: "DokterPikiran-Curated-V2",
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
