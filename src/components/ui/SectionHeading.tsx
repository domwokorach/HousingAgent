import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-link">
            {eyebrow}
          </p>
        )}
        <h2 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h2>
        {description && <p className="mt-2 text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
