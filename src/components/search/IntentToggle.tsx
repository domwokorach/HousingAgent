"use client";

import { cx } from "@/lib/utils";
import type { Intent } from "@/types/property";

/** The rent / buy switch. Used in the hero, the filter panel and the listing form. */
export function IntentToggle({
  value,
  onChange,
  className,
  label = "Rent or buy",
}: {
  value: Intent | "any";
  onChange: (intent: Intent) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx("inline-flex rounded-control border border-line bg-surface-2 p-1", className)}
    >
      {(["rent", "buy"] as const).map((intent) => (
        <button
          key={intent}
          type="button"
          onClick={() => onChange(intent)}
          aria-pressed={value === intent}
          className={cx(
            "h-9 min-w-20 rounded-control px-4 text-sm font-medium transition-colors",
            value === intent
              ? "bg-brand text-brand-ink shadow-soft"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {intent === "rent" ? "Rent" : "Buy"}
        </button>
      ))}
    </div>
  );
}
