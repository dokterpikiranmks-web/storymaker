"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Sparkles,
  Clock,
  ShieldCheck,
  Eye,
  Image as ImageIcon,
  Type,
  Download,
  Copy,
  Check,
  RotateCcw,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  HeartHandshake,
  Brain,
  Stethoscope,
  Moon,
  Sun,
  Flame,
} from "lucide-react";
import { WEEKLY_CONTENT_MATRIX, getStoryForSlot, parseDayIndex } from "@/lib/content-matrix";
import { detectBannedSlang, calculateStoryWordCount, validateStoryDraft } from "@/lib/ahmad-persona";
import type { SlotTime, StoryDraft, VisualMode, ContentPillar } from "@/lib/types";

const DAYS = [
  { index: 1, name: "Senin", label: "Senin" },
  { index: 2, name: "Selasa", label: "Selasa · Ruang Pulih", isPromo: true },
  { index: 3, name: "Rabu", label: "Rabu" },
  { index: 4, name: "Kamis", label: "Kamis · Ruang Pulih", isPromo: true },
  { index: 5, name: "Jumat", label: "Jumat" },
  { index: 6, name: "Sabtu", label: "Sabtu · Ruang Pulih", isPromo: true },
  { index: 0, name: "Minggu", label: "Minggu" },
];

const SLOTS: {
  slot: SlotTime;
  name: string;
  pillar: ContentPillar;
  tag: string;
  icon: any;
  color: string;
  badgeBg: string;
  borderColor: string;
  desc: string;
}[] = [
  {
    slot: "07:00",
    name: "Motivasi Pagi",
    pillar: "MOTIVASI_PAGI",
    tag: "MOTIVASI PAGI",
    icon: Sun,
    color: "#F59E0B",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    borderColor: "border-amber-500/40",
    desc: "Spiritual Islam & Realitas Hidup (Rezeki, Tawakkal, Takdir)",
  },
  {
    slot: "10:00",
    name: "Kesehatan Fungsional",
    pillar: "KESEHATAN_FUNGSIONAL",
    tag: "KESEHATAN FUNGSIONAL",
    icon: Stethoscope,
    color: "#10B981",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    borderColor: "border-emerald-500/40",
    desc: "Holistic Medicine (Gut-Brain, Herbal Sains, Akupresur)",
  },
  {
    slot: "12:00",
    name: "Mental & Hipnoterapi",
    pillar: "MENTAL_NEUROSAINS",
    tag: "MENTAL & NEUROSAINS",
    icon: Brain,
    color: "#818CF8",
    badgeBg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/30",
    borderColor: "border-indigo-500/40",
    desc: "Bawah Sadar, Trauma, Parenting, & Ruang Pulih (3x/Pekan)",
  },
  {
    slot: "19:00",
    name: "Self-Terapi Praktis",
    pillar: "SELF_TERAPI",
    tag: "SELF-TERAPI PRAKTIS",
    icon: Flame,
    color: "#FB923C",
    badgeBg: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    borderColor: "border-orange-500/40",
    desc: "Panduan Somatik 1-2-3 Detik untuk Rilis Ketegangan",
  },
  {
    slot: "21:00",
    name: "Inspirasi Malam",
    pillar: "INSPIRASI_MALAM",
    tag: "INSPIRASI MALAM",
    icon: Moon,
    color: "#93C5FD",
    badgeBg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    borderColor: "border-blue-500/40",
    desc: "Introspeksi Tajam, Tamparan Lembut, & Sugesti Tidur",
  },
];

