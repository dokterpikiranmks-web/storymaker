import type { ReactElement, ReactNode } from "react";
import { ACTS, SLIDE_HEIGHT, SLIDE_WIDTH, THEMES, type ActType, type ThemeName } from "@/lib/stories/constants";
import { stripEmoji, truncate } from "@/lib/utils";

/**
 * Satori JSX templates — 1080×1920 (9:16 vertical poster/story).
 * Satori layout requirements:
 * 1. Every multi-child <div> must explicitly specify display: "flex".
 * 2. Only flexbox layout is supported (row/column).
 * 3. All SVG graphics are rendered inline.
 * 4. Colors use hex, rgba, and linear-gradient/radial-gradient on backgroundImage.
 */

export interface SlideRenderInput {
  headline: string;
  body: string;
  cta?: string | null;
  actType: ActType;
  themeName?: ThemeName;
  handle?: string;
  signature?: string;
  technique?: string | null;
  keyElement?: string | null;
}

interface Segment {
  text: string;
  accent: boolean;
}

type Word = Segment[];

function sanitize(value: string): string {
  return stripEmoji(value)
    .replace(/[→⇒➜➔]/g, "->")
    .replace(/[←⇐]/g, "<-")
    .replace(/\r/g, "");
}

/**
 * Parses *accented words* inside strings so they can be rendered with dynamic highlight colors.
 */
export function parseAccentWords(text: string): Word[] {
  const words: Word[] = [];
  let glue = false;
  const parts = sanitize(text).split(/(\*[^*]+\*)/g);
  for (const part of parts) {
    if (!part) continue;
    const accent = part.length > 2 && part.startsWith("*") && part.endsWith("*");
    const content = (accent ? part.slice(1, -1) : part).replace(/\*/g, "");
    for (const token of content.split(/(\s+)/)) {
      if (!token) continue;
      if (/^\s+$/.test(token)) {
        glue = false;
        continue;
      }
      if (glue && words.length > 0) words[words.length - 1].push({ text: token, accent });
      else words.push([{ text: token, accent }]);
      glue = true;
    }
  }
  return words;
}

function plainLength(text: string): number {
  return sanitize(text).replace(/\*/g, "").length;
}

function headlineSize(text: string, base: number): number {
  const len = plainLength(text);
  if (len <= 26) return base;
  if (len <= 44) return Math.round(base * 0.88);
  if (len <= 65) return Math.round(base * 0.76);
  if (len <= 90) return Math.round(base * 0.65);
  return Math.round(base * 0.58);
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MICRO-DESIGN COMPONENTS (OFFICIAL BRANDING)
// ─────────────────────────────────────────────────────────────────────────────

/** Official Minimalist Watermark for Dokter Pikiran */
function BrandWatermark({ color }: { color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginRight: 12 }}>
        <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2.2" strokeOpacity="0.8" />
        <path d="M12 7v10M7 12h10" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill={color} />
      </svg>
      <span
        style={{
          fontFamily: "Inter",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: 4,
          color,
          textTransform: "uppercase",
        }}
      >
        Dokter Pikiran
      </span>
    </div>
  );
}

/** Slide counter dots: e.g. • ○ ○ ○ for slide 1 */
function SlideCounterDots({
  activeIndex,
  accentColor,
  mutedColor,
}: {
  activeIndex: number;
  accentColor: string;
  mutedColor: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center" }}>
      {[1, 2, 3, 4].map((n) => {
        const isActive = n === activeIndex;
        return (
          <div
            key={n}
            style={{
              display: "flex",
              width: isActive ? 34 : 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: isActive ? accentColor : mutedColor,
              marginRight: n < 4 ? 10 : 0,
              opacity: isActive ? 1 : 0.45,
            }}
          />
        );
      })}
    </div>
  );
}

/** Top Header Bar with Watermark + Act Badge */
function TopHeaderBar({
  badgeText,
  badgeBg,
  badgeBorder,
  badgeColor,
  watermarkColor,
  slotTime,
}: {
  badgeText: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
  watermarkColor: string;
  slotTime?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginBottom: 44,
      }}
    >
      <BrandWatermark color={watermarkColor} />
      <div style={{ display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 24px",
            borderRadius: 999,
            backgroundColor: badgeBg,
            border: `1.5px solid ${badgeBorder}`,
            fontFamily: "JetBrains Mono",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 3,
            color: badgeColor,
            textTransform: "uppercase",
          }}
        >
          {badgeText}
        </div>
        {slotTime ? (
          <div
            style={{
              display: "flex",
              marginLeft: 16,
              fontFamily: "JetBrains Mono",
              fontSize: 20,
              letterSpacing: 2,
              color: watermarkColor,
              opacity: 0.7,
            }}
          >
            {slotTime}
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** Standard Slide Footer with Handle, Dots, and Page Indicator */
function SlideFooter({
  handle,
  signature,
  color,
  font,
  index,
  accentColor,
}: {
  handle?: string;
  signature?: string;
  color: string;
  font: string;
  index: number;
  accentColor: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: "auto",
        paddingTop: 40,
        fontFamily: font,
        color,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 1, color }}>
          {sanitize(handle || "@dokterpikiran")}
        </div>
        {signature ? (
          <div style={{ display: "flex", fontSize: 20, marginTop: 6, opacity: 0.75, color }}>
            {truncate(sanitize(signature), 50)}
          </div>
        ) : null}
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <SlideCounterDots activeIndex={index} accentColor={accentColor} mutedColor={color} />
        <div
          style={{
            display: "flex",
            marginLeft: 20,
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            letterSpacing: 3,
            fontWeight: 700,
            color,
            opacity: 0.85,
          }}
        >
          {`${index}/4`}
        </div>
      </div>
    </div>
  );
}

