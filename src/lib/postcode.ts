import type { GeoPoint } from "@/types/search";

/**
 * Lightweight postcode helpers.
 *
 * A real deployment would call a lookup service (e.g. postcodes.io). For this
 * demo we ship a centroid table for the outward codes used by the seed data so
 * partial-postcode search and radius filtering work entirely offline.
 */

export const OUTCODE_CENTROIDS: Record<string, GeoPoint & { town: string }> = {
  SW11: { lat: 51.4649, lng: -0.1653, town: "Battersea, London" },
  SE15: { lat: 51.4696, lng: -0.0685, town: "Peckham, London" },
  E14: { lat: 51.5049, lng: -0.0198, town: "Canary Wharf, London" },
  N4: { lat: 51.5713, lng: -0.1035, town: "Finsbury Park, London" },
  NW6: { lat: 51.5432, lng: -0.1934, town: "Kilburn, London" },
  W5: { lat: 51.5136, lng: -0.3018, town: "Ealing, London" },
  CR0: { lat: 51.3762, lng: -0.0982, town: "Croydon" },
  BR1: { lat: 51.4058, lng: 0.0155, town: "Bromley" },
  M1: { lat: 53.4794, lng: -2.2359, town: "Manchester" },
  M20: { lat: 53.4218, lng: -2.2299, town: "Didsbury, Manchester" },
  B15: { lat: 52.4642, lng: -1.9271, town: "Edgbaston, Birmingham" },
  B1: { lat: 52.4784, lng: -1.9086, town: "Birmingham" },
  LS6: { lat: 53.8177, lng: -1.5686, town: "Headingley, Leeds" },
  LS1: { lat: 53.7987, lng: -1.5492, town: "Leeds" },
  BS8: { lat: 51.4553, lng: -2.6136, town: "Clifton, Bristol" },
  BS1: { lat: 51.4522, lng: -2.5966, town: "Bristol" },
  L1: { lat: 53.4035, lng: -2.9803, town: "Liverpool" },
  L18: { lat: 53.3811, lng: -2.9045, town: "Mossley Hill, Liverpool" },
  S11: { lat: 53.3617, lng: -1.4988, town: "Ecclesall, Sheffield" },
  NG7: { lat: 52.9556, lng: -1.1747, town: "Nottingham" },
  NE2: { lat: 54.9878, lng: -1.6097, town: "Jesmond, Newcastle" },
  G12: { lat: 55.8766, lng: -4.2924, town: "Hillhead, Glasgow" },
  EH3: { lat: 55.9533, lng: -3.2059, town: "Edinburgh" },
  CF11: { lat: 51.4715, lng: -3.1923, town: "Cardiff" },
  BN1: { lat: 50.8355, lng: -0.1441, town: "Brighton" },
  RG1: { lat: 51.4551, lng: -0.9718, town: "Reading" },
  OX2: { lat: 51.7625, lng: -1.2762, town: "Oxford" },
  CB1: { lat: 52.1985, lng: 0.1354, town: "Cambridge" },
  MK9: { lat: 52.0406, lng: -0.7594, town: "Milton Keynes" },
  LE2: { lat: 52.6178, lng: -1.1273, town: "Leicester" },
  SO15: { lat: 50.9151, lng: -1.4257, town: "Southampton" },
  YO1: { lat: 53.9583, lng: -1.0803, town: "York" },
  BA1: { lat: 51.3847, lng: -2.3617, town: "Bath" },
  EX4: { lat: 50.7331, lng: -3.5325, town: "Exeter" },
};

/** Uppercases and collapses whitespace: "sw11 3ab" -> "SW11 3AB". */
export function normalisePostcode(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, " ");
}

/** Uppercase, no spaces: the canonical key form. "sw11 3ab" -> "SW113AB". */
export function compactPostcode(input: string): string {
  return normalisePostcode(input).replace(/\s/g, "");
}

/** Canonical display form, with the space restored. "sw113ab" -> "SW11 3AB". */
export function formatPostcode(input: string): string {
  const compact = compactPostcode(input);
  if (compact.length > 3 && /\d[A-Z]{2}$/.test(compact)) {
    return `${compact.slice(0, -3)} ${compact.slice(-3)}`;
  }
  return compact;
}

/**
 * Pulls the outward code from a full or partial postcode: "SW11 3AB" -> "SW11",
 * "EH3 6QG" -> "EH3", "M1" -> "M1".
 *
 * Whitespace can't be relied on, so a full postcode is detected by its inward
 * code, which is always exactly three characters: a digit then two letters.
 * Matching the outward shape alone would swallow part of the inward code on
 * single-digit districts ("EH36QG" -> "EH36Q").
 */
export function outwardCode(input: string): string {
  const compact = normalisePostcode(input).replace(/\s/g, "");
  if (!compact) return "";

  if (compact.length > 3 && /\d[A-Z]{2}$/.test(compact)) {
    return compact.slice(0, -3);
  }

  const match = compact.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  return match ? match[1] : compact;
}

/** Resolves a full or partial postcode to a point, longest prefix wins. */
export function locatePostcode(input: string): (GeoPoint & { town: string }) | null {
  const compact = normalisePostcode(input).replace(/\s/g, "");
  if (!compact) return null;

  const exact = OUTCODE_CENTROIDS[outwardCode(compact)];
  if (exact) return exact;

  // Partial entry such as "SW1" or "M" — match any outcode starting with it.
  const candidates = Object.entries(OUTCODE_CENTROIDS).filter(([code]) =>
    code.startsWith(compact),
  );
  if (candidates.length === 0) return null;

  const lat = candidates.reduce((sum, [, c]) => sum + c.lat, 0) / candidates.length;
  const lng = candidates.reduce((sum, [, c]) => sum + c.lng, 0) / candidates.length;
  return {
    lat,
    lng,
    town: candidates.length === 1 ? candidates[0][1].town : `${compact} area`,
  };
}

/** Great-circle distance between two points, in miles. */
export function distanceMiles(a: GeoPoint, b: GeoPoint): number {
  const R = 3958.8;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** True when the text looks like the start of a UK postcode rather than a place name. */
export function looksLikePostcode(input: string): boolean {
  return /^[A-Z]{1,2}\d/i.test(input.trim());
}

/** The standard full UK postcode pattern (outward + inward, space required). */
const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2}$/;

/** True for a complete, correctly-shaped UK postcode — not a partial/outward one. */
export function isValidUkPostcode(input: string): boolean {
  return UK_POSTCODE_REGEX.test(formatPostcode(input));
}
