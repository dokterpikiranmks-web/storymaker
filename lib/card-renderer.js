/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V2.1 — Image Card Renderer (lib/card-renderer.js)
 *  Generates 1080x1920 (9:16) PNG cards for WhatsApp Story
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
 * Menentukan tema warna kartu berdasarkan babak dan pilar
 */
function getCardTheme(act, pillar = "PIKIRAN") {
  // Palet default berdasarkan pilar
  if (pillar === "TUBUH") {
    return {
      bgGradient: "linear-gradient(180deg, #13241B 0%, #1E382B 60%, #0F1C15 100%)",
      accentColor: "#86EFAC", // Mint
      pillBg: "rgba(134, 239, 172, 0.15)",
      pillBorder: "rgba(134, 239, 172, 0.35)",
      textColor: "#F0FDF4",
      subtextColor: "#BBF7D0",
      cardBg: "rgba(255, 255, 255, 0.04)",
      borderColor: "rgba(134, 239, 172, 0.2)",
    };
  }

  if (pillar === "TEKNOLOGI") {
    return {
      bgGradient: "linear-gradient(180deg, #0F172A 0%, #1E293B 60%, #090D16 100%)",
      accentColor: "#93C5FD", // Soft Blue
      pillBg: "rgba(147, 197, 253, 0.15)",
      pillBorder: "rgba(147, 197, 253, 0.35)",
      textColor: "#F8FAFC",
      subtextColor: "#BAE6FD",
      cardBg: "rgba(255, 255, 255, 0.04)",
      borderColor: "rgba(147, 197, 253, 0.2)",
    };
  }

  // PIKIRAN (Default Muted Slate & Warm Sand)
  return {
    bgGradient: "linear-gradient(180deg, #18222F 0%, #243346 60%, #101720 100%)",
    accentColor: "#FDE047", // Warm Gold
    pillBg: "rgba(253, 224, 71, 0.15)",
    pillBorder: "rgba(253, 224, 71, 0.35)",
    textColor: "#F8FAFC",
    subtextColor: "#FEF08A",
    cardBg: "rgba(255, 255, 255, 0.04)",
    borderColor: "rgba(253, 224, 71, 0.2)",
  };
}

/**
 * Menghasilkan elemen virtual node untuk Satori
 */
function createCardElement(story, meta = {}) {
  const pillar = meta.pillar || "PIKIRAN";
  const theme = getCardTheme(story.act, pillar);
  const headline = story.visualGuide?.headline || "Dokter Pikiran";
  const slideNum = story.slide || 1;
  const time = story.time || "07:00";
  const actName = story.act || "STORY";
  const text = story.text || "";
  const isCta = actName === "CTA HALUS" || actName === "CTA";
  const keyword = meta.keyword || "RESET";

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
              // Badge Babak & Jam
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
                          color: "rgba(255, 255, 255, 0.6)",
                          fontSize: "26px",
                          fontWeight: 600,
                          letterSpacing: "1px",
                        },
                        children: `${time} WITA`,
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
                    marginTop: "20px",
                  },
                  children: headline,
                },
              },

              // Garis Aksen Tipis
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: "120px",
                    height: "4px",
                    backgroundColor: theme.accentColor,
                    borderRadius: "2px",
                    opacity: 0.8,
                  },
                },
              },
            ],
          },
        },

        // ── BODY CONTENT CONTAINER ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              width: "100%",
              backgroundColor: theme.cardBg,
              border: `1.5px solid ${theme.borderColor}`,
              borderRadius: "36px",
              padding: "72px 64px",
              boxSizing: "border-box",
              margin: "auto 0",
              gap: "36px",
            },
            children: [
              // Kutipan Pembuka Halus
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: theme.accentColor,
                    fontSize: "48px",
                    lineHeight: 1,
                    fontFamily: "Playfair Display, serif",
                    opacity: 0.7,
                  },
                  children: '"',
                },
              },

              // Teks Isi Story
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: "42px",
                    lineHeight: 1.6,
                    color: theme.textColor,
                    fontWeight: 400,
                    letterSpacing: "0.2px",
                  },
                  children: text,
                },
              },

              // Khusus Slide CTA: Box Instruksi Interaksi
              isCta
                ? {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.pillBg,
                        border: `2px dashed ${theme.accentColor}`,
                        borderRadius: "24px",
                        padding: "24px 32px",
                        marginTop: "16px",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              color: theme.accentColor,
                              fontSize: "32px",
                              fontWeight: 700,
                              letterSpacing: "1px",
                            },
                            children: `Balas Story: ketik "${keyword}"`,
                          },
                        },
                      ],
                    },
                  }
                : null,
            ].filter(Boolean),
          },
        },

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
                          fontSize: "26px",
                          fontWeight: 700,
                          letterSpacing: "1.5px",
                        },
                        children: "DOKTER PIKIRAN",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          color: "rgba(255, 255, 255, 0.45)",
                          fontSize: "20px",
                          marginTop: "4px",
                        },
                        children: "Ahmad Jawahir Zain • Parepare",
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
                  children: "WhatsApp Story Edition",
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
 * @param {Object} story
 * @param {Object} [meta]
 * @returns {Promise<Buffer>}
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
    fitTo: { mode: "width", value: CARD_WIDTH },
    font: { loadSystemFonts: false },
    background: "#000000",
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

/**
 * Render seluruh slide (5 buah) menjadi array Buffer PNG
 * @param {Object} storyData - Output dari generateStoryV2
 * @returns {Promise<Array<{ slide: number, act: string, buffer: Buffer, filename: string }>>}
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
  renderStoryCardPng,
  renderAllStoryCards,
};
