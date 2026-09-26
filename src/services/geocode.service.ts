/**
 * Turning a postcode into coordinates.
 *
 * Called once, when a listing is created or edited — the result is stored on
 * the property so map rendering never hits the network. See the geocoding
 * route at src/app/api/geocode/route.ts.
 */

import { compactPostcode, formatPostcode, locatePostcode } from "@/lib/postcode";
import { fail, ok, type Result } from "@/types/api";
import type { PlacePoint } from "@/types/search";

export interface GeocodedPlace extends PlacePoint {
  postcode: string;
  /** "mapbox" is an exact lookup; "local" is an outward-code centroid. */
  source: "mapbox" | "local";
}

/** Repeated lookups of the same postcode are common on an edit form. */
const cache = new Map<string, GeocodedPlace>();

/**
 * Resolves a postcode to a point.
 *
 * Tries the server route first, which uses Mapbox when a token is configured.
 * If that is unreachable — offline, no token, a failed deploy — it falls back
 * to the local outward-code table so the listing form still works.
 */
export async function geocodePostcode(
  postcode: string,
): Promise<Result<GeocodedPlace>> {
  const query = postcode.trim();
  if (!query) return fail("Enter the postcode.", "postcode");

  const key = compactPostcode(query);
  const cached = cache.get(key);
  if (cached) return ok(cached);

  try {
    const response = await fetch(
      `/api/geocode?postcode=${encodeURIComponent(query)}`,
      { headers: { accept: "application/json" } },
    );
    const data = await response.json();

    if (response.ok && typeof data.lat === "number" && typeof data.lng === "number") {
      const place: GeocodedPlace = {
        lat: data.lat,
        lng: data.lng,
        postcode: data.postcode ?? formatPostcode(query),
        label: data.label ?? key,
        source: data.source === "mapbox" ? "mapbox" : "local",
      };
      cache.set(key, place);
      return ok(place);
    }

    // The route answered, and the answer was "no".
    if (response.status === 400 || response.status === 404) {
      return fail(
        typeof data.error === "string"
          ? data.error
          : "We couldn't find that postcode.",
        "postcode",
      );
    }

    throw new Error(`Geocoding failed with ${response.status}`);
  } catch {
    const local = locatePostcode(query);
    if (local) {
      const place: GeocodedPlace = {
        lat: local.lat,
        lng: local.lng,
        postcode: formatPostcode(query),
        label: local.town,
        source: "local",
      };
      cache.set(key, place);
      return ok(place);
    }

    return fail(
      "We couldn't look that postcode up just now. Check your connection and try again.",
      "postcode",
    );
  }
}

/** Clears the lookup cache. Used by tests. */
export function clearGeocodeCache(): void {
  cache.clear();
}
