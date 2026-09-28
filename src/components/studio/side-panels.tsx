"use client";

import {
  Camera,
  Cpu,
  Database,
  History,
  KeyRound,
  Loader2,
  Lock,
  MessageCircle,
  Radio,
  RefreshCw,
  ShieldCheck,
  UserRound,
  Zap,
} from "lucide-react";
import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/client-api";
import type {
  CampaignSummaryDTO,
  EngineStatusDTO,
  FeatureFlags,
  PersonaSettings,
  WorkerHeartbeatDTO,
} from "@/lib/stories/types";
import { cn, formatRelative } from "@/lib/utils";
import type { Notify } from "./toaster";

function useNow(interval: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), interval);
    return () => window.clearInterval(t);
  }, [interval]);
  return now;
}

function StatusCode({ code }: { code: number }) {
  const tone = code === 200 ? "text-emerald-300 border-emerald-400/30" : code === 429 || code === 503 ? "text-amber-200 border-amber-400/30" : "text-rose-200 border-rose-400/30";
  return <span className={cn("rounded border px-1 py-px text-[10px] font-bold", tone)}>{code || "ERR"}</span>;
}

// ── Gemini Quota Guard ────────────────────────────────────────────────────
export function EnginePanel({
  engine,
  fetchedAt,
  busy,
  onRediscover,
  onReset,
}: {
  engine: EngineStatusDTO;
  fetchedAt: number;
  busy: boolean;
  onRediscover: () => void;
  onReset: () => void;
}) {
  const now = useNow(1000);
  const elapsed = Math.max(0, now - fetchedAt);

  return (
    <Card>
      <CardHeader
        icon={<Cpu />}
        title="Gemini Quota Guard"
        subtitle="Autodetect · circuit breaker · failover"
        action={
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" title="Re-discover model (models.list)" onClick={onRediscover} loading={busy} disabled={!engine.configured}>
              {busy ? null : <RefreshCw />}
            </Button>
            <Button size="icon" variant="ghost" title="Reset semua circuit breaker" onClick={onReset} disabled={!engine.configured || busy}>
              <Zap />
            </Button>
          </div>
        }
      />
      <div className="space-y-4 p-5">
        {!engine.configured ? (
          <div className="rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3 text-xs leading-relaxed text-amber-100">
            <p className="flex items-center gap-1.5 font-semibold">
              <KeyRound className="size-3.5" /> GEMINI_API_KEY belum diisi
            </p>
            <p className="mt-1 text-amber-100/80">
              Engine berjalan dalam mode <b>Offline Alchemist</b>. Ambil API key gratis di Google AI Studio, isi di <code>.env</code>, lalu restart — cascade model terdeteksi otomatis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Model optimal</p>
              <p className={cn("mt-0.5 truncate font-mono text-xs", engine.optimalModel ? "text-emerald-300" : "text-amber-200")}>
                {engine.optimalModel ?? "semua cooldown"}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Discovery</p>
              <p className="mt-0.5 truncate font-mono text-xs text-slate-200">
                {engine.discoverySource ?? "pending"} · {engine.discoveredModels.length}
              </p>
            </div>
          </div>
        )}
        {engine.discoveryError ? (
          <p className="rounded-lg border border-rose-400/20 bg-rose-400/[0.05] p-2 font-mono text-[10px] leading-relaxed text-rose-200">{engine.discoveryError}</p>
        ) : null}

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Fallback cascade</p>
          <ol className="space-y-1.5">
            {engine.cascade.map((m) => {
              const remaining = Math.max(0, m.cooldownRemainingMs - elapsed);
              const state = m.state !== "ready" && remaining === 0 ? "ready" : m.state;
              return (
                <li key={m.model} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-2.5 py-1.5">
                  <span className="w-4 text-right font-mono text-[10px] text-slate-500">{m.rank}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-slate-200" title={m.lastError ?? m.model}>
                    {m.model}
                  </span>
                  {m.lastLatencyMs != null && state === "ready" ? <span className="font-mono text-[10px] text-slate-500">{m.lastLatencyMs}ms</span> : null}
                  {state === "ready" ? (
                    <Badge tone="emerald">ready</Badge>
                  ) : state === "cooldown" ? (
                    <Badge tone="amber" title={m.lastError ?? undefined}>
                      <span suppressHydrationWarning>{Math.ceil(remaining / 1000)}s</span>
                    </Badge>
                  ) : (
                    <Badge tone="rose" title={m.lastError ?? undefined}>
                      off
                    </Badge>
                  )}
                </li>
              );
            })}
          </ol>
          <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
            PRD: {engine.prdCascade.join(" → ")} · cooldown dasar {engine.baseCooldownSeconds}s (eksponensial saat gagal beruntun)
          </p>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Telemetry terbaru</p>
          {engine.telemetry.length === 0 ? (
            <p className="text-xs text-slate-500">Belum ada request ke Gemini.</p>
          ) : (
            <ul className="space-y-1">
              {engine.telemetry.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-center gap-2 font-mono text-[11px]" title={t.errorMessage ?? undefined}>
                  <StatusCode code={t.statusCode} />
                  <span className="min-w-0 flex-1 truncate text-slate-300">{t.modelName}</span>
                  <span className="text-slate-500">{t.latencyMs != null ? `${t.latencyMs}ms` : "—"}</span>
                  <span className="w-14 text-right text-slate-600" suppressHydrationWarning>
                    {new Date(t.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

// ── Distribution status ───────────────────────────────────────────────────
function Row({ icon, label, value, tone, hint }: { icon: ReactNode; label: string; value: string; tone: "emerald" | "amber" | "rose" | "cyan"; hint?: string }) {
  const dot = { emerald: "bg-emerald-400", amber: "bg-amber-400", rose: "bg-rose-400", cyan: "bg-cyan-400" }[tone];
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5">
      <span className="mt-0.5 text-slate-400 [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-100">
          <span className={cn("h-1.5 w-1.5 rounded-full", dot)} />
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 text-[10px] text-slate-500" suppressHydrationWarning>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DistributionPanel({ flags, worker }: { flags: FeatureFlags; worker: WorkerHeartbeatDTO }) {
  const now = useNow(15_000);
  const online = Boolean(worker.lastSeen && now - new Date(worker.lastSeen).getTime() < 3 * 60_000);
  return (
    <Card>
      <CardHeader icon={<Radio />} title="Distribution" subtitle="Portal web + daemon Baileys lokal + Meta Graph API" />
      <div className="space-y-2 p-5">
        <Row
          icon={<MessageCircle />}
          label="WhatsApp daemon (Baileys)"
          value={online ? (worker.connected ? "Online · sesi WA aktif" : "Online · menunggu scan QR") : "Offline"}
          tone={online && worker.connected ? "emerald" : online ? "amber" : "rose"}
          hint={worker.lastSeen ? `poll terakhir ${formatRelative(worker.lastSeen, now)}${worker.me ? ` · ${worker.me}` : ""}` : "belum pernah melakukan polling"}
        />
        <Row
          icon={<Camera />}
          label="Instagram Graph API"
          value={flags.instagramConfigured ? "Terkonfigurasi" : "Belum diset"}
          tone={flags.instagramConfigured ? "emerald" : "amber"}
          hint={flags.instagramConfigured ? undefined : "IG_USER_ID + IG_ACCESS_TOKEN (akun Business)"}
        />
        <Row
          icon={<Database />}
          label="Penyimpanan aset"
          value={flags.supabaseStorageConfigured ? "Supabase Storage · story-assets" : "Postgres (fallback)"}
          tone="cyan"
        />
        <Row
          icon={<Lock />}
          label="Akses dashboard"
          value={flags.dashboardAuthEnabled ? "Terkunci passcode" : "Terbuka"}
          tone={flags.dashboardAuthEnabled ? "emerald" : "amber"}
          hint={flags.dashboardAuthEnabled ? undefined : "Set DASHBOARD_PASSCODE sebelum deploy publik"}
        />
        <Row
          icon={<ShieldCheck />}
          label="WORKER_SECRET"
          value={flags.workerSecretConfigured ? "Aktif" : "Belum diset"}
          tone={flags.workerSecretConfigured ? "emerald" : "rose"}
          hint={flags.workerSecretConfigured ? undefined : "Daemon ditolak sampai secret diisi di kedua sisi"}
        />
        <details className="rounded-xl border border-white/10 bg-black/30 p-3">
          <summary className="cursor-pointer text-[11px] font-semibold text-cyan-300">Cara menjalankan daemon WhatsApp</summary>
          <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
            {`cd worker\nnpm install\ncp .env.example .env\n# isi STORY_MAKER_URL=${flags.appUrl}\n# isi WORKER_SECRET (sama dgn server)\nnpm start   # scan QR di terminal`}
          </pre>
        </details>
      </div>
    </Card>
  );
}

// ── Campaign history ──────────────────────────────────────────────────────
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

export function HistoryPanel({
  campaigns,
  currentId,
  loadingId,
  onSelect,
}: {
  campaigns: CampaignSummaryDTO[];
  currentId: string | null;
  loadingId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader icon={<History />} title="Riwayat Campaign" subtitle={`${campaigns.length} hari tersimpan`} />
      <div className="thin-scrollbar max-h-[340px] overflow-y-auto p-2">
        {campaigns.length === 0 ? (
          <p className="p-3 text-xs text-slate-500">Belum ada campaign. Mulai dari Quick Idea Drop.</p>
        ) : (
          campaigns.map((c) => {
            const [, m, d] = c.campaignDate.split("-");
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  "flex w-full cursor-pointer items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.05]",
                  c.id === currentId && "bg-cyan-400/[0.07] ring-1 ring-cyan-400/30",
                )}
              >
                <div className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-white/10 bg-black/30 py-1">
                  <span className="text-[9px] font-semibold uppercase text-slate-500">{MONTHS[Number(m) - 1] ?? m}</span>
                  <span className="text-base font-bold leading-none text-white">{d}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-100">{c.themeTopic}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge tone={c.generationSource === "gemini" ? "emerald" : "amber"}>{c.generationSource === "gemini" ? "Gemini" : "Offline"}</Badge>
                    {c.counts.POSTED ? <Badge tone="emerald">{c.counts.POSTED} posted</Badge> : null}
                    {c.counts.SCHEDULED ? <Badge tone="amber">{c.counts.SCHEDULED} jadwal</Badge> : null}
                    {c.counts.FAILED ? <Badge tone="rose">{c.counts.FAILED} gagal</Badge> : null}
                  </div>
                </div>
                {loadingId === c.id ? <Loader2 className="mt-1 size-4 animate-spin text-cyan-300" /> : null}
              </button>
            );
          })
        )}
      </div>
    </Card>
  );
}

// ── Persona & brand ───────────────────────────────────────────────────────
const PERSONA_FIELDS: Array<{ key: keyof PersonaSettings; label: string; placeholder: string; multiline?: boolean; max: number }> = [
  { key: "creatorName", label: "Nama kreator", placeholder: "Nama Anda", max: 80 },
  { key: "handle", label: "Handle", placeholder: "@username", max: 60 },
  { key: "ctaKeyword", label: "Kata kunci CTA (KETIK '…')", placeholder: "RESET", max: 24 },
  { key: "whatsappNumber", label: "Nomor WhatsApp (opsional)", placeholder: "62812xxxx", max: 20 },
  { key: "signature", label: "Signature di slide", placeholder: "Hipnoterapis Klinis · …", max: 120 },
  { key: "audience", label: "Audiens target", placeholder: "Siapa yang ingin dijangkau?", multiline: true, max: 400 },
  { key: "voiceNotes", label: "Catatan gaya bahasa", placeholder: "Mis. hindari kata 'healing', suka analogi kopi…", multiline: true, max: 800 },
];

export function PersonaPanel({ persona, onSaved, notify }: { persona: PersonaSettings; onSaved: (p: PersonaSettings) => void; notify: Notify }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<PersonaSettings>(persona);
  const [saving, setSaving] = useState(false);

  const change = (key: keyof PersonaSettings) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await apiFetch<{ persona: PersonaSettings }>("/api/settings/persona", { method: "PUT", json: form });
      setForm(data.persona);
      onSaved(data.persona);
      setOpen(false);
      notify("success", "Persona disimpan", "Generate berikutnya memakai identitas ini. Klik Re-render agar handle/signature baru tampil di slide.");
    } catch (err) {
      notify("error", "Gagal menyimpan persona", errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader
        icon={<UserRound />}
        title="Persona & Brand"
        subtitle={`${persona.creatorName} · ${persona.handle} · KETIK '${persona.ctaKeyword}'`}
        action={
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setForm(persona);
              setOpen((o) => !o);
            }}
          >
            {open ? "Tutup" : "Edit"}
          </Button>
        }
      />
      {open ? (
        <form onSubmit={save} className="space-y-3 p-5">
          {PERSONA_FIELDS.map((f) => (
            <div key={f.key}>
              <Label htmlFor={`persona-${f.key}`}>{f.label}</Label>
              {f.multiline ? (
                <Textarea id={`persona-${f.key}`} rows={3} value={form[f.key]} maxLength={f.max} placeholder={f.placeholder} onChange={change(f.key)} />
              ) : (
                <Input id={`persona-${f.key}`} value={form[f.key]} maxLength={f.max} placeholder={f.placeholder} onChange={change(f.key)} />
              )}
            </div>
          ))}
          <Button type="submit" variant="primary" className="w-full" loading={saving}>
            Simpan persona
          </Button>
        </form>
      ) : (
        <div className="space-y-2 p-5 text-xs leading-relaxed text-slate-400">
          <p className="text-slate-300">{persona.signature}</p>
          <div className="flex flex-wrap gap-1.5">
            {["Hipnoterapi Klinis", "Totok Saraf", "Solo AI Dev", "Public Speaker"].map((p) => (
              <Badge key={p} tone="violet">
                {p}
              </Badge>
            ))}
          </div>
          <p className="line-clamp-3">{persona.audience}</p>
        </div>
      )}
    </Card>
  );
}
