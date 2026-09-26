import type { Intent } from "./property";

/**
 * A property listing from the Homedata live-listings feed.
 *
 * This is deliberately *not* the app's own `Property`. A live listing carries
 * far less: no description, floor area, EPC, availability date or postcode.
 * Forcing it into `Property` would mean inventing values and showing them to
 * people as fact, so it stays a narrower type of its own.
 */
export interface LiveListing {
  id: string;
  /** Provider's display address, e.g. "Example Road, Manchester". */
  address: string;
  /** GBP. Monthly for rentals, asking price for sales. Null if withheld. */
  price: number | null;
  intent: Intent;
  /** Provider's own status string, e.g. "For sale", "Under offer". */
  status: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  /** Provider's free-text type, e.g. "Semi-Detached". Not our PropertyType. */
  propertyType: string | null;
  images: string[];
  agentName: string | null;
  lat: number | null;
  lng: number | null;
  addedDate: string | null;
}

export interface LiveListingSearch {
  location: string;
  intent: Intent;
  minBedrooms?: number | null;
  maxPrice?: number | null;
  pageSize?: number;
}

export interface LiveListingResults {
  location: string;
  /** What the provider matched the location text to. */
  boundary: string | null;
  /** Total matches the provider reports, which may exceed what was returned. */
  total: number;
  listings: LiveListing[];
}
