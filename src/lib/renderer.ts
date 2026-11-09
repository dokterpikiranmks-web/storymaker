/**
 * src/lib/renderer.ts
 * Satori + Resvg High-Speed Visual Engine for Dokter Pikiran Makassar.
 *
 * Produces crisp 1080 x 1920 px (9:16) PNG story flyers in sub-second time.
 * Supports:
 * 1. Mode "illustrated" (Split Header with feathered gradient & Full Atmospheric with dark tint)
 * 2. Mode "text_only" (Minimalist luxury typography with radial glow)
 */

import fs from "fs";
import path from "path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import type { StoryDraft, VisualMode, ContentPillar, SlotTime } from "./types";
import { getIllustrationForPillar } from "./illustration-assets";

export interface RenderOptions {
  mode?: VisualMode;
  customIllustrationPath?: string;
  width?: number;
  height?: number;
}

export interface RenderResult {
  pngBuffer: Buffer;
  imageBase64: string;
  width: number;
  height: number;
  renderTimeMs: number;
  mode: VisualMode;
}

// Cached font buffers
let cachedFonts: Array<{
  name: string;
  data: Buffer;
  weight: 400 | 500 | 600 | 700 | 800;
  style: "normal" | "italic";
}> | null = null;

function loadFonts() {
  if (cachedFonts) return cachedFonts;

  const projectRoot = process.cwd();
  const fontDir = path.join(projectRoot, "src/assets/fonts");

  const fontInter400 = fs.readFileSync(path.join(fontDir, "inter-latin-400-normal.woff"));
  const fontInter600 = fs.readFileSync(path.join(fontDir, "inter-latin-600-normal.woff"));
  const fontInter800 = fs.readFileSync(path.join(fontDir, "inter-latin-800-normal.woff"));
  const fontPlayfair700 = fs.readFileSync(path.join(fontDir, "playfair-display-latin-700-normal.woff"));
  const fontPlayfair500Italic = fs.readFileSync(path.join(fontDir, "playfair-display-latin-500-italic.woff"));
  const fontMono400 = fs.readFileSync(path.join(fontDir, "jetbrains-mono-latin-400-normal.woff"));

  cachedFonts = [
    { name: "Inter", data: fontInter400, weight: 400, style: "normal" },
    { name: "Inter", data: fontInter600, weight: 600, style: "normal" },
    { name: "Inter", data: fontInter800, weight: 800, style: "normal" },
    { name: "Playfair Display", data: fontPlayfair700, weight: 700, style: "normal" },
    { name: "Playfair Display", data: fontPlayfair500Italic, weight: 500, style: "italic" },
    { name: "JetBrains Mono", data: fontMono400, weight: 400, style: "normal" },
  ];

  return cachedFonts;
}

interface Palette {
  bg: string;
  accentGlow: string;
  accentColor: string;
  accentBorder: string;
  tagBg: string;
}

const PILLAR_PALETTES: Record<ContentPillar, Palette> = {
  MOTIVASI_PAGI: {
    bg: "#0B0D13",
    accentGlow: "rgba(245, 158, 11, 0.14)",
    accentColor: "#F59E0B",
    accentBorder: "rgba(245, 158, 11, 0.38)",
    tagBg: "rgba(245, 158, 11, 0.12)",
  },
  KESEHATAN_FUNGSIONAL: {
    bg: "#0A100E",
    accentGlow: "rgba(16, 185, 129, 0.13)",
    accentColor: "#10B981",
    accentBorder: "rgba(16, 185, 129, 0.38)",
    tagBg: "rgba(16, 185, 129, 0.12)",
  },
  MENTAL_NEUROSAINS: {
    bg: "#0B0E18",
    accentGlow: "rgba(99, 102, 241, 0.15)",
    accentColor: "#818CF8",
    accentBorder: "rgba(99, 102, 241, 0.38)",
    tagBg: "rgba(99, 102, 241, 0.12)",
  },
  SELF_TERAPI: {
    bg: "#100D0C",
    accentGlow: "rgba(249, 115, 22, 0.13)",
    accentColor: "#FB923C",
    accentBorder: "rgba(249, 115, 22, 0.38)",
    tagBg: "rgba(249, 115, 22, 0.12)",
  },
  INSPIRASI_MALAM: {
    bg: "#08090E",
    accentGlow: "rgba(147, 197, 253, 0.12)",
    accentColor: "#93C5FD",
    accentBorder: "rgba(147, 197, 253, 0.38)",
    tagBg: "rgba(147, 197, 253, 0.12)",
  },
};

/**
 * Builds the top bar element.
 */
