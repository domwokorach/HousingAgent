"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { canListProperties } from "@/constants/accountTypes";
import { PROPERTY_TYPE_LABELS } from "@/constants/propertyTypes";
import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { formatDate, formatPriceShort } from "@/lib/utils";
import type { Property } from "@/types/property";
import { IconTrash, IconWarning } from "@/components/ui/Icons";
import { Alert, Badge, Button, ButtonLink, Card, EmptyState, Photo } from "@/components/ui";
import { PropertyImageManager } from "@/components/properties/PropertyImageManager";

function ListingRow({
  property,
  onDelete,
}: {
  property: Property;
  onDelete: () => void;
}) {
  const [managing, setManaging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const cover = property.images[0];

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <div className="aspect-[3/2] w-full shrink-0 overflow-hidden rounded-control bg-surface-2 sm:w-48">
          {cover ? (
            <Photo src={cover.src} alt={cover.alt} sizes="192px" />
          ) : (
            <div className="grid h-full place-items-center px-2 text-center text-xs text-ink-muted">
              No photos yet
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              {property.intent === "rent" ? "To rent" : "For sale"}
            </Badge>
            <span className="text-sm text-ink-muted">
              Listed {formatDate(property.listedAt)}
            </span>
          </div>

          <h3 className="mt-2 text-lg font-semibold leading-snug text-ink">
            <Link href={ROUTES.property(property.id)} className="hover:text-link-hover">
              {property.title}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-ink-muted">
            {property.addressLine1}, {property.town} {property.postcode}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            {formatPriceShort(property.price)}
            {property.intent === "rent" && " pcm"} · {property.bedrooms} bed ·{" "}
            {property.bathrooms} bath · {PROPERTY_TYPE_LABELS[property.type]} ·{" "}
            {property.images.length} photo{property.images.length === 1 ? "" : "s"}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <ButtonLink
              href={ROUTES.propertyEdit(property.id)}
              size="sm"
              variant="secondary"
            >
              Edit details
            </ButtonLink>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setManaging((open) => !open)}
              aria-expanded={managing}
            >
              {managing ? "Hide photos" : "Manage photos"}
            </Button>
            <ButtonLink href={ROUTES.property(property.id)} size="sm" variant="ghost">
              View listing
            </ButtonLink>
            <Button
              size="sm"
              variant="ghost"
              className="ml-auto text-danger hover:bg-danger-soft hover:text-danger"
              onClick={() => setConfirming(true)}
            >
              <IconTrash className="size-4" />
              Remove
            </Button>
          </div>

          {confirming && (
            <div className="mt-4 rounded-control border border-danger/40 bg-danger-soft p-4">
              <p className="flex items-start gap-2 text-sm text-ink">
                <IconWarning className="mt-0.5 size-4 shrink-0 text-danger" />
                Remove this listing? It will no longer appear in search results. This
                cannot be undone.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                  Cancel
                </Button>
                <Button size="sm" variant="danger" onClick={onDelete}>
                  Remove listing
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {managing && (
        <div className="border-t border-line bg-surface-2/40 p-4 sm:p-6">
          <PropertyImageManager property={property} />
        </div>
      )}
    </Card>
  );
}

export function MyPropertiesPanel() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { myListings, deleteProperty } = useProperties();
  const [notice, setNotice] = useState<string>();

  if (!user) return null;

  // Set by the create page on a successful redirect.
  const justCreated = searchParams.get("created") === "1";
  const message =
    notice ??
    (justCreated
      ? "Listing created. Use “Manage photos” to add images before it goes live."
      : undefined);

  if (!canListProperties(user.accountType)) {
    return (
      <EmptyState
        title="Listing is for landlords, sellers and agents"
        description="Tenant and buyer accounts can search, shortlist and enquire. To advertise a property, create a landlord/seller or housing agent account."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <ButtonLink href={ROUTES.saved}>Your shortlist</ButtonLink>
            <ButtonLink href={ROUTES.register} variant="secondary">
              Create a listing account
            </ButtonLink>
          </div>
        }
      />
    );
  }

  return (
    <div>
      {message && (
        <Alert tone="success" className="mb-6">
          {message}
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-lg font-semibold text-ink">
          {myListings.length} {myListings.length === 1 ? "listing" : "listings"}
        </p>
        <ButtonLink href={ROUTES.propertyCreate}>Add a property</ButtonLink>
      </div>

      {myListings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="You haven't listed anything yet"
            description="Add your first property, then upload photos of the exterior, living room, kitchen, bedrooms, bathrooms, garden and parking."
            action={
              <ButtonLink href={ROUTES.propertyCreate}>Add a property</ButtonLink>
            }
          />
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
          {myListings.map((property) => (
            <li key={property.id}>
              <ListingRow
                property={property}
                onDelete={() => {
                  void deleteProperty(property.id);
                  setNotice(`"${property.title}" has been removed.`);
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
