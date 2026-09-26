/**
 * Server-only Postgres connection for HM Land Registry sold-price data.
 *
 * Separate from `src/lib/db.ts` (the localStorage-backed listings store,
 * which stays as-is) — this talks to the `sold_properties` table populated
 * by the S3 -> RDS import pipeline. Never imported from client components.
 *
 * Next.js (Turbopack) hot-reloads modules on every save in dev, which would
 * otherwise create a fresh `Pool` — and a fresh batch of Postgres connections
 * — on each reload. Caching the pool on `globalThis` survives module
 * reloads within the same dev server process.
 */

import { Pool } from "pg";

if (typeof window !== "undefined") {
  throw new Error("src/lib/postgres.ts must not be imported in client code.");
}

declare global {
  var __soldPropertiesPool: Pool | undefined;
}

function createPool(): Pool {
  // Deliberately not DATABASE_URL: that name is claimed by the Neon
  // integration's auto-synced env vars (POSTGRES_*/PG*/NEON_* in
  // .env.local), which point at an unrelated Neon database. Reusing it here
  // would get silently overwritten on the next `vercel env pull`.
  const connectionString = process.env.RDS_DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "RDS_DATABASE_URL is not set. Add it to .env.local — see .env.example.",
    );
  }
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

export function getPool(): Pool {
  if (!globalThis.__soldPropertiesPool) {
    globalThis.__soldPropertiesPool = createPool();
  }
  return globalThis.__soldPropertiesPool;
}
