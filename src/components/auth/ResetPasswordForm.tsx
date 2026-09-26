"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/constants/navigation";
import { resetPassword } from "@/services/auth.service";
import { validate } from "@/validation";
import { resetPasswordSchema } from "@/validation/auth.schema";
import { Alert, Button, Field, Input } from "@/components/ui";

/**
 * Sets a new password from a reset link. Real links carry a signed, expiring
 * token; with no server to mint or verify one, this only accepts the demo
 * token and says so plainly rather than pretending to authenticate.
 */
export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const emailFromLink = searchParams.get("email") ?? "";

  const [email, setEmail] = useState(emailFromLink);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="flex flex-col gap-5">
        <Alert tone="success">
          Your password has been changed. You can sign in with it now.
        </Alert>
        <Button size="lg" onClick={() => router.push(ROUTES.login)}>
          Go to login
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    const parsed = validate(resetPasswordSchema, { token, password, confirmPassword });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await resetPassword(token, email, password);
      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.error });
        return;
      }
      setErrors({});
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      {!token && (
        <Alert tone="info">
          This page expects a reset link with a token. This demo has no server or email
          service, so links can&apos;t be sent — change your password from{" "}
          <Link href={ROUTES.settings} className="font-medium underline underline-offset-4">
            Account Settings
          </Link>{" "}
          once you are signed in.
        </Alert>
      )}

      {errors.form && <Alert>{errors.form}</Alert>}
      {errors.token && <Alert>{errors.token}</Alert>}

      <Field label="Email address" htmlFor="rp-email" required error={errors.email}>
        <Input
          id="rp-email"
          type="email"
          autoComplete="email"
          value={email}
          invalid={Boolean(errors.email)}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>

      <Field label="New password" htmlFor="rp-password" required error={errors.password}>
        <Input
          id="rp-password"
          type="password"
          autoComplete="new-password"
          value={password}
          invalid={Boolean(errors.password)}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <Field
        label="Confirm new password"
        htmlFor="rp-confirm"
        required
        error={errors.confirmPassword}
      >
        <Input
          id="rp-confirm"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          invalid={Boolean(errors.confirmPassword)}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />
      </Field>

      <Button type="submit" size="lg" loading={submitting}>
        Set new password
      </Button>

      <p className="text-center text-sm text-ink-muted">
        <Link
          href={ROUTES.login}
          className="font-medium text-link underline underline-offset-4"
        >
          Back to login
        </Link>
      </p>
    </form>
  );
}
