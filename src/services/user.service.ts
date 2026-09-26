import { selectUser, getSnapshot, update } from "@/lib/db";
import { fail, ok, type Result } from "@/types/api";
import type { Enquiry, User } from "@/types/user";
import { validate } from "@/validation";
import { profileSchema, type ProfileValues } from "@/validation/account.schema";
import { passwordMatches } from "@/lib/auth";

export async function updateProfile(values: ProfileValues): Promise<Result<User>> {
  const parsed = validate(profileSchema, values);
  if (!parsed.ok) {
    const [field, message] = Object.entries(parsed.errors)[0];
    return fail(message, field);
  }

  const user = selectUser(getSnapshot());
  if (!user) return fail("You are not signed in.");

  const patched: User = { ...user, ...parsed.data };
  update((state) => ({
    ...state,
    users: state.users.map((u) => (u.email === user.email ? patched : u)),
  }));
  return ok(patched);
}

export async function listEnquiriesForUser(user: User | null): Promise<Enquiry[]> {
  if (!user) return [];
  return getSnapshot().enquiries.filter((enquiry) => enquiry.email === user.email);
}

/**
 * Permanent. Removes the account and everything attached to it: shortlist,
 * listings the account created, and its enquiry history.
 */
export async function deleteAccount(password: string): Promise<Result> {
  const user = selectUser(getSnapshot());
  if (!user) return fail("You are not signed in.");
  if (!passwordMatches(user, password)) {
    return fail("That password does not match this account.", "password");
  }

  const email = user.email;
  update((state) => {
    const saved = { ...state.saved };
    delete saved[email];
    return {
      ...state,
      users: state.users.filter((u) => u.email !== email),
      saved,
      created: state.created.filter((property) => property.ownerEmail !== email),
      enquiries: state.enquiries.filter((enquiry) => enquiry.email !== email),
      session: null,
    };
  });
  return ok();
}
