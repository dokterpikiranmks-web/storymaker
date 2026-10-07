import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import type { ReactNode } from "react";
import "./globals.css";

const inter = localFont({
  src: [
    { path: "../assets/fonts/inter-latin-400-normal.woff", weight: "400", style: "normal" },
    { path: "../assets/fonts/inter-latin-600-normal.woff", weight: "600", style: "normal" },
    { path: "../assets/fonts/inter-latin-800-normal.woff", weight: "800", style: "normal" },
  ],
  variable: "--font-inter",
  display: "swap",
});

const mono = localFont({
  src: [
    { path: "../assets/fonts/jetbrains-mono-latin-400-normal.woff", weight: "400", style: "normal" },
    { path: "../assets/fonts/jetbrains-mono-latin-700-normal.woff", weight: "700", style: "normal" },
  ],
  variable: "--font-jetbrains",
  display: "swap",
});

const serif = localFont({
  src: [
    { path: "../assets/fonts/playfair-display-latin-500-italic.woff", weight: "500", style: "italic" },
    { path: "../assets/fonts/playfair-display-latin-700-normal.woff", weight: "700", style: "normal" },
  ],
  variable: "--font-playfair",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Remote Studio V2 · Dokter Pikiran Makassar",
  description:
    "Remote Studio V2 Dokter Pikiran Makassar — Siaran 5 Slide WhatsApp Story 9:16 & PDF Panduan Klinis via Telegram Engine V2.",
};

export const viewport: Viewport = {
  themeColor: "#0F1115",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" className={`${inter.variable} ${mono.variable} ${serif.variable}`}>
      <body className="min-h-screen font-sans text-slate-200 antialiased">{children}</body>
    </html>
  );
}
