"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { validate } from "@/validation";
import { changePasswordSchema } from "@/validation/account.schema";
import { Alert, Button, Card, Field, Input } from "@/components/ui";

export function ChangePasswordForm() {
  const { changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    const values = { currentPassword, newPassword, confirmPassword };
    const parsed = validate(changePasswordSchema, values);
    setDone(false);

    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    setSaving(true);
    try {
      const result = await changePassword(parsed.data);
      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.error });
        return;
      }
      setErrors({});
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setDone(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold tracking-tight text-ink">Change password</h2>
      <p className="mt-1.5 text-sm text-ink-muted">
        Use at least 8 characters, including a letter and a number.
      </p>

      {done && (
        <Alert tone="success" className="mt-4">
          Your password has been changed.
        </Alert>
      )}
      {errors.form && <Alert className="mt-4">{errors.form}</Alert>}

      <form
        noValidate
        className="mt-5 flex max-w-md flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSubmit();
        }}
      >
        <Field
          label="Current password"
          htmlFor="pw-current"
          required
          error={errors.currentPassword}
        >
          <Input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            invalid={Boolean(errors.currentPassword)}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </Field>

        <Field label="New password" htmlFor="pw-next" required error={errors.newPassword}>
          <Input
            id="pw-next"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            invalid={Boolean(errors.newPassword)}
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </Field>

        <Field
          label="Confirm new password"
          htmlFor="pw-confirm"
          required
          error={errors.confirmPassword}
        >
          <Input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            invalid={Boolean(errors.confirmPassword)}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </Field>

        <Button type="submit" className="self-start" loading={saving}>
          Update password
        </Button>
      </form>
    </Card>
  );
}
