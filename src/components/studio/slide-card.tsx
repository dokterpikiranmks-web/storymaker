"use client";

import { AlertTriangle, Camera, CheckCircle2, Clock, Download, ImageOff, Loader2, MessageCircle, Pencil, Send } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { ACTS, THEME_NAMES, THEMES, type PostStatus } from "@/lib/stories/constants";
import type { CampaignDTO, SlideDTO } from "@/lib/stories/types";
import { cn } from "@/lib/utils";
import type { Notify } from "./toaster";

type SlidePatch = Partial<
  Pick<SlideDTO, "headline" | "bodyText" | "callToAction" | "caption" | "visualTheme" | "targetTime" | "postToWhatsapp" | "postToInstagram">
>;

const VISUAL_KEYS: Array<keyof SlidePatch> = ["headline", "bodyText", "callToAction", "visualTheme"];

const STATUS_TONE: Record<PostStatus, "neutral" | "amber" | "emerald" | "rose"> = {
  DRAFT: "neutral",
  SCHEDULED: "amber",
  POSTED: "emerald",
  FAILED: "rose",
};
const STATUS_LABEL: Record<PostStatus, string> = { DRAFT: "Draft", SCHEDULED: "Terjadwal", POSTED: "Terkirim", FAILED: "Gagal" };

export function AccentText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\*[^*]+\*)/g).map((part, i) =>
        part.length > 2 && part.startsWith("*") && part.endsWith("*") ? (
          <span key={i} className="text-cyan-300">
            {part.slice(1, -1)}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function EditableText({
  value,
  onSave,
  multiline = false,
  allowEmpty = false,
  placeholder,
  maxLength,
  render,
  textClassName,
  hint,
}: {
  value: string;
  onSave: (next: string) => void;
  multiline?: boolean;
  allowEmpty?: boolean;
  placeholder?: string;
  maxLength?: number;
  render?: (v: string) => ReactNode;
  textClassName?: string;
  hint?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next === value.trim()) return;
    if (!next && !allowEmpty) return;
    onSave(next);
  };

  if (editing) {
    return (
      <div>
        <textarea
          autoFocus
          value={draft}
          maxLength={maxLength}
          rows={multiline ? 6 : 2}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(value);
              setEditing(false);
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey || !multiline)) {
              e.preventDefault();
              commit();
            }
          }}
          className={cn(
            "w-full resize-y rounded-lg border border-cyan-400/40 bg-black/50 px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-cyan-400/20",
            textClassName,
          )}
        />
        <p className="mt-0.5 text-[10px] text-slate-500">{hint ?? (multiline ? "Ctrl/⌘+Enter simpan · Esc batal" : "Enter simpan · Esc batal")}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      className="group/edit relative w-full cursor-text rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.05]"
    >
      <span className={cn("block pr-5", textClassName)}>
        {value ? (render ? render(value) : value) : <span className="font-normal italic text-slate-500">{placeholder}</span>}
      </span>
      <Pencil className="absolute right-1.5 top-2 size-3 text-slate-500 opacity-0 transition group-hover/edit:opacity-100" />
    </button>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <p className="mt-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">{children}</p>;
}

