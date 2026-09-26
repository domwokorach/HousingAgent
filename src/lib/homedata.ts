/**
 * Mapping the Homedata provider response onto the app's own shapes.
 *
 * Homedata publishes an OpenAPI document but it carries no response schemas,
 * so field names cannot be verified ahead of a live call. Everything here is
 * therefore parsed rather than assumed: unknown extra fields are ignored,
 * missing fields become null instead of `undefined` leaking into the UI, and a
 * response that has changed shape entirely fails as a clear error rather than
 * rendering a page of blanks.
 */

import { z } from "zod";
import type { Intent } from "@/types/property";
import type { LiveListing } from "@/types/listing";

export const HOMEDATA_BASE_URL = "https://api.homedata.co.uk/api";

/** The provider's transaction types, from the documented `sort` enum. */
export type HomedataTransactionType = "Sale" | "Rental";

/** Our rent/buy maps onto the provider's Sale/Rental. */
export function toTransactionType(intent: Intent): HomedataTransactionType {
  return intent === "buy" ? "Sale" : "Rental";
}

export function fromTransactionType(value: unknown): Intent {
  return String(value).toLowerCase() === "rental" ? "rent" : "buy";
}

/** Coerces the provider's loose numerics without turning "" into 0. */
const looseNumber = z
  .union([z.number(), z.string(), z.null(), z.undefined()])
  .transform((value) => {
    if (value === null || value === undefined || value === "") return null;
    const parsed = typeof value === "number" ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  });

const looseString = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((value) =>
    value === null || value === undefined ? null : String(value).trim() || null,
  );

/**
 * Images arrive either as bare URLs or as objects. Only absolute https URLs
 * are kept — anything else would be a broken <img> or, worse, a javascript:
 * URL rendered into the page.
 */
const imageList = z
  .unknown()
  .transform((value) => {
    const raw = Array.isArray(value) ? value : [];
    const urls: string[] = [];

    for (const entry of raw) {
      const candidate =
        typeof entry === "string"
          ? entry
          : entry && typeof entry === "object"
            ? ((entry as Record<string, unknown>).url ??
              (entry as Record<string, unknown>).src ??
              (entry as Record<string, unknown>).image)
            : null;

      if (typeof candidate !== "string") continue;
      try {
        const url = new URL(candidate);
        if (url.protocol === "https:") urls.push(url.toString());
      } catch {
        /* not a usable URL — skip it */
      }
    }

    return urls;
  });

/** One listing as the provider sends it. Unknown fields are ignored. */
export const homedataListingSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    display_address: looseString.optional(),
    latest_price: looseNumber.optional(),
    transaction_type: z.unknown().optional(),
    latest_status: looseString.optional(),
    bedrooms: looseNumber.optional(),
    bathrooms: looseNumber.optional(),
    listing_property_type: looseString.optional(),
    images: z.unknown().optional(),
    agent_name: looseString.optional(),
    geopoint: z
      .object({ lat: looseNumber.optional(), lon: looseNumber.optional() })
      .partial()
      .nullish(),
    added_date: looseString.optional(),
  })
  .loose();

export function toLiveListing(raw: unknown): LiveListing | null {
  const parsed = homedataListingSchema.safeParse(raw);
  if (!parsed.success) return null;

  const listing = parsed.data;

  return {
    id: String(listing.id),
    address: listing.display_address ?? "Address not supplied",
    price: listing.latest_price ?? null,
    intent: fromTransactionType(listing.transaction_type),
    status: listing.latest_status ?? null,
    bedrooms: listing.bedrooms ?? null,
    bathrooms: listing.bathrooms ?? null,
    propertyType: listing.listing_property_type ?? null,
    images: imageList.parse(listing.images),
    agentName: listing.agent_name ?? null,
    lat: listing.geopoint?.lat ?? null,
    lng: listing.geopoint?.lon ?? null,
    addedDate: listing.added_date ?? null,
  };
}

/** The search envelope: a count plus a results array. */
export const homedataSearchSchema = z
  .object({
    count: looseNumber.optional(),
    results: z.array(z.unknown()).optional(),
  })
  .loose();

/** The boundary autocomplete envelope. */
export const homedataBoundarySchema = z
  .object({
    results: z
      .array(
        z
          .object({
            id: z.union([z.string(), z.number()]),
            name: looseString.optional(),
            label: looseString.optional(),
          })
          .loose(),
      )
      .optional(),
  })
  .loose();

/** The provider's error envelope: { error: { code, message, status } }. */
export const homedataErrorSchema = z
  .object({
    error: z
      .object({
        code: looseString.optional(),
        message: looseString.optional(),
      })
      .loose()
      .optional(),
  })
  .loose();

export function readProviderError(body: unknown): string | null {
  const parsed = homedataErrorSchema.safeParse(body);
  return parsed.success ? (parsed.data.error?.message ?? null) : null;
}