function buildTopBar(draft: StoryDraft, palette: Palette) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        width: "100%",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            },
            children: [
              // Tag pill
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 22px",
                    borderRadius: "999px",
                    backgroundColor: palette.tagBg,
                    border: `1.5px solid ${palette.accentBorder}`,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "8px",
                          height: "8px",
                          borderRadius: "999px",
                          backgroundColor: palette.accentColor,
                        },
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "20px",
                          fontFamily: "JetBrains Mono",
                          fontWeight: 600,
                          color: palette.accentColor,
                          letterSpacing: "1.5px",
                        },
                        children: draft.tag,
                      },
                    },
                  ],
                },
              },
              // Time label
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "22px",
                    fontFamily: "JetBrains Mono",
                    fontWeight: 400,
                    color: "#94A3B8",
                    letterSpacing: "1px",
                  },
                  children: `${draft.slot} WITA`,
                },
              },
            ],
          },
        },
        // Divider
        {
          type: "div",
          props: {
            style: {
              width: "100%",
              height: "1px",
              backgroundColor: "rgba(255, 255, 255, 0.08)",
            },
          },
        },
      ],
    },
  };
}

/**
 * Builds the bottom signature element.
 */
function buildBottomSignature(draft: StoryDraft, palette: Palette) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: "32px",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        width: "100%",
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
                type: "span",
                props: {
                  style: {
                    fontSize: "26px",
                    fontFamily: "Playfair Display",
                    fontWeight: 700,
                    color: "#FFFFFF",
                    letterSpacing: "0.2px",
                  },
                  children: draft.signature,
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "19px",
                    fontFamily: "Inter",
                    fontWeight: 400,
                    color: "#94A3B8",
                  },
                  children: draft.subSignature,
                },
              },
            ],
          },
        },
        // Monogram Seal
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "56px",
              height: "56px",
              borderRadius: "18px",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: `1px solid ${palette.accentBorder}`,
              fontSize: "24px",
              color: palette.accentColor,
              fontFamily: "Playfair Display",
              fontWeight: 700,
            },
            children: "DP",
          },
        },
      ],
    },
  };
}

/**
 * Builds middle body content (paragraphs, steps, highlights).
 */
