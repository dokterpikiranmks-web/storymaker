/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2.1 — Dynamic Card Renderer (lib/card-renderer.js)
 *  Generates 1080x1920 (9:16) Dynamic Themed PNG cards for WhatsApp Story
 * ════════════════════════════════════════════════════════════════════════════
 *  Revisi:
 *  - Dynamic Daily Themes (Forest Sage, Slate Charcoal, Warm Sand/Obsidian)
 *  - Variasi Layout Per Babak (Quote Centering, Highlight Box, Checklist, Vignette, CTA Box)
 * ════════════════════════════════════════════════════════════════════════════
 */

const { readFile } = require("node:fs/promises");
const path = require("node:path");
const { Resvg } = require("@resvg/resvg-js");
const satori = require("satori").default || require("satori");

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1920;

let cachedFonts = null;

/**
 * Memuat dan meng-cache font WOFF dari folder assets
 */
async function getFonts() {
  if (cachedFonts) return cachedFonts;

  const fontDir = path.join(process.cwd(), "src", "assets", "fonts");

  try {
    const [interRegular, interSemiBold, interBold, playfairSemiBold] = await Promise.all([
      readFile(path.join(fontDir, "inter-latin-400-normal.woff")),
      readFile(path.join(fontDir, "inter-latin-600-normal.woff")),
      readFile(path.join(fontDir, "inter-latin-800-normal.woff")),
      readFile(path.join(fontDir, "playfair-display-latin-600-normal.woff")),
    ]);

    cachedFonts = [
      { name: "Inter", data: interRegular, weight: 400, style: "normal" },
      { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
      { name: "Inter", data: interBold, weight: 800, style: "normal" },
      { name: "Playfair Display", data: playfairSemiBold, weight: 600, style: "normal" },
    ];
  } catch (err) {
    console.warn("⚠️ Gagal memuat custom fonts, menggunakan fallback standar:", err.message);
    cachedFonts = [];
  }

  return cachedFonts;
}

/**
 * Menentukan tema warna dinamis berdasarkan pilar dan hari
 * Sesuai panduan CTO:
 * - TUBUH: Forest Sage (#162621, teks #E4EFE7, aksen #74A892)
 * - PIKIRAN: Slate Charcoal (#1A1E24, teks #F0F4F8, aksen #63B3ED)
 * - TEKNOLOGI / Weekend: Warm Sand / Obsidian (#121214, teks #EDEDED, aksen #E2B774)
 */
function resolveDynamicTheme(pillar = "PIKIRAN", date = new Date()) {
  const p = pillar.toUpperCase();
  const day = (date instanceof Date ? date : new Date(date)).getDay();

  // Mode Forest Sage (Pilar TUBUH atau Hari Selasa/Kamis)
  if (p === "TUBUH" || (p === "AUTO" && (day === 2 || day === 4))) {
    return {
      name: "Forest Sage",
      bgGradient: "linear-gradient(180deg, #162621 0%, #1A2F29 55%, #0F1C18 100%)",
      accentColor: "#74A892",
      textColor: "#E4EFE7",
      subtextColor: "#B8D5C8",
      cardBg: "rgba(116, 168, 146, 0.07)",
      borderColor: "rgba(116, 168, 146, 0.28)",
      pillBg: "rgba(116, 168, 146, 0.16)",
      pillBorder: "rgba(116, 168, 146, 0.4)",
    };
  }

  // Mode Warm Sand / Obsidian (Pilar TEKNOLOGI atau Akhir Pekan Sabtu/Minggu)
  if (p === "TEKNOLOGI" || (p === "AUTO" && (day === 0 || day === 6))) {
    return {
      name: "Warm Obsidian",
      bgGradient: "linear-gradient(180deg, #121214 0%, #1C1B1F 55%, #0A0A0C 100%)",
      accentColor: "#E2B774",
      textColor: "#EDEDED",
      subtextColor: "#EED7B0",
      cardBg: "rgba(226, 183, 116, 0.07)",
      borderColor: "rgba(226, 183, 116, 0.28)",
      pillBg: "rgba(226, 183, 116, 0.16)",
      pillBorder: "rgba(226, 183, 116, 0.4)",
    };
  }

  // Mode Slate Charcoal (Pilar PIKIRAN - Default Hari Senin/Rabu/Jumat)
  return {
    name: "Slate Charcoal",
    bgGradient: "linear-gradient(180deg, #1A1E24 0%, #242A33 55%, #12151A 100%)",
    accentColor: "#63B3ED",
    textColor: "#F0F4F8",
    subtextColor: "#BEE3F8",
    cardBg: "rgba(99, 179, 237, 0.07)",
    borderColor: "rgba(99, 179, 237, 0.28)",
    pillBg: "rgba(99, 179, 237, 0.16)",
    pillBorder: "rgba(99, 179, 237, 0.4)",
  };
}

/**
 * Membangun variasi tata letak kartu berdasarkan jenis Babak
 */
function buildActLayout(story, theme, meta) {
  const actName = (story.act || "STORY").toUpperCase();
  const text = story.text || "";
  const keyword = meta.keyword || "RESET";

  // 1. STORY 1: HOOK — Tata Letak "Quote Centering"
  if (actName.includes("HOOK")) {
    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          margin: "auto 0",
          padding: "60px 40px",
          gap: "28px",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                color: theme.accentColor,
                fontSize: "72px",
                fontFamily: "Playfair Display, serif",
                lineHeight: 0.8,
                opacity: 0.75,
              },
              children: "“",
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontSize: "48px",
                fontWeight: 600,
                lineHeight: 1.45,
                color: theme.textColor,
                letterSpacing: "-0.5px",
                textAlign: "center",
              },
              children: text,
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                marginTop: "16px",
                padding: "8px 24px",
                borderRadius: "100px",
                backgroundColor: theme.pillBg,
                color: theme.accentColor,
                fontSize: "22px",
                fontWeight: 600,
                letterSpacing: "1px",
              },
              children: "BACA PERLAHAN",
            },
          },
        ],
      },
    };
  }

  // 2. STORY 2: EDUKASI MIKRO — Tata Letak "Highlight Concept Box"
  if (actName.includes("EDUKASI")) {
    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.cardBg,
          border: `2px solid ${theme.borderColor}`,
          borderRadius: "36px",
          padding: "64px 56px",
          margin: "auto 0",
          gap: "28px",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "12px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      width: "12px",
                      height: "12px",
                      borderRadius: "6px",
                      backgroundColor: theme.accentColor,
                    },
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      color: theme.accentColor,
                      fontSize: "24px",
                      fontWeight: 700,
                      letterSpacing: "2px",
                    },
                    children: "ANALOGI SEDERHANA",
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontSize: "44px",
                fontWeight: 500,
                lineHeight: 1.55,
                color: theme.textColor,
              },
              children: text,
            },
          },
        ],
      },
    };
  }

  // 3. STORY 3: PRAKTIK — Tata Letak "Checklist / Somatik Action"
  if (actName.includes("PRAKTIK")) {
    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.cardBg,
          border: `2px solid ${theme.borderColor}`,
          borderRadius: "36px",
          padding: "64px 56px",
          margin: "auto 0",
          gap: "28px",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: `1px solid ${theme.borderColor}`,
                paddingBottom: "20px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      color: theme.accentColor,
                      fontSize: "24px",
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                    },
                    children: "LATIHAN 60 DETIK",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      backgroundColor: theme.pillBg,
                      border: `1px solid ${theme.pillBorder}`,
                      padding: "6px 18px",
                      borderRadius: "100px",
                      color: theme.subtextColor,
                      fontSize: "20px",
                      fontWeight: 600,
                    },
                    children: "Bisa Di Mana Saja",
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontSize: "40px",
                fontWeight: 400,
                lineHeight: 1.6,
                color: theme.textColor,
              },
              children: text,
            },
          },
        ],
      },
    };
  }

  // 4. STORY 4: BUKTI — Tata Letak "Story Vignette Meja Terapi"
  if (actName.includes("BUKTI")) {
    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.cardBg,
          border: `2px solid ${theme.borderColor}`,
          borderRadius: "36px",
          padding: "64px 56px",
          margin: "auto 0",
          gap: "24px",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: theme.accentColor,
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "1.5px",
              },
              children: "CATATAN MEJA TERAPI MAKASSAR",
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontSize: "39px",
                fontWeight: 400,
                lineHeight: 1.6,
                color: theme.textColor,
                fontStyle: "italic",
              },
              children: `“${text}”`,
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "22px",
                fontWeight: 500,
                marginTop: "8px",
              },
              children: "— Cerita nyata anonim di ruang klinik Dokter Pikiran",
            },
          },
        ],
      },
    };
  }

  // 5. STORY 5: CTA HALUS — Tata Letak "Action Trigger Box"
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.cardBg,
        border: `2px solid ${theme.borderColor}`,
        borderRadius: "36px",
        padding: "64px 56px",
        margin: "auto 0",
        gap: "32px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              fontSize: "40px",
              fontWeight: 400,
              lineHeight: 1.6,
              color: theme.textColor,
            },
            children: text,
          },
        },
        // Highlight Tombol Interaksi Balas WhatsApp
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.pillBg,
              border: `2px dashed ${theme.accentColor}`,
              borderRadius: "24px",
              padding: "28px 36px",
              gap: "8px",
              marginTop: "12px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontSize: "24px",
                    fontWeight: 500,
                    letterSpacing: "1px",
                  },
                  children: "BALAS STORY INI:",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: theme.accentColor,
                    fontSize: "40px",
                    fontWeight: 800,
                    letterSpacing: "3px",
                  },
                  children: `Ketik "${keyword}"`,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * Menghasilkan elemen virtual node 1080x1920 untuk Satori
 */
