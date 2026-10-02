"use client";

import {
  Calendar,
  CheckCircle2,
  Circle,
  Laptop,
  Layers,
  Loader2,
  Mic,
  MicOff,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ApiClientError, apiFetch, errorMessage } from "@/lib/client-api";
import type { CampaignDTO, CampaignType, EngineStatusDTO, GenerationInfo } from "@/lib/stories/types";
import { cn } from "@/lib/utils";
import type { Notify } from "./toaster";

const EXAMPLES = [
  "Overthinking sebelum tidur",
  "Leher kaku karena stres deadline",
  "Prokrastinasi = bug di system prompt",
  "Demam panggung sebelum presentasi",
  "Lapar emosional jam 10 malam",
];

const STEPS = [
  "Autodetect model Gemini optimal (Quota Guard)…",
  "Menyusun 4 babak dopamine loop…",
  "Menanam sugesti Alpha/Theta & anchor CTA…",
  "Merender 4 visual 1080×1920 via Satori…",
  "Menyimpan campaign & aset…",
];

const SCOUT_STEPS = [
  "Dr. Mind Scout mendeteksi pilar klinis harian…",
  "Meriset 3 domain klinis (Totok Saraf, Hipnoterapi, Solusi AI)…",
  "Merumuskan 3-langkah Lead Magnet Protocol (siap PDF)…",
  "Merender 4 visual poster 9:16 via Satori…",
  "Menyimpan ke Supabase Storage & setting jadwal tayang…",
];

const PROMO_STEPS = [
  "Mempersiapkan parameter Flash Promo ad-hoc…",
  "Menyusun psikologi penawaran 4 babak (Scarcity & Social Proof)…",
  "Mengunci CTA booking & instruksi chat WhatsApp…",
  "Merender 4 visual poster 9:16 via Satori…",
  "Menyimpan sebagai campaign terpisah (Zero Conflict)…",
];

type RecognitionResultList = ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { resultIndex: number; results: RecognitionResultList }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
}
type RecognitionCtor = new () => RecognitionLike;

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
const noopSubscribe = () => () => undefined;

