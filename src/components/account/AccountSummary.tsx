"use client";

import { ACCOUNT_TYPE_LABELS } from "@/constants/accountTypes";
import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { IconTrash } from "@/components/ui/Icons";
import { Button, ButtonLink, Card } from "@/components/ui";

/** Read-only account facts, plus the way out: logout and account deletion. */
export function AccountSummary() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold tracking-tight text-ink">Account</h2>

      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {[
          ["Email address", user.email],
          ["Account type", ACCOUNT_TYPE_LABELS[user.accountType]],
          ["Member since", formatDate(user.createdAt)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-ink-muted">{label}</dt>
            <dd className="mt-0.5 font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button variant="secondary" onClick={() => void logout()}>
          Logout
        </Button>
        <ButtonLink
          href={ROUTES.deleteAccount}
          variant="ghost"
          className="text-danger hover:bg-danger-soft hover:text-danger"
        >
          <IconTrash className="size-4" />
          Delete account
        </ButtonLink>
      </div>
    </Card>
  );
}
