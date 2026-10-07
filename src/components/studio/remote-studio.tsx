"use client";

import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  HelpCircle,
  Loader2,
  LogOut,
  MapPin,
  Send,
  Sparkles,
  Tag,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type PillarKey = "PIKIRAN" | "TUBUH" | "TEKNOLOGI";
export type ContentMode = "daily" | "case" | "promo";
export type StudioMode = "serial" | "single";
export type SinglePresetKey = "TOTOK_SARAF" | "HIPNOTERAPI" | "QUOTES";
export type PromoTemplateId =
  | "bright-botanical"
  | "warm-sand"
  | "clean-minimalist"
  | "bright_botanical"
  | "warm_editorial"
  | "clean_minimalist";
export type QuotesTemplateId = "cinematic" | "linen" | "botanical";
export type FlyerTemplateId = PromoTemplateId | QuotesTemplateId;

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
  // ── Mode Switcher Utama: Serial 5-Story vs 1-Story Flyer ──
  const [studioMode, setStudioMode] = useState<StudioMode>("serial");

  // ── State Serial 5-Story ──
  const [selectedPillar, setSelectedPillar] = useState<PillarKey>(getDefaultPillar);
  const [mode, setMode] = useState<ContentMode>("daily");
  const [patientComplaint, setPatientComplaint] = useState("");
  const [promoSlotInfo, setPromoSlotInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastSuccess, setLastSuccess] = useState<LastSendHistory | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<LastSendHistory | null>(null);

  // ── State Single Flyer Studio (1-Story 9:16) ──
  const [singlePreset, setSinglePreset] = useState<SinglePresetKey>("TOTOK_SARAF");
  const [promoTemplate, setPromoTemplate] = useState<PromoTemplateId>("bright-botanical");
  const [quotesTemplate, setQuotesTemplate] = useState<QuotesTemplateId>("cinematic");
  const [flyerTitle, setFlyerTitle] = useState("Totok Saraf Makassar");
  const [flyerPrice, setFlyerPrice] = useState("Rp 150.000");
  const [flyerDuration, setFlyerDuration] = useState("± 1 Jam");
  const [flyerAddress, setFlyerAddress] = useState("Jl. Batua Raya 10 B No.9 Makassar");
  const [flyerSchedule, setFlyerSchedule] = useState("Senin – Sabtu 16.00 – 21.00 WITA");
  const [flyerNotes, setFlyerNotes] = useState("Maksimal 5 pasien per hari");
  const [flyerCustomPrompt, setFlyerCustomPrompt] = useState("");
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleSuccess, setSingleSuccess] = useState<string | null>(null);
  const [singleError, setSingleError] = useState<string | null>(null);

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
      window.prompt("Salin link panduan PDF berikut:", activePdfUrl);
    }
  }, [activePdfUrl]);

  // Switch Preset Handler untuk Single Flyer
  const handleSelectPreset = (presetKey: SinglePresetKey) => {
    setSinglePreset(presetKey);
    setSingleSuccess(null);
    setSingleError(null);

    if (presetKey === "TOTOK_SARAF") {
      setFlyerTitle("Totok Saraf Makassar");
      setFlyerPrice("Rp 150.000");
      setFlyerDuration("± 1 Jam");
      setFlyerAddress("Jl. Batua Raya 10 B No.9 Makassar");
      setFlyerSchedule("Senin – Sabtu 16.00 – 21.00 WITA");
      setFlyerNotes("Maksimal 5 pasien per hari");
    } else if (presetKey === "HIPNOTERAPI") {
      setFlyerTitle("Hipnoterapi Klinis Makassar");
      setFlyerPrice("Rp 350.000");
      setFlyerDuration("± 2 Jam");
      setFlyerAddress("Jl. Batua Raya 10 B No.9 Makassar");
      setFlyerSchedule("Senin – Sabtu 16.00 – 21.00 WITA");
      setFlyerNotes("Khusus 3 sesi privat per hari • Reservasi H-1");
    } else if (presetKey === "QUOTES") {
      setFlyerTitle(
        "Tubuhmu tidak sedang melawanmu, ia hanya sedang kelelahan melindungi dirimu. Beri ia ruang dan rasa aman untuk melepaskan beban."
      );
      setFlyerPrice("");
      setFlyerDuration("");
      setFlyerAddress("Makassar, WITA (UTC+8)");
      setFlyerSchedule("");
      setFlyerNotes("Catatan Meja Terapi Makassar • Sistem Saraf & Bawah Sadar");
    }
  };

  // Form Submission ke POST /api/v2/generate-and-send (Serial 5-Story)
  async function handleGenerateAndSend() {
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);

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

  // Form Submission ke POST /api/v2/generate-single-flyer (1-Story Flyer)
  async function handleGenerateSingleFlyer() {
    if (singleLoading) return;
    setSingleLoading(true);
    setSingleSuccess(null);
    setSingleError(null);

    try {
      const activeTemplate = singlePreset === "QUOTES" ? quotesTemplate : promoTemplate;
      const payload = {
        preset: singlePreset === "QUOTES" ? "QUOTES" : "PROMO_KLINIK",
        templateId: activeTemplate,
        customPrompt: flyerCustomPrompt.trim() || undefined,
        title: flyerTitle.trim(),
        price: flyerPrice.trim() || undefined,
        duration: flyerDuration.trim() || undefined,
        address: flyerAddress.trim() || undefined,
        schedule: flyerSchedule.trim() || undefined,
        notes: flyerNotes.trim() || undefined,
      };

      const res = await fetch("/api/v2/generate-single-flyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses pengiriman flyer ke Telegram.");
      }

      setSingleSuccess(
        singlePreset === "QUOTES"
          ? "✅ 1 Kartu Quote Editorial (2K Ultra HD) berhasil dikirim ke Telegram!"
          : "✅ 1 Flyer Promosi Ultra HD (2K) berhasil dikirim ke Telegram!"
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSingleError(msg);
    } finally {
      setSingleLoading(false);
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
              <span className="hidden xs:inline">Telegram Engine Ready</span>
              <span className="xs:hidden">Ready</span>
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

        {/* ── SEGMENTED SWITCHER MODE ── */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-[#161B22] p-1.5 shadow-md">
          <button
            type="button"
            onClick={() => setStudioMode("serial")}
            className={cn(
              "cursor-pointer flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold transition-all",
              studioMode === "serial"
                ? "bg-[#74A892]/25 text-[#A5DFC8] border border-[#74A892]/50 shadow-[0_0_15px_rgba(116,168,146,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            )}
          >
            <span className="text-base">📚</span>
            <span className="truncate">Serial 5-Story (Harian)</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioMode("single")}
            className={cn(
              "cursor-pointer flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-bold transition-all",
              studioMode === "single"
                ? "bg-amber-500/25 text-amber-200 border border-amber-400/50 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent"
            )}
          >
            <span className="text-base">🎯</span>
            <span className="truncate">1-Story Flyer (Promo / Quote)</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            TAB 1: SERIAL 5-STORY HARIAN
            ══════════════════════════════════════════════════════════════════════ */}
        {studioMode === "serial" ? (
          <>
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
                    placeholder="Contoh: Pasien pebisnis 38 th, leher kaku & gerd kambuh saat deadline tender, sudah minum antasida tapi tenggorokan tetap mengganjal..."
                    className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#74A892] focus:outline-none focus:ring-1 focus:ring-[#74A892]"
                  />
                  <p className="text-[10px] text-slate-400">
                    💡 AI akan meramu 5 babak Story yang membongkar mekanisme somatik di balik keluhan ini.
                  </p>
                </div>
              ) : null}

              {mode === "promo" ? (
                <div className="pt-1 space-y-1.5">
                  <label htmlFor="promo-slot" className="block text-[11px] font-semibold text-amber-300">
                    Informasi Slot & Jadwal Meja Terapi Makassar:
                  </label>
                  <input
                    id="promo-slot"
                    type="text"
                    value={promoSlotInfo}
                    onChange={(e) => setPromoSlotInfo(e.target.value)}
                    placeholder="Contoh: Tersedia 2 slot sesi tatap muka untuk besok sore (16.30 WITA)..."
                    className="w-full rounded-xl border border-amber-400/30 bg-[#0F1115] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                  <p className="text-[10px] text-slate-400">
                    Slot akan disisipkan di Story 5 (CTA) dengan scarcity alami dan nomor WA klinik.
                  </p>
                </div>
              ) : null}
            </section>

            {/* ── CARD 3: ACTION & STATUS TERKINI ── */}
            <section className="rounded-2xl border border-white/5 bg-[#1A1E24] p-4 sm:p-5 shadow-md space-y-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Card 3 · ACTION & STATUS TERKINI
              </p>

              <button
                type="button"
                onClick={handleGenerateAndSend}
                disabled={loading}
                className={cn(
                  "w-full h-13 sm:h-14 cursor-pointer rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.98]",
                  loading
                    ? "bg-slate-700/60 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 via-[#74A892] to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-[#0A1411] shadow-emerald-500/20",
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-[#0A1411]" />
                    <span>Menerbitkan 5 Kartu Naskah ke Telegram...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-5 text-[#0A1411]" />
                    <span>SIARKAN 5 STORY HARI INI KE TELEGRAM</span>
                  </>
                )}
              </button>

              {/* Status Message */}
              {errorMessage ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Gagal Menerbitkan:</strong> {errorMessage}
                  </div>
                </div>
              ) : null}

              {lastSuccess ? (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-200 space-y-1.5 shadow-sm">
                  <div className="flex items-center justify-between font-bold text-emerald-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="size-4" />
                      <span>Berhasil Dikirim ke Telegram!</span>
                    </span>
                    <span className="font-mono text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded">
                      {lastSuccess.timeStr}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    Topik: &quot;{lastSuccess.topic}&quot; • Pilar {lastSuccess.pillar}
                  </p>
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
          </>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════
              TAB 2: 1-STORY FLYER STUDIO (PROMO / QUOTE)
              ══════════════════════════════════════════════════════════════════════ */
          <>
            {/* ── CARD 1 FLYER: PILIHAN PRESET ── */}
            <section className="relative overflow-hidden rounded-2xl border border-amber-400/40 bg-[#1A1E24] p-4 sm:p-5 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                  🎯 Pilihan Preset Flyer 9:16
                </p>
                <span className="rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300">
                  2K ULTRA HD (2160×3840 PX)
                </span>
              </div>

              {/* 3 Preset Options */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPreset("TOTOK_SARAF")}
                  className={cn(
                    "cursor-pointer rounded-xl p-2.5 text-center transition-all border flex flex-col items-center gap-1",
                    singlePreset === "TOTOK_SARAF"
                      ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                      : "border-white/5 bg-[#0F1115] text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="text-xl">🌿</span>
                  <span className="text-xs font-bold leading-tight">Totok Saraf</span>
                  <span className="text-[10px] text-emerald-400/80">Makassar</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset("HIPNOTERAPI")}
                  className={cn(
                    "cursor-pointer rounded-xl p-2.5 text-center transition-all border flex flex-col items-center gap-1",
                    singlePreset === "HIPNOTERAPI"
                      ? "border-sky-400/80 bg-sky-500/20 text-sky-200 shadow-[0_0_15px_rgba(56,189,248,0.2)]"
                      : "border-white/5 bg-[#0F1115] text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="text-xl">🧠</span>
                  <span className="text-xs font-bold leading-tight">Hipnoterapi</span>
                  <span className="text-[10px] text-sky-400/80">Klinis</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectPreset("QUOTES")}
                  className={cn(
                    "cursor-pointer rounded-xl p-2.5 text-center transition-all border flex flex-col items-center gap-1",
                    singlePreset === "QUOTES"
                      ? "border-amber-400/80 bg-amber-500/20 text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                      : "border-white/5 bg-[#0F1115] text-slate-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <span className="text-xl">✨</span>
                  <span className="text-xs font-bold leading-tight">Quotes</span>
                  <span className="text-[10px] text-amber-400/80">Harian</span>
                </button>
              </div>

              {/* ── PILIHAN TEMPLATE DESAIN VISUAL ── */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <span>🎨</span>
                    <span>Pilihan Gaya Template (Ultra HD 2K)</span>
                  </p>
                  <span className="text-[10px] text-amber-300/80 font-mono">2160×3840 px</span>
                </div>

                {singlePreset !== "QUOTES" ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPromoTemplate("bright-botanical")}
                      className={cn(
                        "cursor-pointer rounded-xl p-2.5 text-left transition-all border flex flex-col gap-0.5",
                        promoTemplate === "bright-botanical" || promoTemplate === "bright_botanical"
                          ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                          : "border-white/5 bg-[#0F1115] text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="text-xs font-bold flex items-center gap-1">🌿 Bright Botanical</span>
                      <span className="text-[10px] text-emerald-400/80">Standar Klinik Spa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPromoTemplate("warm-sand")}
                      className={cn(
                        "cursor-pointer rounded-xl p-2.5 text-left transition-all border flex flex-col gap-0.5",
                        promoTemplate === "warm-sand" || promoTemplate === "warm_editorial"
                          ? "border-amber-400/80 bg-amber-500/20 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                          : "border-white/5 bg-[#0F1115] text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="text-xs font-bold flex items-center gap-1">🏛️ Warm Sand</span>
                      <span className="text-[10px] text-amber-400/80">Editorial Linen Zen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPromoTemplate("clean-minimalist")}
                      className={cn(
                        "cursor-pointer rounded-xl p-2.5 text-left transition-all border flex flex-col gap-0.5",
                        promoTemplate === "clean-minimalist" || promoTemplate === "clean_minimalist"
                          ? "border-sky-400/80 bg-sky-500/20 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.25)]"
                          : "border-white/5 bg-[#0F1115] text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="text-xs font-bold flex items-center gap-1">✨ Clean Minimalist</span>
                      <span className="text-[10px] text-sky-400/80">Modern Swiss Style</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuotesTemplate("cinematic")}
                      className={cn(
                        "cursor-pointer rounded-xl p-2.5 text-left transition-all border flex flex-col gap-0.5",
                        quotesTemplate === "cinematic"
                          ? "border-amber-400/80 bg-amber-500/20 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                          : "border-white/5 bg-[#0F1115] text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="text-xs font-bold flex items-center gap-1">🌑 Cinematic</span>
                      <span className="text-[10px] text-amber-400/80">Deep Atmosphere</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuotesTemplate("linen")}
                      className={cn(
                        "cursor-pointer rounded-xl p-2.5 text-left transition-all border flex flex-col gap-0.5",
                        quotesTemplate === "linen"
                          ? "border-amber-400/80 bg-amber-500/20 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                          : "border-white/5 bg-[#0F1115] text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="text-xs font-bold flex items-center gap-1">📜 Warm Linen</span>
                      <span className="text-[10px] text-amber-400/80">Zen Paper Texture</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setQuotesTemplate("botanical")}
                      className={cn(
                        "cursor-pointer rounded-xl p-2.5 text-left transition-all border flex flex-col gap-0.5",
                        quotesTemplate === "botanical"
                          ? "border-emerald-400/80 bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.25)]"
                          : "border-white/5 bg-[#0F1115] text-slate-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <span className="text-xs font-bold flex items-center gap-1">🌿 Botanical</span>
                      <span className="text-[10px] text-emerald-400/80">Organic Mindful</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-white/5 bg-black/30 p-2.5 text-[11px] text-slate-300">
                {singlePreset === "TOTOK_SARAF" ? (
                  <p>
                    🌿 <strong>Flyer Promosi Totok Saraf:</strong> Foto rileksasi pasien & terapis, 5 ikon bulat manfaat somatik, badge harga Rp 150.000, alamat Jl. Batua Raya 10 B No.9 Makassar & sticky note kuning reservasi.
                  </p>
                ) : singlePreset === "HIPNOTERAPI" ? (
                  <p>
                    🧠 <strong>Flyer Promosi Hipnoterapi:</strong> Restrukturisasi bawah sadar & psikosomatis, badge sesi privat mendalam Rp 350.000 (± 2 Jam), alamat Batua Raya Makassar.
                  </p>
                ) : (
                  <p>
                    ✨ <strong>Kartu Quote / Refleksi Tunggal:</strong> Tipografi editorial elegan dengan serif Playfair Display, foto atmosferik zen, kutipan bijak meja terapi Makassar 1 slide.
                  </p>
                )}
              </div>
            </section>

            {/* ── CARD 2 FLYER: FORM INPUT RINGKAS ── */}
            <section className="rounded-2xl border border-white/5 bg-[#1A1E24] p-4 sm:p-5 shadow-md space-y-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  📝 Form Kustomisasi Flyer
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">Preset Terpilih Aktif</span>
              </div>

              {/* Input Judul / Headline */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  {singlePreset === "QUOTES" ? "Kutipan Bijak / Teks Refleksi:" : "Judul Layanan / Headline Flyer:"}
                </label>
                {singlePreset === "QUOTES" ? (
                  <textarea
                    rows={3}
                    value={flyerTitle}
                    onChange={(e) => setFlyerTitle(e.target.value)}
                    placeholder="Tulis kutipan refleksi..."
                    className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={flyerTitle}
                    onChange={(e) => setFlyerTitle(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:border-[#74A892] focus:outline-none"
                  />
                )}
              </div>

              {/* Jika PROMO KLINIK: Form Harga, Durasi, Alamat, Jadwal */}
              {singlePreset !== "QUOTES" ? (
                <>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Tag className="size-3 text-emerald-400" />
                        <span>Biaya Terapi:</span>
                      </label>
                      <input
                        type="text"
                        value={flyerPrice}
                        onChange={(e) => setFlyerPrice(e.target.value)}
                        placeholder="Rp 150.000"
                        className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-3 py-2 text-xs text-white focus:border-[#74A892] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <Clock className="size-3 text-emerald-400" />
                        <span>Durasi Sesi:</span>
                      </label>
                      <input
                        type="text"
                        value={flyerDuration}
                        onChange={(e) => setFlyerDuration(e.target.value)}
                        placeholder="± 1 Jam"
                        className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-3 py-2 text-xs text-white focus:border-[#74A892] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <MapPin className="size-3 text-emerald-400" />
                      <span>Alamat Klinik:</span>
                    </label>
                    <input
                      type="text"
                      value={flyerAddress}
                      onChange={(e) => setFlyerAddress(e.target.value)}
                      placeholder="Jl. Batua Raya 10 B No.9 Makassar"
                      className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-3 py-2 text-xs text-white focus:border-[#74A892] focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                      <Clock className="size-3 text-emerald-400" />
                      <span>Jadwal Praktik:</span>
                    </label>
                    <input
                      type="text"
                      value={flyerSchedule}
                      onChange={(e) => setFlyerSchedule(e.target.value)}
                      placeholder="Senin – Sabtu 16.00 – 21.00 WITA"
                      className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-3 py-2 text-xs text-white focus:border-[#74A892] focus:outline-none"
                    />
                  </div>
                </>
              ) : null}

              {/* Catatan Sticky Note */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                  <span>📌 Catatan Sticky Note / Scarcity:</span>
                </label>
                <input
                  type="text"
                  value={flyerNotes}
                  onChange={(e) => setFlyerNotes(e.target.value)}
                  placeholder="Maksimal 5 pasien per hari"
                  className="w-full rounded-xl border border-amber-400/30 bg-[#0F1115] px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              {/* Custom Prompt Imagen 3 */}
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Sparkles className="size-3 text-amber-300" />
                  <span>Prompt Visual Imagen 3 (Opsional):</span>
                </label>
                <input
                  type="text"
                  value={flyerCustomPrompt}
                  onChange={(e) => setFlyerCustomPrompt(e.target.value)}
                  placeholder="Kosongkan untuk visual fotorealistis klinik default Makassar"
                  className="w-full rounded-xl border border-white/10 bg-[#0F1115] px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:border-[#74A892] focus:outline-none"
                />
              </div>
            </section>

            {/* ── CARD 3 FLYER: TOMBOL AKSI GENERATE & STATUS ── */}
            <section className="rounded-2xl border border-amber-400/30 bg-[#1A1E24] p-4 sm:p-5 shadow-md space-y-3.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                🚀 Aksi Siaran Flyer Tunggal
              </p>

              <button
                type="button"
                onClick={handleGenerateSingleFlyer}
                disabled={singleLoading}
                className={cn(
                  "w-full h-13 sm:h-14 cursor-pointer rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg active:scale-[0.98]",
                  singleLoading
                    ? "bg-slate-700/60 text-slate-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-[#0F1411] shadow-amber-400/25",
                )}
              >
                {singleLoading ? (
                  <>
                    <Loader2 className="size-5 animate-spin text-[#0F1411]" />
                    <span>Meracik Visual Fotorealistis & Tipografi Flyer...</span>
                  </>
                ) : (
                  <>
                    <Send className="size-5 text-[#0F1411]" />
                    <span>🚀 GENERATE & KIRIM 1 FLYER KE TELEGRAM</span>
                  </>
                )}
              </button>

              {/* Feedback Alert Sukses */}
              {singleSuccess ? (
                <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 p-4 text-xs text-emerald-200 space-y-1.5 shadow-sm">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-300">
                    <CheckCircle2 className="size-5 text-emerald-400" />
                    <span>{singleSuccess}</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Flyer 9:16 resolusi Ultra HD 2K (2160×3840 px) telah terkirim lengkap dengan caption promosi ke bot Telegram. Buka Telegram untuk mengunduh ke galeri HP & bagikan ke WhatsApp Story.
                  </p>
                </div>
              ) : null}

              {/* Feedback Alert Error */}
              {singleError ? (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertCircle className="size-4 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Gagal Mengirim Flyer:</strong> {singleError}
                  </div>
                </div>
              ) : null}
            </section>
          </>
        )}

        {/* Minimal Footer */}
        <footer className="text-center text-[11px] text-slate-500 pt-2 pb-4">
          Dokter Pikiran Makassar · Remote Studio V2 · Telegram Engine V2.3
        </footer>

      </div>
    </div>
  );
}
