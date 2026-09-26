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
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add it to .env.local — see .env.example.",
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
