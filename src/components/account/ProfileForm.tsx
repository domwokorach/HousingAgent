"use client";

import { useState } from "react";
import { ACCOUNT_TYPE_LABELS } from "@/constants/accountTypes";
import { useAuth } from "@/hooks/useAuth";
import { formatDate } from "@/lib/utils";
import { validate } from "@/validation";
import { profileSchema } from "@/validation/account.schema";
import { Alert, Button, Card, Field, Input } from "@/components/ui";

export function ProfileForm() {
  const { user, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [lastUser, setLastUser] = useState(user);

  // Re-seed the form when the account record changes, without a syncing effect.
  if (lastUser !== user) {
    setLastUser(user);
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setPhone(user?.phone ?? "");
  }

  if (!user) return null;

  const cancel = () => {
    setEditing(false);
    setErrors({});
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setPhone(user.phone);
  };

  const handleSubmit = async () => {
    const parsed = validate(profileSchema, { firstName, lastName, phone });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile(parsed.data);
      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.error });
        return;
      }
      setErrors({});
      setEditing(false);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Your details</h2>
        {!editing && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            Edit details
          </Button>
        )}
      </div>

      {saved && !editing && (
        <Alert tone="success" className="mt-4">
          Your profile has been updated.
        </Alert>
      )}
      {errors.form && <Alert className="mt-4">{errors.form}</Alert>}

      {editing ? (
        <form
          noValidate
          className="mt-5 flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" htmlFor="pf-first" required error={errors.firstName}>
              <Input
                id="pf-first"
                autoComplete="given-name"
                value={firstName}
                invalid={Boolean(errors.firstName)}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </Field>

            <Field label="Last name" htmlFor="pf-last" required error={errors.lastName}>
              <Input
                id="pf-last"
                autoComplete="family-name"
                value={lastName}
                invalid={Boolean(errors.lastName)}
                onChange={(event) => setLastName(event.target.value)}
              />
            </Field>
          </div>

          <Field label="Phone number" htmlFor="pf-phone" required error={errors.phone}>
            <Input
              id="pf-phone"
              type="tel"
              autoComplete="tel"
              value={phone}
              invalid={Boolean(errors.phone)}
              onChange={(event) => setPhone(event.target.value)}
            />
          </Field>

          <Field
            label="Email address"
            htmlFor="pf-email"
            hint="Your email address is your sign-in name and can't be changed in this demo."
          >
            <Input id="pf-email" value={user.email} disabled />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
            <Button type="button" variant="secondary" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <dl className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            ["Name", `${user.firstName} ${user.lastName}`],
            ["Email address", user.email],
            ["Phone number", user.phone],
            ["Account type", ACCOUNT_TYPE_LABELS[user.accountType]],
            ["Member since", formatDate(user.createdAt)],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-ink-muted">{label}</dt>
              <dd className="mt-0.5 font-medium text-ink">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </Card>
  );
}
