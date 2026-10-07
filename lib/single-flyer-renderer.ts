import { readFile } from "node:fs/promises";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori, { type Font } from "satori";

export const FLYER_WIDTH = 1080;
export const FLYER_HEIGHT = 1920;

export interface SingleFlyerPayload {
  preset: "PROMO_KLINIK" | "QUOTES";
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

// Representasi node element JSON kompatibel dengan Satori
export interface SatoriElement {
  type: string;
  props: {
    style?: Record<string, string | number | undefined>;
    children?: string | SatoriElement | (string | SatoriElement)[];
    src?: string;
    alt?: string;
    [key: string]: unknown;
  };
}

let cachedFonts: Font[] | null = null;

/**
 * Memuat font WOFF resmi dari src/assets/fonts untuk Satori
 */
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

/**
 * Membangun elemen kartu Preset 1: PROMO KLINIK
 */
function buildPromoKlinikElement(data: SingleFlyerPayload): SatoriElement {
  const title = data.title || "Totok Saraf Makassar";
  const price = data.price || "Rp 150.000";
  const duration = data.duration || "± 1 Jam";
  const address = data.address || "Jl. Batua Raya 10 B No.9 Makassar";
  const schedule = data.schedule || "Senin – Sabtu 16.00 – 21.00 WITA";
  const notes = data.notes || "Maksimal 5 pasien per hari";
  const subtitle =
    data.subtitle || "Stimulasi Titik Saraf & Relaksasi Sistem Saraf Somatik";

  const benefits = [
    "Meredakan Sakit Kepala & Migrain",
    "Mengurangi Ketegangan Otot & Leher",
    "Melancarkan Aliran Darah Tubuh",
    "Membantu Kualitas Tidur (Insomnia)",
    "Mendukung Ketenangan Mental & Vagus Nerve",
  ];

  const heroPhotoNode: SatoriElement = data.heroPhotoBase64
    ? {
        type: "img",
        props: {
          src: data.heroPhotoBase64,
          alt: "Hero Terapi",
          style: {
            width: "976px",
            height: "520px",
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
            height: "520px",
            backgroundColor: "#11382A",
          },
        },
      };

  const createBenefitPill = (text: string): SatoriElement => ({
    type: "div",
    props: {
      style: {
        display: "flex",
        flex: 1,
        alignItems: "center",
        gap: "12px",
        backgroundColor: "rgba(116, 168, 146, 0.08)",
        border: "1px solid rgba(116, 168, 146, 0.25)",
        borderRadius: "16px",
        padding: "12px 16px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#10B981",
              alignItems: "center",
              justifyContent: "center",
              color: "#051A12",
              fontWeight: 900,
              fontSize: "18px",
            },
            children: "✓",
          },
        },
        {
          type: "span",
          props: {
            style: {
              fontSize: "19px",
              fontWeight: 600,
              color: "#E4EFE7",
            },
            children: text,
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
        backgroundColor: "#0A1411",
        backgroundImage:
          "linear-gradient(180deg, #071510 0%, #102B21 35%, #0B1F18 70%, #050D0A 100%)",
        padding: "54px 52px 46px 52px",
        boxSizing: "border-box",
        fontFamily: "Inter, sans-serif",
        color: "#E4EFE7",
      },
      children: [
        // ── HEADER ZONA ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "12px",
            },
            children: [
              // Top Tagline Badge
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 24px",
                    borderRadius: "100px",
                    backgroundColor: "rgba(116, 168, 146, 0.16)",
                    border: "1.5px solid rgba(116, 168, 146, 0.45)",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "17px",
                        fontWeight: 800,
                        letterSpacing: "2.5px",
                        color: "#88C7AD",
                        textTransform: "uppercase",
                      },
                      children: "TERAPI ALAMI • TANPA OBAT • TANPA EFEK SAMPING",
                    },
                  },
                },
              },
              // Judul Layanan Besar
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
                          fontFamily: "Playfair Display, serif",
                          fontSize: "58px",
                          fontWeight: 700,
                          color: "#FFFFFF",
                          letterSpacing: "-0.5px",
                          lineHeight: 1.15,
                          textAlign: "center",
                        },
                        children: title,
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "21px",
                          fontWeight: 400,
                          color: "#B8D5C8",
                          marginTop: "6px",
                          textAlign: "center",
                        },
                        children: subtitle,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // ── ZONA HERO FOTO + BADGE SCRIPT ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              position: "relative",
              width: "976px",
              height: "520px",
              borderRadius: "28px",
              overflow: "hidden",
              border: "2px solid rgba(116, 168, 146, 0.35)",
              boxShadow: "0 20px 40px rgba(0,0,0,0.45)",
              backgroundColor: "#0D221A",
            },
            children: [
              heroPhotoNode,
              // Gradient Overlay
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: "976px",
                    height: "240px",
                    backgroundImage:
                      "linear-gradient(180deg, rgba(7, 21, 16, 0) 0%, rgba(7, 21, 16, 0.82) 55%, rgba(7, 21, 16, 0.98) 100%)",
                  },
                },
              },
              // Badge Kutipan Script "Tubuh lebih rileks, pikiran lebih tenang"
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    position: "absolute",
                    bottom: "20px",
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
                        backgroundColor: "rgba(5, 16, 12, 0.85)",
                        border: "1.5px solid rgba(226, 183, 116, 0.6)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
                      },
                      children: {
                        type: "span",
                        props: {
                          style: {
                            fontFamily: "Playfair Display, serif",
                            fontStyle: "italic",
                            fontSize: "27px",
                            fontWeight: 500,
                            color: "#FDE68A",
                            letterSpacing: "0.5px",
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

        // ── ZONA 5 BENEFIT GRID ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
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
                    borderBottom: "1px solid rgba(116, 168, 146, 0.2)",
                    paddingBottom: "6px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "16px",
                          fontWeight: 800,
                          letterSpacing: "2.5px",
                          color: "#88C7AD",
                          textTransform: "uppercase",
                        },
                        children: "5 MANFAAT UTAMA TERAPI",
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#74A892",
                        },
                        children: "Stimulasi Titik Saraf Alami",
                      },
                    },
                  ],
                },
              },
              // 5 Benefit Items
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
                          createBenefitPill(benefits[0]),
                          createBenefitPill(benefits[1]),
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
                          createBenefitPill(benefits[2]),
                          createBenefitPill(benefits[3]),
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
                        children: [createBenefitPill(benefits[4])],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },

        // ── ZONA HARGA (BADGE HIJAU TUA + GOLD BRUSH) ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#0F382B",
              backgroundImage:
                "linear-gradient(90deg, #0A281E 0%, #154C3A 50%, #0A281E 100%)",
              border: "2px solid #E2B774",
              borderRadius: "22px",
              padding: "16px 28px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
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
                          fontSize: "15px",
                          fontWeight: 800,
                          letterSpacing: "2px",
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
                          fontSize: "44px",
                          fontWeight: 700,
                          color: "#FFFFFF",
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
                    padding: "8px 22px",
                    borderRadius: "100px",
                    backgroundColor: "rgba(16, 185, 129, 0.2)",
                    border: "1.5px solid #10B981",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#6EE7B7",
                      },
                      children: `Durasi ${duration}`,
                    },
                  },
                },
              },
            ],
          },
        },

        // ── ZONA INFO & ALAMAT ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: "18px",
              padding: "14px 22px",
              gap: "16px",
            },
            children: [
              // Alamat
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
                              style: { fontSize: "12px", color: "#88C7AD", fontWeight: 700 },
                              children: "LOKASI KLINIK",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "17px", fontWeight: 600, color: "#FFFFFF" },
                              children: address,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Jadwal
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    flex: 1,
                    borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
                    paddingLeft: "16px",
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
                              style: { fontSize: "12px", color: "#88C7AD", fontWeight: 700 },
                              children: "JADWAL PRAKTIK",
                            },
                          },
                          {
                            type: "span",
                            props: {
                              style: { fontSize: "17px", fontWeight: 600, color: "#FFFFFF" },
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

        // ── ZONA STICKY NOTE KUNING MIRING ──
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "14px",
              backgroundColor: "#FEF08A",
              border: "2px solid #FDE047",
              borderRadius: "16px",
              padding: "16px 22px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
              transform: "rotate(-1.2deg)",
            },
            children: [
              {
                type: "span",
                props: {
                  style: { fontSize: "26px" },
                  children: "📌",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        fontSize: "18px",
                        fontWeight: 800,
                        color: "#78350F",
                        lineHeight: 1.3,
                      },
                      children: `PENTING: Wajib buat janji min. sehari sebelum datang • ${notes}`,
                    },
                  },
                },
              },
            ],
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
              paddingTop: "4px",
            },
            children: [
              {
                type: "span",
                props: {
                  style: { fontSize: "14px", color: "#6E8B7F", fontWeight: 600 },
                  children: "DOKTER PIKIRAN MAKASSAR • Ahmad Jawahir Zain (Hipnoterapis Klinis)",
                },
              },
              {
                type: "span",
                props: {
                  style: { fontSize: "13px", color: "#506A60", fontStyle: "italic" },
                  children: "WhatsApp Reservasi Resmi",
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
 * Membangun elemen kartu Preset 2: QUOTES TUNGGAL
 */
function buildQuotesElement(data: SingleFlyerPayload): SatoriElement {
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
            height: "480px",
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
            height: "480px",
            backgroundColor: "#15202E",
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
          "linear-gradient(180deg, #090D12 0%, #161F2E 40%, #0C121B 100%)",
        padding: "64px 60px 54px 60px",
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
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
              paddingBottom: "16px",
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
                    {
                      type: "span",
                      props: {
                        style: { fontSize: "22px" },
                        children: "🌿",
                      },
                    },
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
                    color: "#64748B",
                    fontWeight: 600,
                    letterSpacing: "1px",
                  },
                  children: "MAKASSAR • WITA (UTC+8)",
                },
              },
            ],
          },
        },

        // Atmospheric Photo Card
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              position: "relative",
              width: "960px",
              height: "480px",
              borderRadius: "28px",
              overflow: "hidden",
              border: "1px solid rgba(147, 197, 253, 0.25)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
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
                      "linear-gradient(180deg, rgba(13,17,23,0.1) 0%, rgba(13,17,23,0.85) 100%)",
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    position: "absolute",
                    bottom: "24px",
                    left: "28px",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 20px",
                    borderRadius: "50px",
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                    border: "1px solid rgba(226, 183, 116, 0.5)",
                  },
                  children: {
                    type: "span",
                    props: {
                      style: {
                        fontFamily: "Playfair Display, serif",
                        fontStyle: "italic",
                        fontSize: "20px",
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

        // Quote Content Section
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              padding: "20px 10px",
            },
            children: [
              {
                type: "span",
                props: {
                  style: {
                    fontFamily: "Playfair Display, serif",
                    fontSize: "110px",
                    lineHeight: 0.6,
                    color: "#E2B774",
                    opacity: 0.75,
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
              // Author & Credential
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    borderLeft: "3px solid #E2B774",
                    paddingLeft: "16px",
                    marginTop: "10px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: {
                          fontSize: "24px",
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

        // Reflection Note Box
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
              {
                type: "span",
                props: {
                  style: { fontSize: "28px" },
                  children: "💡",
                },
              },
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
 * Render Satori JSON tree element berdasarkan payload preset
 */
export function buildSingleFlyerElement(payload: SingleFlyerPayload): SatoriElement {
  if (payload.preset === "QUOTES") {
    return buildQuotesElement(payload);
  }
  return buildPromoKlinikElement(payload);
}

/**
 * Render flyer tunggal 1080x1920 menjadi string SVG melalui Satori
 */
export async function renderSingleFlyerSvg(payload: SingleFlyerPayload): Promise<string> {
  const fonts = await getFlyerFonts();
  const element = buildSingleFlyerElement(payload);

  // Cast element ke any karena Satori menerima React element atau JSON virtual node object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return satori(element as any, {
    width: FLYER_WIDTH,
    height: FLYER_HEIGHT,
    fonts,
  });
}

/**
 * Render flyer tunggal 1080x1920 menjadi Buffer PNG murni siap kirim ke Telegram
 */
export async function renderSingleFlyerPng(payload: SingleFlyerPayload): Promise<Buffer> {
  const svg = await renderSingleFlyerSvg(payload);

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: FLYER_WIDTH },
    font: { loadSystemFonts: false },
    background: "#000000",
  });

  const pngData = resvg.render();
  return Buffer.from(pngData.asPng());
}
