import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

/** Status stays muted — it should read clearly without shouting. */
const TONES = {
  danger: "border-danger/30 bg-danger-soft text-danger",
  success: "border-success/30 bg-success-soft text-success",
  info: "border-line-strong bg-cream text-ink-body",
} as const;

export function Alert({
  tone = "danger",
  children,
  className,
}: {
  tone?: keyof typeof TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      // Errors interrupt; confirmations wait for a pause in speech.
      role={tone === "danger" ? "alert" : "status"}
      className={cx("rounded-control border px-4 py-3 text-sm", TONES[tone], className)}
    >
      {children}
    </div>
  );
}
