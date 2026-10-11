/**
 * ════════════════════════════════════════════════════════════════════════════
 *  StoryMaker V3.0 — Infographic Visual Card Renderer (lib/card-renderer.js)
 *  Generates 1080x1920 (9:16) Visual Infographic PNG Cards for WhatsApp Story
 * ════════════════════════════════════════════════════════════════════════════
 *  Revisi Akbar V3.0:
 *  - KUNCI resolusi ke 1080 x 1920 px murni (Retina 1x, render < 1 detik, tajam).
 *  - Elemen Visual Infografis di setiap Slide:
 *    * Story 1 (Hook): Big Statement Text + Badge Pill Kategori + Visual Caution/Paradox SVG Icon.
 *    * Story 2 (Edukasi): DIAGRAM ALUR BIOLOGIS (Flowchart 3 Node dengan Panah SVG).
 *    * Story 3 (Praktik): STEP-BY-STEP VISUAL CARDS (Badge Langkah 01, 02, 03 + Titik Tubuh).
 *    * Story 4 (Bukti): Layout Rekam Medis Elegan + Stempel Terverifikasi Somatik Makassar.
 *    * Story 5 (Refleksi): Kartu Penutup Tenang + Mockup Buku Saku PDF + Tombol CTA Interaktif.
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
 */
function resolveDynamicTheme(pillar = "PIKIRAN", date = new Date()) {
  const p = (pillar || "PIKIRAN").toUpperCase();
  const day = (date instanceof Date ? date : new Date(date)).getDay();

  // Mode Forest Sage (Pilar TUBUH)
  if (p === "TUBUH" || (p === "AUTO" && (day === 1 || day === 4))) {
    return {
      name: "Forest Sage",
      bgGradient: "linear-gradient(180deg, #101E1A 0%, #172D26 50%, #0B1613 100%)",
      accentColor: "#74A892",
      accentGlow: "rgba(116, 168, 146, 0.35)",
      textColor: "#EAF4EE",
      subtextColor: "#BFDACF",
      cardBg: "rgba(116, 168, 146, 0.08)",
      borderColor: "rgba(116, 168, 146, 0.3)",
      pillBg: "rgba(116, 168, 146, 0.18)",
      pillBorder: "rgba(116, 168, 146, 0.45)",
    };
  }

  // Mode Warm Sand / Obsidian (Pilar TEKNOLOGI)
  if (p === "TEKNOLOGI" || (p === "AUTO" && (day === 2 || day === 5))) {
    return {
      name: "Warm Obsidian",
      bgGradient: "linear-gradient(180deg, #121214 0%, #1F1E22 50%, #0A0A0C 100%)",
      accentColor: "#E2B774",
      accentGlow: "rgba(226, 183, 116, 0.35)",
      textColor: "#F4EFEA",
      subtextColor: "#E5D2BA",
      cardBg: "rgba(226, 183, 116, 0.08)",
      borderColor: "rgba(226, 183, 116, 0.3)",
      pillBg: "rgba(226, 183, 116, 0.18)",
      pillBorder: "rgba(226, 183, 116, 0.45)",
    };
  }

  // Mode Slate Charcoal (Pilar PIKIRAN - Default)
  return {
    name: "Slate Charcoal",
    bgGradient: "linear-gradient(180deg, #131922 0%, #1E2836 50%, #0E131B 100%)",
    accentColor: "#63B3ED",
    accentGlow: "rgba(99, 179, 237, 0.35)",
    textColor: "#F1F5F9",
    subtextColor: "#CBD5E1",
    cardBg: "rgba(99, 179, 237, 0.08)",
    borderColor: "rgba(99, 179, 237, 0.3)",
    pillBg: "rgba(99, 179, 237, 0.18)",
    pillBorder: "rgba(99, 179, 237, 0.45)",
  };
}

/**
 * Membangun variasi tata letak kartu infografis berdasarkan Babak Story (1 - 5)
 */
