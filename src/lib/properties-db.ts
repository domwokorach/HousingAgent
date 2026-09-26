/**
 * Query layer for the app's own `properties` / `property_images` tables —
 * listings created in-app by landlords/agents. Server-only.
 *
 * Separate connection from `./postgres` (which is dedicated to the read-only
 * `sold_properties` HMLR import via `RDS_DATABASE_URL`): this talks to the
 * app's own Neon database via `DATABASE_URL`. Schema: db/schema/properties.sql.
 */

import { Pool } from "pg";
import type {
  EnergyRating,
  FurnishedStatus,
  ImageCategory,
  Intent,
  Property,
  PropertyDraft,
  PropertyImage,
  PropertyType,
  Tenure,
} from "@/types/property";

if (typeof window !== "undefined") {
  throw new Error("src/lib/properties-db.ts must not be imported in client code.");
}

declare global {
  var __propertiesPool: Pool | undefined;
}

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to .env.local.");
  }
  return new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

function getPool(): Pool {
  if (!globalThis.__propertiesPool) {
    globalThis.__propertiesPool = createPool();
  }
  return globalThis.__propertiesPool;
}

interface PropertyRow {
  id: string;
  title: string;
  intent: Intent;
  price: number;
  address_line1: string;
  address_line2: string | null;
  town: string;
  postcode: string;
  lat: number;
  lng: number;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  size_sq_ft: number;
  description: string;
  available_from: string;
  furnished: FurnishedStatus | null;
  energy_rating: EnergyRating | null;
  tenure: Tenure | null;
  council_tax_band: string | null;
  deposit_weeks: number | null;
  agent_id: string;
  owner_email: string | null;
  featured: boolean;
  listed_at: string;
}

interface PropertyImageRow {
  property_id: string;
  src: string;
  category: ImageCategory;
  alt: string;
}

