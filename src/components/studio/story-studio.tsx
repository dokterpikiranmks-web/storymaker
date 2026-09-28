"use client";

import { CalendarClock, Camera, ChevronLeft, ChevronRight, Download, Layers, MessageCircle, RefreshCw, Send, Trash2, Undo2 } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch, errorMessage } from "@/lib/client-api";
import { ACTS, POST_STATUSES, type PostStatus } from "@/lib/stories/constants";
import type { CampaignDTO, FeatureFlags, SlideDTO } from "@/lib/stories/types";
import { cn, formatDateLong } from "@/lib/utils";
import { SlideCard } from "./slide-card";
import type { Notify } from "./toaster";

function ChannelPill({ active, onClick, icon, label, disabled, title }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; disabled?: boolean; title?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 [&_svg]:size-3.5",
        active ? "bg-emerald-400/15 text-emerald-200 ring-1 ring-emerald-400/30" : "text-slate-400 hover:text-slate-200",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function StoryStudio({
  campaign,
  flags,
  onCampaignChange,
  onSlideChange,
  onDeleted,
  notify,
}: {
  campaign: CampaignDTO;
  flags: FeatureFlags;
  onCampaignChange: (campaign: CampaignDTO) => void;
  onSlideChange: (slide: SlideDTO) => void;
  onDeleted: (id: string) => void;
  notify: Notify;
}) {
  const [channels, setChannels] = useState({ whatsapp: true, instagram: false });
  const [busy, setBusy] = useState<null | "schedule" | "now" | "cancel" | "render" | "delete">(null);
  const [active, setActive] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const counts = useMemo(() => {
    const base = Object.fromEntries(POST_STATUSES.map((s) => [s, 0])) as Record<PostStatus, number>;
    for (const s of campaign.slides) base[s.status] += 1;
    return base;
  }, [campaign.slides]);

  async function schedule(mode: "schedule" | "now" | "cancel") {
    if (mode === "now" && !window.confirm("Posting semua 4 babak ke channel terpilih SEKARANG?")) return;
    setBusy(mode);
    try {
      const data = await apiFetch<{
        campaign: CampaignDTO | null;
        pastDue: number;
        instagram: Array<{ ok: boolean; error?: string }>;
        workerRequired: boolean;
        workerSecretConfigured: boolean;
      }>(`/api/campaigns/${campaign.id}/schedule`, {
        method: "POST",
        json: { mode, channels: mode === "cancel" ? undefined : { whatsapp: channels.whatsapp, instagram: channels.instagram && flags.instagramConfigured } },
      });
      if (data.campaign) onCampaignChange(data.campaign);
      const workerNote = data.workerRequired
        ? data.workerSecretConfigured
          ? " Pastikan daemon WhatsApp lokal berjalan."
          : " ⚠ WORKER_SECRET belum diset — daemon WhatsApp belum bisa terhubung."
        : "";
      if (mode === "schedule") {
        const times = campaign.slides.map((s) => s.targetTime).join(" · ");
        notify(
          "success",
          "Jadwal tersimpan",
          `Tayang ${times} (${flags.timezone}).${data.pastDue ? ` ${data.pastDue} babak sudah lewat jamnya → langsung dikirim.` : ""}${workerNote}`,
        );
      } else if (mode === "now") {
        const failed = data.instagram.filter((r) => !r.ok);
        if (failed.length) notify("error", `Instagram gagal (${failed.length})`, failed[0].error);
        else notify("success", "Post Now diproses", `Semua babak masuk antrean.${workerNote}`);
      } else {
        notify("info", "Jadwal dibatalkan", "Slide kembali menjadi draft.");
      }
    } catch (err) {
      notify("error", "Aksi gagal", errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function rerender() {
    setBusy("render");
    try {
      const data = await apiFetch<{ campaign: CampaignDTO; errors: string[] }>(`/api/campaigns/${campaign.id}/render`, { method: "POST" });
      onCampaignChange(data.campaign);
      if (data.errors.length) notify("error", "Sebagian render gagal", data.errors.join("; "));
      else notify("success", "4 slide dirender ulang");
    } catch (err) {
      notify("error", "Render gagal", errorMessage(err));
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    if (!window.confirm(`Hapus campaign ${campaign.campaignDate} beserta 4 slide-nya?`)) return;
    setBusy("delete");
    try {
      await apiFetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      notify("info", "Campaign dihapus");
      onDeleted(campaign.id);
    } catch (err) {
      notify("error", "Gagal menghapus", errorMessage(err));
      setBusy(null);
    }
  }

  function onScroll() {
    const el = scrollerRef.current;
    if (!el || campaign.slides.length === 0) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    if (maxScroll <= 0) return setActive(0);
    setActive(Math.round((el.scrollLeft / maxScroll) * (campaign.slides.length - 1)));
  }

  function scrollToCard(index: number) {
    const el = scrollerRef.current;
    const child = el?.children[index] as HTMLElement | undefined;
    if (el && child) el.scrollTo({ left: child.offsetLeft - el.offsetLeft - 20, behavior: "smooth" });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-5 border-b border-white/5 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="cyan">
              <Layers /> Story Studio
            </Badge>
            <Badge tone={campaign.generationSource === "gemini" ? "emerald" : "amber"}>
              {campaign.generationSource === "gemini" ? `Gemini · ${campaign.generationModel ?? "auto"}` : "Offline Alchemist"}
            </Badge>
            <span className="text-xs text-slate-400">{formatDateLong(campaign.campaignDate)}</span>
          </div>
          <h2 className="mt-2 font-serif text-2xl font-medium italic leading-tight text-white sm:text-3xl">{campaign.themeTopic}</h2>
          {campaign.coreInsight ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-400">{campaign.coreInsight}</p> : null}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {counts.DRAFT ? <Badge>{counts.DRAFT} draft</Badge> : null}
            {counts.SCHEDULED ? <Badge tone="amber">{counts.SCHEDULED} terjadwal</Badge> : null}
            {counts.POSTED ? <Badge tone="emerald">{counts.POSTED} terkirim</Badge> : null}
            {counts.FAILED ? <Badge tone="rose">{counts.FAILED} gagal</Badge> : null}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2.5 lg:items-end">
          <div className="flex items-center gap-1 self-start rounded-xl border border-white/10 bg-black/30 p-1 lg:self-end">
            <span className="px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Channel</span>
            <ChannelPill
              active={channels.whatsapp}
              onClick={() => setChannels((c) => ({ ...c, whatsapp: !c.whatsapp }))}
              icon={<MessageCircle />}
              label="WhatsApp"
              title="WhatsApp Status via daemon Baileys lokal"
            />
            <ChannelPill
              active={channels.instagram && flags.instagramConfigured}
              disabled={!flags.instagramConfigured}
              onClick={() => setChannels((c) => ({ ...c, instagram: !c.instagram }))}
              icon={<Camera />}
              label="Instagram"
              title={flags.instagramConfigured ? "Instagram Stories via Meta Graph API" : "Isi IG_USER_ID & IG_ACCESS_TOKEN untuk mengaktifkan"}
            />
          </div>
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <a href={`/api/campaigns/${campaign.id}/download`} className={buttonVariants({ variant: "secondary" })}>
              <Download /> Download All Slides
            </a>
            <Button variant="outline" loading={busy === "schedule"} onClick={() => void schedule("schedule")}>
              {busy === "schedule" ? null : <CalendarClock />} Schedule
            </Button>
            <Button variant="primary" loading={busy === "now"} onClick={() => void schedule("now")}>
              {busy === "now" ? null : <Send />} Post Now
            </Button>
          </div>
          <div className="flex flex-wrap gap-1 lg:justify-end">
            {counts.SCHEDULED + counts.FAILED > 0 ? (
              <Button variant="ghost" size="sm" loading={busy === "cancel"} onClick={() => void schedule("cancel")}>
                <Undo2 /> Batalkan jadwal
              </Button>
            ) : null}
            <Button variant="ghost" size="sm" loading={busy === "render"} onClick={() => void rerender()}>
              {busy === "render" ? null : <RefreshCw />} Re-render
            </Button>
            <Button variant="ghost" size="sm" loading={busy === "delete"} onClick={() => void remove()} className="hover:text-rose-200">
              {busy === "delete" ? null : <Trash2 />} Hapus
            </Button>
          </div>
        </div>
      </div>

      <div className="relative">
        <div ref={scrollerRef} onScroll={onScroll} className="thin-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth p-5">
          {campaign.slides.map((slide) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              timezone={flags.timezone}
              instagramConfigured={flags.instagramConfigured}
              onSlideChange={onSlideChange}
              onCampaignChange={onCampaignChange}
              notify={notify}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 pb-5">
          <Button size="icon" variant="ghost" aria-label="Sebelumnya" onClick={() => scrollToCard(Math.max(0, active - 1))}>
            <ChevronLeft />
          </Button>
          {campaign.slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => scrollToCard(i)}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition",
                i === active ? "bg-cyan-400/15 text-cyan-200" : "text-slate-500 hover:text-slate-300",
              )}
            >
              {ACTS[slide.act].slotEmoji} {slide.targetTime}
            </button>
          ))}
          <Button size="icon" variant="ghost" aria-label="Berikutnya" onClick={() => scrollToCard(Math.min(campaign.slides.length - 1, active + 1))}>
            <ChevronRight />
          </Button>
        </div>
      </div>
    </Card>
  );
}
