/**
 * Mapbox configuration.
 *
 * Two tokens, deliberately:
 *
 * - `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` is readable by anyone who loads the page,
 *   because GL JS runs in the browser and has to authenticate from there. Make
 *   it a *public* token and restrict it by URL in the Mapbox dashboard.
 * - `MAPBOX_SECRET_TOKEN` never leaves the server. The geocoding route prefers
 *   it, so forward geocoding isn't billed against a token that strangers can
 *   lift out of the bundle and reuse.
 *
 * Both are optional. Without them the app falls back to the schematic map and
 * the local outward-code table, so a fresh clone still runs.
 */

/** Browser-side token. Inlined into the client bundle by Next — never secret. */
export const PUBLIC_MAPBOX_TOKEN =
  process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ?? "";

/** True when interactive Mapbox tiles can be rendered. */
export function hasMapboxToken(): boolean {
  return PUBLIC_MAPBOX_TOKEN.length > 0;
}

/**
 * Server-only token for the geocoding route. Falls back to the public one so
 * the feature still works if only one token is configured.
 */
export function serverGeocodingToken(): string {
  return process.env.MAPBOX_SECRET_TOKEN || PUBLIC_MAPBOX_TOKEN;
}

/**
 * A light, low-saturation basemap to sit under the cream UI. Override with
 * NEXT_PUBLIC_MAPBOX_STYLE if you build a custom style in Mapbox Studio.
 */
export const MAPBOX_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE ?? "mapbox://styles/mapbox/light-v11";

/**
 * Mapbox follows GeoJSON, which orders coordinates [longitude, latitude] —
 * the opposite of how they are spoken and of how they are stored on a
 * Property. Every hand-off to Mapbox goes through this function so the swap
 * happens in exactly one place.
 */
export function toLngLat(point: { lat: number; lng: number }): [number, number] {
  return [point.lng, point.lat];
}

/** The inverse, for reading coordinates back out of a Mapbox response. */
export function fromLngLat(coordinates: [number, number]): {
  lat: number;
  lng: number;
} {
  const [lng, lat] = coordinates;
  return { lat, lng };
}
