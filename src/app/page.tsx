"use client";

import { useState } from "react";
import { Sparkles, Clock, ShieldCheck, HeartHandshake, Eye, Image as ImageIcon, Type } from "lucide-react";

interface SlideData {
  id: string;
  slot: string;
  title: string;
  subtitle: string;
  theme: string;
  accent: string;
  imageTextOnly: string;
  imageIllustrated: string | null;
  summary: string;
  psychology: string;
  toneSample: string;
  badge: string;
  illustrationNote?: string;
}

const SLIDES: SlideData[] = [
  {
    id: "slide-01",
    slot: "07:00 WITA",
    title: "Ketenangan Bukan Berarti Tidak Ada Masalah",
    subtitle: "Pilar 1: Motivasi Pagi (Quotes Otentik)",
    theme: "Amber Awakening",
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    imageTextOnly: "/samples/slide-01-0700-motivasi-pagi.png",
    imageIllustrated: "/samples/slide-01-illustrated-atmospheric.png",
    illustrationNote:
      "Pola Full Atmospheric Background: Siluet orang duduk tenang di jendela fajar berkabut keemasan, dilapisi dark overlay 76% agar teks kutipan tetap kontras 100%.",
    summary:
      "Quote pembuka hari yang realistis dan menenangkan. Bukan klise motivator internet, melainkan ajakan untuk meregulasi pikiran sebelum berhadapan dengan riuh dunia.",
    psychology:
      "Audiens baru bangun tidur, sering kali terbangun dengan morning cortisol spike (cemas akan beban hari ini). Quote ini menurunkan tensi batin dan memberi rasa kendali.",
    toneSample:
      "\"Ketenangan adalah ketika Anda memilih untuk tidak membiarkan keributan di luar masuk dan merusak rumah di dalam kepala Anda.\"",
    badge: "Anti-Generik · Mindset Pagi",
  },
  {
    id: "slide-02",
    slot: "10:00 WITA",
    title: "Saat Pikiran Buntu, Kenapa Perut yang Terasa Perih?",
    subtitle: "Pilar 2: Kesehatan Fungsional & Holistic Medicine",
    theme: "Botanical Sage",
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    imageTextOnly: "/samples/slide-02-1000-kesehatan-fungsional.png",
    imageIllustrated: "/samples/slide-02-illustrated-split-header.png",
    illustrationNote:
      "Pola Split Header: Ilustrasi editorial medis alur saraf otak-usus (gut-brain axis) dengan aksen emas dan botani, menyatu halus lewat feathered gradient ke area teks di bawahnya.",
    summary:
      "Membongkar kaitan erat antara saraf usus (gut-brain axis) dan asam lambung yang naik saat memendam cemas, tanpa istilah kedokteran yang bikin pusing.",
    psychology:
      "Audiens di jam kantor sering merasakan maag/GERD kambuh saat stres. Konten ini memberikan 'aha moment' bahwa masalah fisik mereka berakar dari beban emosi.",
    toneSample:
      "\"Dengarkan tubuh Anda, karena tubuh tidak pernah berbohong. Mengobati lambung tanpa merapikan pikiran sering kali hanya menjadi solusi sementara.\"",
    badge: "Gut-Brain Connection",
  },
  {
    id: "slide-03",
    slot: "12:00 WITA",
    title: "Logika Tahu Kita Aman, Tapi Kenapa Jantung Berdebar?",
    subtitle: "Pilar 3: Mental, Neurosains & Ruang Pulih",
    theme: "Amethyst Deep",
    accent: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
    imageTextOnly: "/samples/slide-03-1200-mental-neurosains.png",
    imageIllustrated: null,
    summary:
      "Edukasi neurosains bawah sadar (95% respon bawah sadar vs 5% logika) yang diselipkan soft-promo berkelas untuk layanan terapi Ruang Pulih Dokter Pikiran.",
    psychology:
      "Orang yang lelah memaksakan diri 'berpikir positif' merasa sangat dipahami karena divalidasi bahwa luka lama bawah sadar memang butuh diurai, bukan cuma disangkal.",
    toneSample:
      "\"Mengurai simpul bawah sadar yang tertahan bertahun-tahun tentu sulit dilakukan sendirian... Di Ruang Pulih, kita duduk bersama mengurai akarnya sampai tuntas tanpa dihakimi.\"",
    badge: "Soft Promo 3x Seminggu",
  },
  {
    id: "slide-04",
    slot: "19:00 WITA",
    title: "Latihan Sederhana 90 Detik: Melepaskan Beban Hari Ini",
    subtitle: "Pilar 4: Panduan Self-Terapi Praktis (Somatik)",
    theme: "Sunset Terracotta",
    accent: "text-orange-400 border-orange-500/30 bg-orange-500/10",
    imageTextOnly: "/samples/slide-04-1900-self-terapi.png",
    imageIllustrated: null,
    summary:
      "3 langkah nyata somatik yang bisa langsung dilakukan audiens di rumah saat lelah: napas vagal 4-6 detik, rilis pundak & rahang, serta kata penutup hari.",
    psychology:
      "Audiens pulang kerja dengan tubuh kaku. Panduan praktis ini memberikan intervensi nyata langsung terasa di tubuh dalam 90 detik, membangun trust tinggi.",
    toneSample:
      "\"Sadari pundak dan rahang gigi Anda. Turunkan pundak yang kaku dan lepaskan gigitan rahang bawah... Hari ini sudah selesai.\"",
    badge: "Aksi Nyata Mandiri",
  },
  {
    id: "slide-05",
    slot: "21:00 WITA",
    title: "Izin untuk Beristirahat",
    subtitle: "Pilar 5: Inspirasi Malam (Penutup Hari)",
    theme: "Celestial Velvet",
    accent: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    imageTextOnly: "/samples/slide-05-2100-inspirasi-malam.png",
    imageIllustrated: null,
    summary:
      "Pesan tenang penutup hari yang memberi izin kepada audiens untuk berhenti menghakimi diri sendiri dan tertidur dalam rasa cukup.",
    psychology:
      "Mencegah overthinking tengah malam. Menjadi teman hangat yang menepuk pundak audiens sebelum tidur tanpa tuntutan apa pun.",
    toneSample:
      "\"Tempat tidur Anda adalah ruang untuk memulihkan diri, bukan ruang pengadilan untuk menghakimi kekurangan Anda sepanjang hari.\"",
    badge: "Pelepas Overthinking",
  },
];

