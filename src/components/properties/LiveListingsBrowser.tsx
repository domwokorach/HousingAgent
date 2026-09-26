"use client";

import { useId, useState } from "react";
import { BEDROOM_OPTIONS, priceSteps } from "@/constants/propertyTypes";
import { useLiveListings } from "@/hooks/useLiveListings";
import { formatPriceShort } from "@/lib/utils";
import type { Intent } from "@/types/property";
import { IconSearch } from "@/components/ui/Icons";
import { Alert, Button, EmptyState, Field, Input, Select } from "@/components/ui";
import { IntentToggle } from "@/components/search/IntentToggle";
import { PropertiesMap } from "@/components/maps/PropertiesMap";
import { LiveListingCard } from "./LiveListingCard";

/** How many listings to pull. Each one returned costs provider credit. */
const PAGE_SIZES = [6, 12, 24];

export function LiveListingsBrowser() {
  const id = useId();
  const { results, error, unconfigured, loading, hasSearched, search } = useLiveListings();

  const [location, setLocation] = useState("Manchester");
  const [intent, setIntent] = useState<Intent>("buy");
  const [minBedrooms, setMinBedrooms] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(12);
  const [locationError, setLocationError] = useState<string>();

  const mappable = (results?.listings ?? []).filter(
    (listing) => listing.lat !== null && listing.lng !== null,
  );

  const handleSubmit = () => {
    if (!location.trim()) {
      setLocationError("Enter a town, city or area to search.");
      return;
    }
    setLocationError(undefined);
    void search({ location, intent, minBedrooms, maxPrice, pageSize });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Live listings
        </h1>
        <p className="mt-3 text-lg text-ink-body">
          Search properties currently on the market across the UK, straight from the
          Homedata feed. These sit alongside Housing Agent&apos;s own listings rather
          than replacing them.
        </p>
      </header>

      <form
        className="mt-8 rounded-card border border-line bg-surface p-5 shadow-soft sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <IntentToggle value={intent} onChange={setIntent} className="mb-4" />

        <div className="grid gap-4 lg:grid-cols-4">
          <Field
            label="Town, city or area"
            htmlFor={`${id}-location`}
            required
            error={locationError}
            hint={locationError ? undefined : "e.g. Manchester, Leeds, Camden"}
          >
            <Input
              id={`${id}-location`}
              value={location}
              invalid={Boolean(locationError)}
              onChange={(event) => {
                setLocation(event.target.value);
                setLocationError(undefined);
              }}
            />
          </Field>

          <Field label="Bedrooms (minimum)" htmlFor={`${id}-beds`}>
            <Select
              id={`${id}-beds`}
              value={minBedrooms ?? ""}
              onChange={(event) =>
                setMinBedrooms(event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">Any</option>
              {BEDROOM_OPTIONS.map((beds) => (
                <option key={beds} value={beds}>
                  {beds}+ bedroom{beds > 1 ? "s" : ""}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Maximum price" htmlFor={`${id}-max`}>
            <Select
              id={`${id}-max`}
              value={maxPrice ?? ""}
              onChange={(event) =>
                setMaxPrice(event.target.value ? Number(event.target.value) : null)
              }
            >
              <option value="">No maximum</option>
              {priceSteps(intent)
                .slice(1)
                .map((step) => (
                  <option key={step} value={step}>
                    {formatPriceShort(step)}
                  </option>
                ))}
            </Select>
          </Field>

          <Field
            label="Results to fetch"
            htmlFor={`${id}-size`}
            hint="Each listing returned costs credit."
          >
            <Select
              id={`${id}-size`}
              value={pageSize}
              onChange={(event) => setPageSize(Number(event.target.value))}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size} listings
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Button type="submit" size="lg" className="mt-4" loading={loading}>
          <IconSearch className="size-5" />
          Search live listings
        </Button>
      </form>

      {unconfigured && (
        <Alert tone="info" className="mt-6">
          <p className="font-semibold">Live listings aren&apos;t switched on.</p>
          <p className="mt-1">
            Add a <code className="font-mono">HOMEDATA_API_KEY</code> to{" "}
            <code className="font-mono">.env.local</code> and restart the dev server.
            Everything else in the app works without it — see README.md.
          </p>
        </Alert>
      )}

      {error && !unconfigured && (
        <Alert className="mt-6" tone="danger">
          {error}
        </Alert>
      )}

      {results && (
        <>
          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
            <p className="text-lg font-semibold text-ink" aria-live="polite">
              {results.listings.length}{" "}
              {results.listings.length === 1 ? "listing" : "listings"}
              {results.total > results.listings.length && (
                <span className="ml-2 text-base font-normal text-ink-muted">
                  of {results.total.toLocaleString("en-GB")} found in{" "}
                  {results.boundary ?? results.location}
                </span>
              )}
            </p>
            <p className="text-sm text-ink-subtle">Supplied by Homedata</p>
          </div>

          {results.listings.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nothing on the market matched"
                description="Try a wider area, a higher maximum price, or fewer bedrooms."
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="grid gap-6 sm:grid-cols-2">
                {results.listings.map((listing) => (
                  <LiveListingCard key={listing.id} listing={listing} />
                ))}
              </div>

              {mappable.length > 0 && (
                <aside className="hidden lg:block">
                  <div className="sticky top-24">
                    <PropertiesMap
                      pins={mappable.map((listing) => ({
                        id: listing.id,
                        lat: listing.lat as number,
                        lng: listing.lng as number,
                        title: listing.address,
                        price: listing.price,
                        intent: listing.intent,
                        bedrooms: listing.bedrooms,
                        bathrooms: listing.bathrooms,
                        subtitle: listing.propertyType ?? undefined,
                      }))}
                      caption={`${mappable.length} of ${results.listings.length} listings have coordinates`}
                      className="aspect-[4/5]"
                    />
                  </div>
                </aside>
              )}
            </div>
          )}
        </>
      )}

      {!hasSearched && !loading && (
        <div className="mt-8">
          <EmptyState
            title="Search to see what's on the market"
            description="Live listings are fetched on demand rather than up front, because the provider charges for every listing returned."
          />
        </div>
      )}
    </div>
  );
}
