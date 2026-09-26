import type { ComponentPropsWithRef, ReactNode } from "react";
import { cx } from "@/lib/utils";
import { IconWarning } from "./Icons";

export function Checkbox({
  id,
  label,
  error,
  className,
  ...props
}: ComponentPropsWithRef<"input"> & { id: string; label: ReactNode; error?: string }) {
  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <div className="flex items-start gap-2.5">
        <input
          id={id}
          type="checkbox"
          className="mt-0.5 size-[18px] shrink-0 cursor-pointer rounded border-line-strong"
          aria-invalid={error ? true : undefined}
          {...props}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-6 text-ink">
          {label}
        </label>
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-danger">
          <IconWarning className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
