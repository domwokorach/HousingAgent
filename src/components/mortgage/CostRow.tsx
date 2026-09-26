/** One line in a cost breakdown: label, optional note, right-aligned figure. */
export function CostRow({
  label,
  value,
  hint,
  strong = false,
}: {
  label: string;
  value: string;
  hint?: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <dt className={strong ? "font-medium text-ink" : "text-sm text-ink-muted"}>
        {label}
        {hint && <span className="block text-xs text-ink-muted/80">{hint}</span>}
      </dt>
      <dd
        className={
          strong
            ? "shrink-0 text-lg font-semibold tabular-nums text-ink"
            : "shrink-0 tabular-nums text-ink"
        }
      >
        {value}
      </dd>
    </div>
  );
}
