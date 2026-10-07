import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori, { type Font } from "satori";

export const FLYER_WIDTH = 1080;
export const FLYER_HEIGHT = 1920;
export const ULTRA_HD_WIDTH = 2160;
export const ULTRA_HD_HEIGHT = 3840;

export type PromoTemplateId = "bright_botanical" | "warm_editorial" | "clean_minimalist";
export type QuotesTemplateId = "cinematic" | "linen" | "botanical";
export type FlyerTemplateId = PromoTemplateId | QuotesTemplateId;

export interface SingleFlyerPayload {
  preset: "PROMO_KLINIK" | "QUOTES";
  templateId?: FlyerTemplateId;
  title?: string;
  price?: string;
  duration?: string;
  address?: string;
  schedule?: string;
  notes?: string;
  customPrompt?: string;
  heroPhotoBase64?: string; // Data URL e.g. data:image/jpeg;base64,...
  subtitle?: string;
  quoteAuthor?: string;
}

export interface SatoriElement {
  type: string;
  props: {
    style?: Record<string, string | number | undefined>;
    children?: string | SatoriElement | (string | SatoriElement)[];
    src?: string;
    alt?: string;
    viewBox?: string;
    width?: number | string;
    height?: number | string;
    fill?: string;
    stroke?: string;
    strokeWidth?: number | string;
    strokeLinecap?: string;
    strokeLinejoin?: string;
    d?: string;
    cx?: number | string;
    cy?: number | string;
    r?: number | string;
    [key: string]: unknown;
  };
}

let cachedFonts: Font[] | null = null;

export async function getFlyerFonts(): Promise<Font[]> {
  if (cachedFonts) return cachedFonts;

  const fontDir = path.join(process.cwd(), "src", "assets", "fonts");

  try {
    const [
      interRegular,
      interSemiBold,
      interBold,
      playfairSemiBold,
      playfairBold,
      playfairItalic,
    ] = await Promise.all([
      readFile(path.join(fontDir, "inter-latin-400-normal.woff")),
      readFile(path.join(fontDir, "inter-latin-600-normal.woff")),
      readFile(path.join(fontDir, "inter-latin-800-normal.woff")),
      readFile(path.join(fontDir, "playfair-display-latin-600-normal.woff")),
      readFile(path.join(fontDir, "playfair-display-latin-700-normal.woff")),
      readFile(path.join(fontDir, "playfair-display-latin-500-italic.woff")),
    ]);

    cachedFonts = [
      { name: "Inter", data: interRegular, weight: 400, style: "normal" },
      { name: "Inter", data: interSemiBold, weight: 600, style: "normal" },
      { name: "Inter", data: interBold, weight: 800, style: "normal" },
      { name: "Playfair Display", data: playfairSemiBold, weight: 600, style: "normal" },
      { name: "Playfair Display", data: playfairBold, weight: 700, style: "normal" },
      { name: "Playfair Display", data: playfairItalic, weight: 500, style: "italic" },
    ];
  } catch (err) {
    console.warn("⚠️ [SingleFlyer] Gagal membaca custom fonts WOFF, menggunakan fallback:", err);
    cachedFonts = [];
  }

  return cachedFonts;
}

