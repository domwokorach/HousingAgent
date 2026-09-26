import Image from "next/image";
import type { JSX } from "react";
import { cx } from "@/lib/utils";

/** Shared prop shape between `Photo` and `RemotePhoto`, so callers can swap one for the other. */
export interface PhotoProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** Fit the whole image inside the box instead of cropping it to fill. */
  contain?: boolean;
}

export type PhotoComponent = (props: PhotoProps) => JSX.Element;

/**
 * Property photography ships as first-party SVG illustrations, and uploads are
 * data URLs. Both are served with a plain <img>: `next/image` would add nothing
 * for vectors, and its optimiser refuses SVG unless `dangerouslyAllowSVG` is
 * turned on, which is not worth doing for assets that need no optimising.
 */
export function Photo({
  src,
  alt,
  className,
  priority = false,
  sizes,
  contain = false,
}: PhotoProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      sizes={sizes}
      width={1200}
      height={800}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : undefined}
      className={cx(
        "block",
        contain ? "max-h-full max-w-full object-contain" : "h-full w-full object-cover",
        className,
      )}
    />
  );
}

/**
 * Real remote photography — currently just the Homedata live-listings feed
 * (see src/lib/homedata.ts). Unlike `Photo`'s local SVGs and data-URL
 * uploads, these are actual JPEGs on someone else's server, so next/image's
 * resizing and optimisation genuinely help. Needs a positioned ancestor with
 * a defined size, since it renders with `fill`. The hostname must be listed
 * under `images.remotePatterns` in next.config.ts or Next.js will refuse it.
 */
export function RemotePhoto({
  src,
  alt,
  className,
  priority = false,
  sizes,
  contain = false,
}: PhotoProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : "lazy"}
      className={cx(contain ? "object-contain" : "object-cover", className)}
    />
  );
}

export function Logo({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={160}
      height={160}
      loading="lazy"
      decoding="async"
      className={cx("block", className)}
    />
  );
}
