import { NextResponse, type NextRequest } from "next/server";
import {
  HOMEDATA_BASE_URL,
  homedataBoundarySchema,
  homedataSearchSchema,
  readProviderError,
  toLiveListing,
  toTransactionType,
} from "@/lib/homedata";
import type { Intent } from "@/types/property";
import type { LiveListing, LiveListingResults } from "@/types/listing";

/**
 * Live property search, proxied through the server so the Homedata key never
 * reaches the browser.
 *
 * Two calls per search: a boundary lookup to turn a place name into an id,
 * then the listings search itself. Both cost credit — measured against the
 * live API, the boundary lookup is 1 token and the search is 5, on top of the
 * per-listing charge. Both are therefore cached: the boundary for the process
 * lifetime because place names don't move, the search for five minutes,
 * so a re-rendering component cannot burn credit.
 *
 * Note: the published OpenAPI document describes the boundary autocomplete as
 * "open access — no API key required", but the deployed endpoint returns 403
 * without one. The key is sent on both calls.
 */

export const dynamic = "force-dynamic";

/** Kept low by default: every listing returned costs credit. */
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50; // the provider allows 200; we do not need it
const REQUEST_TIMEOUT_MS = 12_000;
const SEARCH_TTL_MS = 5 * 60 * 1000;

interface CacheEntry<T> {
  value: T;
  expires: number;
}

const boundaryCache = new Map<string, CacheEntry<{ id: string; name: string | null }>>();
const searchCache = new Map<string, CacheEntry<LiveListingResults>>();
const MAX_CACHE_ENTRIES = 200;

function readCache<T>(store: Map<string, CacheEntry<T>>, key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expires < Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

function writeCache<T>(
  store: Map<string, CacheEntry<T>>,
  key: string,
  value: T,
  ttlMs: number,
): T {
  if (store.size >= MAX_CACHE_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

function providerFetch(url: string, apiKey: string) {
  return fetch(url, {
    headers: { Authorization: `Api-Key ${apiKey}`, accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
}

/**
 * Maps a provider failure onto something we are willing to show a visitor.
 *
 * The provider's own message is logged but never forwarded: it carries
 * operator detail — API key prefixes, token balances, top-up links — that a
 * visitor should not see and cannot act on.
 */
async function providerFailure(response: Response, context: string) {
  let detail = `HTTP ${response.status}`;
  try {
    detail = (await response.json().then(readProviderError)) ?? detail;
  } catch {
    /* non-JSON body — keep the status */
  }

  switch (response.status) {
    case 401:
    case 403:
      console.error(`[api/properties] Homedata rejected the API key (${context}):`, detail);
      return NextResponse.json(
        { error: "Live listings are unavailable right now." },
        { status: 502 },
      );

    // 402 insufficient_tokens: the account is out of credit. That is an
    // operator problem, so the visitor gets a neutral message.
    case 402:
      console.error(
        `[api/properties] Homedata credit exhausted (${context}) — top up at https://homedata.co.uk/subscription:`,
        detail,
      );
      return NextResponse.json(
        { error: "Live listings are temporarily unavailable." },
        { status: 502 },
      );

    case 429:
      console.warn(`[api/properties] Homedata rate limit (${context}):`, detail);
      return NextResponse.json(
        { error: "Too many live searches just now — try again in a moment." },
        { status: 429 },
      );

    default:
      console.error(`[api/properties] Homedata error (${context}):`, detail);
      return NextResponse.json(
        { error: "Live listings are unavailable right now." },
        { status: 502 },
      );
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const location = (params.get("location") ?? "").trim();
  if (!location) {
    return NextResponse.json({ error: "A location is required." }, { status: 400 });
  }
  if (location.length > 80) {
    return NextResponse.json({ error: "That location is too long." }, { status: 400 });
  }

  const intentParam = (params.get("intent") ?? params.get("type") ?? "buy").toLowerCase();
  const intent: Intent =
    intentParam === "rent" || intentParam === "rental" ? "rent" : "buy";

  const bedrooms = positiveInt(params.get("bedrooms"), 0, 20);
  const maxPrice = positiveInt(params.get("maxPrice"), 0, 100_000_000);
  const pageSize = Math.min(
    positiveInt(params.get("pageSize"), 1, MAX_PAGE_SIZE) ?? DEFAULT_PAGE_SIZE,
    MAX_PAGE_SIZE,
  );

  const apiKey = process.env.HOMEDATA_API_KEY;
  if (!apiKey) {
    // 503, not 500: the app is fine, this feature just isn't configured.
    return NextResponse.json(
      {
        error:
          "Live listings aren't configured. Set HOMEDATA_API_KEY in .env.local — see README.md.",
        configured: false,
      },
      { status: 503 },
    );
  }

  const cacheKey = JSON.stringify([
    location.toLowerCase(),
    intent,
    bedrooms,
    maxPrice,
    pageSize,
  ]);
  const cached = readCache(searchCache, cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    /* ---------------------------------------- 1. place name -> boundary id */
    const boundaryKey = location.toLowerCase();
    let boundary = readCache(boundaryCache, boundaryKey);

    if (!boundary) {
      const boundaryResponse = await providerFetch(
        `${HOMEDATA_BASE_URL}/boundaries/autocomplete/?limit=1&q=${encodeURIComponent(location)}`,
        apiKey,
      );

      if (!boundaryResponse.ok) {
        return providerFailure(boundaryResponse, "boundary lookup");
      }

      const parsed = homedataBoundarySchema.safeParse(await boundaryResponse.json());
      const first = parsed.success ? parsed.data.results?.[0] : undefined;

      if (!first) {
        return NextResponse.json(
          { error: `We couldn't find anywhere called "${location}".` },
          { status: 404 },
        );
      }

      // Boundaries are stable, so this is cached for the process lifetime.
      boundary = writeCache(
        boundaryCache,
        boundaryKey,
        { id: String(first.id), name: first.name ?? first.label ?? null },
        24 * 60 * 60 * 1000,
      );
    }

    /* -------------------------------------------- 2. search live listings */
    const search = new URLSearchParams({
      boundary_id: boundary.id,
      transaction_type: toTransactionType(intent),
      page_size: String(pageSize),
    });

    // The provider treats `bedrooms` as a minimum, not an exact match.
    if (bedrooms !== null) search.set("bedrooms", String(bedrooms));
    if (maxPrice !== null) search.set("max_price", String(maxPrice));

    const listingsResponse = await providerFetch(
      `${HOMEDATA_BASE_URL}/live-listings/search/?${search.toString()}`,
      apiKey,
    );

    if (!listingsResponse.ok) {
      return providerFailure(listingsResponse, "listings search");
    }

    const parsed = homedataSearchSchema.safeParse(await listingsResponse.json());
    if (!parsed.success) {
      console.error("[api/properties] unexpected Homedata response shape");
      return NextResponse.json(
        { error: "Live listings came back in a format we didn't recognise." },
        { status: 502 },
      );
    }

    const listings = (parsed.data.results ?? [])
      .map(toLiveListing)
      .filter((listing): listing is LiveListing => listing !== null);

    const payload: LiveListingResults = {
      location,
      boundary: boundary.name,
      total: parsed.data.count ?? listings.length,
      listings,
    };

    return NextResponse.json(writeCache(searchCache, cacheKey, payload, SEARCH_TTL_MS));
  } catch (error) {
    console.error("[api/properties]", error);
    return NextResponse.json(
      { error: "Live listings are unavailable right now." },
      { status: 502 },
    );
  }
}

/** Parses a bounded positive integer, returning null when absent or invalid. */
function positiveInt(raw: string | null, min: number, max: number): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return value;
}
