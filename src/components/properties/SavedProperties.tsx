"use client";

import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFavourites } from "@/hooks/useFavourites";
import { Button, ButtonLink, EmptyState } from "@/components/ui";
import { PropertyGrid, PropertyGridSkeleton } from "./PropertyGrid";

export function SavedProperties() {
  const { hydrated, favourites, clear } = useFavourites();
  const { user } = useAuth();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="h-9 w-64 animate-pulse rounded-control bg-surface-2" />
        <div className="mt-8">
          <PropertyGridSkeleton count={3} />
        </div>
      </div>
    );
  }

  const toRent = favourites.filter((property) => property.intent === "rent");
  const forSale = favourites.filter((property) => property.intent === "buy");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Saved properties
          </h1>
          <p className="mt-2 text-ink-muted">
            {favourites.length === 0
              ? "Nothing saved yet."
              : `${favourites.length} saved · ${toRent.length} to rent · ${forSale.length} for sale`}
          </p>
        </div>
        {favourites.length > 0 && (
          <Button variant="secondary" onClick={() => void clear()}>
            Clear all
          </Button>
        )}
      </header>

      {!user && favourites.length > 0 && (
        <p className="mt-6 rounded-control border border-brand/30 bg-cream px-4 py-3 text-sm text-link">
          You&apos;re browsing as a guest. Create an account to keep this shortlist tied to
          you rather than to this browser session.
        </p>
      )}

      {favourites.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="Your shortlist is empty"
            description="Tap the heart on any property to save it here. Your shortlist works across rent and sale, and stays put between visits."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <ButtonLink href={ROUTES.rent}>Browse rentals</ButtonLink>
                <ButtonLink href={ROUTES.buy} variant="secondary">
                  Browse homes for sale
                </ButtonLink>
              </div>
            }
          />
        </div>
      ) : (
        <PropertyGrid properties={favourites} className="mt-8" />
      )}
    </div>
  );
}
