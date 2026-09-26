"use client";

import { useState } from "react";
import { formatPriceShort, formatRelative } from "@/lib/utils";
import type { LiveListing } from "@/types/listing";
import type { PropertyImage } from "@/types/property";
import { IconBath, IconBed, IconKey, IconPin } from "@/components/ui/Icons";
import { Badge, Button, Modal, Photo } from "@/components/ui";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyMap } from "@/components/maps/PropertyMap";

/** Adapts the provider's bare image URLs to the gallery's shape. */
function toGalleryImages(listing: LiveListing): PropertyImage[] {
  return listing.images.map((src, index) => ({
    id: `${listing.id}-${index}`,
    src,
    category: "other" as const,
    alt: `Photo ${index + 1} of ${listing.address}`,
  }));
}

function priceLabel(listing: LiveListing): string {
  if (listing.price === null) return "Price on application";
  return `${formatPriceShort(listing.price)}${listing.intent === "rent" ? " pcm" : ""}`;
}

/**
 * A live listing from the provider feed.
 *
 * Separate from `PropertyCard` on purpose: a live listing has no floor area,
 * EPC, description or availability date, and padding those out with
 * placeholders would put invented facts in front of people. This renders only
 * what the provider actually sent.
 */
export function LiveListingCard({ listing }: { listing: LiveListing }) {
  const [open, setOpen] = useState(false);
  const cover = listing.images[0];
  const intentLabel = listing.intent === "rent" ? "To rent" : "For sale";

  // The provider's status is often just "For sale"/"To rent" again. Only show
  // it when it actually adds something, like "Under offer".
  const status =
    listing.status && listing.status.toLowerCase() !== intentLabel.toLowerCase()
      ? listing.status
      : null;
  const facts = [
    listing.bedrooms !== null && { icon: IconBed, label: "Bedrooms", value: listing.bedrooms },
    listing.bathrooms !== null && { icon: IconBath, label: "Bathrooms", value: listing.bathrooms },
  ].filter(Boolean) as Array<{ icon: typeof IconBed; label: string; value: number }>;

  return (
    <>
      <article className="group flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift">
        <div className="relative aspect-[3/2] overflow-hidden bg-surface-2">
          {cover ? (
            <Photo
              src={cover}
              alt={listing.address}
              sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
              className="transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid h-full place-items-center px-4 text-center text-sm text-ink-subtle">
              No photo supplied
            </div>
          )}

          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            <Badge tone="brand" className="shadow-soft">
              {intentLabel}
            </Badge>
            {status && (
              <Badge tone="neutral" className="bg-surface shadow-soft">
                {status}
              </Badge>
            )}
          </div>

          {listing.images.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] font-medium text-white">
              {listing.images.length} photos
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <p className="text-xl font-bold tracking-tight text-ink">{priceLabel(listing)}</p>

          <p className="mt-1.5 flex items-start gap-1 text-sm text-ink-body">
            <IconPin className="mt-0.5 size-4 shrink-0" />
            {listing.address}
          </p>

          <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-subtle">
            {facts.map((fact) => (
              <div key={fact.label} className="flex items-center gap-1.5">
                <fact.icon className="size-4" />
                <dt className="sr-only">{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
            {listing.propertyType && (
              <div className="flex items-center gap-1.5">
                <IconKey className="size-4" />
                <dt className="sr-only">Property type</dt>
                <dd>{listing.propertyType}</dd>
              </div>
            )}
          </dl>

          <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-ink-subtle">
            <span className="truncate">{listing.agentName ?? "Agent not supplied"}</span>
            {listing.addedDate && (
              <span className="shrink-0">{formatRelative(listing.addedDate)}</span>
            )}
          </div>

          <Button className="mt-4 w-full" onClick={() => setOpen(true)}>
            View Property
          </Button>
        </div>
      </article>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="lg"
        title={listing.address}
        description={`${priceLabel(listing)}${listing.status ? ` · ${listing.status}` : ""}`}
      >
        <div className="flex flex-col gap-6">
          {listing.images.length > 0 ? (
            <PropertyGallery images={toGalleryImages(listing)} title={listing.address} />
          ) : (
            <p className="rounded-card border border-dashed border-line-strong px-6 py-10 text-center text-sm text-ink-subtle">
              The agent hasn&apos;t supplied photos for this listing.
            </p>
          )}

          <dl className="grid gap-3 sm:grid-cols-2">
            {[
              ["Price", priceLabel(listing)],
              ["Bedrooms", listing.bedrooms ?? "Not supplied"],
              ["Bathrooms", listing.bathrooms ?? "Not supplied"],
              ["Property type", listing.propertyType ?? "Not supplied"],
              ["Status", listing.status ?? "Not supplied"],
              ["Marketed by", listing.agentName ?? "Not supplied"],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-control border border-line bg-canvas px-4 py-3"
              >
                <dt className="text-xs uppercase tracking-wide text-ink-subtle">{label}</dt>
                <dd className="mt-0.5 text-sm font-medium text-ink">{String(value)}</dd>
              </div>
            ))}
          </dl>

          {listing.lat !== null && listing.lng !== null && (
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                Location
              </h3>
              <PropertyMap
                lat={listing.lat}
                lng={listing.lng}
                title={listing.address}
                label={priceLabel(listing)}
                className="mt-3 aspect-[16/9]"
                caption="Coordinates supplied by the listing feed."
              />
            </div>
          )}

          <p className="text-xs leading-relaxed text-ink-subtle">
            This listing comes from a third-party feed and is shown as supplied. It is
            not one of Housing Agent&apos;s own listings, so it can&apos;t be saved or
            enquired about here.
          </p>
        </div>
      </Modal>
    </>
  );
}
