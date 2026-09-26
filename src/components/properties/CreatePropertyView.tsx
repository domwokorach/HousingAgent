"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { canListProperties } from "@/constants/accountTypes";
import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ButtonLink, Card, EmptyState } from "@/components/ui";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { PropertyForm } from "./PropertyForm";

function Body() {
  const router = useRouter();
  const { user } = useAuth();
  if (!user) return null;

  if (!canListProperties(user.accountType)) {
    return (
      <EmptyState
        title="Listing is for landlords, sellers and agents"
        description="Tenant and buyer accounts can search, shortlist and enquire. To advertise a property, create a landlord/seller or housing agent account."
        action={
          <ButtonLink href={ROUTES.saved} variant="secondary">
            Back to your shortlist
          </ButtonLink>
        }
      />
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink">Property details</h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Fill these in, then add photos from{" "}
        <Link href={ROUTES.myProperties} className="text-link underline underline-offset-4">
          My Properties
        </Link>
        .
      </p>
      <div className="mt-6">
        <PropertyForm
          onCancel={() => router.push(ROUTES.myProperties)}
          onSaved={() => router.push(`${ROUTES.myProperties}?created=1`)}
        />
      </div>
    </Card>
  );
}

export function CreatePropertyView() {
  return (
    <RequireAuth
      title="Sign in to list a property"
      description="Landlords, sellers and housing agents can advertise a property here."
    >
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href={ROUTES.account} className="hover:text-link-hover">
                Account
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={ROUTES.myProperties} className="hover:text-link-hover">
                My Properties
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              Add a property
            </li>
          </ol>
        </nav>

        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Add a property
        </h1>
        <p className="mt-2 text-ink-muted">
          Describe the home accurately — renters and buyers rely on what you write here.
        </p>

        <div className="mt-8">
          <Body />
        </div>
      </div>
    </RequireAuth>
  );
}
