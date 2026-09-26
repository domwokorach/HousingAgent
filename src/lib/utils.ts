/** Joins class names, dropping anything falsy. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

const gbp0 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0,
});

const gbp2 = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(value: number, decimals = false): string {
  if (!Number.isFinite(value)) return "—";
  return decimals ? gbp2.format(value) : gbp0.format(Math.round(value));
}

/** Compact headline price: £425,000 stays, £1,250,000 becomes £1.25m. */
export function formatPriceShort(value: number): string {
  if (value >= 1_000_000) {
    return `£${(value / 1_000_000).toFixed(2).replace(/\.?0+$/, "")}m`;
  }
  return formatMoney(value);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/** "3 days ago", "2 weeks ago" — used for listing recency. */
export function formatRelative(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "—";
  const days = Math.floor((now - then) / 86_400_000);
  if (days <= 0) return "Added today";
  if (days === 1) return "Added yesterday";
  if (days < 14) return `Added ${days} days ago`;
  if (days < 60) return `Added ${Math.floor(days / 7)} weeks ago`;
  return `Added ${Math.floor(days / 30)} months ago`;
}

export function formatMiles(miles: number): string {
  return miles < 0.1 ? "here" : `${miles.toFixed(1)} mi`;
}

export function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Monotonic-ish ids, unique within this browser. Kept here so components and
 * services never call Date.now() during render.
 */
let idCounter = 0;
export function makeId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}
