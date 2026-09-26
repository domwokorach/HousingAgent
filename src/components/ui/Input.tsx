import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/utils";

/** Shared control chrome, reused by Input, Textarea and Select. */
/**
 * `line-strong` rather than `line`: a form control has to be distinguishable
 * from the card it sits on, and the softer border is too faint on white.
 */
export const CONTROL_BASE =
  "w-full rounded-control border border-line-strong bg-surface px-3.5 text-ink placeholder:text-placeholder transition-colors duration-150 hover:border-line-strong-strong focus:border-link";

export function Input({
  className,
  invalid,
  ...props
}: ComponentPropsWithRef<"input"> & { invalid?: boolean }) {
  return (
    <input
      className={cx(CONTROL_BASE, "h-11", invalid && "border-danger", className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