export function IdeaDrop({
  today,
  engine,
  onGenerated,
  notify,
}: {
  today: string;
  engine: EngineStatusDTO;
  onGenerated: (campaign: CampaignDTO, info: GenerationInfo) => void;
  notify: Notify;
}) {
  // Campaign Mode: DAILY_AUTONOMOUS vs FLASH_PROMO
  const [campaignType, setCampaignType] = useState<CampaignType>("DAILY_AUTONOMOUS");

  // Daily Mode: Topic vs Raw Voice Note
  const [mode, setMode] = useState<"topic" | "raw">("topic");
  const [topic, setTopic] = useState("");
  const [raw, setRaw] = useState("");
  const [date, setDate] = useState(today);

  // Flash Promo Subtype & States
  const [flashSubtype, setFlashSubtype] = useState<"THERAPY_SLOT" | "APP_SHOWCASE">("THERAPY_SLOT");
  // Therapy Slot State
  const [therapyType, setTherapyType] = useState<"TOTOK_SARAF" | "HIPNOTERAPI" | "KOMBINASI">("TOTOK_SARAF");
  const [remainingSlots, setRemainingSlots] = useState(3);
  const [practiceDate, setPracticeDate] = useState("Sabtu ini, 15:00 - 21:00 WIB");
  const [therapyTopic, setTherapyTopic] = useState("");

  // App Showcase State
  const [appName, setAppName] = useState("Story Maker AI");
  const [appSolution, setAppSolution] = useState("Otomasi pembuatan 4 babak neuro-storytelling harian dalam 30 detik untuk praktisi & solo dev.");
  const [targetUser, setTargetUser] = useState("Praktisi kesehatan, kreator & solo developer");
  const [appTopic, setAppTopic] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(true);

  const [loading, setLoading] = useState(false);
  const [scouting, setScouting] = useState(false);
  const [step, setStep] = useState(0);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const speechSupported = useSyncExternalStore(noopSubscribe, () => getRecognitionCtor() !== null, () => false);

  useEffect(() => {
    if (!loading) return;
    const currentSteps = scouting ? SCOUT_STEPS : campaignType === "FLASH_PROMO" ? PROMO_STEPS : STEPS;
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, currentSteps.length - 1)), 2600);
    return () => window.clearInterval(t);
  }, [loading, scouting, campaignType]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const canSubmitDaily = !loading && (mode === "topic" ? topic.trim().length >= 3 : raw.trim().length >= 10);
  const canSubmitPromo =
    !loading &&
    (flashSubtype === "THERAPY_SLOT"
      ? remainingSlots > 0 && practiceDate.trim().length >= 3
      : appName.trim().length >= 2 && appSolution.trim().length >= 5);

  const canSubmit = campaignType === "DAILY_AUTONOMOUS" ? canSubmitDaily : canSubmitPromo;

  async function autoPilotResearch(overwrite = true): Promise<void> {
    setScouting(true);
    setStep(0);
    setLoading(true);
    try {
      const data = await apiFetch<{
        ok: boolean;
        agent: string;
        pillar: string;
        focus: string;
        campaign: CampaignDTO;
        generation: GenerationInfo;
        lead_magnet_protocol?: unknown;
        scheduledSlidesCount: number;
      }>("/api/cron/research", {
        method: "POST",
        json: { campaign_date: date || undefined, overwrite },
      });
      onGenerated(data.campaign, data.generation);
      notify(
        "success",
        `✨ ${data.agent || "Dr. Mind Scout"} Berhasil Meriset!`,
        `Pilar: ${data.pillar} · 4 Babak & Lead Magnet Protocol siap (Jadwal 07:15, 12:30, 18:45, 21:30)`,
      );
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409 && !overwrite) {
        if (window.confirm(`Campaign harian untuk ${date} sudah ada. Timpa dengan riset baru Dr. Mind Scout?`)) {
          await autoPilotResearch(true);
        }
        return;
      }
      notify("error", "Gagal Auto-Pilot Research", errorMessage(err));
    } finally {
      setScouting(false);
      setLoading(false);
    }
  }

  async function generate(overwrite = false): Promise<void> {
    const payload =
      campaignType === "FLASH_PROMO"
        ? {
            campaign_type: "FLASH_PROMO",
            campaign_date: date || undefined,
            flash_promo_subtype: flashSubtype,
            auto_schedule: autoSchedule,
            ...(flashSubtype === "THERAPY_SLOT"
              ? {
                  therapy_type: therapyType,
                  remaining_slots: Number(remainingSlots) || 3,
                  practice_date: practiceDate.trim(),
                  topic: therapyTopic.trim() || undefined,
                }
              : {
                  app_name: appName.trim(),
                  app_solution: appSolution.trim(),
                  target_user: targetUser.trim() || undefined,
                  topic: appTopic.trim() || undefined,
                }),
          }
        : {
            campaign_type: "DAILY_AUTONOMOUS",
            topic: mode === "topic" ? topic.trim() : undefined,
            raw_thought: mode === "raw" ? raw.trim() : undefined,
            campaign_date: date || undefined,
            overwrite,
          };

    setStep(0);
    setLoading(true);
    try {
      const data = await apiFetch<{ campaign: CampaignDTO; generation: GenerationInfo }>("/api/stories/generate", {
        method: "POST",
        json: payload,
      });
      onGenerated(data.campaign, data.generation);
      notify(
        "success",
        campaignType === "FLASH_PROMO"
          ? (autoSchedule ? "⚡ Flash Promo Berhasil Dibuat & Dijadwalkan!" : "⚡ Flash Promo Berhasil Dibuat!")
          : "4 babak story siap diedit",
        campaignType === "FLASH_PROMO"
          ? (autoSchedule
              ? "Semua slide & gambar berhasil diunggah ke bucket story-assets serta masuk antrean tayang."
              : "Semua slide & gambar berhasil diunggah ke bucket story-assets sebagai entri ad-hoc terpisah.")
          : data.generation.source === "gemini"
          ? `Ditulis oleh ${data.generation.model}`
          : "Mode Offline Alchemist (Gemini tidak dipakai)",
      );
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409 && !overwrite) {
        if (window.confirm(`Campaign harian untuk ${date} sudah ada. Timpa dengan cerita baru?`)) await generate(true);
        return;
      }
      notify("error", "Gagal generate story", errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleMic() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "id-ID";
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) text += r[0].transcript;
      }
      if (text) setRaw((prev) => `${prev} ${text}`.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e) => {
      setListening(false);
      if (e.error !== "aborted" && e.error !== "no-speech") notify("error", "Mikrofon gagal", e.error);
    };
    recognitionRef.current = rec;
    setMode("raw");
    setListening(true);
    rec.start();
  }

  const engineHint = !engine.configured
    ? "Offline Alchemist (GEMINI_API_KEY kosong)"
    : engine.optimalModel
      ? `Gemini autodetect → ${engine.optimalModel}`
      : "Gemini autodetect (discovery saat generate)";

  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-64 w-64 rounded-full bg-emerald-400/5 blur-3xl" />
      <div className="relative p-5 sm:p-6">
        {/* Top Campaign Type Selector */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
          <div className="flex rounded-xl border border-white/10 bg-black/40 p-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCampaignType("DAILY_AUTONOMOUS")}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 transition",
                campaignType === "DAILY_AUTONOMOUS"
                  ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/30"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <Layers className="size-3.5" /> Story Harian (Dopamine Loop)
            </button>
            <button
              type="button"
              onClick={() => setCampaignType("FLASH_PROMO")}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-3.5 py-1.5 transition",
                campaignType === "FLASH_PROMO"
                  ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/30"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <Zap className="size-3.5 text-amber-400" /> ⚡ Flash Promo Studio
            </button>
          </div>

          {campaignType === "DAILY_AUTONOMOUS" ? (
            <button
              type="button"
              onClick={() => void autoPilotResearch(true)}
              disabled={loading}
              title="Picu agen riset klinis otonom Dr. Mind Scout untuk meriset tema hari ini dan menjadwalkan 4 babak langsung"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-500/25 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {scouting ? <Loader2 className="size-3.5 animate-spin text-emerald-300" /> : <Sparkles className="size-3.5 text-emerald-400" />}
              ✨ Auto-Pilot Research (Dr. Mind Scout)
            </button>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-300/90">
              <ShieldCheck className="size-4 text-emerald-400" />
              <span>Zero Conflict: Tidak menimpa story harian on-air</span>
            </div>
          )}
        </div>

        {campaignType === "DAILY_AUTONOMOUS" ? (
          /* ── DAILY AUTONOMOUS STORY GENERATOR ── */
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-300">
                  <Zap className="size-3.5" /> Quick Idea Drop
                </p>
                <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                  Satu ide mentah → <span className="font-serif font-medium italic text-emerald-200">4 babak story</span> siap tayang
                </h2>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-black/30 p-1 text-xs font-semibold">
                {(
                  [
                    ["topic", "Ide kilat"],
                    ["raw", "Voice note / transkrip"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setMode(value)}
                    className={cn(
                      "cursor-pointer rounded-lg px-3 py-1.5 transition",
                      mode === value ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-200",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              {mode === "topic" ? (
                <>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canSubmit) void generate();
                    }}
                    placeholder="Contoh: overthinking sebelum tidur, leher kaku karena deadline, titik GB-20…"
                    maxLength={240}
                    className="h-12 text-base"
                    aria-label="Topik ide kilat"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex}
                        type="button"
                        onClick={() => setTopic(ex)}
                        className="cursor-pointer rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-200"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="relative">
                  <Textarea
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                    rows={5}
                    maxLength={6000}
                    placeholder="Tempel transkrip voice note atau unek-unek mentahmu… The Alchemist akan mengekstrak insight 3 domain klinis & merangkum Lead Magnet Protocol."
                    className="pr-14"
                    aria-label="Transkrip voice note"
                  />
                  {speechSupported ? (
                    <button
                      type="button"
                      onClick={toggleMic}
                      title={listening ? "Stop dikte" : "Dikte langsung (Web Speech, id-ID)"}
                      className={cn(
                        "absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border transition",
                        listening
                          ? "animate-pulse border-rose-400/50 bg-rose-500/20 text-rose-200"
                          : "border-white/10 bg-white/5 text-slate-300 hover:text-cyan-200",
                      )}
                    >
                      {listening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                    </button>
                  ) : null}
                  <p className="mt-1.5 text-right text-[11px] text-slate-500">{raw.length}/6000</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* ── FLASH PROMO STUDIO ── */
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-300">
                  <Zap className="size-3.5" /> Ad-hoc Campaign Studio
                </p>
                <h2 className="mt-1 text-xl font-bold text-white sm:text-2xl">
                  Flash Promo: <span className="font-serif font-medium italic text-amber-200">Slot Terapi & Showcase Aplikasi</span>
                </h2>
              </div>
              <div className="flex rounded-xl border border-white/10 bg-black/30 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFlashSubtype("THERAPY_SLOT")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition",
                    flashSubtype === "THERAPY_SLOT" ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/30" : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  <Stethoscope className="size-3.5" /> Slot Jadwal Terapi
                </button>
                <button
                  type="button"
                  onClick={() => setFlashSubtype("APP_SHOWCASE")}
                  className={cn(
                    "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 transition",
                    flashSubtype === "APP_SHOWCASE" ? "bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/30" : "text-slate-400 hover:text-slate-200",
                  )}
                >
                  <Laptop className="size-3.5" /> Showcase Software / APK
                </button>
              </div>
            </div>

            {flashSubtype === "THERAPY_SLOT" ? (
              /* A. Slot Jadwal Terapi */
              <div className="mt-4 grid gap-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="therapy-type">Layanan Terapi</Label>
                  <select
                    id="therapy-type"
                    value={therapyType}
                    onChange={(e) => setTherapyType(e.target.value as typeof therapyType)}
                    className="mt-1.5 h-10 w-full rounded-lg border border-white/10 bg-slate-900 px-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                  >
                    <option value="TOTOK_SARAF">Totok Saraf & Stimulasi Vagus</option>
                    <option value="HIPNOTERAPI">Hipnoterapi Klinis & Subconscious</option>
                    <option value="KOMBINASI">Kombinasi Somatik + Bawah Sadar</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="remaining-slots">Sisa Slot Tersedia</Label>
                  <Input
                    id="remaining-slots"
                    type="number"
                    min={1}
                    max={50}
                    value={remainingSlots}
                    onChange={(e) => setRemainingSlots(Math.max(1, parseInt(e.target.value) || 1))}
                    className="mt-1.5 h-10 font-mono"
                  />
                </div>
                <div>
                  <Label htmlFor="practice-date">Tanggal & Waktu Praktek</Label>
                  <Input
                    id="practice-date"
                    value={practiceDate}
                    onChange={(e) => setPracticeDate(e.target.value)}
                    placeholder="Contoh: Sabtu ini, 15:00 - 21:00 WIB"
                    className="mt-1.5 h-10"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Label htmlFor="therapy-topic">Fokus Keluhan Utama yang Ditangani (Opsional)</Label>
                  <Input
                    id="therapy-topic"
                    value={therapyTopic}
                    onChange={(e) => setTherapyTopic(e.target.value)}
                    placeholder="Contoh: Pelepasan ketegangan saraf leher GB-20 & overthinking jam 11 malam"
                    className="mt-1.5 h-10"
                  />
                </div>
              </div>
            ) : (
              /* B. Showcase Aplikasi / Software Solutions */
              <div className="mt-4 grid gap-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.03] p-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="app-name">Nama Aplikasi / Tools</Label>
                  <Input
                    id="app-name"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Contoh: Story Maker AI / VagusTracker"
                    className="mt-1.5 h-10"
                  />
                </div>
                <div>
                  <Label htmlFor="target-user">Target Pengguna</Label>
                  <Input
                    id="target-user"
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    placeholder="Contoh: Solo developer, creator, profesional sibuk"
                    className="mt-1.5 h-10"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="app-solution">Solusi & Masalah Kognitif yang Dipecahkan</Label>
                  <Textarea
                    id="app-solution"
                    value={appSolution}
                    onChange={(e) => setAppSolution(e.target.value)}
                    rows={2}
                    placeholder="Contoh: Mengurai beban kognitif context overflow dan mengotomasi naskah neuro-copywriting dalam 30 detik."
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer controls: Date, Engine & Generate Button */}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <Label htmlFor="campaign-date">Tanggal tayang</Label>
              <Input id="campaign-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-[170px] font-mono" />
            </div>
            <div className="pb-2 text-xs text-slate-400">
              <span className="text-slate-500">Engine:</span> <span className="font-mono text-slate-300">{engineHint}</span>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {campaignType === "FLASH_PROMO" ? (
              <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-amber-300 transition hover:text-amber-200">
                <input
                  type="checkbox"
                  checked={autoSchedule}
                  onChange={(e) => setAutoSchedule(e.target.checked)}
                  disabled={loading}
                  className="size-4 cursor-pointer rounded border-amber-400/40 bg-black/40 text-amber-500 accent-amber-400 focus:ring-amber-400"
                />
                <span>Otomatis jadwalkan & unggah ke antrean siar WhatsApp</span>
              </label>
            ) : null}

            <Button
              variant="primary"
              size="lg"
              onClick={() => void generate()}
              disabled={!canSubmit}
              loading={loading}
              className={campaignType === "FLASH_PROMO" ? "bg-amber-500 font-bold text-slate-950 hover:bg-amber-400" : undefined}
            >
              {loading ? (
                campaignType === "FLASH_PROMO"
                  ? (autoSchedule ? "Merender & Menjadwalkan Promo..." : "Membuat & Mengunggah Promo...")
                  : "Meracik 4 Babak Story..."
              ) : (
                <>
                  {campaignType === "FLASH_PROMO" ? <Zap className="size-4" /> : <Sparkles />}
                  {campaignType === "FLASH_PROMO"
                    ? (autoSchedule ? "⚡ Buat & Jadwalkan Flash Promo" : "⚡ Generate Flash Promo (Ad-Hoc)")
                    : "Generate 4-Act Story"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Loading Progress State */}
        {loading ? (
          <div className="mt-5 grid gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
            {(scouting ? SCOUT_STEPS : campaignType === "FLASH_PROMO" ? PROMO_STEPS : STEPS).map((label, i) => (
              <div key={label} className={cn("flex items-center gap-2 text-xs", i <= step ? "text-slate-100" : "text-slate-500")}>
                {i < step ? (
                  <CheckCircle2 className="size-3.5 text-emerald-300" />
                ) : i === step ? (
                  <Loader2 className="size-3.5 animate-spin text-cyan-300" />
                ) : (
                  <Circle className="size-3.5" />
                )}
                {label}
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
