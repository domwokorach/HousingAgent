/**
 * Sign-up, sign-in and password management.
 *
 * DEMO ONLY — see src/lib/auth.ts. There is no server and no session cookie:
 * the "session" is a record in localStorage, and a determined visitor can edit
 * it. Treat every guard here as a UI affordance, not a security boundary.
 */

import { digestPassword, normaliseEmail, passwordMatches } from "@/lib/auth";
import { getSnapshot, selectUser, update } from "@/lib/db";
import { fail, ok, type Result } from "@/types/api";
import type { Credentials, RegisterInput, Session, User } from "@/types/user";
import { validate } from "@/validation";
import { changePasswordSchema } from "@/validation/account.schema";
import { emailSchema } from "@/validation/auth.schema";

export async function getSession(): Promise<Session | null> {
  return getSnapshot().session;
}

export async function getCurrentUser(): Promise<User | null> {
  return selectUser(getSnapshot());
}

export async function register(input: RegisterInput): Promise<Result<User>> {
  const email = normaliseEmail(input.email);

  if (getSnapshot().users.some((user) => user.email === email)) {
    return fail("An account with this email address already exists.", "email");
  }

  const account: User = {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    email,
    phone: input.phone.trim(),
    accountType: input.accountType,
    passwordDigest: digestPassword(input.password),
    createdAt: new Date().toISOString(),
  };

  update((state) => ({
    ...state,
    users: [...state.users, account],
    session: { email, remember: true },
    // Carry a guest shortlist over into the new account.
    saved: { ...state.saved, [email]: state.saved.guest ?? [] },
  }));

  return ok(account);
}

export async function login({
  email,
  password,
  remember,
}: Credentials): Promise<Result<User>> {
  const normalised = normaliseEmail(email);
  const match = getSnapshot().users.find((user) => user.email === normalised);

  // One message for both cases, so this doesn't confirm which emails exist.
  if (!match || !passwordMatches(match, password)) {
    return fail("Email address or password is incorrect.");
  }

  update((state) => ({ ...state, session: { email: normalised, remember } }));
  return ok(match);
}

export async function logout(): Promise<Result> {
  update((state) => ({ ...state, session: null }));
  return ok();
}

export async function verifyPassword(password: string): Promise<boolean> {
  const user = selectUser(getSnapshot());
  return Boolean(user) && passwordMatches(user!, password);
}

export async function changePassword(values: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<Result> {
  const parsed = validate(changePasswordSchema, values);
  if (!parsed.ok) {
    const [field, message] = Object.entries(parsed.errors)[0];
    return fail(message, field);
  }

  const user = selectUser(getSnapshot());
  if (!user) return fail("You are not signed in.");
  if (!passwordMatches(user, values.currentPassword)) {
    return fail("Your current password is incorrect.", "currentPassword");
  }

  update((state) => ({
    ...state,
    users: state.users.map((u) =>
      u.email === user.email
        ? { ...u, passwordDigest: digestPassword(values.newPassword) }
        : u,
    ),
  }));
  return ok();
}

/**
 * A real implementation would mint a signed, expiring token and email it. With
 * no server and no mail service, this reports success either way so the page
 * never reveals whether an address is registered.
 */
export async function requestPasswordReset(email: string): Promise<Result> {
  const parsed = validate(emailSchema, email);
  if (!parsed.ok) return fail("Enter a valid email address.", "email");
  return ok();
}

/**
 * Accepts the demo token only. Without a server there is nowhere to verify a
 * real one, so this deliberately refuses anything else rather than pretending.
 */
export const DEMO_RESET_TOKEN = "demo-reset-token";

export async function resetPassword(
  token: string,
  email: string,
  newPassword: string,
): Promise<Result> {
  if (token !== DEMO_RESET_TOKEN) {
    return fail(
      "This reset link is not valid. In this demo, reset links can't be emailed — change your password from Account Settings instead.",
    );
  }

  const normalised = normaliseEmail(email);
  const user = getSnapshot().users.find((u) => u.email === normalised);
  if (!user) return fail("No account was found for that email address.", "email");

  update((state) => ({
    ...state,
    users: state.users.map((u) =>
      u.email === normalised
        ? { ...u, passwordDigest: digestPassword(newPassword) }
        : u,
    ),
  }));
  return ok();
}
