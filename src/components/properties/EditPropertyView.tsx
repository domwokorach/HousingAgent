"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProperties } from "@/hooks/useProperties";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PropertyForm } from "./PropertyForm";
import { PropertyImageManager } from "./PropertyImageManager";

function Body({ propertyId }: { propertyId: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { getProperty } = useProperties();
  const property = getProperty(propertyId);

  if (!user) return null;

  if (!property) {
    return (
      <EmptyState
        title="That listing no longer exists"
        description="It may have been removed. Check your listings to see what's still advertised."
        action={<ButtonLink href={ROUTES.myProperties}>My Properties</ButtonLink>}
      />
    );
  }

  // Only the account that listed it, or the agent marketing it, may edit.
  const owns =
    property.ownerEmail === user.email ||
    (user.accountType === "agent" && property.agentId === user.email);

  if (!owns) {
    return (
      <EmptyState
        title="You can't edit this listing"
        description="Only the landlord, seller or agent who advertised a property can change it."
        action={
          <ButtonLink href={ROUTES.property(property.id)} variant="secondary">
            View the listing
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="p-6 sm:p-8">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Property details</h2>
        <div className="mt-6">
          <PropertyForm
            property={property}
            onCancel={() => router.push(ROUTES.myProperties)}
            onSaved={(id) => router.push(ROUTES.property(id))}
          />
        </div>
      </Card>

      <Card className="p-6 sm:p-8">
        <PropertyImageManager property={property} />
      </Card>
    </div>
  );
}

export function EditPropertyView({ propertyId }: { propertyId: string }) {
  return (
    <RequireAuth
      title="Sign in to edit this listing"
      description="Only the landlord, seller or agent who advertised a property can change it."
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={ROUTES.myProperties} className="hover:text-link-hover">
                My Properties
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              Edit listing
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Edit listing
        </h1>

        <div className="mt-8">
          <Body propertyId={propertyId} />
        </div>
      </div>
    </RequireAuth>
  );
}
