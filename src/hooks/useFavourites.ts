"use client";

import { useCallback, useMemo } from "react";
import { selectListings, selectSavedIds } from "@/lib/db";
import * as favouriteService from "@/services/favourite.service";
import type { Property } from "@/types/property";
import { useAppState } from "./useAppState";

export function useFavourites() {
  const state = useAppState();
  const savedIds = useMemo(() => selectSavedIds(state), [state]);

  /** Saved order is preserved, newest first; withdrawn listings drop out. */
  const favourites = useMemo(() => {
    const listings = selectListings(state);
    return savedIds
      .map((id) => listings.find((property) => property.id === id))
      .filter((property): property is Property => Boolean(property));
  }, [state, savedIds]);

  const isSaved = useCallback(
    (propertyId: string) => savedIds.includes(propertyId),
    [savedIds],
  );

  const toggle = useCallback(
    (propertyId: string) => favouriteService.toggleFavourite(propertyId),
    [],
  );

  const clear = useCallback(() => favouriteService.clearFavourites(), []);

  return {
    hydrated: state.hydrated,
    savedIds,
    favourites,
    count: savedIds.length,
    isSaved,
    toggle,
    clear,
  };
}
