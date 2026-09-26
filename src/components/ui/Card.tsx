import type { ReactNode } from "react";
import { cx } from "@/lib/utils";

export function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("rounded-card border border-line bg-surface shadow-soft", className)}>
      {children}
    </div>
  );
}