export default function HomePage() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [showIllustrated, setShowIllustrated] = useState(true);

  const activeSlide = SLIDES[selectedIdx];
  const hasIllustrated = activeSlide.imageIllustrated !== null;
  const currentImage =
    (showIllustrated && hasIllustrated && activeSlide.imageIllustrated)
      ? activeSlide.imageIllustrated
      : activeSlide.imageTextOnly;

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Navbar */}
      <header className="border-b border-white/[0.08] bg-black/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center font-serif font-bold text-emerald-400 text-sm">
              DP
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight text-white flex items-center gap-2">
                Dokter Pikiran Makassar
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  VISUAL EXPERIMENT
                </span>
              </h1>
              <p className="text-xs text-slate-400 font-sans">
                Ahmad Jawahir Zain · Perbandingan Visual Ilustrasi vs Teks Murni
              </p>
            </div>
          </div>

          {/* Toggle Button: Teks Murni vs Dengan Ilustrasi */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-white/[0.05] border border-white/10">
            <button
              onClick={() => setShowIllustrated(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                !showIllustrated
                  ? "bg-white/15 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Teks Murni
            </button>
            <button
              onClick={() => setShowIllustrated(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                showIllustrated
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Dengan Ilustrasi
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Preview */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-8">
        {/* Slot Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {SLIDES.map((slide, idx) => {
            const isActive = idx === selectedIdx;
            const isIlluAvailable = slide.imageIllustrated !== null;
            return (
              <button
                key={slide.id}
                onClick={() => setSelectedIdx(idx)}
                className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden ${
                  isActive
                    ? "bg-white/[0.08] border-white/30 shadow-lg shadow-black/40"
                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/15"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-semibold tracking-wider text-slate-400">
                    {slide.slot}
                  </span>
                  {isIlluAvailable && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ART
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium text-slate-200 truncate">
                  {slide.title}
                </div>
              </button>
            );
          })}
        </div>

        {/* Studio Showcase: Mockup + Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Phone Mockup Frame (9:16 Aspect Ratio) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[370px] rounded-[44px] p-3 bg-gradient-to-b from-white/15 via-white/5 to-white/10 border border-white/20 shadow-2xl shadow-black/80">
              {/* Phone Speaker Notch */}
              <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black/60 rounded-full z-20 flex items-center justify-center">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Inner Screen */}
              <div className="relative aspect-[9/16] w-full rounded-[36px] overflow-hidden bg-slate-950 border border-white/10">
                <img
                  key={currentImage}
                  src={currentImage}
                  alt={activeSlide.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                />

                {/* Subtle Hover Action overlay */}
                <a
                  href={currentImage}
                  target="_blank"
                  rel="noreferrer"
                  className="absolute bottom-4 right-4 bg-black/70 hover:bg-black/90 text-white text-xs px-3 py-1.5 rounded-full border border-white/20 backdrop-blur flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Resolusi Penuh
                </a>
              </div>
            </div>
          </div>

          {/* Right: Analytical Breakdown & Concept Rationale */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Header info */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-semibold border ${activeSlide.accent}`}
                >
                  {activeSlide.slot} · {activeSlide.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Mode Aktif: {showIllustrated && hasIllustrated ? "Dengan Ilustrasi Artistik" : "Teks Murni"}
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                  {activeSlide.title}
                </h2>
                <p className="text-sm text-slate-400 mt-1 font-sans">
                  {activeSlide.subtitle}
                </p>
              </div>

              {showIllustrated && hasIllustrated && activeSlide.illustrationNote && (
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-emerald-300 block mb-1">
                      Catatan Desain Ilustrasi:
                    </span>
                    {activeSlide.illustrationNote}
                  </div>
                </div>
              )}

              <p className="text-slate-300 text-sm leading-relaxed border-t border-white/[0.08] pt-4">
                {activeSlide.summary}
              </p>
            </div>

            {/* Tone of Voice in Action */}
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono font-semibold text-emerald-400 tracking-wider">
                <Sparkles className="w-4 h-4" />
                KARAKTER BAHASA AHMAD (MAKASSAR PERSONA)
              </div>
              <blockquote className="border-l-2 border-emerald-500/50 pl-4 py-1 text-slate-200 text-sm sm:text-base italic font-serif leading-relaxed">
                {activeSlide.toneSample}
              </blockquote>
              <p className="text-xs text-slate-400">
                Santai tapi formal. Menggunakan pilihan kata yang bersih (
                <span className="text-slate-200 font-mono">Anda, kita, tidak, sering kali</span>
                ), tanpa gaul Jakarta, tetap hangat dan sangat mudah didekati.
              </p>
            </div>

            {/* Psychology & Business Strategy */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-400">
                  <Clock className="w-4 h-4 text-amber-400" />
                  KONDISI PSIKOLOGIS AUDIENS
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeSlide.psychology}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/[0.08] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  ESTETIKA & DAYA BACA
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {showIllustrated && hasIllustrated
                    ? "Ilustrasi memperkuat mood emosional tanpa menabrak teks berkat dark overlay dan gradient fade halus."
                    : "1 pesan utama per slide. Ruang bernapas luas (padding 100px), tipografi Playfair Display & Inter, nyaman tuntas dalam 3 detik."}
                </p>
              </div>
            </div>

            {/* Ruang Pulih Highlight (if slot 3) */}
            {selectedIdx === 2 && (
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3.5">
                <HeartHandshake className="w-6 h-6 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-indigo-200">
                    Formula Jembatan Solusi: Promosi Ruang Pulih
                  </div>
                  <p className="text-xs text-indigo-300/80 leading-relaxed">
                    Tidak ada hard-selling norak. Promosi lahir secara organik setelah mengedukasi bahwa pikiran bawah sadar tidak bisa disembuhkan hanya dengan logika sendirian.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer className="border-t border-white/[0.08] py-6 px-6 text-center text-xs text-slate-500 font-mono">
        Dokter Pikiran Makassar · Visual Concept Verification · Phase 5 Fresh Architecture
      </footer>
    </div>
  );
}