/** Master Headline with Accent Words support */
function Headline({
  text,
  size,
  color,
  accent,
  font = "Inter",
  weight = 800,
  italic = false,
  center = false,
  lineHeight = 1.12,
  letterSpacing = -1.5,
  glow,
}: {
  text: string;
  size: number;
  color: string;
  accent: string;
  font?: string;
  weight?: 400 | 500 | 600 | 700 | 800;
  italic?: boolean;
  center?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
  glow?: string;
}): ReactElement {
  const words = parseAccentWords(text);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: center ? "center" : "flex-start",
        fontFamily: font,
        fontSize: size,
        fontWeight: weight,
        fontStyle: italic ? "italic" : "normal",
        lineHeight,
        letterSpacing,
        color,
      }}
    >
      {words.map((word, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            marginRight: Math.round(size * 0.22),
            marginLeft: center ? Math.round(size * 0.02) : 0,
          }}
        >
          {word.map((seg, j) => (
            <span
              key={j}
              style={{
                color: seg.accent ? accent : color,
                textShadow: seg.accent && glow ? glow : "none",
              }}
            >
              {seg.text}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PARSING UTILITIES FOR THE 4 ARCHETYPES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Babak 1: Extracts 3 body symptoms and 1 afternoon teaser.
 */
function parseChecklistContent(body: string, cta?: string | null): { items: string[]; teaser: string } {
  const clean = sanitize(body).replace(/\*/g, "");
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  let teaser = "";
  const candidateItems: string[] = [];

  // Look for teaser line mentioning siang, jam 12:30, solusi, etc.
  for (const line of lines) {
    if (/siang|12[:.]30|jam 12|solusi|bocorkan|tunjukkan|nanti siang|janji/i.test(line)) {
      if (!teaser) teaser = line;
      continue;
    }

    // Check for bullet markers: "-", "•", "*", "[ ]", "1.", etc.
    const bulletMatch = line.match(/^[-*•✓\[\]\d.]+\s*(.+)$/);
    if (bulletMatch && bulletMatch[1]) {
      candidateItems.push(bulletMatch[1]);
    } else {
      // Split sentences if no bullet markers
      const sentences = line.split(/(?<=[.!?])\s+/).filter(Boolean);
      for (const s of sentences) {
        if (/siang|12[:.]30|jam 12|solusi|bocorkan|tunjukkan/i.test(s)) {
          if (!teaser) teaser = s;
        } else if (s.length > 8) {
          candidateItems.push(s);
        }
      }
    }
  }

  if (!teaser && cta) teaser = cta;
  if (!teaser) teaser = "Solusi titik saraf peredanya kita kupas tuntas siang ini jam 12:30.";

  // Curate 3 high-impact checklist items
  let items = candidateItems.slice(0, 3);
  if (items.length < 3) {
    const fallbacks = [
      "Otot leher belakang mengeras kaku saat bangun tidur",
      "Rahang bawah mengatup rapat tanpa disadari saat mikir",
      "Napas terasa dangkal dan dada mengganjal berat",
    ];
    items = [...items, ...fallbacks].slice(0, 3);
  }

  // Format cleanly (truncate to 72 chars max per item for punchy impact)
  return {
    items: items.map((it) => truncate(it.replace(/^[-*•\d.]+\s*/, ""), 72)),
    teaser: truncate(teaser, 110),
  };
}

/**
 * Babak 2: Extracts 3 somatic action cards (Action Verb, Instruction, Meridian Indicator).
 */
function parseActionStepsContent(body: string): Array<{ step: string; verb: string; instruction: string; meridian: string }> {
  const clean = sanitize(body).replace(/\*/g, "");
  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);

  // Default clinical somatic protocol
  const defaults = [
    {
      step: "01",
      verb: "TEKAN",
      instruction: "Letakkan dua jempol di cekungan pangkal tengkorak leher belakang (GB-20) dan tekan lembut 30 detik.",
      meridian: "Titik GB-20 • Cekungan Leher Belakang",
    },
    {
      step: "02",
      verb: "HEMBUSKAN",
      instruction: "Tarik napas perlahan lewat hidung 4 detik, hembuskan panjang lewat mulut 8 detik seperti meniup lilin.",
      meridian: "Rem Saraf Vagus • Jalur Napas Plong",
    },
    {
      step: "03",
      verb: "LEPASKAN",
      instruction: "Turunkan kedua bahu santai dan rasakan ketegangan leher serta dada seketika rontok.",
      meridian: "Meridian Trapezius • Dekompresi Saraf",
    },
  ];

  // Try extracting action verbs if user customized the steps
  const verbs = ["TEKAN", "HEMBUSKAN", "LEPASKAN", "SENTUH", "TARIK NAPAS", "PUTAR", "RILEKS"];
  const parsed: typeof defaults = [];

  for (let i = 0; i < lines.length && parsed.length < 3; i++) {
    const line = lines[i];
    if (/sore|18[:.]45|jam 18|kabel emosi/i.test(line)) continue;

    for (const v of verbs) {
      if (line.toUpperCase().includes(v)) {
        const stepNum = `0${parsed.length + 1}`;
        const instruction = line.replace(new RegExp(`^.*${v}[:\\s-]*`, "i"), "").trim() || line;
        parsed.push({
          step: stepNum,
          verb: v,
          instruction: truncate(instruction, 90),
          meridian: defaults[parsed.length]?.meridian ?? "Meridian Akupresur Terapi",
        });
        break;
      }
    }
  }

  return parsed.length === 3 ? parsed : defaults;
}

/**
 * Babak 3: Extracts the Split Comparison (Yang Kamu Pikirkan vs Akar Masalah Saraf).
 */
function parseComparisonContent(body: string): {
  perceivedTitle: string;
  perceivedItems: string[];
  clinicalTitle: string;
  clinicalItems: string[];
  teaser: string;
} {
  const clean = sanitize(body).replace(/\*/g, "");
  let teaser = "Nanti malam jam 21:30 sebelum tidur, kita reset pikiran bawah sadarmu.";

  const lines = clean.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const l of lines) {
    if (/malam|21[:.]30|jam 21|sebelum tidur|reset/i.test(l)) {
      teaser = l;
      break;
    }
  }

  return {
    perceivedTitle: "YANG KAMU PIKIRKAN",
    perceivedItems: [
      "Mengira salah posisi tidur atau salah bantal",
      "Pegal fisik biasa akibat kelamaan di depan laptop",
      "Cukup dioles balsam atau dipijat sebentar",
    ],
    clinicalTitle: "AKAR MASALAH SARAF",
    clinicalItems: [
      "Pikiran bawah sadar menyalakan 'alarm bahaya' non-stop",
      "Kabel saraf simpatik terkunci di mode tegang & siaga",
      "Sistem tubuh butuh restart dari akar instruksi lama",
    ],
    teaser: truncate(teaser, 110),
  };
}

/**
 * Babak 4: Extracts Keyword, Document Title, and Preview Steps for Lead Magnet Card.
 */
function parseLeadMagnetContent(headline: string, body: string, cta?: string | null): {
  keyword: string;
  documentTitle: string;
  steps: string[];
} {
  const fullText = `${cta || ""} ${headline} ${body}`;

  // Extract keyword
  let keyword = "RESET";
  const kwMatch = fullText.match(/(?:ketik|keyword|kata kunci)\s+['"]?([A-Za-z0-9_-]{2,20})['"]?/i);
  if (kwMatch && kwMatch[1]) {
    keyword = kwMatch[1].toUpperCase();
  } else if (/LEHER/i.test(fullText)) {
    keyword = "LEHER";
  } else if (/LAMBUNG/i.test(fullText)) {
    keyword = "LAMBUNG";
  } else if (/INSOMNIA/i.test(fullText)) {
    keyword = "INSOMNIA";
  } else if (/FOKUS/i.test(fullText)) {
    keyword = "FOKUS";
  }

  // Derive Document Title
  let docTitle = "PROTOKOL RESET SARAF VAGUS";
  if (/leher|tengkorak/i.test(fullText)) {
    docTitle = "PROTOKOL RESET SARAF VAGUS & OTOT LEHER";
  } else if (/lambung|begah|asam/i.test(fullText)) {
    docTitle = "PROTOKOL SOMATIK GUT-BRAIN & ASAM LAMBUNG";
  } else if (/tidur|insomnia|lelap/i.test(fullText)) {
    docTitle = "PROTOKOL GELOMBANG THETA & TIDUR PULIH";
  } else if (/otak|nge-hang|mikir/i.test(fullText)) {
    docTitle = "PANDUAN DEKOMPRESI OVERTHINKING & FOKUS";
  }

  return {
    keyword,
    documentTitle: docTitle,
    steps: [
      "01 • Titik Akupresur Meridian Leher Belakang (GB-20)",
      "02 • Rem Darurat Saraf Vagus: Pola Nafas 4-7-8",
      "03 • Sugesti Pelepasan Gelombang Theta Bawah Sadar",
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. [BABAK 1: THE THUMB-STOPPER CHECKLIST]
// Palette: Deep Emerald & Cream Warm
// ─────────────────────────────────────────────────────────────────────────────
function ThumbStopperChecklist(input: SlideRenderInput): ReactElement {
  const act = ACTS[input.actType] ?? ACTS.ACT_1_HOOK;
  const { items, teaser } = parseChecklistContent(input.body, input.cta);

  const bgGradient = "linear-gradient(180deg, #04140F 0%, #07231B 50%, #03120D 100%)";
  const emeraldAccent = "#34D399";
  const emeraldGlow = "rgba(52, 211, 153, 0.4)";
  const creamWarm = "#FBF7EE";
  const creamMuted = "#D1C7B7";

  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        backgroundImage: bgGradient,
        backgroundColor: "#04140F",
        padding: "88px 84px 96px",
      }}
    >
      {/* Ambient Radial Lighting Glow */}
      <div
        style={{
          position: "absolute",
          top: -200,
          right: -200,
          width: 900,
          height: 900,
          borderRadius: 900,
          backgroundImage: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -240,
          left: -200,
          width: 950,
          height: 950,
          borderRadius: 950,
          backgroundImage: "radial-gradient(circle, rgba(5,150,105,0.15) 0%, rgba(5,150,105,0) 70%)",
        }}
      />

      {/* Top Header Bar */}
      <TopHeaderBar
        badgeText="SELF-CHECK PAGI • DOKTER PIKIRAN"
        badgeBg="rgba(52, 211, 153, 0.12)"
        badgeBorder="rgba(52, 211, 153, 0.4)"
        badgeColor={emeraldAccent}
        watermarkColor={creamMuted}
        slotTime="PAGI · 07:15"
      />

      {/* Main Content Area */}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
        {/* Bold Impact Headline */}
        <Headline
          text={input.headline}
          size={headlineSize(input.headline, 102)}
          color={creamWarm}
          accent={emeraldAccent}
          font="Inter"
          weight={800}
          letterSpacing={-2}
          glow={`0 0 32px ${emeraldGlow}`}
        />

        {/* Subtitle / Context prompt */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 44,
            marginBottom: 28,
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            color: emeraldAccent,
            textTransform: "uppercase",
          }}
        >
          <span style={{ marginRight: 10 }}>[!]</span> APAKAH TUBUHMU MERASAKAN INI SAAT BANGUN?
        </div>

        {/* Interactive Checklist Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            borderRadius: 32,
            border: "2px solid rgba(52, 211, 153, 0.3)",
            backgroundColor: "rgba(6, 32, 24, 0.88)",
            padding: "36px 36px 32px",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
          }}
        >
          {items.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "24px 28px",
                borderRadius: 22,
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                border: "1.5px solid rgba(52, 211, 153, 0.18)",
                marginBottom: idx < items.length - 1 ? 18 : 0,
              }}
            >
              {/* Aesthetic Checkbox Square [✓] */}
              <div
                style={{
                  display: "flex",
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  backgroundColor: emeraldAccent,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 0 18px ${emeraldGlow}`,
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#04140F" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              {/* Symptom Label */}
              <div
                style={{
                  display: "flex",
                  marginLeft: 24,
                  fontFamily: "Inter",
                  fontSize: 34,
                  fontWeight: 600,
                  lineHeight: 1.35,
                  color: creamWarm,
                }}
              >
                {item}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Teaser Box: Promise of afternoon solution */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 34,
            padding: "26px 32px",
            borderRadius: 24,
            border: "2px dashed rgba(52, 211, 153, 0.45)",
            backgroundColor: "rgba(52, 211, 153, 0.09)",
          }}
        >
          <div
            style={{
              display: "flex",
              padding: "8px 18px",
              borderRadius: 12,
              backgroundColor: emeraldAccent,
              color: "#04140F",
              fontFamily: "JetBrains Mono",
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: 2,
              flexShrink: 0,
              marginRight: 22,
            }}
          >
            SOLUSI SIANG · 12:30
          </div>
          <div
            style={{
              display: "flex",
              fontFamily: "Inter",
              fontSize: 28,
              fontWeight: 600,
              color: creamWarm,
              lineHeight: 1.35,
            }}
          >
            {teaser}
          </div>
        </div>
      </div>

      {/* Slide Footer with Counter Dots */}
      <SlideFooter
        handle={input.handle}
        signature={input.signature}
        color={creamMuted}
        font="Inter"
        index={act.index}
        accentColor={emeraldAccent}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. [BABAK 2: THE 3-STEP ACTION CARDS]
// Palette: Slate Grey & Ice Clinical Blue
// ─────────────────────────────────────────────────────────────────────────────
function ThreeStepActionCards(input: SlideRenderInput): ReactElement {
  const act = ACTS[input.actType] ?? ACTS.ACT_2_SOMATIC;
  const steps = parseActionStepsContent(input.body);

  const bgGradient = "linear-gradient(180deg, #090E17 0%, #0F172A 55%, #0B1120 100%)";
  const iceBlue = "#38BDF8";
  const iceBlueGlow = "rgba(56, 189, 248, 0.4)";
  const slateText = "#F8FAFC";
  const slateMuted = "#94A3B8";

  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        backgroundImage: bgGradient,
        backgroundColor: "#090E17",
        padding: "88px 84px 96px",
      }}
    >
      {/* Clinical Ambient Radial */}
      <div
        style={{
          position: "absolute",
          top: -180,
          left: -180,
          width: 900,
          height: 900,
          borderRadius: 900,
          backgroundImage: "radial-gradient(circle, rgba(56,189,248,0.18) 0%, rgba(56,189,248,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          right: -200,
          width: 900,
          height: 900,
          borderRadius: 900,
          backgroundImage: "radial-gradient(circle, rgba(14,165,233,0.14) 0%, rgba(14,165,233,0) 70%)",
        }}
      />

      {/* Top Header Bar */}
      <TopHeaderBar
        badgeText="PROTOKOL SOMATIK • SIANG 12:30"
        badgeBg="rgba(56, 189, 248, 0.12)"
        badgeBorder="rgba(56, 189, 248, 0.4)"
        badgeColor={iceBlue}
        watermarkColor={slateMuted}
        slotTime="SIANG · 12:30"
      />

      {/* Main Content Area */}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
        {/* Bold Headline */}
        <Headline
          text={input.headline}
          size={headlineSize(input.headline, 96)}
          color={slateText}
          accent={iceBlue}
          font="Inter"
          weight={800}
          letterSpacing={-2}
          glow={`0 0 30px ${iceBlueGlow}`}
        />

        {/* Action subtitle */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 36,
            marginBottom: 26,
            fontFamily: "JetBrains Mono",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 3,
            color: iceBlue,
            textTransform: "uppercase",
          }}
        >
          <span style={{ marginRight: 10 }}>▶</span> LAKUKAN 3 LANGKAH FISIK INI SEKARANG:
        </div>

        {/* 3 Sequential Action Cards (Vertical Stack) */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {steps.map((st) => (
            <div
              key={st.step}
              style={{
                display: "flex",
                alignItems: "center",
                borderRadius: 26,
                backgroundColor: "rgba(30, 41, 59, 0.78)",
                border: "2px solid rgba(56, 189, 248, 0.28)",
                padding: "26px 30px",
                boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
              }}
            >
              {/* Badge Step "01", "02", "03" with contrasting background */}
              <div
                style={{
                  display: "flex",
                  width: 76,
                  height: 76,
                  borderRadius: 20,
                  backgroundColor: iceBlue,
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: `0 0 20px ${iceBlueGlow}`,
                }}
              >
                <span
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#0F172A",
                  }}
                >
                  {st.step}
                </span>
              </div>

              {/* Action content & meridian indicator */}
              <div style={{ display: "flex", flexDirection: "column", marginLeft: 26, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{
                      fontFamily: "Inter",
                      fontSize: 32,
                      fontWeight: 800,
                      letterSpacing: 2,
                      color: iceBlue,
                      textTransform: "uppercase",
                    }}
                  >
                    {st.verb}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    fontFamily: "Inter",
                    fontSize: 27,
                    fontWeight: 500,
                    lineHeight: 1.35,
                    color: slateText,
                    marginTop: 6,
                  }}
                >
                  {st.instruction}
                </div>

                {/* Meridian / Body indicator pill */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginTop: 12,
                    padding: "6px 16px",
                    borderRadius: 999,
                    backgroundColor: "rgba(56, 189, 248, 0.12)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    alignSelf: "flex-start",
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
                    <circle cx="12" cy="12" r="9" stroke={iceBlue} strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" fill={iceBlue} />
                    <line x1="12" y1="2" x2="12" y2="6" stroke={iceBlue} strokeWidth="2" strokeLinecap="round" />
                    <line x1="12" y1="18" x2="12" y2="22" stroke={iceBlue} strokeWidth="2" strokeLinecap="round" />
                    <line x1="2" y1="12" x2="6" y2="12" stroke={iceBlue} strokeWidth="2" strokeLinecap="round" />
                    <line x1="18" y1="12" x2="22" y2="12" stroke={iceBlue} strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span
                    style={{
                      fontFamily: "JetBrains Mono",
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: 1.5,
                      color: "#BAE6FD",
                      textTransform: "uppercase",
                    }}
                  >
                    {st.meridian}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hook to afternoon discussion */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 32,
            padding: "20px 28px",
            borderRadius: 20,
            border: "1.5px solid rgba(148, 163, 184, 0.2)",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: 12,
              height: 12,
              borderRadius: 12,
              backgroundColor: iceBlue,
              marginRight: 16,
            }}
          />
          <span style={{ fontFamily: "Inter", fontSize: 24, fontWeight: 500, color: slateMuted }}>
            {input.cta ? truncate(sanitize(input.cta), 90) : "Sore 18:45: Mengapa leher kaku adalah alarm kabel emosi?"}
          </span>
        </div>
      </div>

      {/* Slide Footer */}
      <SlideFooter
        handle={input.handle}
        signature={input.signature}
        color={slateMuted}
        font="Inter"
        index={act.index}
        accentColor={iceBlue}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. [BABAK 3: THE SPLIT COMPARISON]
// Palette: Deep Earth Charcoal & Warm Ochre
// ─────────────────────────────────────────────────────────────────────────────
function SplitComparison(input: SlideRenderInput): ReactElement {
  const act = ACTS[input.actType] ?? ACTS.ACT_3_CLINICAL_AI;
  const comparison = parseComparisonContent(input.body);

  const bgGradient = "linear-gradient(180deg, #110F0D 0%, #1A1613 50%, #110E0C 100%)";
  const warmOchre = "#F59E0B";
  const ochreLight = "#FBBF24";
  const ochreGlow = "rgba(245, 158, 11, 0.4)";
  const creamText = "#FAF5EF";
  const charcoalMuted = "#A8A29E";

  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        backgroundImage: bgGradient,
        backgroundColor: "#110F0D",
        padding: "88px 84px 96px",
      }}
    >
      {/* Atmospheric Warm Ochre Glow */}
      <div
        style={{
          position: "absolute",
          top: 300,
          right: -240,
          width: 900,
          height: 900,
          borderRadius: 900,
          backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.16) 0%, rgba(245,158,11,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -200,
          left: -200,
          width: 850,
          height: 850,
          borderRadius: 850,
          backgroundImage: "radial-gradient(circle, rgba(217,119,6,0.12) 0%, rgba(217,119,6,0) 70%)",
        }}
      />

      {/* Top Header Bar */}
      <TopHeaderBar
        badgeText="DIAGNOSA KLINIS • SORE 18:45"
        badgeBg="rgba(245, 158, 11, 0.12)"
        badgeBorder="rgba(245, 158, 11, 0.4)"
        badgeColor={ochreLight}
        watermarkColor={charcoalMuted}
        slotTime="SORE · 18:45"
      />

      {/* Main Content Area */}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
        {/* Bold Impact Headline */}
        <Headline
          text={input.headline}
          size={headlineSize(input.headline, 96)}
          color={creamText}
          accent={ochreLight}
          font="Inter"
          weight={800}
          letterSpacing={-2}
          glow={`0 0 32px ${ochreGlow}`}
        />

        {/* 2-Panel High Contrast Comparison */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 38 }}>
          {/* Panel 1 (Neutral / Muted): YANG KAMU PIKIRKAN */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 24,
              backgroundColor: "rgba(28, 25, 23, 0.88)",
              border: "1.5px solid rgba(168, 162, 158, 0.22)",
              padding: "26px 32px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: charcoalMuted,
                  textTransform: "uppercase",
                }}
              >
                PERSEPSI AWAL · GEJALA LUARAN
              </div>
              <div
                style={{
                  display: "flex",
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(168, 162, 158, 0.15)",
                  alignItems: "center",
                  justifyContent: "center",
                  color: charcoalMuted,
                  fontSize: 18,
                  fontWeight: 700,
                }}
              >
                ✕
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Inter",
                fontSize: 34,
                fontWeight: 800,
                color: "#D6D3D1",
                marginBottom: 16,
              }}
            >
              {comparison.perceivedTitle}
            </div>

            {comparison.perceivedItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "Inter",
                  fontSize: 27,
                  color: charcoalMuted,
                  lineHeight: 1.4,
                  marginTop: idx > 0 ? 10 : 0,
                }}
              >
                <span style={{ marginRight: 12, color: "#78716C" }}>•</span>
                {item}
              </div>
            ))}
          </div>

          {/* High-Contrast VS Bridge */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "-18px 0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "8px 26px",
                borderRadius: 999,
                backgroundColor: "#161412",
                border: `2px solid ${warmOchre}`,
                boxShadow: `0 0 20px ${ochreGlow}`,
                fontFamily: "JetBrains Mono",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: 3,
                color: ochreLight,
                textTransform: "uppercase",
              }}
            >
              ⚡ VS · KENYATAAN MEJA TERAPI
            </div>
          </div>

          {/* Panel 2 (Accent / Highlight): AKAR MASALAH SARAF */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 26,
              backgroundImage: "linear-gradient(145deg, rgba(245, 158, 11, 0.18) 0%, rgba(217, 119, 6, 0.08) 100%)",
              border: `2.5px solid ${warmOchre}`,
              backgroundColor: "rgba(22, 19, 16, 0.95)",
              padding: "28px 32px",
              boxShadow: `0 16px 40px rgba(0,0,0,0.5), 0 0 30px ${ochreGlow}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: "JetBrains Mono",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: ochreLight,
                  textTransform: "uppercase",
                }}
              >
                FAKTA MEJA TERAPI · BAWAH SADAR
              </div>
              <div
                style={{
                  display: "flex",
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: warmOchre,
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#161412",
                  fontSize: 20,
                  fontWeight: 800,
                }}
              >
                ✓
              </div>
            </div>

            <div
              style={{
                display: "flex",
                fontFamily: "Inter",
                fontSize: 36,
                fontWeight: 800,
                color: ochreLight,
                marginBottom: 16,
              }}
            >
              {comparison.clinicalTitle}
            </div>

            {comparison.clinicalItems.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  alignItems: "center",
                  fontFamily: "Inter",
                  fontSize: 28,
                  fontWeight: 600,
                  color: creamText,
                  lineHeight: 1.4,
                  marginTop: idx > 0 ? 12 : 0,
                }}
              >
                <span style={{ marginRight: 14, color: warmOchre, fontWeight: 800 }}>✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Evening Reset Hook */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginTop: 30,
            padding: "18px 26px",
            borderRadius: 18,
            backgroundColor: "rgba(245, 158, 11, 0.08)",
            border: "1px dashed rgba(245, 158, 11, 0.35)",
          }}
        >
          <span style={{ fontFamily: "Inter", fontSize: 24, fontWeight: 500, color: "#E7E5E4" }}>
            {comparison.teaser}
          </span>
        </div>
      </div>

      {/* Slide Footer */}
      <SlideFooter
        handle={input.handle}
        signature={input.signature}
        color={charcoalMuted}
        font="Inter"
        index={act.index}
        accentColor={warmOchre}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. [BABAK 4: THE LEAD MAGNET ASSET MOCKUP CARD]
// Palette: Midnight Obsidian & Gold Accent
// ─────────────────────────────────────────────────────────────────────────────
function LeadMagnetMockupCard(input: SlideRenderInput): ReactElement {
  const act = ACTS[input.actType] ?? ACTS.ACT_4_ANCHOR;
  const leadMagnet = parseLeadMagnetContent(input.headline, input.body, input.cta);

  const bgGradient = "linear-gradient(180deg, #09090B 0%, #0D0D12 50%, #050508 100%)";
  const goldPrimary = "#FBBF24";
  const goldAccent = "#F59E0B";
  const goldGlow = "rgba(251, 191, 36, 0.45)";
  const platinumText = "#FAFAF9";
  const obsidianMuted = "#A1A1AA";

  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        backgroundImage: bgGradient,
        backgroundColor: "#09090B",
        padding: "84px 80px 92px",
      }}
    >
      {/* Luxury Gold Ambient Lighting */}
      <div
        style={{
          position: "absolute",
          top: -200,
          left: 100,
          width: 880,
          height: 880,
          borderRadius: 880,
          backgroundImage: "radial-gradient(circle, rgba(245,158,11,0.18) 0%, rgba(245,158,11,0) 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: -100,
          width: 900,
          height: 900,
          borderRadius: 900,
          backgroundImage: "radial-gradient(circle, rgba(217,119,6,0.12) 0%, rgba(217,119,6,0) 70%)",
        }}
      />

      {/* Top Header Bar */}
      <TopHeaderBar
        badgeText="EDISI KHUSUS • MALAM 21:30"
        badgeBg="rgba(245, 158, 11, 0.12)"
        badgeBorder="rgba(245, 158, 11, 0.4)"
        badgeColor={goldPrimary}
        watermarkColor={obsidianMuted}
        slotTime="MALAM · 21:30"
      />

      {/* Main Content Area */}
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
        {/* Authoritative Resting Headline */}
        <Headline
          text={input.headline}
          size={headlineSize(input.headline, 96)}
          color={platinumText}
          accent={goldPrimary}
          font="Playfair Display"
          weight={700}
          letterSpacing={-1}
          glow={`0 0 32px ${goldGlow}`}
        />

        {/* Subtitle intro */}
        <div
          style={{
            display: "flex",
            fontFamily: "Inter",
            fontSize: 26,
            fontWeight: 500,
            color: obsidianMuted,
            marginTop: 20,
            marginBottom: 28,
            lineHeight: 1.4,
          }}
        >
          {truncate(sanitize(input.body).replace(/\*/g, ""), 120)}
        </div>

        {/* ── THE LEAD MAGNET ASSET MOCKUP CARD (ELEGANT FRAMED POCKETBOOK) ── */}
        <div
          style={{
            display: "flex",
            position: "relative",
            borderRadius: 30,
            border: `2px solid rgba(245, 158, 11, 0.45)`,
            backgroundImage: "linear-gradient(145deg, #18181B 0%, #0C0C0F 100%)",
            boxShadow: `0 24px 60px rgba(0,0,0,0.7), 0 0 40px rgba(245, 158, 11, 0.25)`,
            overflow: "hidden",
            padding: "36px 36px 32px",
          }}
        >
          {/* Authentic Book Spine strip on the left */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              bottom: 0,
              width: 14,
              backgroundImage: "linear-gradient(180deg, #FBBF24 0%, #D97706 50%, #B45309 100%)",
            }}
          />

          {/* Inner Document Content */}
          <div style={{ display: "flex", flexDirection: "column", flex: 1, marginLeft: 16 }}>
            {/* Top Document Metadata Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {/* PDF Document Icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ marginRight: 10 }}>
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={goldPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={goldPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span
                  style={{
                    fontFamily: "JetBrains Mono",
                    fontSize: 20,
                    fontWeight: 800,
                    letterSpacing: 3,
                    color: goldPrimary,
                    textTransform: "uppercase",
                  }}
                >
                  PANDUAN PRAKTIK SAKU (PDF)
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  padding: "4px 14px",
                  borderRadius: 6,
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  border: "1px solid rgba(245, 158, 11, 0.3)",
                  fontFamily: "JetBrains Mono",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "#FDE68A",
                }}
              >
                EDISI RESMI
              </div>
            </div>

            {/* Document Title */}
            <div
              style={{
                display: "flex",
                fontFamily: "Playfair Display",
                fontSize: 44,
                fontWeight: 700,
                color: platinumText,
                lineHeight: 1.18,
                marginTop: 20,
                marginBottom: 20,
              }}
            >
              {leadMagnet.documentTitle}
            </div>

            {/* Document Divider */}
            <div
              style={{
                display: "flex",
                width: "100%",
                height: 1.5,
                backgroundImage: "linear-gradient(90deg, rgba(245, 158, 11, 0.6) 0%, rgba(245, 158, 11, 0.1) 100%)",
                marginBottom: 20,
              }}
            />

            {/* 3 Step Chapters Preview */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {leadMagnet.steps.map((st, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontFamily: "Inter",
                    fontSize: 24,
                    fontWeight: 500,
                    color: "#D4D4D8",
                  }}
                >
                  <span style={{ color: goldPrimary, marginRight: 12, fontWeight: 700 }}>•</span>
                  {st}
                </div>
              ))}
            </div>

            {/* Official Stamp & Signature Row */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-end",
                marginTop: 26,
                paddingTop: 16,
                borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              }}
            >
              {/* Official Seal Emblem */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <div
                  style={{
                    display: "flex",
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    border: `1.5px solid ${goldPrimary}`,
                    backgroundColor: "rgba(245, 158, 11, 0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={goldPrimary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontFamily: "JetBrains Mono", fontSize: 16, fontWeight: 800, letterSpacing: 2, color: goldPrimary }}>
                    VERIFIED PROTOCOL
                  </span>
                  <span style={{ fontFamily: "Inter", fontSize: 16, color: obsidianMuted }}>
                    Standar Klinis Mandiri
                  </span>
                </div>
              </div>

              {/* Logo / Signature: DOKTER PIKIRAN */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span
                  style={{
                    fontFamily: "Playfair Display",
                    fontSize: 30,
                    fontStyle: "italic",
                    fontWeight: 600,
                    color: goldPrimary,
                  }}
                >
                  dr. Dokter Pikiran
                </span>
                <span style={{ fontFamily: "Inter", fontSize: 15, color: obsidianMuted, letterSpacing: 1 }}>
                  Hipnoterapis Klinis & Akupresur
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── HIGH-CONTRAST CALL-TO-ACTION BAR ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 34,
            padding: "26px 36px",
            borderRadius: 24,
            backgroundImage: "linear-gradient(90deg, #F59E0B 0%, #FBBF24 50%, #D97706 100%)",
            boxShadow: "0 16px 45px rgba(245, 158, 11, 0.45)",
          }}
        >
          {/* Left WhatsApp Icon & High-Contrast Text */}
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
            <div
              style={{
                display: "flex",
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: "#09090B",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginRight: 22,
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="#FBBF24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontFamily: "JetBrains Mono",
                  fontSize: 18,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: "#78350F",
                  textTransform: "uppercase",
                }}
              >
                GRATIS MALAM INI · FORMAT PDF
              </div>
              <div
                style={{
                  fontFamily: "Inter",
                  fontSize: 31,
                  fontWeight: 800,
                  color: "#09090B",
                  lineHeight: 1.25,
                }}
              >
                {`Ketik '${leadMagnet.keyword}' di chat WhatsApp sekarang untuk menerima PDF ini`}
              </div>
            </div>
          </div>

          {/* Right Action Arrow */}
          <div
            style={{
              display: "flex",
              width: 52,
              height: 52,
              borderRadius: 26,
              backgroundColor: "#09090B",
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 20,
              flexShrink: 0,
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 5l7 7-7 7" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Slide Footer */}
      <SlideFooter
        handle={input.handle}
        signature={input.signature}
        color={obsidianMuted}
        font="Inter"
        index={act.index}
        accentColor={goldPrimary}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE DISPATCHER & PUBLIC EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

export const TEMPLATE_MAP: Record<ThemeName, (input: SlideRenderInput) => ReactElement> = {
  "Neuro-Dark": ThumbStopperChecklist,
  "Somatic-Clean": ThreeStepActionCards,
  "Hacker-Terminal": SplitComparison,
  "Minimal-Hypnotic": LeadMagnetMockupCard,
};

/**
 * Builds the exact 1080×1920 Satori React element based on the 4 Dynamic Slide Archetypes.
 * Automatically selects the archetype and matching palette based on ActType:
 * - ACT_1_HOOK: The Thumb-Stopper Checklist (Deep Emerald & Cream Warm)
 * - ACT_2_SOMATIC: The 3-Step Action Cards (Slate Grey & Ice Clinical Blue)
 * - ACT_3_CLINICAL_AI: The Split Comparison (Deep Earth Charcoal & Warm Ochre)
 * - ACT_4_ANCHOR: The Lead Magnet Asset Mockup Card (Midnight Obsidian & Gold Accent)
 */
export function buildSlideElement(input: SlideRenderInput): ReactElement {
  switch (input.actType) {
    case "ACT_1_HOOK":
      return ThumbStopperChecklist(input);
    case "ACT_2_SOMATIC":
      return ThreeStepActionCards(input);
    case "ACT_3_CLINICAL_AI":
      return SplitComparison(input);
    case "ACT_4_ANCHOR":
      return LeadMagnetMockupCard(input);
    default:
      return (TEMPLATE_MAP[input.themeName ?? "Neuro-Dark"] ?? ThumbStopperChecklist)(input);
  }
}
