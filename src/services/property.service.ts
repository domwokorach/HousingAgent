/**
 * Property reads and writes.
 *
 * Everything is async and returns a `Result` for mutations, so the UI is
 * already written against the shape a real API would return. Today the calls
 * resolve immediately from the client-side store in `src/lib/db.ts`; swapping
 * in `fetch` later touches only this file.
 */

import { getSnapshot, selectListings, update } from "@/lib/db";
import { runSearch } from "@/lib/search";
import { agents } from "@/lib/seed";
import { makeId } from "@/lib/utils";
import { canListProperties } from "@/constants/accountTypes";
import { fail, ok, type Result } from "@/types/api";
import type {
  Property,
  PropertyDraft,
  PropertyImage,
} from "@/types/property";
import type { SearchCriteria, SearchOutcome } from "@/types/search";
import type { User } from "@/types/user";

export async function listProperties(): Promise<Property[]> {
  return selectListings(getSnapshot());
}

export async function getProperty(id: string): Promise<Property | null> {
  return selectListings(getSnapshot()).find((p) => p.id === id) ?? null;
}

export async function searchProperties(
  criteria: SearchCriteria,
): Promise<SearchOutcome> {
  return runSearch(selectListings(getSnapshot()), criteria);
}

export async function getFeaturedProperties(limit = 6): Promise<Property[]> {
  return selectListings(getSnapshot())
    .filter((property) => property.featured)
    .slice(0, limit);
}

export async function getPropertiesByAgent(agentId: string): Promise<Property[]> {
  return selectListings(getSnapshot()).filter(
    (property) => property.agentId === agentId,
  );
}

/** Same intent, and either the same town or a comparable size. */
export async function getSimilarProperties(
  property: Property,
  limit = 3,
): Promise<Property[]> {
  return selectListings(getSnapshot())
    .filter(
      (other) =>
        other.id !== property.id &&
        other.intent === property.intent &&
        (other.town === property.town ||
          Math.abs(other.bedrooms - property.bedrooms) <= 1),
    )
    .slice(0, limit);
}

/** The listings a given account is responsible for. */
export async function listPropertiesForOwner(user: User | null): Promise<Property[]> {
  if (!user) return [];
  return selectListings(getSnapshot()).filter(
    (property) =>
      property.ownerEmail === user.email ||
      (user.accountType === "agent" && property.agentId === user.email),
  );
}

export async function createProperty(
  draft: PropertyDraft,
  user: User | null,
): Promise<Result<string>> {
  if (!user) return fail("You must be signed in to list a property.");
  if (!canListProperties(user.accountType)) {
    return fail("Only landlord, seller and agent accounts can list a property.");
  }
  if (!agents.some((agent) => agent.id === draft.agentId)) {
    return fail("Choose the agent marketing this property.", "agentId");
  }

  const id = makeId("user");
  const listing: Property = {
    ...draft,
    id,
    listedAt: new Date().toISOString(),
    ownerEmail: user.email,
  };

  update((state) => ({ ...state, created: [listing, ...state.created] }));
  return ok(id);
}

export async function updateProperty(
  id: string,
  patch: Partial<Property>,
): Promise<Result> {
  const exists = selectListings(getSnapshot()).some((p) => p.id === id);
  if (!exists) return fail("That listing no longer exists.");

  update((state) => ({
    ...state,
    overrides: { ...state.overrides, [id]: { ...state.overrides[id], ...patch } },
  }));
  return ok();
}

export async function deleteProperty(id: string): Promise<Result> {
  update((state) =>
    state.removed.includes(id)
      ? state
      : { ...state, removed: [...state.removed, id] },
  );
  return ok();
}

export async function setPropertyImages(
  id: string,
  images: PropertyImage[],
): Promise<Result> {
  return updateProperty(id, { images });
}