function createCardElement(story, meta = {}) {
  const theme = resolveDynamicTheme(meta.pillar, meta.date);
  const headline = story.visualGuide?.headline || "Dokter Pikiran";
  const slideNum = story.slide || 1;
  const time = story.time || "07:00";
  const actName = story.act || "STORY";

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        width: "1080px",
        height: "1920px",
        background: theme.bgGradient,
        padding: "120px 96px",
        justifyContent: "space-between",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
        position: "relative",
      },
      children: [
        // ── TOP HEADER ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: "28px",
            },
            children: [
              // Badge Babak & Jam & Tema
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          backgroundColor: theme.pillBg,
                          border: `1.5px solid ${theme.pillBorder}`,
                          borderRadius: "100px",
                          padding: "12px 28px",
                          color: theme.accentColor,
                          fontSize: "26px",
                          fontWeight: 700,
                          letterSpacing: "2px",
                        },
                        children: `STORY ${slideNum}/5 • ${actName}`,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          color: "rgba(255, 255, 255, 0.6)",
                          fontSize: "24px",
                          fontWeight: 600,
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                              },
                              children: `${time} WITA`,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },

              // Headline Judul
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: "58px",
                    fontWeight: 700,
                    lineHeight: 1.25,
                    color: "#FFFFFF",
                    fontFamily: "Playfair Display, Inter, serif",
                    marginTop: "16px",
                  },
                  children: headline,
                },
              },

              // Garis Aksen Tipis Berwarna Sesuai Tema
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: "140px",
                    height: "4px",
                    backgroundColor: theme.accentColor,
                    borderRadius: "2px",
                  },
                },
              },
            ],
          },
        },

        // ── DYNAMIC ACT CONTENT CONTAINER ──
        buildActLayout(story, theme, meta),

        // ── FOOTER WATERMARK ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              paddingTop: "24px",
              borderTop: "1px solid rgba(255, 255, 255, 0.12)",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          color: "#FFFFFF",
                          fontSize: "24px",
                          fontWeight: 700,
                          letterSpacing: "1.2px",
                        },
                        children: "DOKTER PIKIRAN • Ahmad Jawahir Zain • Makassar",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          color: "rgba(255, 255, 255, 0.45)",
                          fontSize: "18px",
                          marginTop: "4px",
                        },
                        children: "Hipnoterapi Klinis & Sistem Saraf Bawah Sadar",
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "22px",
                    fontWeight: 500,
                  },
                  children: `WhatsApp Story • ${theme.name}`,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * Render 1 Story Slide menjadi Buffer PNG 1080x1920
 */
