"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type ToastTone = "success" | "error" | "info";
export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}
export type Notify = (tone: ToastTone, title: string, description?: string) => void;

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);
  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), []);
  const notify = useCallback<Notify>(
    (tone, title, description) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [...list.slice(-3), { id, tone, title, description }]);
      window.setTimeout(() => dismiss(id), tone === "error" ? 9000 : 6000);
    },
    [dismiss],
  );
  return { toasts, notify, dismiss };
}

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };

export function Toaster({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(420px,calc(100vw-2rem))] flex-col gap-2" aria-live="polite">
      {toasts.map((t) => {
        const Icon = ICONS[t.tone];
        return (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md",
              t.tone === "success" && "border-emerald-400/30 bg-emerald-950/80 text-emerald-50",
              t.tone === "error" && "border-rose-400/30 bg-rose-950/85 text-rose-50",
              t.tone === "info" && "border-cyan-400/30 bg-slate-900/90 text-slate-100",
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.description ? <p className="mt-0.5 text-xs leading-relaxed opacity-85">{t.description}</p> : null}
            </div>
            <button type="button" onClick={() => onDismiss(t.id)} className="cursor-pointer opacity-60 hover:opacity-100" aria-label="Tutup">
              <X className="size-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
