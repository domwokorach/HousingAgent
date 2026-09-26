import { cx } from "@/lib/utils";
import type { Property } from "@/types/property";
import type { SearchResult } from "@/types/search";
import { PropertyCard } from "./PropertyCard";

/**
 * Responsive grid of property cards. Accepts plain properties or search
 * results, so distance badges come through when a location was searched.
 */
export function PropertyGrid({
  properties,
  results,
  columns = 3,
  className,
}: {
  properties?: Property[];
  results?: SearchResult[];
  columns?: 2 | 3;
  className?: string;
}) {
  const items =
    results ??
    (properties ?? []).map((property) => ({
      property,
      distance: null,
      score: 0,
    }));

  return (
    <div
      className={cx(
        "grid gap-6 sm:grid-cols-2",
        columns === 3 && "lg:grid-cols-3",
        className,
      )}
    >
      {items.map((item, index) => (
        <PropertyCard
          key={item.property.id}
          property={item.property}
          distance={item.distance}
          priority={index < 2}
        />
      ))}
    </div>
  );
}

export function PropertyGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="h-96 animate-pulse rounded-card bg-surface-2" />
      ))}
    </div>
  );
}
