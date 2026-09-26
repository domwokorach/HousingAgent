"use client";

import { useCallback, useState } from "react";
import { searchLiveListings } from "@/services/live-listings.service";
import type { LiveListingResults, LiveListingSearch } from "@/types/listing";

/**
 * Drives a live-listings search. Results are never fetched automatically —
 * each call costs credit per listing returned, so a search only happens when
 * somebody asks for one.
 */
export function useLiveListings() {
  const [results, setResults] = useState<LiveListingResults | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [unconfigured, setUnconfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const search = useCallback(async (input: LiveListingSearch) => {
    setLoading(true);
    setError(null);
    setUnconfigured(false);

    try {
      const outcome = await searchLiveListings(input);
      setHasSearched(true);

      if (!outcome.ok) {
        setResults(null);
        setError(outcome.error);
        setUnconfigured(outcome.field === "unconfigured");
        return;
      }

      setResults(outcome.data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, error, unconfigured, loading, hasSearched, search };
}
