"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { cx } from "@/lib/utils";
import type { AccountType } from "@/types/user";
import { validate } from "@/validation";
import { passwordStrength, registerSchema } from "@/validation/auth.schema";
import { IconCheck, IconKey, IconUser } from "@/components/ui/Icons";
import { Alert, Button, Checkbox, Field, Input } from "@/components/ui";

interface Values {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  accountType: AccountType;
  acceptedTerms: boolean;
}

const EMPTY: Values = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  accountType: "tenant",
  acceptedTerms: false,
};

const BENEFITS = [
  "Save properties to a shortlist that follows you between searches.",
  "Landlords and agents can list properties and manage their photos.",
  "Keep a record of every enquiry you send.",
];

export function RegisterForm() {
  const router = useRouter();
  const { register, hydrated } = useAuth();

  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // Clear a field's error as soon as the user starts fixing it.
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      delete next.form;
      return next;
    });
  };

  const strength = passwordStrength(values.password);
  const fieldErrorCount = Object.keys(errors).filter((key) => key !== "form").length;

  const handleSubmit = async () => {
    const parsed = validate(registerSchema, values);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      // Send focus to the first field with a problem.
      requestAnimationFrame(() =>
        document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(),
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await register(parsed.data);
      if (!result.ok) {
        setErrors({ [result.field ?? "form"]: result.error });
        return;
      }
      router.push(`${ROUTES.account}?welcome=1`);
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
      {fieldErrorCount > 0 && (
        <Alert>
          There{" "}
          {fieldErrorCount === 1
            ? "is 1 problem"
            : `are ${fieldErrorCount} problems`}{" "}
          with the details you entered. Please check the fields marked below.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" htmlFor="firstName" required error={errors.firstName}>
          <Input
            id="firstName"
            autoComplete="given-name"
            value={values.firstName}
            invalid={Boolean(errors.firstName)}
            onChange={(event) => set("firstName", event.target.value)}
          />
        </Field>

        <Field label="Last name" htmlFor="lastName" required error={errors.lastName}>
          <Input
            id="lastName"
            autoComplete="family-name"
            value={values.lastName}
            invalid={Boolean(errors.lastName)}
            onChange={(event) => set("lastName", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Email address" htmlFor="email" required error={errors.email}>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={values.email}
          invalid={Boolean(errors.email)}
          onChange={(event) => set("email", event.target.value)}
        />
      </Field>

      <Field
        label="Phone number"
        htmlFor="phone"
        required
        error={errors.phone}
        hint="So agents can call you back about a viewing."
      >
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="07700 900123"
          value={values.phone}
          invalid={Boolean(errors.phone)}
          onChange={(event) => set("phone", event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Password" htmlFor="password" required error={errors.password}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={values.password}
            invalid={Boolean(errors.password)}
            onChange={(event) => set("password", event.target.value)}
          />
        </Field>

        <Field
          label="Confirm password"
          htmlFor="confirmPassword"
          required
          error={errors.confirmPassword}
        >
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            invalid={Boolean(errors.confirmPassword)}
            onChange={(event) => set("confirmPassword", event.target.value)}
          />
        </Field>
      </div>

      {values.password && (
        <div aria-live="polite">
          <div className="flex items-center gap-2">
            <div className="flex h-1.5 flex-1 gap-1" aria-hidden="true">
              {[0, 1, 2, 3].map((step) => (
                <span
                  key={step}
                  className={cx(
                    "h-full flex-1 rounded-full transition-colors",
                    step < strength.score
                      ? strength.score <= 1
                        ? "bg-danger"
                        : strength.score <= 2
                          ? "bg-accent"
                          : "bg-success"
                      : "bg-line",
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-ink-muted">{strength.label}</span>
          </div>
          {strength.missing.length > 0 && (
            <p className="mt-1.5 text-xs text-ink-muted">
              To strengthen it, add {strength.missing.join(", ")}.
            </p>
          )}
        </div>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-ink">
          Account type
          <span className="ml-1 text-danger" aria-hidden="true">
            *
          </span>
        </legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          {ACCOUNT_TYPES.map((option) => {
            const selected = values.accountType === option.value;
            return (
              <label
                key={option.value}
                className={cx(
                  "flex cursor-pointer flex-col rounded-control border p-4 transition-colors",
                  selected
                    ? "border-brand bg-cream"
                    : "border-line bg-surface hover:border-ink-muted/50",
                )}
              >
                <span className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="accountType"
                    value={option.value}
                    checked={selected}
                    onChange={() => set("accountType", option.value)}
                    className="size-4"
                  />
                  <span className="font-medium text-ink">{option.label}</span>
                </span>
                <span className="mt-1.5 pl-6 text-sm text-ink-muted">
                  {option.description}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <Checkbox
        id="acceptedTerms"
        checked={values.acceptedTerms}
        error={errors.acceptedTerms}
        onChange={(event) => set("acceptedTerms", event.target.checked)}
        label={
          <>
            I accept the{" "}
            <Link
              href={ROUTES.terms}
              className="font-medium text-link underline underline-offset-4"
            >
              Terms and Conditions
            </Link>{" "}
            and the{" "}
            <Link
              href={`${ROUTES.terms}#privacy`}
              className="font-medium text-link underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </>
        }
      />

      <Button type="submit" size="lg" loading={submitting} disabled={!hydrated}>
        <IconUser className="size-5" />
        Create Account
      </Button>

      <p className="text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link
          href={ROUTES.login}
          className="font-medium text-link underline underline-offset-4"
        >
          Login
        </Link>
      </p>

      <ul className="flex flex-col gap-1.5 rounded-control bg-surface-2 px-4 py-3 text-xs text-ink-muted">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-2">
            <IconCheck className="mt-0.5 size-3.5 shrink-0 text-link" />
            {benefit}
          </li>
        ))}
      </ul>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-muted">
        <IconKey className="mt-0.5 size-4 shrink-0" />
        This is a demonstration app: your account is stored only in this browser and is
        never sent to a server. Please don&apos;t reuse a real password.
      </p>
    </form>
  );
}