function toProperty(row: PropertyRow, images: PropertyImage[]): Property {
  return {
    id: row.id,
    title: row.title,
    intent: row.intent,
    price: row.price,
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? undefined,
    town: row.town,
    postcode: row.postcode,
    lat: row.lat,
    lng: row.lng,
    type: row.type,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    sizeSqFt: row.size_sq_ft,
    description: row.description,
    availableFrom: row.available_from,
    furnished: row.furnished ?? undefined,
    energyRating: row.energy_rating ?? undefined,
    tenure: row.tenure ?? undefined,
    councilTaxBand: row.council_tax_band ?? undefined,
    depositWeeks: row.deposit_weeks ?? undefined,
    agentId: row.agent_id,
    images,
    listedAt: row.listed_at,
    featured: row.featured,
    ownerEmail: row.owner_email ?? undefined,
  };
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Every id-keyed lookup below is guarded by this. Seed/demo listing ids
 * (slugs like "harper-quinn") and legacy mock-store ids are never valid
 * UUIDs, so treating a non-UUID as "not found" — rather than sending it to
 * Postgres and letting `invalid_text_representation` (22P02) surface as a
 * 500 — is what lets `property.service.ts` fall back to the mock store for
 * those ids.
 */
function isUuid(id: string): boolean {
  return UUID_PATTERN.test(id);
}

const PROPERTY_COLUMNS = `id, title, intent, price, address_line1, address_line2, town,
  postcode, lat, lng, type, bedrooms, bathrooms, size_sq_ft, description,
  available_from, furnished, energy_rating, tenure, council_tax_band,
  deposit_weeks, agent_id, owner_email, featured, listed_at`;

/** Fetches images for a set of property ids, grouped by property, in position order. */
async function imagesByPropertyId(
  pool: Pool,
  propertyIds: string[],
): Promise<Map<string, PropertyImage[]>> {
  const byId = new Map<string, PropertyImage[]>();
  if (propertyIds.length === 0) return byId;

  const result = await pool.query<PropertyImageRow & { id: string }>(
    `SELECT id, property_id, src, category, alt
     FROM property_images
     WHERE property_id = ANY($1)
     ORDER BY property_id, position ASC`,
    [propertyIds],
  );

  for (const row of result.rows) {
    const image: PropertyImage = {
      id: row.id,
      src: row.src,
      category: row.category,
      alt: row.alt,
    };
    const existing = byId.get(row.property_id);
    if (existing) existing.push(image);
    else byId.set(row.property_id, [image]);
  }
  return byId;
}

export async function dbListProperties(): Promise<Property[]> {
  const pool = getPool();
  const result = await pool.query<PropertyRow>(
    `SELECT ${PROPERTY_COLUMNS} FROM properties WHERE deleted_at IS NULL ORDER BY listed_at DESC`,
  );
  const images = await imagesByPropertyId(pool, result.rows.map((r) => r.id));
  return result.rows.map((row) => toProperty(row, images.get(row.id) ?? []));
}

export async function dbGetProperty(id: string): Promise<Property | null> {
  if (!isUuid(id)) return null;
  const pool = getPool();
  const result = await pool.query<PropertyRow>(
    `SELECT ${PROPERTY_COLUMNS} FROM properties WHERE id = $1 AND deleted_at IS NULL`,
    [id],
  );
  const row = result.rows[0];
  if (!row) return null;
  const images = await imagesByPropertyId(pool, [row.id]);
  return toProperty(row, images.get(row.id) ?? []);
}

export async function dbCreateProperty(
  draft: PropertyDraft,
  owner: { ownerEmail: string },
): Promise<string> {
  const pool = getPool();
  const result = await pool.query<{ id: string }>(
    `INSERT INTO properties (
      title, intent, price, address_line1, address_line2, town, postcode,
      lat, lng, type, bedrooms, bathrooms, size_sq_ft, description,
      available_from, furnished, energy_rating, tenure, council_tax_band,
      deposit_weeks, agent_id, owner_email, featured
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
    RETURNING id`,
    [
      draft.title,
      draft.intent,
      draft.price,
      draft.addressLine1,
      draft.addressLine2 ?? null,
      draft.town,
      draft.postcode,
      draft.lat,
      draft.lng,
      draft.type,
      draft.bedrooms,
      draft.bathrooms,
      draft.sizeSqFt,
      draft.description,
      draft.availableFrom,
      draft.furnished ?? null,
      draft.energyRating ?? null,
      draft.tenure ?? null,
      draft.councilTaxBand ?? null,
      draft.depositWeeks ?? null,
      draft.agentId,
      owner.ownerEmail,
      draft.featured ?? false,
    ],
  );
  const id = result.rows[0].id;

  if (draft.images.length > 0) {
    await writeImages(pool, id, draft.images);
  }
  return id;
}

const PATCH_COLUMN_MAP: Record<string, string> = {
  title: "title",
  intent: "intent",
  price: "price",
  addressLine1: "address_line1",
  addressLine2: "address_line2",
  town: "town",
  postcode: "postcode",
  lat: "lat",
  lng: "lng",
  type: "type",
  bedrooms: "bedrooms",
  bathrooms: "bathrooms",
  sizeSqFt: "size_sq_ft",
  description: "description",
  availableFrom: "available_from",
  furnished: "furnished",
  energyRating: "energy_rating",
  tenure: "tenure",
  councilTaxBand: "council_tax_band",
  depositWeeks: "deposit_weeks",
  agentId: "agent_id",
  featured: "featured",
};

/** Partial update. `images` is excluded — use `dbSetPropertyImages` for that. */
export async function dbUpdateProperty(
  id: string,
  patch: Partial<Property>,
): Promise<boolean> {
  if (!isUuid(id)) return false;

  const entries = Object.entries(patch).filter(
    ([key]) => key in PATCH_COLUMN_MAP,
  );
  if (entries.length === 0) return dbPropertyExists(id);

  const pool = getPool();
  const setClauses = entries.map(
    ([key], index) => `${PATCH_COLUMN_MAP[key]} = $${index + 2}`,
  );
  const values = entries.map(([, value]) => value ?? null);

  const result = await pool.query(
    `UPDATE properties SET ${setClauses.join(", ")}
     WHERE id = $1 AND deleted_at IS NULL`,
    [id, ...values],
  );
  return (result.rowCount ?? 0) > 0;
}

async function dbPropertyExists(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const pool = getPool();
  const result = await pool.query(
    "SELECT 1 FROM properties WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  return result.rowCount !== null && result.rowCount > 0;
}

export async function dbDeleteProperty(id: string): Promise<boolean> {
  if (!isUuid(id)) return false;
  const pool = getPool();
  const result = await pool.query(
    "UPDATE properties SET deleted_at = now() WHERE id = $1 AND deleted_at IS NULL",
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}

/** Replaces a property's images atomically (delete + re-insert in one transaction). */
async function writeImages(pool: Pool, propertyId: string, images: PropertyImage[]) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM property_images WHERE property_id = $1", [propertyId]);

    if (images.length > 0) {
      const values: unknown[] = [];
      const rows = images.map((image, index) => {
        const base = values.length;
        values.push(propertyId, index, image.src, image.category, image.alt);
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
      });

      await client.query(
        `INSERT INTO property_images (property_id, position, src, category, alt)
         VALUES ${rows.join(", ")}`,
        values,
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function dbSetPropertyImages(
  id: string,
  images: PropertyImage[],
): Promise<boolean> {
  const pool = getPool();
  const exists = await dbPropertyExists(id);
  if (!exists) return false;
  await writeImages(pool, id, images);
  return true;
}