async function renderStoryCardPng(story, meta = {}) {
  const fonts = await getFonts();
  const element = createCardElement(story, meta);

  const svg = await satori(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 2160 },
    font: { loadSystemFonts: false },
    background: "#000000",
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

/**
 * Render seluruh 5 kartu naskah menjadi array Buffer PNG
 */
async function renderAllStoryCards(storyData) {
  if (!storyData || !Array.isArray(storyData.stories)) {
    throw new Error("Data story tidak valid untuk render kartu gambar.");
  }

  const results = [];
  const meta = {
    pillar: storyData.pillar,
    topic: storyData.topic,
    keyword: storyData.keyword,
    date: storyData.date,
  };

  for (const story of storyData.stories) {
    const buffer = await renderStoryCardPng(story, meta);
    const filename = `story-${storyData.date || "today"}-slide-${story.slide}-${story.act.toLowerCase().replace(/\s+/g, "_")}.png`;

    results.push({
      slide: story.slide,
      act: story.act,
      time: story.time,
      text: story.text,
      headline: story.visualGuide?.headline,
      buffer,
      filename,
    });
  }

  return results;
}

module.exports = {
  CARD_WIDTH,
  CARD_HEIGHT,
  getFonts,
  resolveDynamicTheme,
  renderStoryCardPng,
  renderAllStoryCards,
};
