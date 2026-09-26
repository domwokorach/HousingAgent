"use client";

import { useState } from "react";
import { SORT_OPTIONS } from "@/constants/propertyTypes";
import { useSearch } from "@/hooks/useSearch";
import { cx } from "@/lib/utils";
import type { Intent } from "@/types/property";
import type { SortOption } from "@/types/search";
import { IconPin, IconSearch } from "@/components/ui/Icons";
import { Alert, Button, EmptyState, Select } from "@/components/ui";
import { PropertyFilters } from "@/components/properties/PropertyFilters";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { PropertiesMap, pinFromProperty } from "@/components/maps/PropertiesMap";

/**
 * The shared results experience behind /properties, /rent and /buy. All state
 * lives in the URL via `useSearch`, so results are linkable and the back
 * button steps through searches.
 */
export function SearchResults({
  basePath,
  lockedIntent,
  heading,
  intro,
}: {
  basePath: string;
  lockedIntent?: Intent;
  heading: string;
  intro: string;
}) {
  const {
    hydrated,
    criteria,
    applyCriteria,
    clear,
    activeFilterCount,
    results,
    centre,
    unresolvedLocation,
  } = useSearch({ basePath, lockedIntent });

  const [showMap, setShowMap] = useState(true);

  // Cap the pins so a nationwide search doesn't put hundreds of markers on
  // the map; the cards below remain the complete list.
  const mapped = results.slice(0, 40).map((result) => result.property);
  const pins = mapped.map(pinFromProperty);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {heading}
        </h1>
        <p className="mt-3 text-lg text-ink-muted">{intro}</p>
      </header>

      <div className="mt-8">
        <PropertyFilters
          criteria={criteria}
          onApply={applyCriteria}
          lockIntent={Boolean(lockedIntent)}
        />
      </div>

      {unresolvedLocation && (
        <Alert tone="info" className="mt-6">
          We don&apos;t recognise the postcode <strong>{criteria.query}</strong> yet. This
          demo covers a sample of UK areas — try SW11, M20, LS6, BS8, EH3, CB1 or a town
          name.
        </Alert>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-lg font-semibold text-ink" aria-live="polite">
            {hydrated ? results.length : "—"}{" "}
            {results.length === 1 ? "property" : "properties"}
            {criteria.intent !== "any" &&
              (criteria.intent === "rent" ? " to rent" : " for sale")}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-muted">
            {centre ? (
              <>
                <IconPin className="size-4" />
                Within {criteria.radius} mile{criteria.radius === 1 ? "" : "s"} of{" "}
                {centre.label}
              </>
            ) : criteria.query ? (
              <>
                <IconSearch className="size-4" />
                Matching &ldquo;{criteria.query}&rdquo;
              </>
            ) : (
              <>
                Showing everything across the UK
                {activeFilterCount > 0 && " that matches your filters"}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-ink-muted">
            Sort by
          </label>
          <Select
            id="sort"
            value={criteria.sort}
            onChange={(event) =>
              applyCriteria({ ...criteria, sort: event.target.value as SortOption })
            }
            className="h-10 w-48"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={() => setShowMap((open) => !open)}
            className="hidden lg:inline-flex"
            aria-pressed={showMap}
          >
            {showMap ? "Hide map" : "Show map"}
          </Button>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No properties match this search"
            description="Try widening the radius, raising the maximum price, or removing the property type filter."
            action={
              <Button variant="secondary" onClick={clear}>
                Clear all filters
              </Button>
            }
          />
        </div>
      ) : (
        <div
          className={cx(
            "mt-6 grid gap-6",
            showMap ? "lg:grid-cols-[1fr_380px]" : "lg:grid-cols-1",
          )}
        >
          <PropertyGrid
            results={results}
            columns={showMap ? 2 : 3}
            className={showMap ? "xl:grid-cols-2" : undefined}
          />

          {showMap && (
            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <PropertiesMap
                  pins={pins}
                  centre={centre ?? undefined}
                  radiusMiles={centre ? criteria.radius : undefined}
                  caption={
                    mapped.length < results.length
                      ? `Showing ${mapped.length} of ${results.length} results on the map`
                      : centre
                        ? `${results.length} results near ${centre.label}`
                        : `${results.length} results across the UK`
                  }
                  className="aspect-[4/5]"
                />
              </div>
            </aside>
          )}
        </div>
      )}
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="h-10 w-80 animate-pulse rounded-control bg-surface-2" />
      <div className="mt-4 h-6 w-full max-w-xl animate-pulse rounded-control bg-surface-2" />
      <div className="mt-8 h-64 animate-pulse rounded-card bg-surface-2" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="h-96 animate-pulse rounded-card bg-surface-2" />
        ))}
      </div>
    </div>
  );
}
