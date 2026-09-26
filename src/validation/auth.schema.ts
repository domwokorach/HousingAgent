import { z } from "zod";
import { ACCOUNT_TYPES } from "@/constants/accountTypes";
import type { AccountType } from "@/types/user";

const accountTypeValues = ACCOUNT_TYPES.map((option) => option.value) as [
  AccountType,
  ...AccountType[],
];

/** Deliberately permissive: catches typos without rejecting real addresses. */
export const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .max(254, "That email address is too long.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, "Enter a valid email address, for example name@example.com.");

/** UK numbers, tolerating spaces, dashes, brackets and +44. */
export const phoneSchema = z
  .string()
  .trim()
  .min(1, "Enter your phone number.")
  .refine(
    (value) => /^(\+44|0)\d{9,10}$/.test(value.replace(/[\s()-]/g, "")),
    "Enter a valid UK phone number, for example 07700 900123.",
  );

export const optionalPhoneSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^(\+44|0)\d{9,10}$/.test(value.replace(/[\s()-]/g, "")),
    "Enter a valid UK phone number, or leave this blank.",
  );

/** The minimum bar to create an account. */
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters, including a letter and a number.")
  .regex(/[A-Za-z]/, "Use at least 8 characters, including a letter and a number.")
  .regex(/\d/, "Use at least 8 characters, including a letter and a number.");

const nameSchema = (field: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter your ${field} name.`)
    .min(2, `${field === "first" ? "First" : "Last"} name must be at least 2 characters.`)
    .max(60, "That name is too long.");

export const registerSchema = z
  .object({
    firstName: nameSchema("first"),
    lastName: nameSchema("last"),
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Re-enter your password."),
    accountType: z.enum(accountTypeValues),
    acceptedTerms: z
      .boolean()
      .refine((v) => v, "You must accept the Terms and Conditions to continue."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Both passwords must match.",
    path: ["confirmPassword"],
  });

export type RegisterValues = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean(),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "This reset link is missing its token."),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Re-enter your new password."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Both passwords must match.",
    path: ["confirmPassword"],
  });

/* ------------------------------------------------------- strength meter */

const STRENGTH_RULES: Array<{ test: (value: string) => boolean; label: string }> = [
  { test: (v) => v.length >= 8, label: "at least 8 characters" },
  { test: (v) => /[a-z]/.test(v) && /[A-Z]/.test(v), label: "upper and lower case letters" },
  { test: (v) => /\d/.test(v), label: "a number" },
  { test: (v) => /[^A-Za-z0-9]/.test(v), label: "a symbol" },
];

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Requirements the password does not yet meet. */
  missing: string[];
}

export function passwordStrength(value: string): PasswordStrength {
  const met = STRENGTH_RULES.filter((rule) => rule.test(value));
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"] as const;
  const score = met.length as PasswordStrength["score"];
  return {
    score,
    label: labels[score],
    missing: STRENGTH_RULES.filter((rule) => !rule.test(value)).map((r) => r.label),
  };
}
