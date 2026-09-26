import { getSnapshot, selectListings, selectSavedIds, selectSavedKey, update } from "@/lib/db";
import { ok, type Result } from "@/types/api";
import type { Property } from "@/types/property";

export async function listFavouriteIds(): Promise<string[]> {
  return selectSavedIds(getSnapshot());
}

/** Resolved to full listings, newest save first, skipping anything withdrawn. */
export async function listFavourites(): Promise<Property[]> {
  const state = getSnapshot();
  const listings = selectListings(state);
  return selectSavedIds(state)
    .map((id) => listings.find((property) => property.id === id))
    .filter((property): property is Property => Boolean(property));
}

export async function isFavourite(propertyId: string): Promise<boolean> {
  return selectSavedIds(getSnapshot()).includes(propertyId);
}

export async function toggleFavourite(propertyId: string): Promise<Result<boolean>> {
  const key = selectSavedKey(getSnapshot());
  let saved = false;

  update((state) => {
    const existing = state.saved[key] ?? [];
    saved = !existing.includes(propertyId);
    const next = saved
      ? [propertyId, ...existing]
      : existing.filter((id) => id !== propertyId);
    return { ...state, saved: { ...state.saved, [key]: next } };
  });

  return ok(saved);
}

export async function clearFavourites(): Promise<Result> {
  const key = selectSavedKey(getSnapshot());
  update((state) => ({ ...state, saved: { ...state.saved, [key]: [] } }));
  return ok();
}
