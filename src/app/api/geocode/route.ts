import { NextResponse, type NextRequest } from "next/server";
import { fromLngLat, serverGeocodingToken } from "@/lib/mapbox";
import { compactPostcode, formatPostcode, locatePostcode } from "@/lib/postcode";

/**
 * Forward geocoding: postcode (or address) in, coordinates out.
 *
 * This runs server-side so the secret token stays off the client, and so the
 * cache below is shared by everyone rather than per browser tab.
 *
 * Coordinates are looked up once, when a listing is created or edited, and
 * stored on the property — map rendering never calls this route.
 */

export interface GeocodeResult {
  query: string;
  postcode: string;
  lat: number;
  lng: number;
  /** Where the answer came from, so the UI can explain a rough match. */
  source: "mapbox" | "local";
  label?: string;
}

/** Full or partial UK postcode, with or without the space. */
const UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?(\s*\d[A-Z]{2})?$/i;

// Postcodes don't move. A process-lifetime cache is plenty and keeps the
// Mapbox bill down when several listings share an area. Keyed on the compact
// form so "SW11 3AB" and "sw113ab" are one entry, not two.
const cache = new Map<string, GeocodeResult>();
const MAX_CACHE_ENTRIES = 500;

function cacheResult(key: string, result: GeocodeResult): GeocodeResult {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, result);
  return result;
}

/** The offline answer: the local outward-code centroid table. */
function localLookup(query: string): GeocodeResult | null {
  const found = locatePostcode(query);
  if (!found) return null;
  return {
    query,
    postcode: formatPostcode(query),
    lat: found.lat,
    lng: found.lng,
    source: "local",
    label: found.town,
  };
}

async function mapboxLookup(
  query: string,
  token: string,
): Promise<GeocodeResult | null> {
  const url = new URL("https://api.mapbox.com/search/geocode/v6/forward");
  url.searchParams.set("q", query);
  url.searchParams.set("country", "gb");
  url.searchParams.set("limit", "1");
  url.searchParams.set("access_token", token);

  const response = await fetch(url, {
    // Mapbox is the source of truth; our own cache above handles repeats.
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });

  if (!response.ok) {
    throw new Error(`Mapbox responded ${response.status}`);
  }

  const data = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: { full_address?: string; name?: string };
    }>;
  };

  const feature = data.features?.[0];
  const coordinates = feature?.geometry?.coordinates;
  if (!coordinates || coordinates.length !== 2) return null;

  const { lat, lng } = fromLngLat(coordinates);
  return {
    query,
    postcode: formatPostcode(query),
    lat,
    lng,
    source: "mapbox",
    label: feature?.properties?.full_address ?? feature?.properties?.name,
  };
}

export async function GET(request: NextRequest) {
  const raw = (
    request.nextUrl.searchParams.get("postcode") ??
    request.nextUrl.searchParams.get("q") ??
    ""
  ).trim();

  if (!raw) {
    return NextResponse.json(
      { error: "A postcode is required." },
      { status: 400 },
    );
  }

  if (raw.length > 100) {
    return NextResponse.json({ error: "That query is too long." }, { status: 400 });
  }

  // Keep obviously-wrong input away from the paid API.
  if (!UK_POSTCODE.test(raw)) {
    return NextResponse.json(
      { error: "Enter a UK postcode, for example SW1A 1AA." },
      { status: 400 },
    );
  }

  const key = compactPostcode(raw);
  const cached = cache.get(key);
  if (cached) return NextResponse.json(cached);

  const token = serverGeocodingToken();

  if (token) {
    try {
      const result = await mapboxLookup(raw, token);
      if (result) return NextResponse.json(cacheResult(key, result));
    } catch (error) {
      // A Mapbox outage shouldn't take the listing form down with it.
      console.error("[geocode] Mapbox lookup failed:", error);
    }
  }

  const fallback = localLookup(raw);
  if (fallback) return NextResponse.json(cacheResult(key, fallback));

  return NextResponse.json(
    {
      error: token
        ? "We couldn't find that postcode."
        : "We couldn't place that postcode. Mapbox isn't configured, so only a sample of UK areas is available — see README.md.",
    },
    { status: 404 },
  );
}
