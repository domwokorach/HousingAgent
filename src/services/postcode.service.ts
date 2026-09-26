import {
  distanceMiles,
  locatePostcode,
  looksLikePostcode,
  normalisePostcode,
  outwardCode,
} from "@/lib/postcode";
import type { GeoPoint, PlacePoint } from "@/types/search";

/**
 * Place lookup. Backed by a local outward-code table; a production build would
 * call a lookup service such as postcodes.io from here and cache the result.
 */
export async function lookupPostcode(value: string): Promise<PlacePoint | null> {
  const found = locatePostcode(value);
  return found ? { lat: found.lat, lng: found.lng, label: found.town } : null;
}

export function distanceBetween(a: GeoPoint, b: GeoPoint): number {
  return distanceMiles(a, b);
}

export { looksLikePostcode, normalisePostcode, outwardCode };
