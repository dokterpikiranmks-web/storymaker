import type { ReactElement, ReactNode } from "react";
import { ACTS, SLIDE_HEIGHT, SLIDE_WIDTH, THEMES, type ActType, type ThemeName } from "@/lib/stories/constants";
import { stripEmoji, truncate } from "@/lib/utils";

/**
 * Satori JSX templates — 1080×1920 (9:16). Satori rules respected:
 * every multi-child <div> has display:flex, only flexbox layout, inline SVG for art.
 */

export interface SlideRenderInput {
  headline: string;
  body: string;
  cta?: string | null;
  actType: ActType;
  themeName: ThemeName;
  handle?: string;
  signature?: string;
}

interface Segment {
  text: string;
  accent: boolean;
}

/** A visual word = one or more styled segments with no space between them (e.g. accent word + comma). */
type Word = Segment[];

function sanitize(value: string): string {
  return stripEmoji(value)
    .replace(/[→⇒➜➔]/g, "->")
    .replace(/[←⇐]/g, "<-")
    .replace(/\r/g, "");
}

/**
 * "Semakin keras *berpikir*, semakin" → words with accent flags. Tokens that touch
 * the previous token without whitespace (",", "-nya") are glued to the same word.
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

function plainLength(text: string) {
  return sanitize(text).replace(/\*/g, "").length;
}

function headlineSize(text: string, base: number): number {
  const len = plainLength(text);
  if (len <= 26) return base;
  if (len <= 46) return Math.round(base * 0.86);
  if (len <= 68) return Math.round(base * 0.74);
  if (len <= 96) return Math.round(base * 0.64);
  return Math.round(base * 0.56);
}

function bodySize(text: string, base = 44): number {
  const len = text.length;
  if (len <= 150) return base;
  if (len <= 240) return Math.round(base * 0.93);
  if (len <= 330) return Math.round(base * 0.86);
  if (len <= 420) return Math.round(base * 0.8);
  return Math.round(base * 0.74);
}

function paragraphs(text: string): string[] {
  return truncate(sanitize(text).replace(/\*/g, ""), 560)
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, " ").trim())
    .filter(Boolean);
}

