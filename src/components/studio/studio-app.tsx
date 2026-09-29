"use client";

import { AlertTriangle, Brain, ChevronRight, LogOut, ShieldAlert, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { ACT_LIST, THEMES } from "@/lib/stories/constants";
import type {
  CampaignDTO,
  CampaignSummaryDTO,
  EngineStatusDTO,
  FeatureFlags,
  GenerationInfo,
  PersonaSettings,
  SlideDTO,
  WorkerHeartbeatDTO,
} from "@/lib/stories/types";
import { cn } from "@/lib/utils";
import { IdeaDrop } from "./idea-drop";
import { DistributionPanel, EnginePanel, HistoryPanel, PersonaPanel } from "./side-panels";
import { StoryStudio } from "./story-studio";
import { Toaster, useToasts } from "./toaster";

export interface StudioAppProps {
  initialCampaign: CampaignDTO | null;
  initialCampaigns: CampaignSummaryDTO[];
  initialPersona: PersonaSettings;
  initialFlags: FeatureFlags;
  initialEngine: EngineStatusDTO;
  initialWorker: WorkerHeartbeatDTO;
}

function EnginePill({ engine }: { engine: EngineStatusDTO }) {
  const state = !engine.configured ? "offline" : engine.optimalModel ? "ready" : "pending";
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs">
      <span className="relative flex h-2 w-2">
        <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-60", state === "ready" ? "bg-emerald-400" : "bg-amber-400")} />
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", state === "ready" ? "bg-emerald-400" : "bg-amber-400")} />
      </span>
      <span className="text-slate-400">AI Brain</span>
      <span className="font-mono text-slate-100">
        {state === "offline" ? "Offline Alchemist" : state === "ready" ? engine.optimalModel : "autodetect"}
      </span>
    </div>
  );
}

function GenerationBanner({ info, onClose }: { info: GenerationInfo; onClose: () => void }) {
  const gemini = info.source === "gemini";
  return (
    <div className={cn("flex items-start gap-3 rounded-2xl border px-4 py-3", gemini ? "border-emerald-400/25 bg-emerald-400/[0.06]" : "border-amber-400/25 bg-amber-400/[0.06]")}>
      {gemini ? <Sparkles className="mt-0.5 size-4 shrink-0 text-emerald-300" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">
          {gemini ? `Ditulis oleh ${info.model} dalam ${(info.latencyMs / 1000).toFixed(1)} detik` : "Offline Alchemist Template dipakai"}
        </p>
        {info.fallbackReason ? <p className="mt-0.5 text-xs text-amber-100/80">{info.fallbackReason}</p> : null}
        {info.attempts.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
            {info.attempts.map((a, i) => (
              <span key={`${a.model}-${i}`} className="flex items-center gap-1.5">
                {i > 0 ? <ChevronRight className="size-3 text-slate-500" /> : null}
                <span className={cn("rounded-md border px-1.5 py-0.5", a.status === 200 ? "border-emerald-400/30 text-emerald-200" : "border-rose-400/30 text-rose-200")} title={a.message}>
                  {a.model} · {a.status === 200 ? "OK" : `${a.status || "ERR"} ${a.kind}`}
                </span>
              </span>
            ))}
          </div>
        ) : null}
        {info.renderErrors?.length ? <p className="mt-1 text-xs text-rose-200">Render: {info.renderErrors.join("; ")}</p> : null}
      </div>
      <button type="button" onClick={onClose} className="cursor-pointer text-slate-400 hover:text-white" aria-label="Tutup">
        <X className="size-4" />
      </button>
    </div>
  );
}

