"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFavourites } from "@/hooks/useFavourites";
import { useProperties } from "@/hooks/useProperties";
import { validate } from "@/validation";
import { deleteAccountSchema } from "@/validation/account.schema";
import { IconTrash, IconWarning } from "@/components/ui/Icons";
import { Alert, Button, ButtonLink, Field, Input, Modal } from "@/components/ui";

const CONSEQUENCES = [
  "Your profile, name, email address and phone number",
  "Every property you have saved to your shortlist",
  "Any properties you have listed, and their photos",
  "Your enquiry history with agents",
];

/**
 * Deliberately slow: it explains what goes, asks for the password, and then
 * asks once more. Cancel is available at every step.
 */
export function DeleteAccountForm() {
  const router = useRouter();
  const { user, verifyPassword, deleteAccount } = useAuth();
  const { savedIds } = useFavourites();
  const { myListings } = useProperties();

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!user) return null;

  const handleContinue = async () => {
    const parsed = validate(deleteAccountSchema, { password });
    if (!parsed.ok) {
      setError(parsed.errors.password);
      return;
    }
    if (!(await verifyPassword(password))) {
      setError("That password does not match this account.");
      return;
    }
    setError(undefined);
    setConfirming(true);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteAccount(password);
      if (!result.ok) {
        setConfirming(false);
        setError(result.error);
        return;
      }
      router.push(`${ROUTES.home}?deleted=1`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="rounded-card border border-danger/40 bg-danger-soft p-6">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-danger">
          <IconWarning className="size-5 shrink-0" />
          Delete your account
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink">
          Deleting your account is <strong>permanent</strong>. It cannot be undone, and we
          cannot restore anything afterwards. You will be signed out immediately.
        </p>

        <p className="mt-4 text-sm font-medium text-ink">This removes:</p>
        <ul className="mt-2 flex max-w-2xl flex-col gap-1.5 text-sm text-ink">
          {CONSEQUENCES.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span
                aria-hidden="true"
                className="mt-2 size-1.5 shrink-0 rounded-full bg-danger"
              />
              {item}
            </li>
          ))}
        </ul>

        <p className="mt-3 text-sm text-ink-muted">
          You currently have {savedIds.length} saved{" "}
          {savedIds.length === 1 ? "property" : "properties"} and {myListings.length}{" "}
          {myListings.length === 1 ? "listing" : "listings"}.
        </p>

        <form
          noValidate
          className="mt-6 max-w-md"
          onSubmit={(event) => {
            event.preventDefault();
            void handleContinue();
          }}
        >
          <Field
            label="Confirm your password"
            htmlFor="delete-password"
            required
            error={error}
            hint={
              error
                ? undefined
                : `Enter the password for ${user.email} to continue.`
            }
          >
            <Input
              id="delete-password"
              type="password"
              autoComplete="current-password"
              value={password}
              invalid={Boolean(error)}
              onChange={(event) => {
                setPassword(event.target.value);
                setError(undefined);
              }}
            />
          </Field>

          <div className="mt-5 flex flex-wrap gap-3">
            <ButtonLink href={ROUTES.settings} variant="secondary">
              Cancel
            </ButtonLink>
            <Button type="submit" variant="danger">
              <IconTrash className="size-4" />
              Delete Account
            </Button>
          </div>
        </form>
      </div>

      <Modal
        open={confirming}
        onClose={() => setConfirming(false)}
        title="Last chance — are you sure?"
        description={
          <>
            Your password is confirmed. Selecting <strong>Delete Account permanently</strong>{" "}
            below will immediately and permanently remove your account and everything
            listed above.
          </>
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={() => void handleDelete()}>
              <IconTrash className="size-4" />
              Delete Account permanently
            </Button>
          </>
        }
      >
        <Alert>There is no undo, and no way to recover the account afterwards.</Alert>
      </Modal>
    </>
  );
}
