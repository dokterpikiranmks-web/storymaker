"use client";

import { CheckCircle2, Circle, Loader2, Mic, MicOff, Sparkles, Zap } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ApiClientError, apiFetch, errorMessage } from "@/lib/client-api";
import type { CampaignDTO, EngineStatusDTO, GenerationInfo } from "@/lib/stories/types";
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
  const [mode, setMode] = useState<"topic" | "raw">("topic");
  const [topic, setTopic] = useState("");
  const [raw, setRaw] = useState("");
  const [date, setDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const speechSupported = useSyncExternalStore(noopSubscribe, () => getRecognitionCtor() !== null, () => false);

  useEffect(() => {
    if (!loading) return;
    const t = window.setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 2800);
    return () => window.clearInterval(t);
  }, [loading]);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  const canSubmit = !loading && (mode === "topic" ? topic.trim().length >= 3 : raw.trim().length >= 10);

  async function generate(overwrite = false): Promise<void> {
    const payload = {
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
        "4 babak story siap diedit",
        data.generation.source === "gemini" ? `Ditulis oleh ${data.generation.model}` : "Mode Offline Alchemist (Gemini tidak dipakai)",
      );
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409 && !overwrite) {
        if (window.confirm(`Campaign untuk ${date} sudah ada. Timpa dengan cerita baru?`)) await generate(true);
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
                placeholder="Contoh: overthinking sebelum tidur, leher kaku karena deadline…"
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
                placeholder="Tempel transkrip voice note atau tulis unek-unek mentahmu… Boleh berantakan — The Alchemist akan mengekstrak insight terkuatnya."
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
          <Button variant="primary" size="lg" onClick={() => void generate()} disabled={!canSubmit} loading={loading}>
            {loading ? null : <Sparkles />} Generate 4-Act Story
          </Button>
        </div>

        {loading ? (
          <div className="mt-5 grid gap-1.5 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-4">
            {STEPS.map((label, i) => (
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
