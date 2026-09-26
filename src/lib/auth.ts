/**
 * Password and session helpers.
 *
 * DEMO ONLY. Accounts live in this browser's localStorage and passwords are
 * reduced to a non-reversible-looking digest so they are not sitting in
 * storage as plain text. This is NOT password security: the digest is fast,
 * unsalted per-user and runs on the client, so anyone with the storage can
 * brute-force it. A real deployment must authenticate on a server, hash with
 * bcrypt or argon2, and never hold credentials in the browser. See README.md.
 */

import type { User } from "@/types/user";

export function digestPassword(password: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x1000193;
  const salted = `housing-agent::${password}`;
  for (let i = 0; i < salted.length; i++) {
    const code = salted.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 0x01000193) >>> 0;
    h2 = Math.imul(h2 + code, 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

export function passwordMatches(user: User, password: string): boolean {
  return user.passwordDigest === digestPassword(password);
}

/** Email addresses are the account key, so they are normalised everywhere. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

