"use client";

import {
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Flame,
  HelpCircle,
  Loader2,
  LogOut,
  Send,
  Sparkles,
  Stethoscope,
  Terminal,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type PillarKey = "PIKIRAN" | "TUBUH" | "TEKNOLOGI";
export type ContentMode = "daily" | "case" | "promo";

export interface LastSendHistory {
  topic: string;
  pillar: PillarKey;
  keyword: string;
  timeStr: string;
  timestamp: string;
  pdfUrl?: string;
}

interface PillarConfig {
  key: PillarKey;
  emoji: string;
  label: string;
  title: string;
  keyword: string;
  description: string;
  focusHint: string;
  accentHex: string;
  borderClass: string;
  bgGlowClass: string;
  textAccentClass: string;
  badgeClass: string;
  activeTabClass: string;
}

const PILLAR_CONFIGS: Record<PillarKey, PillarConfig> = {
  PIKIRAN: {
    key: "PIKIRAN",
    emoji: "🧠",
    label: "PIKIRAN",
    title: "Bawah Sadar & Belief System",
    keyword: "RESET",
    description: "Mengurai error mismatch afirmasi positif, subvocal rumination & alarm bawah sadar.",
    focusHint: "Paradoks kognitif & reset rasa aman sistem saraf",
    accentHex: "#FDE047",
    borderClass: "border-amber-400/40 hover:border-amber-400/60",
    bgGlowClass: "from-amber-500/10 via-amber-500/5 to-transparent",
    textAccentClass: "text-amber-300",
    badgeClass: "bg-amber-400/10 text-amber-300 border-amber-400/30",
    activeTabClass: "bg-amber-500/20 text-amber-200 border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.15)]",
  },
  TUBUH: {
    key: "TUBUH",
    emoji: "🌿",
    label: "TUBUH",
    title: "Gut-Brain & Sistem Saraf Somatik",
    keyword: "LAMBUNG",
    description: "Anomali klep asam lambung, relaxation-induced anxiety & pelepasan kuncian somatik.",
    focusHint: "Koneksi vagus nerve, asam lambung & somatik rahang",
    accentHex: "#74A892",
    borderClass: "border-[#74A892]/50 hover:border-[#74A892]/70",
    bgGlowClass: "from-[#74A892]/15 via-[#74A892]/5 to-transparent",
    textAccentClass: "text-[#88C7AD]",
    badgeClass: "bg-[#74A892]/15 text-[#88C7AD] border-[#74A892]/40",
    activeTabClass: "bg-[#74A892]/25 text-[#A5DFC8] border-[#74A892]/60 shadow-[0_0_15px_rgba(116,168,146,0.2)]",
  },
  TEKNOLOGI: {
    key: "TEKNOLOGI",
    emoji: "⚡",
    label: "TEKNOLOGI",
    title: "Arsitektur Otak & Overthinking",
    keyword: "FOKUS",
    description: "Analogi pre-trained weights bawah sadar, fine-tuning saraf & background process otak.",
    focusHint: "Overthinking, mental tab overload & neuro-komputasi",
    accentHex: "#93C5FD",
    borderClass: "border-sky-400/40 hover:border-sky-400/60",
    bgGlowClass: "from-sky-500/10 via-sky-500/5 to-transparent",
    textAccentClass: "text-sky-300",
    badgeClass: "bg-sky-400/10 text-sky-300 border-sky-400/30",
    activeTabClass: "bg-sky-500/20 text-sky-200 border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.15)]",
  },
};

/**
 * Menghitung default pilar berdasarkan kalender WITA
 */
function getDefaultPillar(): PillarKey {
  const day = new Date().getDay();
  if (day === 0 || day === 3) return "PIKIRAN";
  if (day === 1 || day === 4) return "TUBUH";
  return "TEKNOLOGI";
}

interface RemoteStudioProps {
  authEnabled?: boolean;
}

export function RemoteStudio({ authEnabled }: RemoteStudioProps) {
  // Card 1: State Pilar
  const [selectedPillar, setSelectedPillar] = useState<PillarKey>(getDefaultPillar);

  // Card 2: State Mode & Input
  const [mode, setMode] = useState<ContentMode>("daily");
  const [patientComplaint, setPatientComplaint] = useState("");
  const [promoSlotInfo, setPromoSlotInfo] = useState("");

  // Card 3: Action & Loading State
  const [loading, setLoading] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<LastSendHistory | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Card 4: Quick Action & PDF Link State
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<LastSendHistory | null>(null);

  // Load history from localStorage upon mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("remote_studio_v2_last_send");
      if (saved) {
        const parsed = JSON.parse(saved) as LastSendHistory;
        setHistory(parsed);
      }
    } catch {
      /* ignore storage err */
    }
  }, []);

  const currentPillarConfig = useMemo(() => PILLAR_CONFIGS[selectedPillar], [selectedPillar]);

  // Compute active PDF URL
  const activePdfUrl = useMemo(() => {
    if (history?.pdfUrl && history.pillar === selectedPillar) {
      return history.pdfUrl;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}/api/protocol/pdf?keyword=${currentPillarConfig.keyword}&pillar=${selectedPillar}`;
  }, [history, selectedPillar, currentPillarConfig]);

  // Copy PDF Link handler
  const copyPdfLink = useCallback(async () => {
    try {
      if (!activePdfUrl) return;
      await navigator.clipboard.writeText(activePdfUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback prompt jika clipboard API diblokir
      window.prompt("Salin link panduan PDF berikut:", activePdfUrl);
    }
  }, [activePdfUrl]);

  // Form Submission ke POST /api/v2/generate-and-send
  async function handleGenerateAndSend() {
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);

    // Persiapkan payload sesuai mode
    let targetTopic: string | undefined = undefined;
    if (mode === "case") {
      targetTopic = patientComplaint.trim() || undefined;
    } else if (mode === "promo") {
      const slotText = promoSlotInfo.trim();
      targetTopic = slotText ? `Flash Promo Konsultasi Makassar: ${slotText}` : undefined;
    }

    try {
      const res = await fetch("/api/v2/generate-and-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pillar: selectedPillar,
          topic: targetTopic,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses siaran ke Telegram.");
      }

      const now = new Date();
      const timeStr = `${now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WITA`;

      const sendRecord: LastSendHistory = {
        topic: data.topic || targetTopic || `Story 5 Babak ${selectedPillar}`,
        pillar: (data.pillar as PillarKey) || selectedPillar,
        keyword: data.keyword || currentPillarConfig.keyword,
        timeStr,
        timestamp: data.timestamp || now.toISOString(),
        pdfUrl: data.telegram?.pdfUrl,
      };

      setLastSuccess(sendRecord);
      setHistory(sendRecord);

      try {
        localStorage.setItem("remote_studio_v2_last_send", JSON.stringify(sendRecord));
      } catch {
        /* ignore */
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  }

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-100 px-3 py-4 sm:px-6 sm:py-8 font-sans selection:bg-[#74A892]/30">
      <div className="mx-auto max-w-xl space-y-4 sm:space-y-5">
        
        {/* ── TOP BAR ── */}
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-white/5 bg-[#1A1E24] px-4 py-3.5 shadow-md">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-xl sm:text-2xl select-none">🌿</span>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white uppercase truncate">
                DOKTER PIKIRAN MAKASSAR
              </h1>
              <p className="text-[11px] font-medium text-slate-400 truncate">
                Remote Studio V2 · Sistem Saraf & Bawah Sadar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="hidden xs:inline">Telegram Engine V2 Ready</span>
              <span className="xs:hidden">V2 Ready</span>
            </div>

            {authEnabled ? (
              <button
                type="button"
                onClick={handleLogout}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-rose-300 transition"
                title="Keluar dari Studio"
              >
                <LogOut className="size-4" />
              </button>
            ) : null}
          </div>
        </header>

        {/* ── CARD 1: PILAR KONTEN HARI INI ── */}
        <section
          className={cn(
            "relative overflow-hidden rounded-2xl border bg-[#1A1E24] p-4 sm:p-5 transition-all duration-300 shadow-md",
            currentPillarConfig.borderClass,
          )}
        >
          <div
            className={cn(
              "pointer-events-none absolute inset-0 bg-gradient-to-b opacity-60",
              currentPillarConfig.bgGlowClass,
            )}
          />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Card 1 · PILAR KONTEN HARI INI
              </p>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider",
                  currentPillarConfig.badgeClass,
                )}
              >
                CTA: {currentPillarConfig.keyword}
              </span>
            </div>

            {/* Segmented Control / Tabs */}
            <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/5 bg-[#0F1115]/90 p-1">
              {(Object.keys(PILLAR_CONFIGS) as PillarKey[]).map((key) => {
                const conf = PILLAR_CONFIGS[key];
                const isActive = selectedPillar === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedPillar(key)}
                    className={cn(
                      "cursor-pointer rounded-lg py-2 px-1 text-center font-bold text-xs transition-all border",
                      isActive
                        ? conf.activeTabClass
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5",
                    )}
                  >
                    <span className="mr-1">{conf.emoji}</span>
                    <span>{conf.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Pillar Card Detail */}
            <div className="rounded-xl border border-white/5 bg-black/30 p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className={cn("font-bold text-sm", currentPillarConfig.textAccentClass)}>
                  {currentPillarConfig.title}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">1 Hari 1 Pilar</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {currentPillarConfig.description}
              </p>
            </div>
          </div>
        </section>

        {/* ── CARD 2: MODE KONTEN & INPUT ── */}
        <section className="rounded-2xl border border-white/5 bg-[#1A1E24] p-4 sm:p-5 shadow-md space-y-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Card 2 · MODE KONTEN & INPUT
          </p>

          {/* Mode Selector Pill Buttons */}
          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => setMode("daily")}
              className={cn(
                "cursor-pointer flex items-start gap-3 rounded-xl border p-3 text-left transition",
                mode === "daily"
                  ? "border-[#74A892]/60 bg-[#74A892]/10 text-white shadow-sm"
                  : "border-white/5 bg-[#0F1115]/60 text-slate-400 hover:text-slate-200 hover:border-white/10",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
                  mode === "daily" ? "border-[#74A892] bg-[#74A892]" : "border-slate-500",
                )}
              >
                {mode === "daily" ? <span className="h-1.5 w-1.5 rounded-full bg-[#0F1115]" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Story Harian Otomatis</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-[#74A892]/20 text-[#88C7AD] border border-[#74A892]/30">
                    Rekomendasi AI
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  AI memilih topik paradoks terbaik secara otonom untuk pilar {selectedPillar}.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("case")}
              className={cn(
                "cursor-pointer flex items-start gap-3 rounded-xl border p-3 text-left transition",
                mode === "case"
                  ? "border-[#74A892]/60 bg-[#74A892]/10 text-white shadow-sm"
                  : "border-white/5 bg-[#0F1115]/60 text-slate-400 hover:text-slate-200 hover:border-white/10",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
                  mode === "case" ? "border-[#74A892] bg-[#74A892]" : "border-slate-500",
                )}
              >
                {mode === "case" ? <span className="h-1.5 w-1.5 rounded-full bg-[#0F1115]" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-white">
                  Kasus Meja Terapi / Topik Khusus
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Input keluhan spesifik pasien untuk dibedah dengan wawasan klinis Makassar.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("promo")}
              className={cn(
                "cursor-pointer flex items-start gap-3 rounded-xl border p-3 text-left transition",
                mode === "promo"
                  ? "border-amber-400/60 bg-amber-400/10 text-white shadow-sm"
                  : "border-white/5 bg-[#0F1115]/60 text-slate-400 hover:text-slate-200 hover:border-white/10",
              )}
            >
              <div
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition",
                  mode === "promo" ? "border-amber-400 bg-amber-400" : "border-slate-500",
                )}
              >
                {mode === "promo" ? <span className="h-1.5 w-1.5 rounded-full bg-[#0F1115]" /> : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                  <span>Flash Promo Konsultasi</span>
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    Klinik Makassar
                  </span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Siarkan slot kosong meja terapi dengan psikologi scarcity & CTA WhatsApp.
                </p>
              </div>
            </button>
          </div>

          {/* Dynamic Input depending on Mode */}
          {mode === "case" ? (
            <div className="pt-1 space-y-1.5">
              <label htmlFor="patient-complaint" className="block text-[11px] font-semibold text-slate-300">
                Keluhan Pasien / Catatan Kasus Klinis:
              </label>
              <textarea
                id="patient-complaint"
                rows={3}
                value={patientComplaint}
                onChange={(e) => setPatientComplaint(e.target.value)}
                placeholder='Misal: "Dada sesak tiap buka laptop", "Asam lambung kambuh saat libur", "Leher kaku jam 11 malam"...'
                className="w-full rounded-xl border border-white/10 bg-[#0F1115] p-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-[#74A892] focus:outline-none transition resize-none"
              />
              <p className="text-[10px] text-slate-500 text-right">
                AI akan meramu keluhan ini ke 5 babak story & teknik somatik mikro 60 detik.
              </p>
            </div>
          ) : null}

          {mode === "promo" ? (
            <div className="pt-1 space-y-1.5">
              <label htmlFor="promo-slot" className="block text-[11px] font-semibold text-amber-200">
                Slot Kosong & Jadwal Praktek Makassar:
              </label>
              <input
                id="promo-slot"
                type="text"
                value={promoSlotInfo}
                onChange={(e) => setPromoSlotInfo(e.target.value)}
                placeholder='Misal: "Sisa 2 slot totok saraf & konsultasi Sabtu ini (15:00 - 20:00 WITA) di Makassar"'
                className="w-full h-11 rounded-xl border border-amber-400/30 bg-[#0F1115] px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none transition"
              />
              <p className="text-[10px] text-amber-300/80 text-right">
                Otomatis mengunci CTA direct WhatsApp dan nomor antrean meja terapi.
              </p>
            </div>
          ) : null}
        </section>

        {/* ── CARD 3: ACTION & PENGIRIMAN ── */}
        <section className="rounded-2xl border border-white/5 bg-[#1A1E24] p-4 sm:p-5 shadow-md space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Card 3 · ACTION & PENGIRIMAN
          </p>

          <button
            type="button"
            onClick={handleGenerateAndSend}
            disabled={loading}
            className={cn(
              "w-full h-13 sm:h-14 cursor-pointer rounded-xl font-extrabold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all shadow-lg select-none",
              loading
                ? "bg-slate-800 text-slate-400 border border-white/10 cursor-not-allowed"
                : "bg-[#74A892] hover:bg-[#62947E] active:scale-[0.99] text-[#0F1115] shadow-[#74A892]/20 hover:shadow-[#74A892]/30",
            )}
          >
            {loading ? (
              <>
                <Loader2 className="size-5 animate-spin text-[#74A892]" />
                <span className="text-white normal-case font-semibold">
                  Menyusun Naskah & Merender Visual 9:16...
                </span>
              </>
            ) : (
              <>
                <span>🚀 GENERATE & KIRIM KE TELEGRAM (5 SLIDE 9:16)</span>
              </>
            )}
          </button>

          {/* Success Notification */}
          {lastSuccess ? (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-emerald-200 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="size-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1 text-xs">
                  <p className="font-bold text-emerald-300 text-sm">
                    ✅ 5 Kartu Story & PDF berhasil dikirim ke Telegram Anda!
                  </p>
                  <p className="mt-1 text-emerald-100/90 leading-relaxed font-medium">
                    Topik: <span className="text-white font-bold">"{lastSuccess.topic}"</span>
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-emerald-300/80">
                    <span>Pilar: <strong>{lastSuccess.pillar}</strong></span>
                    <span>•</span>
                    <span>Keyword CTA: <strong>{lastSuccess.keyword}</strong></span>
                    <span>•</span>
                    <span>{lastSuccess.timeStr}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Error Notification */}
          {errorMessage ? (
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-3.5 text-rose-200 text-xs flex items-start gap-2.5">
              <span className="text-rose-400 text-sm shrink-0">⚠️</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-rose-300">Gagal Mengirim ke Telegram</p>
                <p className="mt-0.5 text-rose-200/90 leading-relaxed">{errorMessage}</p>
                <p className="mt-1 text-[10px] text-rose-300/70">
                  Periksa koneksi bot Telegram atau coba tekan tombol kirim kembali.
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {/* ── CARD 4: QUICK ACTION & LINK PDF ── */}
        <section className="rounded-2xl border border-white/5 bg-[#1A1E24] p-4 sm:p-5 shadow-md space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Card 4 · QUICK ACTION & LINK PDF
          </p>

          <button
            type="button"
            onClick={copyPdfLink}
            className={cn(
              "w-full h-11 sm:h-12 cursor-pointer rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition active:scale-[0.99]",
              copied
                ? "border-emerald-400/60 bg-emerald-500/20 text-emerald-300 shadow-sm"
                : "border-[#74A892]/40 bg-[#74A892]/10 hover:bg-[#74A892]/20 text-[#88C7AD]",
            )}
          >
            {copied ? (
              <>
                <Check className="size-4 text-emerald-300" />
                <span>Link PDF Berhasil Disalin ke Clipboard! ✅</span>
              </>
            ) : (
              <>
                <Copy className="size-4" />
                <span>📋 Salin Link Panduan PDF Aktif</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-slate-400 text-center">
            Salin link panduan PDF pilar {selectedPillar} ({currentPillarConfig.keyword}) dalam 1 ketukan untuk dibagikan di WhatsApp.
          </p>

          {/* Riwayat Singkat */}
          <div className="pt-3 border-t border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-400">Riwayat Siaran Terakhir</span>
              {history ? (
                <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {history.timeStr}
                </span>
              ) : null}
            </div>

            {history ? (
              <div className="rounded-xl border border-white/5 bg-[#0F1115] p-3 text-xs space-y-1">
                <p className="font-bold text-white truncate text-xs sm:text-sm">
                  {history.topic}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                  <span>Pilar: <strong className="text-slate-200">{history.pillar}</strong></span>
                  <span>•</span>
                  <span>Keyword: <strong className="text-white">{history.keyword}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">Terkirim ke Telegram</span>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-[11px] italic py-1">
                Belum ada siaran yang dikirim pada sesi ini. Tekan tombol generate di atas untuk mulai.
              </p>
            )}
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="text-center text-[11px] text-slate-500 pt-2 pb-4">
          Dokter Pikiran Makassar · Remote Studio V2 · Telegram Engine V2.3
        </footer>

      </div>
    </div>
  );
}
