"use client";

import Link from "next/link";
import { useState } from "react";
import { ROUTES } from "@/constants/navigation";
import { requestPasswordReset } from "@/services/auth.service";
import { validate } from "@/validation";
import { forgotPasswordSchema } from "@/validation/auth.schema";
import { Alert, Button, Field, Input } from "@/components/ui";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="flex flex-col gap-5">
        <Alert tone="success">
          If an account exists for <strong>{email}</strong>, a reset link is on its way.
          Check your inbox and your spam folder.
        </Alert>
        <Alert tone="info">
          In this demonstration app there is no email service and no server, so no message
          is actually sent. Once signed in you can change your password from{" "}
          <Link
            href={ROUTES.settings}
            className="font-medium underline underline-offset-4"
          >
            Account Settings
          </Link>
          .
        </Alert>
        <Link
          href={ROUTES.login}
          className="text-center text-sm font-medium text-link underline underline-offset-4"
        >
          Back to login
        </Link>
      </div>
    );
  }

  const handleSubmit = async () => {
    const parsed = validate(forgotPasswordSchema, { email });
    if (!parsed.ok) {
      setError(parsed.errors.email ?? "Enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await requestPasswordReset(email);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setError(undefined);
      setSent(true);
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
      <Field
        label="Email address"
        htmlFor="reset-email"
        required
        error={error}
        hint="We'll send a reset link to the address on your account."
      >
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          value={email}
          invalid={Boolean(error)}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(undefined);
          }}
        />
      </Field>

      <Button type="submit" size="lg" loading={submitting}>
        Send reset link
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Remembered it?{" "}
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
