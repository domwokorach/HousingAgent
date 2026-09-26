"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { validate } from "@/validation";
import { loginSchema } from "@/validation/auth.schema";
import { Alert, Button, Checkbox, Field, Input } from "@/components/ui";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const { login, hydrated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const clearError = (key: string) =>
    setErrors((prev) => {
      const rest = { ...prev };
      delete rest[key];
      delete rest.form;
      return rest;
    });

  const handleSubmit = async () => {
    const parsed = validate(loginSchema, { email, password, remember });
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(parsed.data);
      if (!result.ok) {
        setErrors({ form: result.error });
        return;
      }
      // Only follow internal paths, so ?next= can't be used to bounce offsite.
      router.push(next && next.startsWith("/") ? next : ROUTES.account);
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
      {errors.form && <Alert>{errors.form}</Alert>}

      <Field label="Email address" htmlFor="login-email" required error={errors.email}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          invalid={Boolean(errors.email)}
          onChange={(event) => {
            setEmail(event.target.value);
            clearError("email");
          }}
        />
      </Field>

      <Field label="Password" htmlFor="login-password" required error={errors.password}>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          invalid={Boolean(errors.password)}
          onChange={(event) => {
            setPassword(event.target.value);
            clearError("password");
          }}
        />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          id="remember"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          label="Remember me"
        />
        <Link
          href={ROUTES.forgotPassword}
          className="text-sm font-medium text-link underline underline-offset-4"
        >
          Forgot Password?
        </Link>
      </div>

      <Button type="submit" size="lg" loading={submitting} disabled={!hydrated}>
        Login
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Don&apos;t have an account?{" "}
        <Link
          href={ROUTES.register}
          className="font-medium text-link underline underline-offset-4"
        >
          Create New Account
        </Link>
      </p>
    </form>
  );
}
