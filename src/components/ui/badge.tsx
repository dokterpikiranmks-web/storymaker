import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider [&_svg]:size-3",
  {
    variants: {
      tone: {
        neutral: "border-white/10 bg-white/5 text-slate-300",
        cyan: "border-cyan-400/30 bg-cyan-400/10 text-cyan-200",
        emerald: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
        amber: "border-amber-400/30 bg-amber-400/10 text-amber-200",
        rose: "border-rose-400/30 bg-rose-400/10 text-rose-200",
        violet: "border-violet-400/30 bg-violet-400/10 text-violet-200",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
