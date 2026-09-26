"use client";

import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ButtonLink } from "@/components/ui";

/** The account call-to-action band, hidden once someone is signed in. */
export function SignedOutCta() {
  const { hydrated, user } = useAuth();
  if (!hydrated || user) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="overflow-hidden rounded-card border border-line bg-cream px-6 py-10 sm:px-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold tracking-tight text-ink">
              Create an account to save properties and track enquiries
            </h2>
            <p className="mt-2 text-ink-muted">
              Tenants and buyers keep a shortlist. Landlords, sellers and agents list
              properties, manage photos and reply to enquiries in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={ROUTES.register} size="lg">
              Create Account
            </ButtonLink>
            <ButtonLink href={ROUTES.login} variant="secondary" size="lg">
              Login
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
