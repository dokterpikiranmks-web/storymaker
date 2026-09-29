"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-slate-900/80 p-8 shadow-2xl backdrop-blur text-center space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="h-7 w-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Terjadi Gangguan pada Server</h2>
          <p className="mt-2 text-sm text-slate-400">
            {error.message && !error.message.includes("digest")
              ? error.message
              : "Koneksi ke database atau service backend sedang tidak tersedia. Pastikan konfigurasi environment sudah lengkap."}
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-slate-500">Error Digest: {error.digest}</p>
          )}
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            className="bg-indigo-600 hover:bg-indigo-500 text-white"
          >
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