function buildMiddleContent(draft: StoryDraft, palette: Palette, isAtmospheric: boolean = false) {
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: isAtmospheric ? "36px" : "30px",
        width: "100%",
        margin: "auto 0",
      },
      children: [
        // Title
        {
          type: "h1",
          props: {
            style: {
              fontSize: draft.title.length > 50 ? "48px" : "54px",
              fontFamily: "Playfair Display",
              fontWeight: 700,
              lineHeight: 1.25,
              color: "#FFFFFF",
              margin: 0,
              letterSpacing: "-0.5px",
            },
            children: draft.title,
          },
        },

        // Accent divider
        {
          type: "div",
          props: {
            style: {
              width: "60px",
              height: "4px",
              borderRadius: "2px",
              backgroundColor: palette.accentColor,
            },
          },
        },

        // Steps (if practical self-terapi)
        ...(draft.steps && draft.steps.length > 0
          ? draft.steps.map((step) => ({
              type: "div",
              props: {
                style: {
                  display: "flex",
                  gap: "22px",
                  alignItems: "flex-start",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "48px",
                        height: "48px",
                        borderRadius: "14px",
                        backgroundColor: palette.tagBg,
                        border: `1.5px solid ${palette.accentBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        fontFamily: "JetBrains Mono",
                        fontWeight: 700,
                        color: palette.accentColor,
                        flexShrink: 0,
                      },
                      children: step.num,
                    },
                  },
                  {
                    type: "p",
                    props: {
                      style: {
                        fontSize: "29px",
                        fontFamily: "Inter",
                        fontWeight: 400,
                        lineHeight: 1.55,
                        color: "#E2E8F0",
                        margin: 0,
                      },
                      children: step.text,
                    },
                  },
                ],
              },
            }))
          : draft.body.map((p) => ({
              type: "p",
              props: {
                style: {
                  fontSize: draft.quoteMark ? "35px" : "30px",
                  fontFamily: draft.quoteMark ? "Playfair Display" : "Inter",
                  fontStyle: draft.quoteMark ? "italic" : "normal",
                  fontWeight: draft.quoteMark ? 500 : 400,
                  lineHeight: 1.6,
                  color: draft.quoteMark ? "#F8FAFC" : "#CBD5E1",
                  margin: 0,
                },
                children: p,
              },
            }))),

        // Highlight Box (if present)
        ...(draft.highlightBox
          ? [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    padding: "26px 30px",
                    borderRadius: "22px",
                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                    border: `1.5px solid ${palette.accentBorder}`,
                    marginTop: "6px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "16px",
                          fontFamily: "JetBrains Mono",
                          fontWeight: 700,
                          color: palette.accentColor,
                          letterSpacing: "1.5px",
                        },
                        children: draft.highlightBox.label,
                      },
                    },
                    {
                      type: "p",
                      props: {
                        style: {
                          fontSize: "24px",
                          fontFamily: "Inter",
                          fontWeight: 400,
                          lineHeight: 1.5,
                          color: "#F8FAFC",
                          margin: 0,
                        },
                        children: draft.highlightBox.content,
                      },
                    },
                  ],
                },
              },
            ]
          : []),
      ],
    },
  };
}

/**
 * Main rendering function: StoryDraft -> PNG Buffer.
 */
export async function renderStoryToPng(
  draft: StoryDraft,
  options: RenderOptions = {}
): Promise<RenderResult> {
  const startTime = Date.now();
  const width = options.width || 1080;
  const height = options.height || 1920;
  const mode = options.mode || draft.visualModePreferred || "text_only";

  const fonts = loadFonts();
  const palette = PILLAR_PALETTES[draft.pillar] || PILLAR_PALETTES.MOTIVASI_PAGI;

  let satoriElement: any;

  if (mode === "illustrated") {
    const illustrationBase64 = getIllustrationForPillar(
      draft.pillar,
      options.customIllustrationPath
    );

    const isAtmospheric =
      draft.pillar === "MOTIVASI_PAGI" || draft.pillar === "INSPIRASI_MALAM";

    if (isAtmospheric && illustrationBase64) {
      // Pola 1: Full Atmospheric Background
      satoriElement = {
        type: "div",
        props: {
          style: {
            width: `${width}px`,
            height: `${height}px`,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontFamily: "Inter",
            color: "#F8FAFC",
            backgroundColor: palette.bg,
            overflow: "hidden",
          },
          children: [
            // Background Image
            {
              type: "img",
              props: {
                src: illustrationBase64,
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${width}px`,
                  height: `${height}px`,
                  objectFit: "cover",
                },
              },
            },
            // Dark Gradient Tint Overlay
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${width}px`,
                  height: `${height}px`,
                  backgroundColor: "rgba(11, 13, 19, 0.76)",
                  backgroundImage: `radial-gradient(circle at 50% 25%, ${palette.accentGlow} 0%, rgba(11, 13, 19, 0.90) 80%)`,
                },
              },
            },
            // Foreground Content
            {
              type: "div",
              props: {
                style: {
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  padding: "100px 90px",
                },
                children: [
                  buildTopBar(draft, palette),
                  buildMiddleContent(draft, palette, true),
                  buildBottomSignature(draft, palette),
                ],
              },
            },
          ],
        },
      };
    } else if (illustrationBase64) {
      // Pola 2: Split Header (Feathered Gradient Fade)
      const topHeight = 720;
      satoriElement = {
        type: "div",
        props: {
          style: {
            width: `${width}px`,
            height: `${height}px`,
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontFamily: "Inter",
            color: "#F8FAFC",
            backgroundColor: palette.bg,
            overflow: "hidden",
          },
          children: [
            // Top Image with Gradient Fade
            {
              type: "div",
              props: {
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: `${width}px`,
                  height: `${topHeight}px`,
                  display: "flex",
                  overflow: "hidden",
                },
                children: [
                  {
                    type: "img",
                    props: {
                      src: illustrationBase64,
                      style: {
                        width: `${width}px`,
                        height: `${topHeight}px`,
                        objectFit: "cover",
                      },
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: `${width}px`,
                        height: "360px",
                        backgroundImage: `linear-gradient(to bottom, transparent 0%, ${palette.bg} 98%)`,
                      },
                    },
                  },
                ],
              },
            },
            // Foreground Content
            {
              type: "div",
              props: {
                style: {
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  padding: "100px 90px",
                },
                children: [
                  buildTopBar(draft, palette),
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        marginTop: "380px", // Pushes text below illustration focal point
                      },
                      children: [buildMiddleContent(draft, palette, false)],
                    },
                  },
                  buildBottomSignature(draft, palette),
                ],
              },
            },
          ],
        },
      };
    } else {
      // Fallback to text_only if illustration is missing
      satoriElement = buildTextOnlyElement(draft, palette, width, height);
    }
  } else {
    // Mode "text_only" (Minimalist Luxury)
    satoriElement = buildTextOnlyElement(draft, palette, width, height);
  }

  // 1. Satori generates SVG
  const svg = await satori(satoriElement, {
    width,
    height,
    fonts,
  });

  // 2. Resvg compiles SVG to PNG Buffer
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
  });
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  const renderTimeMs = Date.now() - startTime;
  const imageBase64 = `data:image/png;base64,${pngBuffer.toString("base64")}`;

  return {
    pngBuffer,
    imageBase64,
    width,
    height,
    renderTimeMs,
    mode,
  };
}

function buildTextOnlyElement(
  draft: StoryDraft,
  palette: Palette,
  width: number,
  height: number
) {
  return {
    type: "div",
    props: {
      style: {
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: palette.bg,
        backgroundImage: `radial-gradient(circle at 50% 12%, ${palette.accentGlow} 0%, transparent 60%)`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "100px 90px",
        fontFamily: "Inter",
        color: "#F8FAFC",
        position: "relative",
      },
      children: [
        buildTopBar(draft, palette),
        buildMiddleContent(draft, palette, false),
        buildBottomSignature(draft, palette),
      ],
    },
  };
}
