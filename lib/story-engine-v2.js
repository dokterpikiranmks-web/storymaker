/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2.2 — AI Engine (lib/story-engine-v2.js)
 *  Brand: Dokter Pikiran (Ahmad Jawahir Zain)
 * ════════════════════════════════════════════════════════════════════════════
 *  Overhaul V2.2:
 *  - Paradoxical Insight & Anti-Generic Knowledge.
 *  - Daftar Larangan Keras (Blacklist Klise Wellness: anti-napas biasa, anti-diet kopi/pedas, anti-berpikir positif, anti-me time).
 *  - The Paradoxical Truth: Anomali biologis & psikologis nyata yang membalikkan asumsi awam.
 *  - Teknik Somatik Mikro 60 Detik Nyata: Physiological Sigh, Sub-occipital Lateral Eye Reset, Jaw Release / Trigeminal Unclench.
 *  - Struktur Format Ketat 5 Story: Hook <= 15 kata, Edukasi <= 25 kata, Bukti meja terapi Parepare, CTA Halus PDF.
 * ════════════════════════════════════════════════════════════════════════════
 */

const { GoogleGenAI } = require("@google/genai");

// Identitas Brand & Persona Resmi Dokter Pikiran
const BRAND_IDENTITY = {
  creator: "Ahmad Jawahir Zain",
  brand: "Dokter Pikiran",
  location: "Parepare, Sulawesi Selatan (WITA)",
  persona:
    "Hipnoterapis klinis & solo developer AI di Parepare yang mengurai anomali biologis dan psikologis bawah sadar secara membumi, berbasis sains sistem saraf nyata tanpa klise motivasi murahan.",
  audience:
    "Pria & wanita usia 25-45 tahun yang lelah dengan tips wellness pasaran, mengalami psikosomatis (asam lambung, sesak, insomnia, leher kaku), dan mencari akar biologis-psikologis yang nyata.",
  tone:
    "Otoritas tinggi, hangat, membumi, membuka mata lewat wawasan paradoks (paradoxical insight), tajam, tanpa istilah medis akademis yang membingungkan, dan anti-klise.",
};

// 3 Pilar Konten Mutlak (1 pilar per hari, tidak boleh campur)
const PILLARS = {
  PIKIRAN: {
    key: "PIKIRAN",
    title: "Bawah Sadar, Belief System & Suara Batin",
    description: "Mengurai error mismatch afirmasi positif, subvocal rumination, dan pemutusan alarm bawah sadar.",
    defaultKeyword: "RESET",
    themeColor: "#1E293B", // Muted Dark Slate
    accentColor: "#FDE047", // Warm Gold
  },
  TUBUH: {
    key: "TUBUH",
    title: "Gut-Brain, Sistem Saraf & Paradoks Tubuh",
    description: "Anomali klep asam lambung, relaxation-induced anxiety, sleep effort paradox, dan kuncian saraf somatik.",
    defaultKeyword: "LAMBUNG",
    themeColor: "#1B2E24", // Deep Forest Sage
    accentColor: "#86EFAC", // Soft Mint Green
  },
  TEKNOLOGI: {
    key: "TEKNOLOGI",
    title: "Arsitektur Otak, Pre-trained Weights & Overthinking",
    description: "Analogi pre-trained weights bawah sadar, fine-tuning sistem saraf, dan pembersihan background process otak.",
    defaultKeyword: "FOKUS",
    themeColor: "#17202A", // Deep Charcoal Slate
    accentColor: "#93C5FD", // Soft Blue Ice
  },
};