function Headline(props: {
  text: string;
  size: number;
  color: string;
  accent: string;
  font: string;
  weight: 400 | 500 | 600 | 700 | 800;
  italic?: boolean;
  center?: boolean;
  lineHeight?: number;
  letterSpacing?: number;
  glow?: string;
}): ReactElement {
  const words = parseAccentWords(props.text);
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: props.center ? "center" : "flex-start",
        fontFamily: props.font,
        fontSize: props.size,
        fontWeight: props.weight,
        fontStyle: props.italic ? "italic" : "normal",
        lineHeight: props.lineHeight ?? 1.08,
        letterSpacing: props.letterSpacing ?? 0,
        color: props.color,
      }}
    >
      {words.map((word, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            marginRight: Math.round(props.size * 0.24),
            marginLeft: props.center ? Math.round(props.size * 0.02) : 0,
          }}
        >
          {word.map((seg, j) => (
            <span
              key={j}
              style={{
                color: seg.accent ? props.accent : props.color,
                textShadow: seg.accent && props.glow ? props.glow : "none",
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

function Body(props: { text: string; size: number; color: string; font: string; center?: boolean; lineHeight?: number; gap?: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        fontFamily: props.font,
        fontSize: props.size,
        lineHeight: props.lineHeight ?? 1.5,
        color: props.color,
        textAlign: props.center ? "center" : "left",
        alignItems: props.center ? "center" : "flex-start",
      }}
    >
      {paragraphs(props.text).map((p, i) => (
        <div key={i} style={{ display: "flex", marginTop: i === 0 ? 0 : (props.gap ?? 28) }}>
          {p}
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ index, active, done, track }: { index: number; active: string; done: string; track: string }) {
  return (
    <div style={{ display: "flex", width: "100%" }}>
      {[1, 2, 3, 4].map((n) => (
        <div
          key={n}
          style={{
            display: "flex",
            flexGrow: 1,
            height: 8,
            borderRadius: 8,
            marginRight: n < 4 ? 12 : 0,
            backgroundColor: n === index ? active : n < index ? done : track,
          }}
        />
      ))}
    </div>
  );
}

function ArrowIcon({ color, size = 40 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Footer({ handle, signature, color, font, index, center }: { handle?: string; signature?: string; color: string; font: string; index: number; center?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: center ? "center" : "space-between",
        alignItems: "flex-end",
        marginTop: 48,
        fontFamily: font,
        color,
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start" }}>
        <div style={{ display: "flex", fontSize: 30, fontWeight: 600 }}>{sanitize(handle || "")}</div>
        {signature ? (
          <div style={{ display: "flex", fontSize: 22, marginTop: 8, opacity: 0.8 }}>{truncate(sanitize(signature), 64)}</div>
        ) : null}
      </div>
      {center ? null : <div style={{ display: "flex", fontSize: 26, letterSpacing: 4 }}>{`${index}/4`}</div>}
    </div>
  );
}

// ── Decorative SVG art ──────────────────────────────────────────────────
function NeuralNet({ color, color2 }: { color: string; color2: string }) {
  const nodes: Array<[number, number]> = [
    [80, 130], [250, 60], [420, 190], [600, 90], [780, 230], [300, 330], [520, 380], [720, 450], [140, 420], [880, 110], [900, 380],
  ];
  const edges: Array<[number, number]> = [
    [0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [2, 5], [5, 6], [6, 7], [4, 7], [0, 8], [8, 5], [3, 9], [9, 4], [2, 6], [4, 10], [7, 10],
  ];
  return (
    <svg width="980" height="520" viewBox="0 0 980 520" style={{ position: "absolute", top: 230, right: -60, opacity: 0.5 }}>
      {edges.map(([a, b], i) => (
        <line key={`e${i}`} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]} stroke={color} strokeOpacity="0.4" strokeWidth="2" />
      ))}
      {nodes.map(([x, y], i) => (
        <circle key={`n${i}`} cx={x} cy={y} r={i % 3 === 0 ? 11 : 6} fill={i % 2 ? color : color2} />
      ))}
      {nodes
        .filter((_, i) => i % 3 === 0)
        .map(([x, y], i) => (
          <circle key={`r${i}`} cx={x} cy={y} r="26" fill="none" stroke={color} strokeOpacity="0.45" strokeWidth="2" />
        ))}
    </svg>
  );
}

function AnatomyDiagram({ stroke, accent, accent2 }: { stroke: string; accent: string; accent2: string }) {
  const vertebrae = Array.from({ length: 15 }, (_, i) => 230 + i * 40);
  const points: Array<[number, number]> = [[200, 205], [118, 300], [282, 300], [200, 470]];
  return (
    <svg width="400" height="900" viewBox="0 0 400 900" style={{ position: "absolute", right: -40, top: 170, opacity: 0.26 }}>
      <circle cx="200" cy="110" r="84" fill="none" stroke={stroke} strokeWidth="3" />
      <path d="M150 178 Q200 222 250 178" fill="none" stroke={stroke} strokeWidth="3" />
      <path d="M50 312 Q200 236 350 312" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <path d="M92 520 Q200 468 308 520" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M104 600 Q200 552 296 600" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M118 790 Q200 740 282 790" fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
      <line x1="200" y1="196" x2="200" y2="830" stroke={stroke} strokeWidth="2" strokeOpacity="0.6" />
      {vertebrae.map((y, i) => (
        <rect key={`v${i}`} x="186" y={y} width="28" height="18" rx="6" fill="none" stroke={stroke} strokeWidth="2" />
      ))}
      {points.map(([x, y], i) => (
        <circle key={`p${i}`} cx={x} cy={y} r="30" fill="none" stroke={i % 2 ? accent2 : accent} strokeWidth="3" />
      ))}
      {points.map(([x, y], i) => (
        <circle key={`c${i}`} cx={x} cy={y} r="10" fill={i % 2 ? accent2 : accent} />
      ))}
    </svg>
  );
}

function Scanlines() {
  const lines = Array.from({ length: 240 }, (_, i) => i * 8);
  return (
    <svg width={SLIDE_WIDTH} height={SLIDE_HEIGHT} viewBox={`0 0 ${SLIDE_WIDTH} ${SLIDE_HEIGHT}`} style={{ position: "absolute", top: 0, left: 0 }}>
      {lines.map((y) => (
        <line key={y} x1="0" y1={y} x2={SLIDE_WIDTH} y2={y} stroke="#4ADE80" strokeOpacity="0.05" strokeWidth="2" />
      ))}
    </svg>
  );
}

function HypnoticRings({ color }: { color: string }) {
  const radii = Array.from({ length: 13 }, (_, i) => 70 + i * 68);
  return (
    <svg width="1600" height="1600" viewBox="0 0 1600 1600" style={{ position: "absolute", top: 60, left: -260 }}>
      {radii.map((r, i) => (
        <circle key={r} cx="800" cy="800" r={r} fill="none" stroke={i % 4 === 0 ? color : "#FFFFFF"} strokeOpacity={Math.max(0.03, 0.16 - i * 0.011)} strokeWidth={i % 4 === 0 ? 3 : 1.5} />
      ))}
    </svg>
  );
}

// ── Themes ──────────────────────────────────────────────────────────────
function Frame({ bg, children, font, color }: { bg: string; children: ReactNode; font: string; color: string }) {
  return (
    <div
      style={{
        width: SLIDE_WIDTH,
        height: SLIDE_HEIGHT,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        backgroundColor: bg,
        fontFamily: font,
        color,
      }}
    >
      {children}
    </div>
  );
}

function NeuroDark(input: SlideRenderInput): ReactElement {
  const t = THEMES["Neuro-Dark"];
  const act = ACTS[input.actType];
  return (
    <Frame bg={t.bg} font="Inter" color={t.fg}>
      <div style={{ position: "absolute", top: -300, right: -320, width: 1000, height: 1000, borderRadius: 1000, backgroundImage: "radial-gradient(circle, rgba(34,211,238,0.33) 0%, rgba(34,211,238,0) 70%)" }} />
      <div style={{ position: "absolute", bottom: -360, left: -360, width: 1100, height: 1100, borderRadius: 1100, backgroundImage: "radial-gradient(circle, rgba(52,211,153,0.24) 0%, rgba(52,211,153,0) 70%)" }} />
      <NeuralNet color={t.accent} color2={t.accent2} />
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "96px 92px 110px", position: "relative" }}>
        <ProgressBar index={act.index} active={t.accent} done="rgba(34,211,238,0.45)" track="rgba(255,255,255,0.14)" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 44 }}>
          <div style={{ display: "flex", padding: "14px 26px", borderRadius: 999, border: "2px solid rgba(34,211,238,0.55)", backgroundColor: "rgba(34,211,238,0.08)", fontSize: 26, fontWeight: 600, letterSpacing: 3, color: t.accent }}>
            {`BABAK ${act.index} · ${act.shortTitle.toUpperCase()}`}
          </div>
          <div style={{ display: "flex", fontSize: 28, letterSpacing: 4, color: "#94A3B8" }}>{`${act.slot.toUpperCase()} · ${act.time}`}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
          <div style={{ display: "flex", width: 132, height: 8, borderRadius: 8, backgroundImage: `linear-gradient(90deg, ${t.accent}, ${t.accent2})`, marginBottom: 56 }} />
          <Headline text={input.headline} size={headlineSize(input.headline, 110)} color={t.fg} accent={t.accent} font="Inter" weight={800} letterSpacing={-2} glow="0 0 36px rgba(34,211,238,0.55)" />
          <div style={{ display: "flex", marginTop: 60 }}>
            <Body text={input.body} size={bodySize(input.body)} color="#CBD5E1" font="Inter" />
          </div>
        </div>
        {input.cta ? (
          <div style={{ display: "flex", alignItems: "center", padding: "34px 40px", borderRadius: 30, border: "2px solid rgba(52,211,153,0.6)", backgroundImage: "linear-gradient(90deg, rgba(34,211,238,0.14), rgba(52,211,153,0.14))" }}>
            <ArrowIcon color={t.accent2} />
            <div style={{ display: "flex", marginLeft: 22, fontSize: 36, fontWeight: 600, color: t.fg, flexShrink: 1 }}>{truncate(sanitize(input.cta), 90)}</div>
          </div>
        ) : null}
        <Footer handle={input.handle} signature={input.signature} color="#64748B" font="Inter" index={act.index} />
      </div>
    </Frame>
  );
}

function SomaticClean(input: SlideRenderInput): ReactElement {
  const t = THEMES["Somatic-Clean"];
  const act = ACTS[input.actType];
  return (
    <Frame bg={t.bg} font="Inter" color={t.fg}>
      <div style={{ position: "absolute", top: 0, left: 0, width: SLIDE_WIDTH, height: SLIDE_HEIGHT, backgroundImage: "linear-gradient(180deg, #221E1A 0%, #1A1A1A 55%, #131211 100%)" }} />
      <div style={{ position: "absolute", top: -240, left: -200, width: 900, height: 900, borderRadius: 900, backgroundImage: "radial-gradient(circle, rgba(200,162,122,0.18) 0%, rgba(200,162,122,0) 70%)" }} />
      <AnatomyDiagram stroke="#E8DCC8" accent={t.accent} accent2={t.accent2} />
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "96px 92px 110px", position: "relative" }}>
        <ProgressBar index={act.index} active={t.accent} done="rgba(200,162,122,0.5)" track="rgba(239,228,210,0.14)" />
        <div style={{ display: "flex", alignItems: "center", marginTop: 48 }}>
          <div style={{ display: "flex", width: 18, height: 18, borderRadius: 18, backgroundColor: t.accent2, marginRight: 18 }} />
          <div style={{ display: "flex", fontSize: 28, fontWeight: 600, letterSpacing: 6, color: t.accent2 }}>{`SOMATIC RESET · ${act.slot.toUpperCase()} ${act.time}`}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", paddingRight: 40 }}>
          <div style={{ display: "flex", fontSize: 30, color: "#A8998A", fontStyle: "italic", fontFamily: "Playfair Display", fontWeight: 500, marginBottom: 30 }}>{`Babak ${act.index} — ${act.title}`}</div>
          <Headline text={input.headline} size={headlineSize(input.headline, 112)} color={t.fg} accent={t.accent} font="Playfair Display" weight={700} lineHeight={1.1} />
          <div style={{ display: "flex", width: 110, height: 3, backgroundColor: t.accent, marginTop: 56, marginBottom: 52 }} />
          <Body text={input.body} size={bodySize(input.body)} color="#D6CBB8" font="Inter" lineHeight={1.55} />
        </div>
        {input.cta ? (
          <div style={{ display: "flex", alignItems: "center", padding: "32px 38px", borderRadius: 26, border: `2px solid ${t.accent}`, backgroundColor: "rgba(200,162,122,0.08)" }}>
            <div style={{ display: "flex", width: 44, height: 44, borderRadius: 44, border: `3px solid ${t.accent2}`, alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "flex", width: 14, height: 14, borderRadius: 14, backgroundColor: t.accent2 }} />
            </div>
            <div style={{ display: "flex", marginLeft: 24, fontSize: 36, fontWeight: 600, color: t.fg, flexShrink: 1 }}>{truncate(sanitize(input.cta), 90)}</div>
          </div>
        ) : null}
        <Footer handle={input.handle} signature={input.signature} color="#8A7F72" font="Inter" index={act.index} />
      </div>
    </Frame>
  );
}

function HackerTerminal(input: SlideRenderInput): ReactElement {
  const t = THEMES["Hacker-Terminal"];
  const act = ACTS[input.actType];
  const slug = act.act.toLowerCase();
  return (
    <Frame bg={t.bg} font="JetBrains Mono" color={t.fg}>
      <Scanlines />
      <div style={{ position: "absolute", top: 380, left: -200, width: 1400, height: 1200, borderRadius: 1400, backgroundImage: "radial-gradient(circle, rgba(74,222,128,0.12) 0%, rgba(74,222,128,0) 65%)" }} />
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "96px 72px 100px", position: "relative" }}>
        <ProgressBar index={act.index} active={t.accent} done="rgba(74,222,128,0.45)" track="rgba(209,250,229,0.12)" />
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, marginTop: 52, borderRadius: 30, border: "2px solid rgba(74,222,128,0.35)", backgroundColor: "rgba(4,18,10,0.88)", overflow: "hidden" }}>
          <div style={{ display: "flex", alignItems: "center", padding: "26px 32px", borderBottom: "2px solid rgba(74,222,128,0.2)", backgroundColor: "rgba(74,222,128,0.06)" }}>
            <div style={{ display: "flex", width: 22, height: 22, borderRadius: 22, backgroundColor: "#FF5F56", marginRight: 14 }} />
            <div style={{ display: "flex", width: 22, height: 22, borderRadius: 22, backgroundColor: "#FFBD2E", marginRight: 14 }} />
            <div style={{ display: "flex", width: 22, height: 22, borderRadius: 22, backgroundColor: "#27C93F", marginRight: 28 }} />
            <div style={{ display: "flex", fontSize: 24, color: "#6EE7B7" }}>{`~/alchemist/${slug}.ts`}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "48px 48px 44px" }}>
            <div style={{ display: "flex", fontSize: 27, color: "#86EFAC" }}>{`$ ./story --act=${act.index} --slot=${act.slot.toLowerCase()}@${act.time}`}</div>
            <div style={{ display: "flex", fontSize: 27, color: "#4B7F5E", marginTop: 12 }}>{"> loading therapy_session.log ... OK"}</div>
            <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center" }}>
              <div style={{ display: "flex", fontSize: 28, color: t.accent2, marginBottom: 26 }}>{`// ${act.title}`}</div>
              <Headline text={input.headline} size={headlineSize(input.headline, 88)} color={t.accent} accent={t.accent2} font="JetBrains Mono" weight={700} lineHeight={1.16} letterSpacing={-1} glow="0 0 28px rgba(250,204,21,0.45)" />
              <div style={{ display: "flex", marginTop: 52, paddingLeft: 28, borderLeft: "4px solid rgba(74,222,128,0.5)" }}>
                <Body text={input.body} size={bodySize(input.body, 38)} color="#D1FAE5" font="JetBrains Mono" lineHeight={1.55} gap={24} />
              </div>
            </div>
            {input.cta ? (
              <div style={{ display: "flex", alignItems: "center", marginTop: 40, fontSize: 32, fontWeight: 700, color: t.accent }}>
                <div style={{ display: "flex", color: t.accent2, marginRight: 18 }}>{">"}</div>
                <div style={{ display: "flex", flexShrink: 1 }}>{truncate(sanitize(input.cta), 80)}</div>
                <div style={{ display: "flex", width: 22, height: 40, backgroundColor: t.accent, marginLeft: 14 }} />
              </div>
            ) : null}
          </div>
        </div>
        <Footer handle={input.handle} signature={input.signature} color="#4B7F5E" font="JetBrains Mono" index={act.index} />
      </div>
    </Frame>
  );
}

