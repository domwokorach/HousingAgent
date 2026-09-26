import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/utils";
import { CONTROL_BASE } from "./Input";

/** Inline chevron, so the control looks the same in both themes. */
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%239A8F82' stroke-width='2' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")";

export function Select({
  className,
  invalid,
  children,
  ...props
}: ComponentPropsWithRef<"select"> & { invalid?: boolean }) {
  return (
    <select
      className={cx(
        CONTROL_BASE,
        "h-11 appearance-none pr-9",
        invalid && "border-danger",
        className,
      )}
      style={{
        backgroundImage: CHEVRON,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.6rem center",
        backgroundSize: "1.1rem",
      }}
      aria-invalid={invalid || undefined}
      {...props}
    >
      {children}
    </select>
  );
}
