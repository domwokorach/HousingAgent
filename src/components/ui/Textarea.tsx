import type { ComponentPropsWithRef } from "react";
import { cx } from "@/lib/utils";
import { CONTROL_BASE } from "./Input";

export function Textarea({
  className,
  invalid,
  ...props
}: ComponentPropsWithRef<"textarea"> & { invalid?: boolean }) {
  return (
    <textarea
      className={cx(
        CONTROL_BASE,
        "py-2.5 leading-relaxed",
        invalid && "border-danger",
        className,
      )}
      aria-invalid={invalid || undefined}
      {...props}
    />
  );
}