function ChannelToggle({ active, onClick, icon, label, disabled, title }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-3",
        active ? "border-emerald-400/40 bg-emerald-400/15 text-emerald-200" : "border-white/10 text-slate-500 hover:text-slate-300",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function fmt(iso: string | null, timezone: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("id-ID", { timeZone: timezone, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function SlideCard({
  slide,
  instagramConfigured,
  timezone,
  onSlideChange,
  onCampaignChange,
  notify,
}: {
  slide: SlideDTO;
  instagramConfigured: boolean;
  timezone: string;
  onSlideChange: (slide: SlideDTO) => void;
  onCampaignChange: (campaign: CampaignDTO) => void;
  notify: Notify;
}) {
  const act = ACTS[slide.act];
  const [rendering, setRendering] = useState(false);
  const [saving, setSaving] = useState(false);
  const [posting, setPosting] = useState(false);
  const [showCaption, setShowCaption] = useState(false);
  const [time, setTime] = useState(slide.targetTime);
  const [prevTime, setPrevTime] = useState(slide.targetTime);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  if (slide.targetTime !== prevTime) {
    setPrevTime(slide.targetTime);
    setTime(slide.targetTime);
  }

  async function patch(p: SlidePatch) {
    const visual = VISUAL_KEYS.some((k) => p[k] !== undefined);
    if (visual) setRendering(true);
    setSaving(true);
    try {
      const data = await apiFetch<{ slide: SlideDTO; renderError: string | null }>(`/api/slides/${slide.id}`, { method: "PATCH", json: p });
      onSlideChange(data.slide);
      if (data.renderError) notify("error", "Teks tersimpan, tapi render gagal", data.renderError);
    } catch (err) {
      notify("error", "Gagal menyimpan", errorMessage(err));
    } finally {
      setRendering(false);
      setSaving(false);
    }
  }

  async function postNow() {
    const channels = { whatsapp: slide.postToWhatsapp, instagram: slide.postToInstagram && instagramConfigured };
    if (!channels.whatsapp && !channels.instagram) {
      notify("error", "Pilih channel dulu", "Aktifkan WA atau IG pada slide ini.");
      return;
    }
    setPosting(true);
    try {
      const data = await apiFetch<{ campaign: CampaignDTO | null; instagram: Array<{ ok: boolean; error?: string }> }>(
        `/api/campaigns/${slide.campaignId}/schedule`,
        { method: "POST", json: { mode: "now", slideIds: [slide.id], channels } },
      );
      if (data.campaign) onCampaignChange(data.campaign);
      const ig = data.instagram[0];
      if (ig && !ig.ok) notify("error", `Instagram gagal (Babak ${act.index})`, ig.error);
      else
        notify(
          "success",
          `Babak ${act.index} dikirim`,
          channels.whatsapp ? "Masuk antrean WhatsApp — daemon memposting pada polling berikutnya (≤60 detik)." : "Instagram Story terpublikasi.",
        );
    } catch (err) {
      notify("error", "Gagal posting", errorMessage(err));
    } finally {
      setPosting(false);
    }
  }

  const imageUrl = slide.renderedImageUrl && slide.renderedImageUrl !== failedUrl ? slide.renderedImageUrl : null;

  return (
    <article className="flex w-[292px] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-[#0B0F19]/85 p-3 shadow-xl sm:w-[312px]">
      <div className="flex items-start justify-between gap-2 px-1 pb-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            <span aria-hidden>{act.slotEmoji}</span> Babak {act.index} · {act.slot}
          </p>
          <p className="mt-0.5 truncate text-sm font-semibold text-white" title={act.title}>
            {act.title}
          </p>
        </div>
        <Badge tone={STATUS_TONE[slide.status]}>{STATUS_LABEL[slide.status]}</Badge>
      </div>

      <div className="relative aspect-[9/16] overflow-hidden rounded-xl border border-white/10 bg-black">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Preview babak ${act.index}: ${slide.headline.replace(/\*/g, "")}`}
            className="h-full w-full object-cover"
            onError={() => setFailedUrl(slide.renderedImageUrl)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-xs text-slate-500">
            <ImageOff className="size-6" />
            Preview belum tersedia
            <Button size="sm" variant="outline" onClick={() => void patch({ visualTheme: slide.visualTheme })}>
              Render ulang
            </Button>
          </div>
        )}
        {rendering ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/65 backdrop-blur-[2px]">
            <Loader2 className="size-6 animate-spin text-cyan-300" />
            <span className="text-[11px] font-medium text-slate-200">Rendering 1080×1920…</span>
          </div>
        ) : null}
        <span className="absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">9:16 · {act.time}</span>
      </div>

      <div className="mt-3 flex items-center justify-between px-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{slide.visualTheme}</span>
        <div className="flex gap-1.5">
          {THEME_NAMES.map((name) => {
            const t = THEMES[name];
            const active = slide.visualTheme === name;
            return (
              <button
                key={name}
                type="button"
                title={`${name} — ${t.tagline}`}
                aria-label={`Tema ${name}`}
                disabled={saving}
                onClick={() => !active && void patch({ visualTheme: name })}
                className={cn(
                  "h-6 w-6 cursor-pointer rounded-full border-2 transition disabled:cursor-wait",
                  active ? "scale-110 border-white" : "border-white/15 hover:border-white/50",
                )}
                style={{ background: `linear-gradient(135deg, ${t.bg} 0%, ${t.bg} 45%, ${t.accent} 46%, ${t.accent2} 100%)` }}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex flex-col">
        <FieldLabel>Headline</FieldLabel>
        <EditableText
          value={slide.headline}
          onSave={(v) => void patch({ headline: v })}
          maxLength={300}
          render={(v) => <AccentText text={v} />}
          textClassName="text-[15px] font-bold leading-snug text-white"
          hint="*kata* = aksen warna · Enter simpan"
        />
        <FieldLabel>Naskah slide</FieldLabel>
        <EditableText
          value={slide.bodyText}
          multiline
          onSave={(v) => void patch({ bodyText: v })}
          maxLength={1200}
          textClassName="whitespace-pre-line text-[13px] leading-relaxed text-slate-300"
        />
        <FieldLabel>Call to action</FieldLabel>
        <EditableText
          value={slide.callToAction ?? ""}
          allowEmpty
          onSave={(v) => void patch({ callToAction: v || null })}
          maxLength={200}
          placeholder="Tambahkan CTA…"
          textClassName="text-[13px] font-semibold text-emerald-300"
        />
      </div>

      {slide.technique ? (
        <div className="mx-1 mt-2 rounded-lg border border-violet-400/20 bg-violet-400/[0.06] px-2.5 py-2 text-[11px] leading-relaxed text-violet-200">
          <span className="font-semibold">Teknik:</span> {slide.technique}
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setShowCaption((v) => !v)}
        className="mt-2 cursor-pointer px-2 text-left text-[11px] font-semibold text-cyan-300 hover:text-cyan-200"
      >
        {showCaption ? "▾ Sembunyikan caption" : "▸ Caption WA / IG"}
      </button>
      {showCaption ? (
        <EditableText
          value={slide.caption ?? ""}
          multiline
          allowEmpty
          onSave={(v) => void patch({ caption: v || null })}
          maxLength={2200}
          placeholder="Caption kosong…"
          textClassName="whitespace-pre-line text-[12px] leading-relaxed text-slate-300"
        />
      ) : null}

      <div className="mt-auto pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2">
          <Clock className="size-3.5 shrink-0 text-slate-400" />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onBlur={() => {
              if (time !== slide.targetTime && /^\d{2}:\d{2}$/.test(time)) void patch({ targetTime: time });
            }}
            className="w-[88px] bg-transparent font-mono text-sm text-white focus:outline-none"
            aria-label={`Jam tayang babak ${act.index}`}
          />
          <div className="ml-auto flex gap-1">
            <ChannelToggle
              active={slide.postToWhatsapp}
              onClick={() => void patch({ postToWhatsapp: !slide.postToWhatsapp })}
              icon={<MessageCircle />}
              label="WA"
              title="WhatsApp Status (via daemon lokal)"
            />
            <ChannelToggle
              active={slide.postToInstagram}
              disabled={!instagramConfigured && !slide.postToInstagram}
              onClick={() => void patch({ postToInstagram: !slide.postToInstagram })}
              icon={<Camera />}
              label="IG"
              title={instagramConfigured ? "Instagram Story (Graph API)" : "Isi IG_USER_ID & IG_ACCESS_TOKEN untuk mengaktifkan"}
            />
          </div>
        </div>

        <div className="mt-2 min-h-4 px-1 text-[11px] leading-snug" suppressHydrationWarning>
          {slide.status === "SCHEDULED" && slide.scheduledAt ? (
            <span className="flex items-center gap-1 text-amber-200">
              <Clock className="size-3" /> Tayang {fmt(slide.scheduledAt, timezone)}
            </span>
          ) : null}
          {slide.waPostedAt || slide.igPostedAt ? (
            <span className="flex items-center gap-1 text-emerald-300">
              <CheckCircle2 className="size-3" />
              {slide.waPostedAt ? `WA ${fmt(slide.waPostedAt, timezone)}` : ""}
              {slide.waPostedAt && slide.igPostedAt ? " · " : ""}
              {slide.igPostedAt ? `IG ${fmt(slide.igPostedAt, timezone)}` : ""}
            </span>
          ) : null}
          {slide.lastError ? (
            <span className="mt-0.5 flex items-start gap-1 text-rose-300" title={slide.lastError}>
              <AlertTriangle className="mt-0.5 size-3 shrink-0" />
              <span className="line-clamp-2">{slide.lastError}</span>
            </span>
          ) : null}
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <a href={`/api/media/${slide.id}?download=1`} className={buttonVariants({ variant: "secondary", size: "sm" })}>
            <Download /> PNG
          </a>
          <Button variant="outline" size="sm" loading={posting} onClick={() => void postNow()}>
            {posting ? null : <Send />} Post Now
          </Button>
        </div>
      </div>
    </article>
  );
}
