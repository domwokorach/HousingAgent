import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

/** Subtle cream chips — "For Sale", "Available", "Furnished", "New listing". */
const TONES = {
  neutral: "bg-surface-2 text-ink-muted border border-line",
  brand: "bg-cream text-ink border border-line-strong",
  accent: "bg-warning-soft text-warning border border-warning/25",
  success: "bg-success-soft text-success border border-success/25",
} as const;

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