// Kurasi Editorial Berstandar Emas V2.2 (Paradoxical Insight & Anti-Klise)
const CURATED_STORIES = {
  TUBUH: {
    topic: "Kenapa Asam Lambung Kambuh Justru Bukan Karena Kelebihan Asam?",
    keyword: "LAMBUNG",
    stories: [
      {
        slide: 1,
        time: "07:00",
        act: "HOOK",
        text: "Asam lambung perih saat cemas? Lambungmu bukan kelebihan asam, tapi kekurangan asam.",
        visualGuide: {
          headline: "Paradoks Asam Lambung",
          palette: "Forest Sage & Warm Linen",
          elements: "Kartu 9:16 minimalis berwibawa, membongkar mitos asam lambung",
        },
      },
      {
        slide: 2,
        time: "07:45",
        act: "EDUKASI",
        text: "Saat saraf siaga aktif, lambung kekurangan asam. Klep esofagus gagal mengunci rapat, sehingga uap asam bocor naik ke dada.",
        visualGuide: {
          headline: "Klep Gagal Mengunci",
          palette: "Forest Sage & Mint",
          elements: "Highlight box mekanisme katup lambung saat saraf simpatik aktif",
        },
      },
      {
        slide: 3,
        time: "13:00",
        act: "PRAKTIK",
        text: "Jaw Release 60 Detik: Renggangkan rahang, buka mulut santai, lalu tempelkan ujung lidah ke langit-langit mulut. Ini memutus sinyal darurat lambung seketika.",
        visualGuide: {
          headline: "Trigeminal Jaw Release",
          palette: "Sage Green & Sand",
          elements: "Instruksi manuver pelepasan saraf trigeminal rahang dan lambung",
        },
      },
      {
        slide: 4,
        time: "20:00",
        act: "BUKTI",
        text: "Kasus meja terapi Parepare: bertahun-tahun pasien menghindari kopi dan pantang makan, tapi lambung tetap perih. Begitu kuncian saraf rahang dan alarm paniknya direset, keluhan asamnya lenyap.",
        visualGuide: {
          headline: "Kasus Meja Terapi",
          palette: "Deep Forest Muted",
          elements: "Kutipan refleksi nyata anomali tubuh dari Parepare",
        },
      },
      {
        slide: 5,
        time: "21:00",
        act: "CTA HALUS",
        text: "Lambungmu bukan musuh, dia hanya merespons alarm darurat yang belum kamu matikan. Malam ini istirahatkan sarafmu. Mau panduan PDF 60 Detik Atasi Asam Lambung Psikosomatis? Balas story ini: LAMBUNG.",
        visualGuide: {
          headline: "Istirahatkan Saraf Malam Ini",
          palette: "Night Forest & Soft Sand",
          elements: "Pesan penutup tenang dengan pemicu keyword LAMBUNG",
        },
      },
    ],
  },

  PIKIRAN: {
    topic: "Kenapa Memaksa Berpikir Positif Justru Bikin Cemas Makin Parah?",
    keyword: "RESET",
    stories: [
      {
        slide: 1,
        time: "07:00",
        act: "HOOK",
        text: "Memaksa afirmasi positif saat cemas membuat otak membacanya sebagai ancaman kebohongan.",
        visualGuide: {
          headline: "Paradoks Afirmasi Positif",
          palette: "Dark Slate & Warm Sand",
          elements: "Kartu 9:16 minimalis elegan dengan tanda kutip filosofis",
        },
      },
      {
        slide: 2,
        time: "07:45",
        act: "EDUKASI",
        text: "Bawah sadar bekerja mendeteksi ancaman. Saat panik dipaksa 'aku tenang', otak mendeteksi error mismatch dan menaikkan alarm bahaya berlipat ganda.",
        visualGuide: {
          headline: "Error Mismatch Batin",
          palette: "Dark Slate dengan aksen Gold",
          elements: "Analogi pendeteksi error sistem logika dan alarm bawah sadar",
        },
      },
      {
        slide: 3,
        time: "13:00",
        act: "PRAKTIK",
        text: "Sub-occipital Eye Reset 60 Detik: Tanpa menolehkan kepala, lirikkan bola mata ke sudut kanan selama 30 detik sampai ada reflek menguap atau menelan. Kuncian saraf leher belakang langsung lepas.",
        visualGuide: {
          headline: "Lateral Eye Reset",
          palette: "Forest Slate & Linen",
          elements: "Manuver lateral bola mata untuk mereset kuncian saraf leher",
        },
      },
      {
        slide: 4,
        time: "20:00",
        act: "BUKTI",
        text: "Di ruang terapi Parepare, mereka yang paling lelah mentalnya justru yang paling rajin memaksakan afirmasi positif tiap pagi, padahal sistem sarafnya sedang freeze dan butuh rasa aman ragawi.",
        visualGuide: {
          headline: "Fakta Ruang Terapi",
          palette: "Muted Slate hangat",
          elements: "Refleksi mendalam kasus penolakan bawah sadar",
        },
      },
      {
        slide: 5,
        time: "21:00",
        act: "CTA HALUS",
        text: "Pikiranmu tidak butuh kata manis palsu, dia hanya butuh sinyal fisik bahwa kamu aman. Malam ini izinkan dirimu tenang. Mau panduan PDF Reset Sistem Saraf Bawah Sadar? Balas story ini: RESET.",
        visualGuide: {
          headline: "Beri Tubuh Rasa Aman",
          palette: "Night Deep Slate & Warm Sand",
          elements: "Pesan reflektif malam dengan pemicu keyword RESET",
        },
      },
    ],
  },

  TEKNOLOGI: {
    topic: "Bawah Sadar Itu Pre-trained Weights: Kenapa Motivasi Gagal Mereset Otak?",
    keyword: "FOKUS",
    stories: [
      {
        slide: 1,
        time: "07:00",
        act: "HOOK",
        text: "Menghentikan overthinking dengan motivasi sama sia-sianya seperti mengubah AI hanya lewat prompt sekilas.",
        visualGuide: {
          headline: "Bukan Kurang Motivasi",
          palette: "Deep Slate & Soft Blue",
          elements: "Desain kartu clean, analogi arsitektur model AI cerdas",
        },
      },
      {
        slide: 2,
        time: "07:45",
        act: "EDUKASI",
        text: "Bawah sadar persis pre-trained weights model AI dari ribuan jam masa kecil. Mengubahnya butuh fine-tuning konsisten, bukan sekadar mengganti prompt di permukaan.",
        visualGuide: {
          headline: "Pre-trained Weights Batin",
          palette: "Dark Slate & Ice Blue",
          elements: "Analogi deep learning memori bawah sadar",
        },
      },
      {
        slide: 3,
        time: "13:00",
        act: "PRAKTIK",
        text: "Physiological Sigh 60 Detik: Ambil dua tarikan napas pendek cepat lewat hidung, lalu hembuskan panjang lewat mulut. Alveoli paru-paru mekar seketika dan detak jantung melambat dalam 30 detik.",
        visualGuide: {
          headline: "Physiological Sigh",
          palette: "Slate Clean & Sand",
          elements: "Langkah 2 tarikan pendek dan 1 hembusan panjang lega",
        },
      },
      {
        slide: 4,
        time: "20:00",
        act: "BUKTI",
        text: "Sebagai solo dev AI sekaligus praktisi Parepare: ketakutan berulang di kepala sebenarnya adalah subvocal rumination—gerakan mikro pita suara tanpa suara. Saat lidah rileks menempel di langit-langit, overthinking berhenti otomatis.",
        visualGuide: {
          headline: "Catatan Dev & Terapi",
          palette: "Deep Slate hangat",
          elements: "Wawasan persilangan neurosains dan komputasi",
        },
      },
      {
        slide: 5,
        time: "21:00",
        act: "CTA HALUS",
        text: "Otakmu tidak rusak, dia hanya butuh shutdown rapi dari background process yang menumpuk. Mau panduan PDF Fine-Tuning Bawah Sadar & Hentikan Overthinking? Balas story ini: FOKUS.",
        visualGuide: {
          headline: "Shutdown Bersih Malam Ini",
          palette: "Dark Night & Warm White",
          elements: "Pesan hangat penutup hari dengan pemicu keyword FOKUS",
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
    const actUpper = (copy.act || "").toUpperCase();
    if (actUpper.includes("HOOK")) {
      const words = copy.text.trim().split(/\s+/);
      if (words.length > 15) {
        copy.text = words.slice(0, 15).join(" ") + "...";
      }
    } else if (actUpper.includes("EDUKASI")) {
      const words = copy.text.trim().split(/\s+/);
      if (words.length > 25) {
        copy.text = words.slice(0, 25).join(" ") + "...";
      }
    }
    return copy;
  });
}

/**
 * System prompt V2.2 — Paradoxical Insight & Anti-Generic Knowledge
 */
function buildSystemPrompt(pillarKey) {
  const pilar = PILLARS[pillarKey];
  return `Anda adalah ${BRAND_IDENTITY.creator}, pendiri brand ${BRAND_IDENTITY.brand} di Parepare, Sulawesi Selatan.
Persona: ${BRAND_IDENTITY.persona}
Target Audiens: ${BRAND_IDENTITY.audience}
Gaya Bahasa: ${BRAND_IDENTITY.tone}

════════════════════════════════════════════════════════════════════════════════
4 PILAR MUTLAK PROMPT ENGINE V2.2 (PARADOXICAL INSIGHT & ANTI-GENERIC KNOWLEDGE)
════════════════════════════════════════════════════════════════════════════════

PILAR 1: DAFTAR LARANGAN KERAS (NEGATIVE CONSTRAINTS / BLACKLIST KLISE)
DILARANG KERAS menghasilkan solusi klise murahan berikut:
1. JANGAN sarankan "Tarik napas dalam-dalam" atau "Latihan napas 4-7-8 biasa" (terlalu pasaran dan tidak bekerja saat panik akut).
2. JANGAN sarankan "Hindari makanan pedas, asam, atau kopi" (itu ranah dokter umum/gizi biasa, bukan akar psikosomatis sistem saraf).
3. JANGAN gunakan frasa "Berpikir positif", "Jangan stres", atau "Tenangkan pikiran" (tidak berguna bagi orang yang sistem sarafnya sedang freeze atau terjebak alarm bahaya).
4. JANGAN sarankan "Coba luangkan waktu me-time atau relaksasi" (terlalu generik dan tidak solutif).

PILAR 2: CORE THEME: THE PARADOXICAL TRUTH (WAJIB MENGANGKAT CARA KERJA TERBALIK TUBUH & PIKIRAN)
Setiap naskah WAJIB mengangkat anomali biologis/psikologis nyata yang membalikkan asumsi awam:
- Jika Pilar TUBUH (Gut-Brain & Sistem Saraf):
  * Asam lambung naik saat panik sering kali BUKAN karena kelebihan asam, melainkan lambung kekurangan asam akibat saraf simpatik aktif, sehingga klep esofagus gagal mengunci rapat.
  * Relaxation-Induced Anxiety: Saat hari libur atau santai tubuh justru lemas, lambung perih, atau migrain (karena otak terbiasa siaga tinggi dan menganggap keheningan sebagai "ancaman sebelum badai").
  * Sleep Effort Paradox: Semakin dipaksa tidur cepat, mata justru semakin terjaga segar (otak mendeteksi usaha sadar untuk tidur sebagai tanda darurat bahaya).
- Jika Pilar PIKIRAN (Subconscious & Belief System):
  * Kenapa afirmasi positif gagal total: Saat bawah sadar merasa tidak aman, kata-kata manis justru terbaca sebagai ancaman penipuan (error mismatch) yang melipatgandakan kecemasan.
  * Subvocal Rumination: Suara batin yang mendikte ketakutan dan overthinking sebenarnya menggerakkan pita suara dan lidah secara mikro tanpa kita sadari.
- Jika Pilar TEKNOLOGI (AI Analogy):
  * Bawah sadar seperti pre-trained weights model AI yang dilatih ribuan jam sejak masa kecil. Mengubahnya butuh fine-tuning somatik konsisten, bukan sekadar mengganti prompt di permukaan.

PILAR 3: TEKNIK SOMATIK MIKRO 60 DETIK (STORY 3 - ANTI-MAINSTREAM)
Hanya berikan salah satu manuver fisik mikro anatomis nyata yang langsung dirasakan efeknya:
- Physiological Sigh: Dua tarikan napas pendek cepat lewat hidung, dihembuskan satu tarikan panjang perlahan lewat mulut (mereset alveoli paru-paru dan melambatkan detak jantung dalam 30 detik).
- Sub-occipital Lateral Eye Reset: Melirikkan bola mata ke sudut kanan tanpa menolehkan kepala selama 30 detik sampai ada reflek menguap atau menelan (mereset kuncian saraf leher belakang dan alarm bahaya).
- Jaw Release / Trigeminal Unclench: Merenggangkan rahang sedikit lalu membuka mulut santai sambil menempelkan ujung lidah ke langit-langit mulut (memutus sinyal darurat lambung dan menghentikan suara overthinking di kepala).

PILAR 4: STRUKTUR FORMAT KETAT 5 STORY (9:16 VERTICAL FORMAT)
- Story 1 (07:00 WITA) - HOOK: Pertanyaan / bantahan mitos yang menembus asumsi umum. MAKSIMAL 15 KATA (STRICT).
- Story 2 (07:45 WITA) - EDUKASI: Mekanisme paradoks + analogi sistem komputer/AI. MAKSIMAL 25 KATA (STRICT).
- Story 3 (13:00 WITA) - PRAKTIK: Manuver fisik mikro 60 detik (hanya Physiological Sigh, Lateral Eye Reset, atau Jaw/Trigeminal Release).
- Story 4 (20:00 WITA) - BUKTI: Kasus meja terapi Parepare / data riil anomali tubuh yang membuktikan kebenaran paradoks tersebut.
- Story 5 (21:00 WITA) - CTA HALUS: Refleksi malam hangat + ajakan ketik kata kunci (${pilar.defaultKeyword}) untuk mendapatkan link panduan PDF.

FORMAT KELUARAN WAJIB HANYA JSON VALID:
{
  "topic": "Judul Naskah Paradoks Hari Ini",
  "keyword": "${pilar.defaultKeyword}",
  "stories": [
    {
      "slide": 1,
      "time": "07:00",
      "act": "HOOK",
      "text": "Teks naskah hook membongkar mitos maksimal 15 kata",
      "visualGuide": {
        "headline": "Judul Singkat Menusuk",
        "palette": "Dark Slate & Warm Sand",
        "elements": "Desain minimalis 9:16 tenang dan elegan"
      }
    },
    {
      "slide": 2,
      "time": "07:45",
      "act": "EDUKASI",
      "text": "Teks edukasi paradoks + analogi sistem AI maksimal 25 kata",
      "visualGuide": {
        "headline": "Judul Konsep Paradoks",
        "palette": "Dark Slate & Warm Gold",
        "elements": "Highlight box konsep paradoks"
      }
    },
    {
      "slide": 3,
      "time": "13:00",
      "act": "PRAKTIK",
      "text": "Panduan manuver somatik mikro 60 detik nyata",
      "visualGuide": {
        "headline": "Nama Manuver 60 Detik",
        "palette": "Forest Sage & Sand",
        "elements": "Instruksi fisik anatomis mikro"
      }
    },
    {
      "slide": 4,
      "time": "20:00",
      "act": "BUKTI",
      "text": "Kisah meja terapi Parepare membuktikan anomali paradoks",
      "visualGuide": {
        "headline": "Judul Kasus Meja Terapi",
        "palette": "Muted Slate hangat",
        "elements": "Format kutipan reflektif dari Parepare"
      }
    },
    {
      "slide": 5,
      "time": "21:00",
      "act": "CTA HALUS",
      "text": "Pesan malam hangat dan ajakan balas ketik ${pilar.defaultKeyword}",
      "visualGuide": {
        "headline": "Judul Refleksi Malam",
        "palette": "Deep Night Slate & Soft Sand",
        "elements": "Ajakan santai penutup malam"
      }
    }
  ]
}`;
}

/**
 * Generate 5 Story V2.2
 */
async function generateStoryV2(options = {}) {
  const targetDate = options.date ? new Date(options.date) : new Date();
  const pillarKey = resolvePillar(options.pillar, targetDate);
  const pilar = PILLARS[pillarKey];
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const userTopic = (options.topic || options.customTopic || options.rawThought || "").trim();

  const dateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Makassar",
  }).format(targetDate);

  if (apiKey) {
    const ai = new GoogleGenAI({ apiKey });
    const systemPrompt = buildSystemPrompt(pillarKey);
    let userPrompt = `Buatkan 5 babak Story WhatsApp Dokter Pikiran V2.2 untuk hari ini tanggal ${dateStr} dengan pilar ${pillarKey}.
WAJIB patuhi 4 Pilar Aturan V2.2:
1. Blacklist Klise: Dilarang napas 4-7-8 biasa, dilarang pantang makanan pedas/kopi, dilarang berpikir positif/jangan stres, dilarang me-time.
2. Paradoxical Truth: Wajib angkat mekanisme cara kerja terbalik/anomali tubuh atau pikiran yang mengejutkan.
3. Somatik Mikro 60 Detik: Praktik wajib salah satu dari Physiological Sigh, Sub-occipital Eye Reset, atau Trigeminal Jaw Release.
4. Format Ketat: Hook max 15 kata, Edukasi max 25 kata, Bukti meja terapi Parepare, CTA Halus ketik ${pilar.defaultKeyword}.`;

    if (userTopic) {
      userPrompt += `\n\nFOKUS TOPIK / CATATAN KHUSUS DARI USER:\n"${userTopic}"\nBuat 5 babak naskah yang berfokus mendalam pada topik ini sesuai standar paradoks & anti-klise V2.2.`;
    }

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
              topic: userTopic || parsed.topic || pilar.title,
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

  // Fallback Kurasi Editorial Berkualitas Tinggi V2.2 (Paradoxical Insight)
  const curated = CURATED_STORIES[pillarKey] || CURATED_STORIES.TUBUH;
  const fallbackStories = curated.stories.map((s, idx) => {
    if (userTopic && idx === 0) {
      return {
        ...s,
        text: `Tentang ${userTopic}: kamu tidak malas, alarm tubuhmu sedang siaga penuh.`,
        visualGuide: {
          ...s.visualGuide,
          headline: userTopic.length > 25 ? userTopic.slice(0, 25) + "..." : userTopic,
        },
      };
    }
    return s;
  });

  const sanitizedFallback = enforceStoryWordLimits(fallbackStories);

  return {
    success: true,
    date: dateStr,
    pillar: pillarKey,
    pillarTitle: pilar.title,
    themeColor: pilar.themeColor,
    accentColor: pilar.accentColor,
    topic: userTopic || curated.topic,
    keyword: curated.keyword,
    source: "curated_fallback",
    model: "DokterPikiran-Curated-V2.2",
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
