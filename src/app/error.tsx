"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

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
              : "Terjadi kesalahan sistem. Silakan muat ulang halaman."}
          </p>
          {error.digest && (
            <p className="mt-2 font-mono text-xs text-slate-500">Digest: {error.digest}</p>
          )}
        </div>
        <div className="pt-2 flex justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition"
          >
            <RotateCcw className="h-4 w-4" />
            Coba Lagi
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  );
}
