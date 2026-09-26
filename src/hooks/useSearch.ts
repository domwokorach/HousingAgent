"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import { criteriaFromParams, paramsFromCriteria, runSearch } from "@/lib/search";
import { selectListings } from "@/lib/db";
import type { Intent } from "@/types/property";
import type { SearchCriteria, SearchOutcome } from "@/types/search";
import { useAppState } from "./useAppState";

/**
 * Property search driven entirely by the URL, so every result set is
 * linkable and the back button moves through searches.
 */
export function useSearch({
  basePath,
  lockedIntent,
}: {
  basePath: string;
  lockedIntent?: Intent;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const state = useAppState();

  const criteria = useMemo<SearchCriteria>(() => {
    const parsed = criteriaFromParams(
      new URLSearchParams(searchParams.toString()),
      lockedIntent ? { intent: lockedIntent } : {},
    );
    return lockedIntent ? { ...parsed, intent: lockedIntent } : parsed;
  }, [searchParams, lockedIntent]);

  const outcome = useMemo<SearchOutcome>(
    () => runSearch(selectListings(state), criteria),
    [state, criteria],
  );

  const applyCriteria = useCallback(
    (next: SearchCriteria) => {
      const params = paramsFromCriteria(next);
      if (lockedIntent) params.delete("intent");
      const query = params.toString();
      router.push(query ? `${basePath}?${query}` : basePath, { scroll: false });
    },
    [router, basePath, lockedIntent],
  );

  const clear = useCallback(() => router.push(basePath), [router, basePath]);

  const activeFilterCount = useMemo(
    () =>
      [
        criteria.minPrice !== null || criteria.maxPrice !== null,
        criteria.minBeds !== null,
        criteria.types.length > 0,
      ].filter(Boolean).length,
    [criteria],
  );

  return {
    hydrated: state.hydrated,
    criteria,
    applyCriteria,
    clear,
    activeFilterCount,
    ...outcome,
  };
}