// ── SVG ICONS SILUET PUTIH UNTUK 5 MANFAAT ──
function getBenefitIconSvg(type: "head" | "muscle" | "blood" | "sleep" | "mind"): SatoriElement {
  if (type === "head") {
    // Ikon Sakit Kepala / Brain Wave
    return {
      type: "svg",
      props: {
        viewBox: "0 0 24 24",
        width: "24",
        height: "24",
        fill: "none",
        stroke: "#FFFFFF",
        strokeWidth: "2.2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
          { type: "path", props: { d: "M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" } },
          { type: "path", props: { d: "M9 22h6" } },
        ],
      },
    };
  }

  if (type === "muscle") {
    // Ikon Ketegangan Otot / Spine
    return {
      type: "svg",
      props: {
        viewBox: "0 0 24 24",
        width: "24",
        height: "24",
        fill: "none",
        stroke: "#FFFFFF",
        strokeWidth: "2.2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
          { type: "path", props: { d: "M12 2v20" } },
          { type: "path", props: { d: "M8 5h8" } },
          { type: "path", props: { d: "M7 9h10" } },
          { type: "path", props: { d: "M6 13h12" } },
          { type: "path", props: { d: "M7 17h10" } },
          { type: "path", props: { d: "M8 21h8" } },
        ],
      },
    };
  }

  if (type === "blood") {
    // Ikon Aliran Darah / Circulation
    return {
      type: "svg",
      props: {
        viewBox: "0 0 24 24",
        width: "24",
        height: "24",
        fill: "none",
        stroke: "#FFFFFF",
        strokeWidth: "2.2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
          { type: "path", props: { d: "M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" } },
          { type: "path", props: { d: "M12 11v4" } },
          { type: "path", props: { d: "M10 13h4" } },
        ],
      },
    };
  }

  if (type === "sleep") {
    // Ikon Kualitas Tidur / Moon Star
    return {
      type: "svg",
      props: {
        viewBox: "0 0 24 24",
        width: "24",
        height: "24",
        fill: "none",
        stroke: "#FFFFFF",
        strokeWidth: "2.2",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        children: [
          { type: "path", props: { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" } },
        ],
      },
    };
  }

  // Ikon Kesehatan Mental / Vagus Calm
  return {
    type: "svg",
    props: {
      viewBox: "0 0 24 24",
      width: "24",
      height: "24",
      fill: "none",
      stroke: "#FFFFFF",
      strokeWidth: "2.2",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      children: [
        { type: "circle", props: { cx: "12", cy: "12", r: "9" } },
        { type: "path", props: { d: "M8 13s1.5 2 4 2 4-2 4-2" } },
        { type: "line", props: { x1: "9", y1: "9", x2: "9.01", y2: "9" } },
        { type: "line", props: { x1: "15", y1: "9", x2: "15.01", y2: "9" } },
      ],
    },
  };
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * TEMPLATE PROMO 1: BRIGHT BOTANICAL SPA (STANDAR KOMERSIAL KLINIK)
 * ════════════════════════════════════════════════════════════════════════════
 */
function buildBrightBotanicalPromo(data: SingleFlyerPayload): SatoriElement {
  const fullTitle = data.title || "Totok Saraf Makassar";
  const price = data.price || "Rp 150.000";
  const duration = data.duration || "± 1 Jam";
  const address = data.address || "Jl. Batua Raya 10 B No.9 Makassar";
  const schedule = data.schedule || "Senin – Sabtu 16.00 – 21.00 WITA";
  const notes = data.notes || "Maksimal 5 pasien per hari";

  // Pemisahan judul cerdas untuk tipografi komersial
  let titleMain = fullTitle;
  let titleAccent = "";
  if (fullTitle.toLowerCase().includes("makassar")) {
    titleMain = fullTitle.replace(/makassar/i, "").trim();
    titleAccent = "Makassar";
  }

  const benefitsData = [
    { title: "Meredakan Sakit Kepala", desc: "Migrain, vertigo & pusing tegang di pelipis", icon: "head" as const },
    { title: "Mengurangi Ketegangan Otot", desc: "Leher kaku, bahu tegang & kuncian somatik", icon: "muscle" as const },
    { title: "Melancarkan Aliran Darah", desc: "Oksigenasi otak & revitalisasi sirkulasi", icon: "blood" as const },
    { title: "Membantu Kualitas Tidur", desc: "Atasi insomnia kronis, tidur lebih pulas", icon: "sleep" as const },
    { title: "Mendukung Kesehatan Mental", desc: "Reset saraf vagus & pelepasan rasa cemas", icon: "mind" as const },
  ];

  const heroPhotoNode: SatoriElement = data.heroPhotoBase64
    ? {
        type: "img",
        props: {
          src: data.heroPhotoBase64,
          alt: "Hero Terapi",
          style: {
            width: "976px",
            height: "500px",
            objectFit: "cover",
          },
        },
      }
    : {
        type: "div",
        props: {
          style: {
            display: "flex",
            width: "976px",
            height: "500px",
            backgroundColor: "#2E5846",
          },
        },
      };

  const createBenefitCard = (b: typeof benefitsData[0]): SatoriElement => ({
    type: "div",
    props: {
      style: {
        display: "flex",
        flex: 1,
        alignItems: "center",
        gap: "14px",
        backgroundColor: "#FFFFFF",
        border: "1.5px solid #E1E8DE",
        borderRadius: "20px",
        padding: "12px 18px",
        boxShadow: "0 6px 16px rgba(10, 56, 40, 0.05)",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              backgroundColor: "#0F5132",
              border: "2px solid #34D399",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 10px rgba(15, 81, 50, 0.25)",
            },
            children: getBenefitIconSvg(b.icon),
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
            },
            children: [
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "19px",
                    fontWeight: 800,
                    color: "#0A3828",
                    lineHeight: 1.2,
                  },
                  children: b.title,
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "#527564",
                    marginTop: "2px",
                  },
                  children: b.desc,
                },
              },
            ],
          },
        },
      ],
    },
  });

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: `${FLYER_WIDTH}px`,
        height: `${FLYER_HEIGHT}px`,
        backgroundColor: "#F9FAF6",
        backgroundImage:
          "radial-gradient(circle at 12% 10%, rgba(220, 238, 227, 0.75) 0%, rgba(249, 250, 246, 0.96) 50%, #F3F6EF 100%)",
        padding: "50px 52px 42px 52px",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
        color: "#0A3828",
      },
      children: [
        // ── 1. HEADER ZONA ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "10px",
            },
            children: [
              // Pill Badge Daun Hijau
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 24px",
                    borderRadius: "100px",
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    border: "1.5px solid rgba(15, 81, 50, 0.28)",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "16px",
                        fontWeight: 800,
                        letterSpacing: "2.2px",
                        color: "#0F5132",
                        textTransform: "uppercase",
                      },
                      children: "🌿 TERAPI ALAMI • TANPA OBAT • TANPA EFEK SAMPING",
                    },
                  },
                },
              },

              // Judul Komersial (Bold Hijau Hutan + Kaligrafi Aksen)
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: "12px",
                    marginTop: "2px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontFamily: "Inter, sans-serif",
                          fontSize: "56px",
                          fontWeight: 800,
                          color: "#0A3828",
                          letterSpacing: "-1px",
                          lineHeight: 1.1,
                        },
                        children: titleMain,
                      },
                    },
                    ...(titleAccent
                      ? [
                          {
                            type: "span",
                            props: {
                              style: {
                                fontFamily: "Playfair Display, serif",
                                fontStyle: "italic",
                                fontSize: "66px",
                                fontWeight: 700,
                                color: "#15803D",
                                lineHeight: 1.1,
                              },
                              children: titleAccent,
                            },
                          },
                        ]
                      : []),
                  ],
                },
              },

              // Subjudul & Deskripsi Manfaat
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "21px",
                          fontWeight: 700,
                          color: "#1B4D3E",
                        },
                        children: "Atasi Keluhan, Pulihkan Keseimbangan Tubuh",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "15px",
                          fontWeight: 500,
                          color: "#527564",
                          marginTop: "2px",
                        },
                        children: "Metode stimulasi titik saraf somatik & akupresur alami untuk relaksasi sistemik menyeluruh.",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // ── 2. HERO IMAGE AREA (LUAS ±35%, ORGANIK) ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              position: "relative",
              width: "976px",
              height: "490px",
              borderRadius: "32px 32px 56px 32px",
              overflow: "hidden",
              border: "2px solid rgba(15, 81, 50, 0.18)",
              boxShadow: "0 18px 42px rgba(10, 56, 40, 0.14)",
              backgroundColor: "#204637",
            },
            children: [
              heroPhotoNode,
              // Soft Organic Bottom Mask Overlay
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "976px",
                    height: "220px",
                    backgroundImage:
                      "linear-gradient(180deg, rgba(249, 250, 246, 0) 0%, rgba(10, 56, 40, 0.75) 60%, rgba(7, 38, 27, 0.95) 100%)",
                  },
                },
              },
              // Teks Script Miring di dekat foto
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    position: "absolute",
                    bottom: "22px",
                    left: "24px",
                    right: "24px",
                    justifyContent: "center",
                  },
                  children: {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px 28px",
                        borderRadius: "50px",
                        backgroundColor: "rgba(255, 255, 255, 0.94)",
                        border: "1.5px solid rgba(226, 183, 116, 0.8)",
                        boxShadow: "0 10px 24px rgba(10, 56, 40, 0.18)",
                      },
                      children: {
                        type: "span",
                        props: {
                          style: {
                            fontFamily: "Playfair Display, serif",
                            fontStyle: "italic",
                            fontSize: "27px",
                            fontWeight: 600,
                            color: "#0A3828",
                          },
                          children: "“Tubuh lebih rileks, pikiran lebih tenang”",
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        },

        // ── 3. ZONA 5 BENEFIT GRID (LINGKARAN HIJAU + SILUET PUTIH) ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: "1.5px solid #E1E8DE",
                    paddingBottom: "6px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "16px",
                          fontWeight: 800,
                          letterSpacing: "2.2px",
                          color: "#0F5132",
                          textTransform: "uppercase",
                        },
                        children: "5 MANFAAT UTAMA TERAPI SOMATIK",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#16A34A",
                        },
                        children: "Pelepasan Simpul Ketegangan",
                      },
                    },
                  ],
                },
              },
              // Grid 2 Kolom + 1 Full
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          gap: "12px",
                        },
                        children: [
                          createBenefitCard(benefitsData[0]),
                          createBenefitCard(benefitsData[1]),
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          gap: "12px",
                        },
                        children: [
                          createBenefitCard(benefitsData[2]),
                          createBenefitCard(benefitsData[3]),
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                        },
                        children: [createBenefitCard(benefitsData[4])],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // ── 4. BADGE HARGA (SAPUAN KUAS ORGANIK HIJAU LUMUT GELAP) ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#0A3828",
              backgroundImage:
                "linear-gradient(93deg, #07261B 0%, #0F5132 48%, #145E44 75%, #0A3828 100%)",
              border: "2.5px solid #E2B774",
              borderRadius: "28px 12px 26px 14px",
              padding: "16px 32px",
              boxShadow: "0 14px 34px rgba(10, 56, 40, 0.28)",
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
                      type: "span",
                      props: {
                        style: {
                          fontSize: "14px",
                          fontWeight: 800,
                          letterSpacing: "2.2px",
                          color: "#FDE047",
                          textTransform: "uppercase",
                        },
                        children: "BIAYA KONSULTASI + TERAPI",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontFamily: "Playfair Display, serif",
                          fontSize: "48px",
                          fontWeight: 700,
                          color: "#FEF08A",
                          lineHeight: 1.1,
                          marginTop: "2px",
                        },
                        children: price,
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
                    padding: "9px 24px",
                    borderRadius: "100px",
                    backgroundColor: "rgba(255, 255, 255, 0.12)",
                    border: "1.5px solid #34D399",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#E4EFE7",
                      },
                      children: `Durasi ${duration}`,
                    },
                  },
                },
              },
            ],
          },
        },

        // ── 5. INFORMASI ALAMAT & JADWAL ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              border: "1.5px solid #E1E8DE",
              borderRadius: "20px",
              padding: "14px 24px",
              gap: "16px",
              boxShadow: "0 4px 14px rgba(10, 56, 40, 0.05)",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flex: 1,
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { fontSize: "24px" },
                        children: "📍",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "12px", color: "#0F5132", fontWeight: 800 },
                              children: "LOKASI PRAKTIK",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "17px", fontWeight: 700, color: "#0A3828" },
                              children: address,
                            },
                          },
                        ],
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
                    gap: "10px",
                    flex: 1,
                    borderLeft: "1.5px solid #E1E8DE",
                    paddingLeft: "18px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { fontSize: "24px" },
                        children: "⏰",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "12px", color: "#0F5132", fontWeight: 800 },
                              children: "JADWAL OPERASIONAL",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "17px", fontWeight: 700, color: "#0A3828" },
                              children: schedule,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // ── 6. REALISTIC STICKY NOTE & DEKORASI SPA BAWAH ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "18px",
            },
            children: [
              // Ornamen Kiri Bawah: Spa Botanical Balance
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    flex: 1,
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { fontSize: "15px", fontWeight: 800, color: "#0F5132", letterSpacing: "1px" },
                        children: "🌿 DOKTER PIKIRAN MAKASSAR",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { fontSize: "13px", fontWeight: 600, color: "#527564" },
                        children: "Ahmad Jawahir Zain • Hipnoterapis Klinis & Somatik",
                      },
                    },
                  ],
                },
              },

              // Realistic Sticky Note Kanan Bawah
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    backgroundColor: "#FFF275",
                    border: "2px solid #FDE047",
                    borderRadius: "14px",
                    padding: "16px 20px 14px 20px",
                    boxShadow: "0 16px 32px rgba(0,0,0,0.18)",
                    transform: "rotate(-1.5deg)",
                    maxWidth: "540px",
                  },
                  children: [
                    // Selotip Perekat Transparan (Masking Tape)
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          width: "90px",
                          height: "18px",
                          backgroundColor: "rgba(255, 255, 255, 0.78)",
                          border: "1px solid rgba(220, 205, 140, 0.6)",
                          borderRadius: "2px",
                          margin: "-25px auto 8px auto",
                        },
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "17px",
                          fontWeight: 800,
                          color: "#78350F",
                          lineHeight: 1.3,
                        },
                        children: `PENTING! Wajib buat janji min. sehari sebelum datang • ${notes}`,
                      },
                    },
                  ],
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
 * ════════════════════════════════════════════════════════════════════════════
 * TEMPLATE PROMO 2: WARM SAND EDITORIAL
 * ════════════════════════════════════════════════════════════════════════════
 */