function buildActLayout(story, theme, meta) {
  const actName = (story.act || "STORY").toUpperCase();
  const text = story.text || "";
  const keyword = meta.keyword || "RESET";
  const visualGuide = story.visualGuide || {};

  // ══════════════════════════════════════════════════════════════════════════
  // 1. STORY 1: HOOK (Big Statement Text + Badge Pill + Visual Paradox Icon)
  // ══════════════════════════════════════════════════════════════════════════
  if (actName.includes("HOOK")) {
    const badgeText = visualGuide.badge || "🚨 PARADOKS BIOLOGIS";

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
          padding: "40px 20px",
          gap: "36px",
          width: "100%",
        },
        children: [
          // Visual Caution / Paradox SVG Icon
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "110px",
                height: "110px",
                borderRadius: "55px",
                backgroundColor: theme.pillBg,
                border: `2px solid ${theme.accentColor}`,
                boxShadow: `0 0 35px ${theme.accentGlow}`,
              },
              children: [
                {
                  type: "svg",
                  props: {
                    width: "56",
                    height: "56",
                    viewBox: "0 0 24 24",
                    fill: "none",
                    stroke: theme.accentColor,
                    strokeWidth: "2.2",
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    children: [
                      {
                        type: "path",
                        props: {
                          d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
                        },
                      },
                      {
                        type: "line",
                        props: { x1: "12", y1: "9", x2: "12", y2: "13" },
                      },
                      {
                        type: "line",
                        props: { x1: "12", y1: "17", x2: "12.01", y2: "17" },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // Badge Pill Kategori
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                padding: "10px 32px",
                borderRadius: "100px",
                backgroundColor: theme.pillBg,
                border: `1.5px solid ${theme.pillBorder}`,
                color: theme.accentColor,
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "2.5px",
              },
              children: badgeText,
            },
          },

          // Big Statement Hook Text (Besar, Bold, Menusuk)
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                fontSize: "56px",
                fontWeight: 800,
                lineHeight: 1.35,
                color: "#FFFFFF",
                letterSpacing: "-0.5px",
                textAlign: "center",
                padding: "0 24px",
              },
              children: `“${text}”`,
            },
          },

          // Visual Micro Cue (Panduan Baca & Geser)
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginTop: "16px",
                padding: "12px 32px",
                borderRadius: "100px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                color: theme.subtextColor,
                fontSize: "22px",
                fontWeight: 600,
              },
              children: "BACA PERLAHAN • GESER KE STORY BERIKUTNYA ➔",
            },
          },
        ],
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 2. STORY 2: EDUKASI (DIAGRAM ALUR BIOLOGIS / Flowchart 3 Node dengan Panah)
  // ══════════════════════════════════════════════════════════════════════════
  if (actName.includes("EDUKASI")) {
    const rawNodes = visualGuide.flowchart || [
      "Alarm Bahaya Menyala",
      "Saraf Vagus Freeze",
      "Klep Lambung Terbuka",
    ];
    const nodes = Array.isArray(rawNodes) && rawNodes.length >= 3 ? rawNodes.slice(0, 3) : [
      "1. Alarm Otak Aktif",
      "2. Saraf Freeze",
      "3. Anomali Tubuh",
    ];

    const arrowSvg = {
      type: "div",
      props: {
        style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "36px",
        },
        children: [
          {
            type: "svg",
            props: {
              width: "36",
              height: "36",
              viewBox: "0 0 24 24",
              fill: "none",
              stroke: theme.accentColor,
              strokeWidth: "2.8",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              children: [
                { type: "path", props: { d: "M12 4v16" } },
                { type: "path", props: { d: "m18 14-6 6-6-6" } },
              ],
            },
          },
        ],
      },
    };

    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          margin: "auto 0",
          gap: "28px",
          width: "100%",
        },
        children: [
          // Header Diagram
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
                      padding: "6px 20px",
                      borderRadius: "100px",
                      backgroundColor: theme.pillBg,
                      border: `1.5px solid ${theme.pillBorder}`,
                      color: theme.accentColor,
                      fontSize: "20px",
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                    },
                    children: "🔬 SKEMA SEBAB - AKIBAT BIOLOGIS",
                  },
                },
              ],
            },
          },

          // Flowchart Container (3 Node Cards)
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "10px",
                width: "100%",
              },
              children: [
                // Node 1
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      backgroundColor: theme.cardBg,
                      border: `2px solid ${theme.borderColor}`,
                      borderRadius: "22px",
                      padding: "20px 28px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "48px",
                            height: "48px",
                            borderRadius: "24px",
                            backgroundColor: theme.pillBg,
                            color: theme.accentColor,
                            fontSize: "22px",
                            fontWeight: 800,
                          },
                          children: "01",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            color: "#FFFFFF",
                            fontSize: "30px",
                            fontWeight: 700,
                          },
                          children: nodes[0],
                        },
                      },
                    ],
                  },
                },

                arrowSvg,

                // Node 2
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      backgroundColor: theme.cardBg,
                      border: `2px solid ${theme.borderColor}`,
                      borderRadius: "22px",
                      padding: "20px 28px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "48px",
                            height: "48px",
                            borderRadius: "24px",
                            backgroundColor: theme.pillBg,
                            color: theme.accentColor,
                            fontSize: "22px",
                            fontWeight: 800,
                          },
                          children: "02",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            color: theme.accentColor,
                            fontSize: "30px",
                            fontWeight: 700,
                          },
                          children: nodes[1],
                        },
                      },
                    ],
                  },
                },

                arrowSvg,

                // Node 3
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      backgroundColor: theme.cardBg,
                      border: `2px solid ${theme.borderColor}`,
                      borderRadius: "22px",
                      padding: "20px 28px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "48px",
                            height: "48px",
                            borderRadius: "24px",
                            backgroundColor: theme.pillBg,
                            color: theme.accentColor,
                            fontSize: "22px",
                            fontWeight: 800,
                          },
                          children: "03",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            color: "#FFFFFF",
                            fontSize: "30px",
                            fontWeight: 700,
                          },
                          children: nodes[2],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // Kotak Penjelasan Santai di Bawah Diagram
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                backgroundColor: "rgba(0, 0, 0, 0.35)",
                border: `1.5px solid ${theme.borderColor}`,
                borderRadius: "24px",
                padding: "30px 36px",
                gap: "12px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      color: theme.accentColor,
                      fontSize: "20px",
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                    },
                    children: "💡 MENGAPA BISA BEGITU?",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: "36px",
                      fontWeight: 500,
                      lineHeight: 1.5,
                      color: theme.textColor,
                    },
                    children: text,
                  },
                },
              ],
            },
          },
        ],
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 3. STORY 3: PRAKTIK (STEP-BY-STEP VISUAL CARDS: Badge 1, 2, 3 + Titik Tubuh)
  // ══════════════════════════════════════════════════════════════════════════
  if (actName.includes("PRAKTIK")) {
    const rawSteps = visualGuide.steps || [
      { step: "01", action: "Tarik dua napas pendek cepat lewat hidung", target: "Hidung & Alveoli" },
      { step: "02", action: "Hembuskan satu tarikan napas panjang lewat mulut", target: "Mulut & Paru" },
      { step: "03", action: "Rasakan bahu turun otomatis dan debaran dada melambat", target: "Saraf Vagus Aktif" },
    ];
    const steps = Array.isArray(rawSteps) && rawSteps.length >= 3 ? rawSteps.slice(0, 3) : [
      { step: "01", action: "Ambil posisi duduk tegak dan rileks", target: "Postur Duduk" },
      { step: "02", action: "Lakukan manuver mikro selama 30 detik", target: "Titik Fokus" },
      { step: "03", action: "Rasakan kuncian saraf melepas secara spontan", target: "Saraf Rileks" },
    ];

    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          margin: "auto 0",
          gap: "24px",
          width: "100%",
        },
        children: [
          // Header Praktik
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      padding: "8px 24px",
                      borderRadius: "100px",
                      backgroundColor: theme.pillBg,
                      border: `1.5px solid ${theme.pillBorder}`,
                      color: theme.accentColor,
                      fontSize: "20px",
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                    },
                    children: "⚡ PANDUAN 3 LANGKAH VISUAL",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      color: theme.subtextColor,
                      fontSize: "22px",
                      fontWeight: 600,
                    },
                    children: "Bisa Dicoba Sambil Duduk",
                  },
                },
              ],
            },
          },

          // 3 Step-by-Step Visual Cards
          ...steps.map((item, idx) => ({
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                backgroundColor: theme.cardBg,
                border: `2px solid ${theme.borderColor}`,
                borderRadius: "26px",
                padding: "26px 32px",
                gap: "12px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            backgroundColor: theme.pillBg,
                            border: `1px solid ${theme.accentColor}`,
                            padding: "6px 18px",
                            borderRadius: "100px",
                            color: theme.accentColor,
                            fontSize: "18px",
                            fontWeight: 800,
                            letterSpacing: "1.5px",
                          },
                          children: `LANGKAH ${item.step || `0${idx + 1}`}`,
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            color: theme.subtextColor,
                            fontSize: "18px",
                            fontWeight: 600,
                          },
                          children: `🎯 ${item.target || "Titik Tubuh"}`,
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
                      fontSize: "32px",
                      fontWeight: 600,
                      lineHeight: 1.45,
                      color: "#FFFFFF",
                    },
                    children: item.action || "",
                  },
                },
              ],
            },
          })),

          // Footer Prompt
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                paddingTop: "6px",
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "20px",
                fontWeight: 500,
              },
              children: "⏱️ Latihan somatik mikro 60 detik langsung di meja kerja",
            },
          },
        ],
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 4. STORY 4: BUKTI (Rekam Medis Elegan + Stempel Terverifikasi Somatik)
  // ══════════════════════════════════════════════════════════════════════════
  if (actName.includes("BUKTI")) {
    const stampText = visualGuide.stamp || "TERVERIFIKASI SOMATIK • MAKASSAR";

    return {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          backgroundColor: theme.cardBg,
          border: `2px solid ${theme.borderColor}`,
          borderRadius: "36px",
          padding: "54px 48px",
          margin: "auto 0",
          gap: "28px",
          position: "relative",
          width: "100%",
        },
        children: [
          // Header Rekam Medis & Stempel
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                width: "100%",
                borderBottom: "1px dashed rgba(255, 255, 255, 0.2)",
                paddingBottom: "24px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: theme.accentColor,
                            fontSize: "22px",
                            fontWeight: 800,
                            letterSpacing: "2px",
                          },
                          children: "📋 CATATAN MEJA TERAPI MAKASSAR",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            color: "rgba(255, 255, 255, 0.5)",
                            fontSize: "18px",
                          },
                          children: "Klinik Batua Raya 10 B • Kasus Klinis Riil",
                        },
                      },
                    ],
                  },
                },

                // Stempel Terverifikasi Somatik (Rotated Stamp Effect)
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `3px dashed ${theme.accentColor}`,
                      borderRadius: "16px",
                      padding: "10px 22px",
                      transform: "rotate(-6deg)",
                      backgroundColor: theme.pillBg,
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            color: theme.accentColor,
                            fontSize: "17px",
                            fontWeight: 800,
                            letterSpacing: "1.5px",
                          },
                          children: "TERVERIFIKASI SOMATIK",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            color: "#FFFFFF",
                            fontSize: "14px",
                            fontWeight: 700,
                            letterSpacing: "1px",
                          },
                          children: "KLINIS MAKASSAR",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },

          // Body Cerita Kasus Rekam Medis
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "14px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      color: theme.subtextColor,
                      fontSize: "20px",
                      fontWeight: 700,
                      letterSpacing: "1px",
                    },
                    children: "STUDI KASUS PASIEN:",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      fontSize: "38px",
                      fontWeight: 500,
                      lineHeight: 1.55,
                      color: theme.textColor,
                    },
                    children: `“${text}”`,
                  },
                },
              ],
            },
          },

          // Observation Status Badge
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: "16px",
                padding: "14px 24px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      color: theme.accentColor,
                      fontSize: "20px",
                      fontWeight: 700,
                    },
                    children: "STATUS OBSERVASI:",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      color: "#FFFFFF",
                      fontSize: "20px",
                      fontWeight: 500,
                    },
                    children: "Saraf Tenang • Pulih Tanpa Ketergantungan Obat",
                  },
                },
              ],
            },
          },
        ],
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 5. STORY 5: REFLEKSI & PDF (Kartu Tenang + Mockup Buku Saku + CTA Interaktif)
  // ══════════════════════════════════════════════════════════════════════════
  const bookletTitle = visualGuide.booklet || `Panduan Protokol Reset ${meta.pillar || "Bawah Sadar"}`;

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        margin: "auto 0",
        gap: "32px",
        width: "100%",
      },
      children: [
        // Refleksi Tenang Malam Hari
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              backgroundColor: theme.cardBg,
              border: `2px solid ${theme.borderColor}`,
              borderRadius: "32px",
              padding: "44px 44px",
              gap: "12px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: theme.accentColor,
                    fontSize: "20px",
                    fontWeight: 700,
                    letterSpacing: "2px",
                  },
                  children: "🌙 REFLEKSI TENANG MALAM HARI",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    fontSize: "36px",
                    fontWeight: 500,
                    lineHeight: 1.55,
                    color: theme.textColor,
                  },
                  children: text,
                },
              },
            ],
          },
        },

        // Mockup Visual Buku Saku PDF
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "28px",
              backgroundColor: "rgba(0, 0, 0, 0.45)",
              border: `2px solid ${theme.borderColor}`,
              borderRadius: "28px",
              padding: "26px 36px",
            },
            children: [
              // Icon Mini Book Cover
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "88px",
                    height: "114px",
                    borderRadius: "14px",
                    backgroundColor: theme.pillBg,
                    border: `2px solid ${theme.accentColor}`,
                    gap: "4px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          fontSize: "32px",
                        },
                        children: "📄",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          color: theme.accentColor,
                          fontSize: "14px",
                          fontWeight: 800,
                          letterSpacing: "1px",
                        },
                        children: "PDF",
                      },
                    },
                  ],
                },
              },

              // Book Details
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    flex: 1,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                backgroundColor: theme.pillBg,
                                color: theme.accentColor,
                                padding: "4px 14px",
                                borderRadius: "100px",
                                fontSize: "16px",
                                fontWeight: 700,
                              },
                              children: "E-BOOK SAKU GRATIS",
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
                          color: "#FFFFFF",
                          fontSize: "26px",
                          fontWeight: 700,
                          lineHeight: 1.3,
                        },
                        children: bookletTitle,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          color: "rgba(255, 255, 255, 0.45)",
                          fontSize: "17px",
                        },
                        children: "Format Digital PDF • 3 Menit Baca Cepat",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // Interactive CTA Box (Balas Story dengan Keyword)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.pillBg,
              border: `2.5px dashed ${theme.accentColor}`,
              borderRadius: "28px",
              padding: "32px 36px",
              gap: "10px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: "rgba(255, 255, 255, 0.75)",
                    fontSize: "22px",
                    fontWeight: 600,
                    letterSpacing: "1.5px",
                  },
                  children: "BALAS STORY INI DENGAN KETIK:",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: theme.accentColor,
                    fontSize: "48px",
                    fontWeight: 900,
                    letterSpacing: "4px",
                  },
                  children: `👉  "${keyword}"  👈`,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    color: "rgba(255, 255, 255, 0.55)",
                    fontSize: "18px",
                    marginTop: "4px",
                  },
                  children: "Bot WhatsApp otomatis kirim link unduh PDF gratis ke pesanmu",
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
        padding: "110px 84px",
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
              gap: "24px",
            },
            children: [
              // Badge Babak & Jam & Lokasi
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
                          fontSize: "24px",
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
                          gap: "8px",
                          color: "rgba(255, 255, 255, 0.65)",
                          fontSize: "24px",
                          fontWeight: 600,
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { display: "flex" },
                              children: `⏰ ${time} WITA`,
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
                    marginTop: "12px",
                  },
                  children: headline,
                },
              },

              // Garis Aksen Berwarna Tema
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    width: "140px",
                    height: "5px",
                    backgroundColor: theme.accentColor,
                    borderRadius: "3px",
                  },
                },
              },
            ],
          },
        },

        // ── DYNAMIC INFOGRAPHIC ACT CONTENT CONTAINER ──
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
                        children: "DOKTER PIKIRAN • Ahmad Jawahir Zain",
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
                        children: "Hipnoterapi Klinis & Sistem Saraf • Makassar",
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

const ULTRA_HD_WIDTH = 2160;
const ULTRA_HD_HEIGHT = 3840;

/**
 * Render 1 Story Slide menjadi Buffer PNG
 * KUNCI ke 1080 x 1920 px (Retina 1x) untuk render instan (< 1 detik).
 */
async function renderStoryCardPng(story, meta = {}) {
  const fonts = await getFonts();
  const element = createCardElement(story, meta);

  const svg = await satori(element, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts,
  });

  const isSingleFlyer = Boolean(meta.isSingleFlyer || meta.singleFlyer || meta.ultraHd);
  const targetWidth = isSingleFlyer ? ULTRA_HD_WIDTH : CARD_WIDTH;

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: targetWidth },
    font: { loadSystemFonts: false },
    background: "#000000",
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}

/**
 * Render seluruh 5 kartu naskah menjadi array Buffer PNG (KUNCI 1080x1920 px)
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
    isSingleFlyer: false,
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
  ULTRA_HD_WIDTH,
  ULTRA_HD_HEIGHT,
  getFonts,
  resolveDynamicTheme,
  renderStoryCardPng,
  renderAllStoryCards,
};