export default function StudioCockpitPage() {
  const [selectedDay, setSelectedDay] = useState<number>(1); // Default Senin
  const [selectedSlot, setSelectedSlot] = useState<SlotTime>("07:00");
  const [visualMode, setVisualMode] = useState<VisualMode>("illustrated");

  // Editable Draft state
  const [currentDraft, setCurrentDraft] = useState<StoryDraft | null>(null);
  const [editedTitle, setEditedTitle] = useState<string>("");
  const [editedBody, setEditedBody] = useState<string>("");
  const [editedHighlightLabel, setEditedHighlightLabel] = useState<string>("");
  const [editedHighlightContent, setEditedHighlightContent] = useState<string>("");

  // Visual render preview state
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderDuration, setRenderDuration] = useState<number | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"editor" | "psychology">("editor");

  // Load initial draft whenever day or slot changes
  useEffect(() => {
    const draft = getStoryForSlot(selectedSlot, selectedDay);
    if (draft) {
      setCurrentDraft(draft);
      setEditedTitle(draft.title);
      setEditedBody(draft.body.join("\n\n"));
      setEditedHighlightLabel(draft.highlightBox?.label || "");
      setEditedHighlightContent(draft.highlightBox?.content || "");
      setVisualMode(draft.visualModePreferred || "illustrated");
    }
  }, [selectedDay, selectedSlot]);

  // Trigger render when draft or visualMode updates
  useEffect(() => {
    if (!currentDraft) return;
    renderPreview(currentDraft, visualMode);
  }, [currentDraft?.id, visualMode]);

  const renderPreview = async (draftToRender: StoryDraft, mode: VisualMode) => {
    setIsRendering(true);
    const start = Date.now();
    try {
      const response = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft: draftToRender,
          mode,
          format: "json",
        }),
      });

      const data = await response.json();
      if (data.success && data.imageBase64) {
        setPreviewImage(data.imageBase64);
        setRenderDuration(data.renderTimeMs || Date.now() - start);
      } else {
        console.error("Render failed:", data.error);
      }
    } catch (err) {
      console.error("Fetch render error:", err);
    } finally {
      setIsRendering(false);
    }
  };

  // Real-time persona & word count analysis
  const combinedText = `${editedTitle} ${editedBody} ${editedHighlightContent}`;
  const bannedSlangFound = detectBannedSlang(combinedText);
  const wordCount = combinedText.trim().split(/\s+/).filter(Boolean).length;
  const isWordCountSafe = wordCount <= 130;

  // Apply edits to currentDraft and trigger re-render
  const handleApplyChanges = () => {
    if (!currentDraft) return;

    const updatedDraft: StoryDraft = {
      ...currentDraft,
      title: editedTitle,
      body: editedBody
        .split("\n\n")
        .map((p) => p.trim())
        .filter(Boolean),
      highlightBox: editedHighlightLabel
        ? {
            label: editedHighlightLabel,
            content: editedHighlightContent,
          }
        : null,
    };

    setCurrentDraft(updatedDraft);
    renderPreview(updatedDraft, visualMode);
  };

  // Reset back to original matrix content
  const handleReset = () => {
    const original = getStoryForSlot(selectedSlot, selectedDay);
    if (original) {
      setCurrentDraft(original);
      setEditedTitle(original.title);
      setEditedBody(original.body.join("\n\n"));
      setEditedHighlightLabel(original.highlightBox?.label || "");
      setEditedHighlightContent(original.highlightBox?.content || "");
      setVisualMode(original.visualModePreferred || "illustrated");
      renderPreview(original, original.visualModePreferred || "illustrated");
    }
  };

  // Download high-resolution PNG
  const handleDownload = () => {
    if (!previewImage) return;
    const dayObj = DAYS.find((d) => d.index === selectedDay);
    const dayName = dayObj ? dayObj.name : "Hari";
    const cleanSlot = selectedSlot.replace(":", "");
    const filename = `DokterPikiran-${dayName}-${cleanSlot}-${currentDraft?.pillar || "story"}.png`;

    const link = document.createElement("a");
    link.href = previewImage;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy clean caption for Instagram Story / WhatsApp
  const handleCopyCaption = () => {
    if (!currentDraft) return;

    const lines: string[] = [];
    lines.push(`✨ ${currentDraft.tag} · ${currentDraft.slot} WITA`);
    lines.push("");
    lines.push(`"${editedTitle}"`);
    lines.push("");
    lines.push(editedBody);

    if (editedHighlightLabel && editedHighlightContent) {
      lines.push("");
      lines.push(`💡 [${editedHighlightLabel}]`);
      lines.push(editedHighlightContent);
    }

    lines.push("");
    lines.push("---");
    lines.push("Ahmad Jawahir Zain");
    lines.push("Dokter Pikiran Makassar");

    if (currentDraft.isRuangPulihPromo) {
      lines.push("");
      lines.push("Konsultasi & Terapi: Hubungi Ruang Pulih Dokter Pikiran Makassar.");
    }

    lines.push("");
    lines.push("#DokterPikiran #KesehatanMental #HipnoterapiMakassar #HolisticMedicine #RuangPulih");

    navigator.clipboard.writeText(lines.join("\n"));
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const activeSlotObj = SLOTS.find((s) => s.slot === selectedSlot) || SLOTS[0];
  const activeDayObj = DAYS.find((d) => d.index === selectedDay) || DAYS[0];

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800/80 bg-[#0B0D13]/90 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 via-emerald-500/10 to-indigo-500/20 border border-amber-500/40 flex items-center justify-center font-serif text-xl font-bold text-amber-400 shadow-lg shadow-amber-500/10">
              DP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-bold text-white tracking-wide">
                  Dokter Pikiran Makassar
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  STUDIO V5
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Ahmad Persona Engine · High-Speed Satori Visual · Sub-Second Rendering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Zona Waktu: WITA (Makassar)</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Anti-Slang Guard Aktif</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        {/* 1. Day Selector Navigation Bar */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Pilih Hari Penayangan:
            </span>
            <span className="font-mono text-slate-500">
              Jadwal Ruang Pulih: Selasa, Kamis, Sabtu (12:00 WITA)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {DAYS.map((day) => {
              const isSelected = selectedDay === day.index;
              return (
                <button
                  key={day.index}
                  onClick={() => setSelectedDay(day.index)}
                  className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-sm transition-all duration-200 ${
                    isSelected
                      ? "bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-500/10 text-white font-semibold ring-1 ring-amber-500/40"
                      : "bg-[#0E1118]/80 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <span className="text-sm font-medium">{day.name}</span>
                  {day.isPromo ? (
                    <span className="text-[10px] mt-1 font-mono font-medium px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                      Ruang Pulih
                    </span>
                  ) : (
                    <span className="text-[10px] mt-1 font-mono text-slate-500">5 Slot</span>
                  )}
                  {isSelected && (
                    <div className="absolute -bottom-1 w-6 h-1 bg-amber-400 rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Slot Selector Navigation Bar */}
        <div className="flex flex-col gap-2">
          <div className="text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            Pilih Slot Jam Penayangan (1 Slide / Slot):
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {SLOTS.map((s) => {
              const isSelected = selectedSlot === s.slot;
              const Icon = s.icon;
              const isPromoHere =
                s.slot === "12:00" && (selectedDay === 2 || selectedDay === 4 || selectedDay === 6);

              return (
                <button
                  key={s.slot}
                  onClick={() => setSelectedSlot(s.slot)}
                  className={`flex items-start gap-3 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                    isSelected
                      ? `bg-slate-800/90 ${s.borderColor} text-white shadow-lg ring-1 ring-white/10`
                      : "bg-[#0E1118]/80 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl border flex-shrink-0 mt-0.5 ${s.badgeBg}`}
                    style={{ borderColor: isSelected ? s.color : undefined }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-white tracking-wide">
                        {s.slot}
                      </span>
                      {isPromoHere && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 font-semibold font-mono">
                          PROMO
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 truncate mt-0.5">
                      {s.name}
                    </span>
                    <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {s.desc}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Main Workspace: Mockup Preview (Left) & Control Cockpit (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-2">
          {/* Left Column: 9:16 Mobile Mockup Preview */}
          <div className="lg:col-span-5 flex flex-col items-center gap-4">
            {/* Visual Mode Selector */}
            <div className="w-full flex items-center justify-between p-2 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs">
              <span className="text-slate-400 font-medium px-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Mode Visual:
              </span>
              <div className="flex items-center gap-1 bg-[#090C14] p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setVisualMode("illustrated")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    visualMode === "illustrated"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Illustrated
                </button>
                <button
                  onClick={() => setVisualMode("text_only")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    visualMode === "text_only"
                      ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Text-Only Luxury
                </button>
              </div>
            </div>

            {/* Smartphone Frame (9:16 Portrait) */}
            <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-[42px] p-3 bg-gradient-to-b from-slate-700 via-slate-850 to-slate-950 shadow-2xl shadow-black/80 border-[3px] border-slate-750 flex flex-col items-center justify-center overflow-hidden">
              {/* Speaker / Dynamic Island pill */}
              <div className="absolute top-4 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-end px-2">
                <div className="w-2 h-2 rounded-full bg-slate-800 border border-slate-700" />
              </div>

              {/* Inner Screen */}
              <div className="relative w-full h-full rounded-[32px] bg-black overflow-hidden flex items-center justify-center">
                {isRendering ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-slate-400">
                    <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
                    <span className="text-xs font-mono font-medium tracking-wide">
                      Merender Visual 9:16...
                    </span>
                  </div>
                ) : previewImage ? (
                  <img
                    src={previewImage}
                    alt={currentDraft?.title || "Story Preview"}
                    className="w-full h-full object-contain select-none"
                  />
                ) : (
                  <div className="text-xs text-slate-500 font-mono">Memuat Visual...</div>
                )}
              </div>
            </div>

            {/* Preview Status & Quick Action Buttons */}
            <div className="w-full max-w-[340px] flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
                <span>Rasio: 9:16 (1080×1920)</span>
                {renderDuration !== null && (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" />
                    Render: {renderDuration} ms
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownload}
                  disabled={!previewImage}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  Download PNG HD
                </button>
                <button
                  onClick={handleCopyCaption}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-white font-medium text-xs border border-slate-700 transition-all"
                >
                  {copySuccess ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-300" />
                      Salin Teks Caption
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Intelligent Editor & Persona Guard */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Tab Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`text-sm font-semibold pb-2 border-b-2 px-1 transition-all ${
                    activeTab === "editor"
                      ? "text-white border-amber-400"
                      : "text-slate-400 border-transparent hover:text-slate-200"
                  }`}
                >
                  Editor Naskah & Persona Guard
                </button>
                <button
                  onClick={() => setActiveTab("psychology")}
                  className={`text-sm font-semibold pb-2 border-b-2 px-1 transition-all ${
                    activeTab === "psychology"
                      ? "text-white border-indigo-400"
                      : "text-slate-400 border-transparent hover:text-slate-200"
                  }`}
                >
                  Psikologi Slot & DNA Konten
                </button>
              </div>

              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 transition-colors"
                title="Kembalikan teks sesuai database naskah matrix asli"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset ke Matrix Asli
              </button>
            </div>

            {activeTab === "editor" ? (
              <div className="flex flex-col gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
                {/* Slang Alert Banner if detected */}
                {bannedSlangFound.length > 0 && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/40 text-red-200 flex flex-col gap-2">
                    <div className="flex items-center gap-2 font-semibold text-xs text-red-300">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span>⛔ Slang Gaul Jakarta Terdeteksi pada Naskah!</span>
                    </div>
                    <p className="text-xs text-red-200/90">
                      Kata yang melanggar persona:{" "}
                      <span className="font-mono font-bold bg-red-950/80 px-2 py-0.5 rounded border border-red-800 text-red-300">
                        {bannedSlangFound.join(", ")}
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-300">
                      Gunakan gaya bahasa santai-formal khas Ahmad Makassar: ganti kata di atas dengan{" "}
                      <strong className="text-amber-300">Anda / kita / tidak / mengira / sering kali</strong>.
                    </p>
                  </div>
                )}

                {/* Word Count Progress Gauge */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">
                      Kepadatan Naskah 1-Slide (Maks. 130 Kata):
                    </span>
                    <span
                      className={`font-mono font-bold ${
                        wordCount > 130
                          ? "text-red-400"
                          : wordCount > 105
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {wordCount} / 130 kata ({isWordCountSafe ? "Aman Terbaca 3-5 Detik" : "Terlalu Padat"})
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 rounded-full ${
                        wordCount > 130
                          ? "bg-red-500"
                          : wordCount > 105
                          ? "bg-amber-500"
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min((wordCount / 130) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Input: Judul Slide */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Judul Utama (Headline):</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {editedTitle.split(/\s+/).filter(Boolean).length} kata
                    </span>
                  </label>
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors font-serif"
                    placeholder="Masukkan judul slide..."
                  />
                </div>

                {/* Input: Isi Paragraf Slide */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>Isi Materi / Kutipan (Pisahkan paragraf dengan 2 enter):</span>
                    <span className="text-[11px] font-mono text-slate-500">
                      {editedBody.split(/\s+/).filter(Boolean).length} kata
                    </span>
                  </label>
                  <textarea
                    rows={6}
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-slate-200 text-sm focus:outline-none focus:border-amber-500 transition-colors font-sans leading-relaxed"
                    placeholder="Tulis naskah materi..."
                  />
                </div>

                {/* Input: Box Sorotan / Langkah Terapi (Optional) */}
                <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/40 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Box Sorotan / Aksi Nyata (Opsional):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={editedHighlightLabel}
                      onChange={(e) => setEditedHighlightLabel(e.target.value)}
                      placeholder="Label (Contoh: KUNCI MEDIS / RUANG PULIH)"
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <input
                      type="text"
                      value={editedHighlightContent}
                      onChange={(e) => setEditedHighlightContent(e.target.value)}
                      placeholder="Isi sorotan ringkas..."
                      className="sm:col-span-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Render Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={handleApplyChanges}
                    disabled={isRendering || bannedSlangFound.length > 0}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRendering ? "animate-spin" : ""}`} />
                    Perbarui Visual Mockup
                  </button>
                </div>
              </div>
            ) : (
              /* Tab 2: Psychology & Content DNA */
              <div className="flex flex-col gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800 text-xs leading-relaxed">
                <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200">
                  <h4 className="font-semibold text-indigo-300 flex items-center gap-1.5 mb-1 text-sm">
                    <Brain className="w-4 h-4" />
                    Psikologi Audiens pada Jam {selectedSlot} WITA:
                  </h4>
                  {selectedSlot === "07:00" && (
                    <p>
                      Audiens baru bangun tidur dan sering mengalami <em>morning cortisol spike</em>{" "}
                      (cemas akan beban hari ini). Pendekatan tauhid, takdir, dan rezeki yang tertakar
                      menurunkan tensi batin dan menanamkan ketenangan sebelum memulai aktivitas.
                    </p>
                  )}
                  {selectedSlot === "10:00" && (
                    <p>
                      Audiens berada di jam kerja produktif. Tubuh mulai bereaksi terhadap stres
                      (asam lambung naik, leher kaku, maag kambuh). Edukasi fungsional (gut-brain,
                      herbal sains, akupresur) memberi penjelasan ilmiah bahwa keluhan fisik berakar
                      dari alarm emosi.
                    </p>
                  )}
                  {selectedSlot === "12:00" && (
                    <p>
                      Jam istirahat siang. Audiens santai sejenak membuka handphone. Di slot inilah
                      materi bawah sadar/trauma dibahas mendalam, sekaligus diselipkan jembatan empati
                      untuk layanan <strong>Ruang Pulih Dokter Pikiran</strong> (Selasa, Kamis, Sabtu)
                      tanpa kesan murahan atau hard-selling.
                    </p>
                  )}
                  {selectedSlot === "19:00" && (
                    <p>
                      Audiens baru tiba di rumah dengan tubuh penat. Mereka butuh aksi nyata mandiri
                      (bukan teori panjang). Format 3 langkah somatik (napas vagal, rilis rahang & pundak)
                      memberi solusi instan dalam 90 detik.
                    </p>
                  )}
                  {selectedSlot === "21:00" && (
                    <p>
                      Jam menjelang tidur ketika pikiran overthinking sering memutar ulang rasa bersalah.
                      Quotes penutup hari memberikan tamparan lembut keinsyafan sekaligus izin tulus
                      untuk mengistirahatkan pikiran.
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex flex-col gap-2">
                  <h4 className="font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Pedoman Persona Ahmad (Dokter Pikiran Makassar):
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    <li>Gaya bahasa: Santai namun tetap formal dan berwibawa (seperti sahabat cerdas di warkop Makassar).</li>
                    <li>Sapaan: Wajib menggunakan <em>Anda</em> atau <em>kita</em>. Dilarang keras menggunakan <em>lu/gue</em>.</li>
                    <li>Kosakata: Bersih dari dialek gaul Jakarta (<em>ngga, ngira, banget, udah, mager, santuy</em>).</li>
                    <li>Format: Wajib 1 slide per topik, padat, dan terbaca tuntas dalam 3-5 detik.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
