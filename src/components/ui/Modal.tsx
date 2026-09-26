"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cx } from "@/lib/utils";
import { IconClose } from "./Icons";

const SIZES = {
  sm: "max-w-lg",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  full: "max-w-none h-dvh w-full",
} as const;

/**
 * A modal dialog: closes on Escape and on a backdrop click, locks the page
 * behind it, and moves focus inside when it opens.
 *
 * `variant="bare"` drops the panel chrome for full-bleed content such as the
 * photo viewer.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "sm",
  variant = "panel",
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof SIZES;
  variant?: "panel" | "bare";
  className?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus the first control, or the panel itself if it has none.
    const focusable = panelRef.current?.querySelector<HTMLElement>(
      'input:not([type="hidden"]), textarea, select, button, [href], [tabindex]:not([tabindex="-1"])',
    );
    (focusable ?? panelRef.current)?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const titleId = `modal-title-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <div
      className={cx(
        "fixed inset-0 z-50 flex p-4 backdrop-blur-sm",
        // Warm dark rather than black, so the overlay matches the palette.
        variant === "bare"
          ? "flex-col bg-[#2f2a24]/95 p-0"
          : "items-center justify-center bg-[#2f2a24]/55",
      )}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          "w-full outline-none",
          SIZES[size],
          variant === "panel" &&
            "max-h-[85vh] overflow-y-auto rounded-card border border-line bg-surface p-6 shadow-pop",
          variant === "bare" && "flex h-dvh flex-col",
          className,
        )}
      >
        {variant === "panel" ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <h2 id={titleId} className="text-xl font-semibold tracking-tight text-ink">
                {title}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-control text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
              >
                <IconClose className="size-5" />
              </button>
            </div>

            {description && (
              <div className="mt-3 text-sm leading-relaxed text-ink-muted">
                {description}
              </div>
            )}

            {children && <div className="mt-5">{children}</div>}

            {footer && (
              <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>
            )}
          </>
        ) : (
          <>
            <h2 id={titleId} className="sr-only">
              {title}
            </h2>
            {children}
          </>
        )}
      </div>
    </div>
  );
}