function EmptyStudio() {
  return (
    <Card className="p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Framework 4 babak · Dopamine loop harian</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
        {ACT_LIST.map((act) => {
          const theme = THEMES[act.defaultTheme];
          return (
            <div key={act.act} className="relative overflow-hidden rounded-xl border border-white/10 p-4" style={{ background: `linear-gradient(160deg, ${theme.bg} 0%, #0b0f19 100%)` }}>
              <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl" style={{ background: theme.accent, opacity: 0.25 }} />
              <p className="text-xs font-semibold" style={{ color: theme.accent }}>
                {act.slotEmoji} {act.slot} · {act.time}
              </p>
              <p className="mt-2 text-sm font-bold text-white">
                Babak {act.index}: {act.title}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{act.goal}</p>
              <p className="mt-3 font-mono text-[10px] text-slate-500">{act.defaultTheme}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function StudioApp(props: StudioAppProps) {
  const [campaign, setCampaign] = useState<CampaignDTO | null>(props.initialCampaign);
  const [campaigns, setCampaigns] = useState(props.initialCampaigns);
  const [persona, setPersona] = useState(props.initialPersona);
  const [flags, setFlags] = useState(props.initialFlags);
  const [engine, setEngine] = useState(props.initialEngine);
  const [engineFetchedAt, setEngineFetchedAt] = useState(() => Date.now());
  const [engineBusy, setEngineBusy] = useState(false);
  const [worker, setWorker] = useState(props.initialWorker);
  const [lastGeneration, setLastGeneration] = useState<GenerationInfo | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { toasts, notify, dismiss } = useToasts();

  const refreshStatus = useCallback(async (discover = false) => {
    try {
      const data = await apiFetch<{ engine: EngineStatusDTO; worker: WorkerHeartbeatDTO; flags: FeatureFlags }>(
        `/api/system/status${discover ? "?discover=1" : ""}`,
      );
      setEngine(data.engine);
      setEngineFetchedAt(Date.now());
      setWorker(data.worker);
      setFlags(data.flags);
    } catch {
      /* silent — sidebar status is best effort */
    }
  }, []);

  const refreshCampaigns = useCallback(async () => {
    try {
      const data = await apiFetch<{ campaigns: CampaignSummaryDTO[] }>("/api/campaigns");
      setCampaigns(data.campaigns);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(() => void refreshStatus(true), 300);
    const interval = window.setInterval(() => void refreshStatus(false), 20_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(interval);
    };
  }, [refreshStatus]);

  const campaignId = campaign?.id ?? null;
  const hasScheduled = Boolean(campaign?.slides.some((s) => s.status === "SCHEDULED"));
  useEffect(() => {
    if (!campaignId || !hasScheduled) return;
    const t = window.setInterval(async () => {
      try {
        const data = await apiFetch<{ campaign: CampaignDTO }>(`/api/campaigns/${campaignId}`);
        setCampaign(data.campaign);
      } catch {
        /* ignore */
      }
    }, 30_000);
    return () => window.clearInterval(t);
  }, [campaignId, hasScheduled]);

  const onCampaignChange = useCallback(
    (next: CampaignDTO) => {
      setCampaign(next);
      void refreshCampaigns();
    },
    [refreshCampaigns],
  );

  const onSlideChange = useCallback((slide: SlideDTO) => {
    setCampaign((prev) => (prev ? { ...prev, slides: prev.slides.map((s) => (s.id === slide.id ? slide : s)) } : prev));
  }, []);

  async function loadCampaign(id: string) {
    setLoadingId(id);
    try {
      const data = await apiFetch<{ campaign: CampaignDTO }>(`/api/campaigns/${id}`);
      setCampaign(data.campaign);
      setLastGeneration(null);
    } catch (err) {
      notify("error", "Gagal memuat campaign", errorMessage(err));
    } finally {
      setLoadingId(null);
    }
  }

  async function engineAction(kind: "discover" | "reset") {
    setEngineBusy(true);
    try {
      const data =
        kind === "discover"
          ? await apiFetch<{ engine: EngineStatusDTO }>("/api/gemini/status?discover=1&force=1")
          : await apiFetch<{ engine: EngineStatusDTO }>("/api/gemini/status", { method: "POST", json: { action: "reset" } });
      setEngine(data.engine);
      setEngineFetchedAt(Date.now());
      notify("info", kind === "discover" ? "Model Gemini di-discover ulang" : "Circuit breaker di-reset", data.engine.optimalModel ? `Model optimal: ${data.engine.optimalModel}` : undefined);
    } catch (err) {
      notify("error", "Aksi engine gagal", errorMessage(err));
    } finally {
      setEngineBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="mx-auto max-w-[1680px] px-4 py-6 lg:px-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 animate-float items-center justify-center rounded-2xl border border-cyan-400/30 bg-linear-to-br from-cyan-400/20 to-emerald-400/10 shadow-[0_0_30px_rgba(34,211,238,0.25)]">
            <Brain className="size-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-white">
              Story <span className="shimmer-text font-serif font-medium italic">Maker</span>
            </h1>
            <p className="text-xs text-slate-400">Autonomous Neuro-Storytelling Engine · 4-Act Dopamine Loop · $0 free-tier stack</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <EnginePill engine={engine} />
          {flags.dashboardAuthEnabled ? (
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              <LogOut /> Keluar
            </Button>
          ) : (
            <Badge tone="amber" title="Set DASHBOARD_PASSCODE di .env untuk mengunci dashboard">
              <ShieldAlert /> Open access
            </Badge>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <main className="flex min-w-0 flex-col gap-6">
          {!flags.databaseConfigured ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-200">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-400" />
              <div className="flex-1 text-sm">
                <p className="font-semibold text-white">Database Supabase Belum Terhubung</p>
                <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
                  Variabel <code className="rounded bg-black/40 px-1 py-0.5 font-mono text-amber-300">DATABASE_URL</code> belum dimasukkan di <strong>Vercel Project Settings &gt; Environment Variables</strong>. 
                  Untuk menyimpan hasil story dan slide, masukkan connection string PostgreSQL Supabase Anda lalu redeploy.
                </p>
              </div>
            </div>
          ) : null}
          <IdeaDrop
            today={flags.today}
            engine={engine}
            notify={notify}
            onGenerated={(next, info) => {
              setCampaign(next);
              setLastGeneration(info);
              void refreshCampaigns();
              void refreshStatus(false);
            }}
          />
          {lastGeneration ? <GenerationBanner info={lastGeneration} onClose={() => setLastGeneration(null)} /> : null}
          {campaign ? (
            <StoryStudio
              key={campaign.id}
              campaign={campaign}
              flags={flags}
              onCampaignChange={onCampaignChange}
              onSlideChange={onSlideChange}
              onDeleted={(id) => {
                setCampaigns((list) => list.filter((c) => c.id !== id));
                setCampaign(null);
                setLastGeneration(null);
              }}
              notify={notify}
            />
          ) : (
            <EmptyStudio />
          )}
        </main>

        <aside className="flex min-w-0 flex-col gap-6">
          <EnginePanel
            engine={engine}
            fetchedAt={engineFetchedAt}
            busy={engineBusy}
            onRediscover={() => void engineAction("discover")}
            onReset={() => void engineAction("reset")}
          />
          <DistributionPanel flags={flags} worker={worker} />
          <HistoryPanel campaigns={campaigns} currentId={campaign?.id ?? null} loadingId={loadingId} onSelect={(id) => void loadCampaign(id)} />
          <PersonaPanel persona={persona} onSaved={setPersona} notify={notify} />
        </aside>
      </div>

      <footer className="mt-10 pb-6 text-center text-[11px] text-slate-600">
        Story Maker v1.0 · Next.js + Postgres/Supabase + Gemini free tier + Satori/resvg + Baileys + Meta Graph API · Rp 0 / bulan
      </footer>

      <Toaster toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
