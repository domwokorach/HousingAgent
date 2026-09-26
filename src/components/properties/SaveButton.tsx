"use client";

import { useFavourites } from "@/hooks/useFavourites";
import { cx } from "@/lib/utils";
import { IconHeart } from "@/components/ui/Icons";

export function SaveButton({
  propertyId,
  variant = "icon",
  className,
}: {
  propertyId: string;
  variant?: "icon" | "full";
  className?: string;
}) {
  const { hydrated, isSaved, toggle } = useFavourites();
  const saved = hydrated && isSaved(propertyId);
  const label = saved ? "Remove from saved properties" : "Save this property";

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={() => void toggle(propertyId)}
        aria-pressed={saved}
        className={cx(
          "inline-flex h-11 items-center justify-center gap-2 rounded-control border px-5 text-sm font-semibold transition-colors duration-150",
          saved
            ? "border-line-strong bg-cream text-ink"
            : "border-line-strong bg-surface text-ink-body hover:bg-surface-2 hover:text-ink",
          className,
        )}
      >
        <IconHeart className={cx("size-5", saved && "fill-current")} />
        {saved ? "Saved" : "Save property"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={(event) => {
        // The card is one big link; keep the heart from following it.
        event.preventDefault();
        event.stopPropagation();
        void toggle(propertyId);
      }}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cx(
        // White circle, soft border, dark heart — per the card spec.
        "grid size-9 place-items-center rounded-full border border-line bg-surface text-ink shadow-soft transition-colors duration-150 hover:bg-cream",
        saved && "border-line-strong bg-cream",
        className,
      )}
    >
      <IconHeart className={cx("size-5", saved && "fill-current")} />
    </button>
  );
}
