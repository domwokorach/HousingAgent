import { cx } from "@/lib/utils";

export function Spinner({
  className,
  label,
}: {
  className?: string;
  /** Provide when the spinner stands alone, so screen readers announce it. */
  label?: string;
}) {
  return (
    <>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
        className={cx("size-5 animate-spin", className)}
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="3" />
        <path
          d="M21 12a9 9 0 0 0-9-9"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </>
  );
}