function MinimalHypnotic(input: SlideRenderInput): ReactElement {
  const t = THEMES["Minimal-Hypnotic"];
  const act = ACTS[input.actType];
  return (
    <Frame bg={t.bg} font="Inter" color={t.fg}>
      <div style={{ position: "absolute", top: 260, left: -60, width: 1200, height: 1200, borderRadius: 1200, backgroundImage: "radial-gradient(circle, rgba(167,139,250,0.16) 0%, rgba(167,139,250,0) 65%)" }} />
      <HypnoticRings color={t.accent} />
      <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, padding: "96px 100px 110px", position: "relative", alignItems: "center" }}>
        <ProgressBar index={act.index} active="#FAFAFA" done="rgba(250,250,250,0.4)" track="rgba(250,250,250,0.12)" />
        <div style={{ display: "flex", marginTop: 56, fontSize: 26, letterSpacing: 10, color: "#71717A" }}>{`BABAK ${act.index} · ${act.slot.toUpperCase()} ${act.time}`}</div>
        <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
          <Headline text={input.headline} size={headlineSize(input.headline, 104)} color={t.fg} accent="#C4B5FD" font="Playfair Display" weight={500} italic center lineHeight={1.18} />
          <div style={{ display: "flex", width: 120, height: 2, backgroundColor: "rgba(250,250,250,0.35)", marginTop: 64, marginBottom: 60 }} />
          <Body text={input.body} size={bodySize(input.body, 42)} color="#A1A1AA" font="Inter" center lineHeight={1.7} />
        </div>
        {input.cta ? (
          <div style={{ display: "flex", padding: "28px 56px", borderRadius: 999, border: "2px solid rgba(250,250,250,0.55)", fontSize: 32, fontWeight: 600, letterSpacing: 5, color: t.fg, textAlign: "center" }}>
            {truncate(sanitize(input.cta), 70).toUpperCase()}
          </div>
        ) : null}
        <Footer handle={input.handle} signature={input.signature} color="#52525B" font="Inter" index={act.index} center />
      </div>
    </Frame>
  );
}

const TEMPLATE_MAP: Record<ThemeName, (input: SlideRenderInput) => ReactElement> = {
  "Neuro-Dark": NeuroDark,
  "Somatic-Clean": SomaticClean,
  "Hacker-Terminal": HackerTerminal,
  "Minimal-Hypnotic": MinimalHypnotic,
};

export function buildSlideElement(input: SlideRenderInput): ReactElement {
  const template = TEMPLATE_MAP[input.themeName] ?? NeuroDark;
  return template(input);
}
