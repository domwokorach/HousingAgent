import { cx } from "@/lib/utils";

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
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
  /** Fit the whole image inside the box instead of cropping it to fill. */
  contain?: boolean;
}) {
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
