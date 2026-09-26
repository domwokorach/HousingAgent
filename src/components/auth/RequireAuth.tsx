"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { ButtonLink, EmptyState } from "@/components/ui";

/**
 * Gate for the account area. The session lives in localStorage, so there is
 * nothing to check on the server: this renders a skeleton until storage has
 * been read, then either the page or a sign-in prompt.
 *
 * It is a UI affordance, not a security boundary — see src/lib/auth.ts.
 */
export function RequireAuth({
  children,
  title = "Sign in to view this page",
  description = "Your account, saved properties and listings are kept in this browser. Sign in to pick up where you left off.",
}: {
  children: ReactNode;
  title?: string;
  description?: string;
}) {
  const { hydrated, user } = useAuth();
  const pathname = usePathname();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="h-9 w-64 animate-pulse rounded-control bg-surface-2" />
        <div className="mt-8 h-64 animate-pulse rounded-card bg-surface-2" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <EmptyState
          title={title}
          description={description}
          action={
            <div className="flex flex-wrap justify-center gap-3">
              <ButtonLink href={`${ROUTES.login}?next=${encodeURIComponent(pathname)}`}>
                Login
              </ButtonLink>
              <ButtonLink href={ROUTES.register} variant="secondary">
                Create Account
              </ButtonLink>
            </div>
          }
        />
      </div>
    );
  }

  return <>{children}</>;
}
