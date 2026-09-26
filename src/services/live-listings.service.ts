/**
 * Live property listings from the Homedata feed.
 *
 * Everything goes through /api/properties so the provider key stays on the
 * server. That route also caches, which matters here: Homedata bills per
 * returned listing rather than per request.
 */

import { fail, ok, type Result } from "@/types/api";
import type { LiveListingResults, LiveListingSearch } from "@/types/listing";

export interface LiveListingsError {
  message: string;
  /** False when the feature simply has no API key configured. */
  configured: boolean;
}

export async function searchLiveListings(
  input: LiveListingSearch,
): Promise<Result<LiveListingResults>> {
  const params = new URLSearchParams({
    location: input.location.trim(),
    intent: input.intent,
  });

  if (input.minBedrooms) params.set("bedrooms", String(input.minBedrooms));
  if (input.maxPrice) params.set("maxPrice", String(input.maxPrice));
  if (input.pageSize) params.set("pageSize", String(input.pageSize));

  try {
    const response = await fetch(`/api/properties?${params.toString()}`, {
      headers: { accept: "application/json" },
    });
    const data = await response.json().catch(() => null);

    if (response.ok && data && Array.isArray(data.listings)) {
      return ok(data as LiveListingResults);
    }

    const message =
      data && typeof data.error === "string"
        ? data.error
        : "Live listings are unavailable right now.";

    // 503 with configured:false means "no API key", which the UI explains
    // differently from a genuine failure.
    return fail(message, data?.configured === false ? "unconfigured" : undefined);
  } catch {
    return fail(
      "We couldn't reach the live listings service. Check your connection and try again.",
    );
  }
}
