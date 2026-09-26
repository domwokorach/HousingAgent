"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IMAGE_CATEGORY_LABELS } from "@/constants/propertyTypes";
import { cx } from "@/lib/utils";
import type { PropertyImage } from "@/types/property";
import {
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconExpand,
} from "@/components/ui/Icons";
import { Modal, Photo } from "@/components/ui";

export function PropertyGallery({
  images,
  title,
}: {
  images: PropertyImage[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const thumbsRef = useRef<HTMLDivElement>(null);

  const count = images.length;
  const safeIndex = Math.min(index, Math.max(count - 1, 0));

  const go = useCallback(
    (delta: number) => setIndex((current) => (current + delta + count) % count),
    [count],
  );

  // Keep the active thumbnail in view as the main image changes.
  useEffect(() => {
    const active = thumbsRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    active?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [safeIndex]);

  // Arrow keys step through the gallery while the viewer is open.
  useEffect(() => {
    if (!fullscreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      else if (event.key === "ArrowLeft") go(-1);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [fullscreen, go]);

  if (count === 0) {
    return (
      <div className="grid aspect-[3/2] place-items-center rounded-card border border-dashed border-line bg-surface-2 text-sm text-ink-muted">
        No photos have been added to this listing yet.
      </div>
    );
  }

  const current = images[safeIndex];

  const arrow = (direction: -1 | 1, inViewer = false) => (
    <button
      type="button"
      onClick={() => go(direction)}
      aria-label={direction === -1 ? "Previous photo" : "Next photo"}
      className={cx(
        "grid place-items-center rounded-full transition-colors",
        inViewer
          ? "size-12 bg-white/12 text-white hover:bg-white/22"
          : "absolute top-1/2 size-11 -translate-y-1/2 border border-line bg-surface text-ink shadow-soft hover:bg-cream",
        !inViewer && (direction === -1 ? "left-3" : "right-3"),
        inViewer && (direction === -1 ? "absolute left-4" : "absolute right-4"),
      )}
    >
      {direction === -1 ? (
        <IconChevronLeft className={inViewer ? "size-6" : "size-5"} />
      ) : (
        <IconChevronRight className={inViewer ? "size-6" : "size-5"} />
      )}
    </button>
  );

  const thumbnails = (inViewer: boolean) => (
    <div
      ref={inViewer ? undefined : thumbsRef}
      role={inViewer ? undefined : "tablist"}
      aria-label={inViewer ? undefined : `Photos of ${title}`}
      className={cx(
        "flex gap-2 overflow-x-auto",
        inViewer ? "shrink-0 px-4 pb-4" : "mt-3 pb-1",
      )}
    >
      {images.map((image, i) => (
        <button
          key={image.id}
          type="button"
          role={inViewer ? undefined : "tab"}
          aria-selected={inViewer ? undefined : i === safeIndex}
          aria-label={
            inViewer
              ? `View photo ${i + 1}, ${IMAGE_CATEGORY_LABELS[image.category]}`
              : undefined
          }
          data-active={i === safeIndex}
          onClick={() => setIndex(i)}
          className={cx(
            "aspect-[3/2] shrink-0 overflow-hidden border-2 transition-colors",
            inViewer
              ? cx(
                  "w-24 rounded-control",
                  i === safeIndex
                    ? "border-white"
                    : "border-transparent opacity-60 hover:opacity-100",
                )
              : cx(
                  "w-28 rounded-control",
                  i === safeIndex ? "border-brand" : "border-transparent hover:border-line-strong",
                ),
          )}
        >
          <Photo src={image.src} alt="" sizes={inViewer ? "96px" : "112px"} />
          {!inViewer && (
            <span className="sr-only">{IMAGE_CATEGORY_LABELS[image.category]}</span>
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="relative overflow-hidden rounded-card border border-line bg-surface-2">
        <div className="aspect-[3/2]">
          <Photo
            src={current.src}
            alt={current.alt}
            priority
            sizes="(min-width: 1024px) 760px, 100vw"
          />
        </div>

        {count > 1 && (
          <>
            {arrow(-1)}
            {arrow(1)}
          </>
        )}

        <button
          type="button"
          onClick={() => setFullscreen(true)}
          className="absolute bottom-3 right-3 inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 text-sm font-semibold text-ink shadow-soft transition-colors hover:bg-cream"
        >
          <IconExpand className="size-4" />
          Full screen
        </button>

        <p className="absolute bottom-3 left-3 rounded-full bg-ink/75 px-3 py-1.5 text-xs font-medium text-white">
          {IMAGE_CATEGORY_LABELS[current.category]} · {safeIndex + 1} of {count}
        </p>
      </div>

      {count > 1 && thumbnails(false)}

      <Modal
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        title={`${title} — photo viewer`}
        variant="bare"
        size="full"
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 text-white">
          <p className="text-sm">
            <span className="font-medium">{title}</span>
            <span className="text-white/70">
              {" "}
              · {IMAGE_CATEGORY_LABELS[current.category]} · {safeIndex + 1} of {count}
            </span>
          </p>
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="grid size-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            aria-label="Close photo viewer"
          >
            <IconClose className="size-5" />
          </button>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4">
          <div className="flex h-full max-w-5xl items-center justify-center overflow-hidden rounded-card">
            <Photo
              src={current.src}
              alt={current.alt}
              priority
              contain
              sizes="100vw"
              className="rounded-card"
            />
          </div>
          {count > 1 && (
            <>
              {arrow(-1, true)}
              {arrow(1, true)}
            </>
          )}
        </div>

        {count > 1 && thumbnails(true)}
      </Modal>
    </div>
  );
}