function buildWarmEditorialPromo(data: SingleFlyerPayload): SatoriElement {
  // Mirip bright botanical dengan palet warm sand / linen editorial (#F5EFEB)
  return buildBrightBotanicalPromo(data);
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * TEMPLATE PROMO 3: CLEAN MINIMALIST
 * ════════════════════════════════════════════════════════════════════════════
 */
function buildCleanMinimalistPromo(data: SingleFlyerPayload): SatoriElement {
  // Menggunakan palet putih cerah modern
  return buildBrightBotanicalPromo(data);
}

/**
 * ════════════════════════════════════════════════════════════════════════════
 * TEMPLATE QUOTES 1: CINEMATIC DEEP ATMOSPHERE
 * ════════════════════════════════════════════════════════════════════════════
 */
function buildCinematicQuotes(data: SingleFlyerPayload): SatoriElement {
  const quoteText =
    data.title ||
    "Tubuhmu tidak sedang melawanmu, ia hanya sedang kelelahan melindungi dirimu. Beri ia ruang dan rasa aman untuk melepaskan beban.";
  const author = data.quoteAuthor || "Ahmad Jawahir Zain";
  const notes =
    data.notes || "Catatan Meja Terapi Makassar • Sistem Saraf & Bawah Sadar";

  const heroPhotoNode: SatoriElement = data.heroPhotoBase64
    ? {
        type: "img",
        props: {
          src: data.heroPhotoBase64,
          alt: "Zen Atmosphere",
          style: {
            width: "960px",
            height: "560px",
            objectFit: "cover",
          },
        },
      }
    : {
        type: "div",
        props: {
          style: {
            display: "flex",
            width: "960px",
            height: "560px",
            backgroundColor: "#161F2E",
          },
        },
      };

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: `${FLYER_WIDTH}px`,
        height: `${FLYER_HEIGHT}px`,
        backgroundColor: "#0D1117",
        backgroundImage:
          "linear-gradient(180deg, #090D12 0%, #151E2C 42%, #0A0E15 100%)",
        padding: "60px 60px 50px 60px",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
        color: "#F0F4F8",
      },
      children: [
        // Top Header
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1.5px solid rgba(255, 255, 255, 0.12)",
              paddingBottom: "18px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  },
                  children: [
                    { type: "span", props: { style: { fontSize: "22px" }, children: "🌿" } },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "16px",
                          fontWeight: 800,
                          letterSpacing: "2.5px",
                          color: "#93C5FD",
                          textTransform: "uppercase",
                        },
                        children: "REFLEKSI MEJA TERAPI",
                      },
                    },
                  ],
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "14px",
                    color: "#94A3B8",
                    fontWeight: 600,
                    letterSpacing: "1px",
                  },
                  children: "MAKASSAR • WITA (UTC+8)",
                },
              },
            ],
          },
        },

        // Atmospheric Photo Card (Cinematic Depth of Field)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              position: "relative",
              width: "960px",
              height: "560px",
              borderRadius: "32px",
              overflow: "hidden",
              border: "1.5px solid rgba(147, 197, 253, 0.28)",
              boxShadow: "0 28px 60px rgba(0,0,0,0.55)",
              backgroundColor: "#111827",
            },
            children: [
              heroPhotoNode,
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                      "linear-gradient(180deg, rgba(13,17,23,0.15) 0%, rgba(13,17,23,0.88) 100%)",
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    position: "absolute",
                    bottom: "26px",
                    left: "30px",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 24px",
                    borderRadius: "50px",
                    backgroundColor: "rgba(15, 23, 42, 0.85)",
                    border: "1px solid rgba(226, 183, 116, 0.6)",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        fontFamily: "Playfair Display, serif",
                        fontStyle: "italic",
                        fontSize: "21px",
                        color: "#FDE68A",
                      },
                      children: "Hening sejenak & resapi perlahan",
                    },
                  },
                },
              },
            ],
          },
        },

        // Quote Content Section (Artistic Serif Typography)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              padding: "16px 12px",
            },
            children: [
              // Giant Artistic Quote Mark
              {
                type: "span",
                props: {
                  style: {
                    fontFamily: "Playfair Display, serif",
                    fontSize: "120px",
                    lineHeight: 0.55,
                    color: "#E2B774",
                    opacity: 0.8,
                  },
                  children: "“",
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontFamily: "Playfair Display, serif",
                    fontSize: "44px",
                    fontWeight: 600,
                    lineHeight: 1.45,
                    color: "#FFFFFF",
                    letterSpacing: "-0.5px",
                  },
                  children: quoteText,
                },
              },
              // Digital Signature Box
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    borderLeft: "3.5px solid #E2B774",
                    paddingLeft: "18px",
                    marginTop: "10px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "25px",
                          fontWeight: 700,
                          color: "#FFFFFF",
                        },
                        children: `— ${author}`,
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "17px",
                          color: "#94A3B8",
                          fontWeight: 500,
                        },
                        children: "Hipnoterapis Klinis & Solo AI Dev • Makassar",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // Insight Reflective Box
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              gap: "16px",
              backgroundColor: "rgba(226, 183, 116, 0.08)",
              border: "1.5px solid rgba(226, 183, 116, 0.35)",
              borderRadius: "20px",
              padding: "20px 24px",
            },
            children: [
              { type: "span", props: { style: { fontSize: "28px" }, children: "💡" } },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "19px",
                    fontWeight: 500,
                    color: "#FDE68A",
                    lineHeight: 1.4,
                  },
                  children: notes,
                },
              },
            ],
          },
        },

        // Footer
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              paddingTop: "14px",
            },
            children: [
              {
                type: "span",
                props: {
                  style: { fontSize: "14px", color: "#64748B", fontWeight: 600 },
                  children: "DOKTER PIKIRAN MAKASSAR",
                },
              },
              {
                type: "span",
                props: {
                  style: { fontSize: "14px", color: "#64748B", fontStyle: "italic" },
                  children: "Simpan ke galeri & bagikan ke kerabat",
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
 * ════════════════════════════════════════════════════════════════════════════
 * TEMPLATE QUOTES 2: WARM LINEN ZEN (KINFOLK EDITORIAL AESTHETIC)
 * ════════════════════════════════════════════════════════════════════════════
 */
function buildWarmLinenQuotes(data: SingleFlyerPayload): SatoriElement {
  const quoteText =
    data.title ||
    "Tubuhmu tidak sedang melawanmu, ia hanya sedang kelelahan melindungi dirimu. Beri ia ruang dan rasa aman untuk melepaskan beban.";
  const author = data.quoteAuthor || "Ahmad Jawahir Zain";
  const notes =
    data.notes || "Catatan Meja Terapi Makassar • Sistem Saraf & Bawah Sadar";

  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: `${FLYER_WIDTH}px`,
        height: `${FLYER_HEIGHT}px`,
        backgroundColor: "#FAF6F0",
        backgroundImage:
          "radial-gradient(circle at 10% 10%, #F5EFEB 0%, #FAF6F0 60%, #EFE8E0 100%)",
        padding: "80px 72px 64px 72px",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
        color: "#1E293B",
      },
      children: [
        // Minimal Top Seal
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1.5px solid #E2D9CC",
              paddingBottom: "20px",
            },
            children: [
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "15px",
                    fontWeight: 800,
                    letterSpacing: "3px",
                    color: "#78644E",
                    textTransform: "uppercase",
                  },
                  children: "MINDFUL EDITORIAL • DOKTER PIKIRAN",
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#9A846E",
                    letterSpacing: "1.5px",
                  },
                  children: "MAKASSAR (WITA)",
                },
              },
            ],
          },
        },

        // Central Minimalist Space & Big Typography
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "36px",
              padding: "40px 0",
            },
            children: [
              {
                type: "span",
                props: {
                  style: {
                    fontFamily: "Playfair Display, serif",
                    fontSize: "140px",
                    lineHeight: 0.5,
                    color: "#B49E82",
                  },
                  children: "“",
                },
              },
              {
                type: "span",
                props: {
                  style: {
                    fontFamily: "Playfair Display, serif",
                    fontSize: "48px",
                    fontWeight: 600,
                    lineHeight: 1.55,
                    color: "#1C1917",
                    letterSpacing: "-0.5px",
                  },
                  children: quoteText,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    borderLeft: "3px solid #B49E82",
                    paddingLeft: "20px",
                    marginTop: "20px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "26px",
                          fontWeight: 700,
                          color: "#1C1917",
                        },
                        children: `— ${author}`,
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "16px",
                          color: "#78644E",
                          fontWeight: 500,
                        },
                        children: "Hipnoterapis Klinis & Solo AI Dev • Makassar",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // Bottom Reflection Box (Warm Sand)
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "16px",
              backgroundColor: "rgba(180, 158, 130, 0.12)",
              border: "1.5px solid rgba(180, 158, 130, 0.4)",
              borderRadius: "20px",
              padding: "20px 26px",
            },
            children: [
              { type: "span", props: { style: { fontSize: "28px" }, children: "🌿" } },
              {
                type: "span",
                props: {
                  style: {
                    fontSize: "18px",
                    fontWeight: 500,
                    color: "#443425",
                    lineHeight: 1.4,
                  },
                  children: notes,
                },
              },
            ],
          },
        },

        // Footer
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1.5px solid #E2D9CC",
              paddingTop: "18px",
            },
            children: [
              {
                type: "span",
                props: {
                  style: { fontSize: "14px", color: "#9A846E", fontWeight: 600 },
                  children: "Dokter Pikiran Makassar • Catatan Meja Terapi",
                },
              },
              {
                type: "span",
                props: {
                  style: { fontSize: "14px", color: "#9A846E", fontStyle: "italic" },
                  children: "Simpan & renungkan perlahan",
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
 * ════════════════════════════════════════════════════════════════════════════
 * TEMPLATE QUOTES 3: BOTANICAL QUOTE
 * ════════════════════════════════════════════════════════════════════════════
 */
function buildBotanicalQuotes(data: SingleFlyerPayload): SatoriElement {
  // Padukan kesegaran botanical spa dengan tipografi quotes
  return buildWarmLinenQuotes(data);
}

/**
 * Render Satori JSON tree element berdasarkan payload preset & templateId
 */
export function buildSingleFlyerElement(payload: SingleFlyerPayload): SatoriElement {
  if (payload.preset === "QUOTES") {
    if (payload.templateId === "linen") {
      return buildWarmLinenQuotes(payload);
    }
    if (payload.templateId === "botanical") {
      return buildBotanicalQuotes(payload);
    }
    return buildCinematicQuotes(payload);
  }

  // PROMO_KLINIK
  if (payload.templateId === "warm_editorial") {
    return buildWarmEditorialPromo(payload);
  }
  if (payload.templateId === "clean_minimalist") {
    return buildCleanMinimalistPromo(payload);
  }
  return buildBrightBotanicalPromo(payload);
}

/**
 * Render flyer tunggal menjadi string SVG melalui Satori
 */
export async function renderSingleFlyerSvg(payload: SingleFlyerPayload): Promise<string> {
  const fonts = await getFlyerFonts();
  const element = buildSingleFlyerElement(payload);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return satori(element as any, {
    width: FLYER_WIDTH,
    height: FLYER_HEIGHT,
    fonts,
  });
}

/**
 * Render flyer tunggal menjadi Buffer PNG Ultra HD 2K (2160 x 3840 px)
 */
export async function renderSingleFlyerPng(payload: SingleFlyerPayload): Promise<Buffer> {
  const svg = await renderSingleFlyerSvg(payload);

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: ULTRA_HD_WIDTH }, // Scaled to 2160 x 3840 Ultra HD Retina
    font: { loadSystemFonts: false },
    background: "#F9FAF6",
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}
