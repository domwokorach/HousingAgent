/**
 * Property reads and writes.
 *
 * Two sources are merged: the seed/demo catalog (still served from the
 * client-side store in `src/lib/db.ts`, unchanged) and real listings created
 * in-app, which live in Postgres behind `/api/listings` (see
 * `src/lib/properties-db.ts` — not `/api/properties`, which is the unrelated
 * Homedata live-listings proxy). Everything here is async and mutations
 * return a `Result`, so callers don't need to know which source a listing
 * came from.
 */

import { getSnapshot, selectListings, update } from "@/lib/db";
import { runSearch } from "@/lib/search";
import { agents } from "@/lib/seed";
import { canListProperties } from "@/constants/accountTypes";
import { fail, ok, type Result } from "@/types/api";
import type {
  Property,
  PropertyDraft,
  PropertyImage,
} from "@/types/property";
import type { SearchCriteria, SearchOutcome } from "@/types/search";
import type { User } from "@/types/user";

/**
 * This module is imported from both server components (`src/app/page.tsx`,
 * `src/app/agents/[agentId]/page.tsx`) and client code (`useProperties`), and
 * a relative `fetch("/api/listings")` only resolves in the browser — Node's
 * fetch has no implicit origin. Server-side, call the query layer directly
 * instead of round-tripping through our own API route. The dynamic import
 * keeps `pg` (Node-only) out of the client bundle: the `window` check means
 * this branch, and therefore the chunk, never runs in the browser.
 */
/** DB-only listings, no seed data — used by `useProperties` to merge itself. */
export async function fetchDbListings(): Promise<Property[]> {
  try {
    if (typeof window === "undefined") {
      const { dbListProperties } = await import("@/lib/properties-db");
      return await dbListProperties();
    }
    const response = await fetch("/api/listings", { cache: "no-store" });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data.properties) ? (data.properties as Property[]) : [];
  } catch {
    // Listings storage not configured, or the call failed — the app still
    // works with just the seed/demo catalog.
    return [];
  }
}

async function allListings(): Promise<Property[]> {
  const [seeded, db] = await Promise.all([
    Promise.resolve(selectListings(getSnapshot())),
    fetchDbListings(),
  ]);
  return [...db, ...seeded];
}

export async function listProperties(): Promise<Property[]> {
  return allListings();
}

export async function getProperty(id: string): Promise<Property | null> {
  return (await allListings()).find((p) => p.id === id) ?? null;
}

export async function searchProperties(
  criteria: SearchCriteria,
): Promise<SearchOutcome> {
  return runSearch(await allListings(), criteria);
}

export async function getFeaturedProperties(limit = 6): Promise<Property[]> {
  return (await allListings()).filter((property) => property.featured).slice(0, limit);
}

export async function getPropertiesByAgent(agentId: string): Promise<Property[]> {
  return (await allListings()).filter((property) => property.agentId === agentId);
}

/** Same intent, and either the same town or a comparable size. */
export async function getSimilarProperties(
  property: Property,
  limit = 3,
): Promise<Property[]> {
  return (await allListings())
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
  return (await allListings()).filter(
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

  try {
    const response = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-owner-email": user.email },
      body: JSON.stringify(draft),
    });
    const data = await response.json();
    if (!response.ok) return fail(data.error ?? "That listing couldn't be saved.");
    return ok(data.id as string);
  } catch {
    return fail("That listing couldn't be saved right now.");
  }
}

/** The pre-migration mock-store update, kept as a fallback for seed/demo listing ids. */
function updatePropertyInMockStore(id: string, patch: Partial<Property>): Result {
  const exists = selectListings(getSnapshot()).some((p) => p.id === id);
  if (!exists) return fail("That listing no longer exists.");

  update((state) => ({
    ...state,
    overrides: { ...state.overrides, [id]: { ...state.overrides[id], ...patch } },
  }));
  return ok();
}

export async function updateProperty(
  id: string,
  patch: Partial<Property>,
): Promise<Result> {
  try {
    const response = await fetch(`/api/listings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (response.status === 404) return updatePropertyInMockStore(id, patch);
    const data = await response.json();
    if (!response.ok) return fail(data.error ?? "That listing couldn't be updated.");
    return ok();
  } catch {
    return updatePropertyInMockStore(id, patch);
  }
}

export async function deleteProperty(id: string): Promise<Result> {
  try {
    const response = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (response.ok || response.status === 404) {
      // Seed/demo listings aren't rows in Postgres, so a 404 there just means
      // "fall back to the mock store's soft-delete," same as before the
      // migration — it never fails.
      update((state) =>
        state.removed.includes(id) ? state : { ...state, removed: [...state.removed, id] },
      );
      return ok();
    }
    const data = await response.json();
    return fail(data.error ?? "That listing couldn't be deleted right now.");
  } catch {
    update((state) =>
      state.removed.includes(id) ? state : { ...state, removed: [...state.removed, id] },
    );
    return ok();
  }
}

export async function setPropertyImages(
  id: string,
  images: PropertyImage[],
): Promise<Result> {
  try {
    const response = await fetch(`/api/listings/${id}/images`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(images),
    });
    if (response.status === 404) return updatePropertyInMockStore(id, { images });
    const data = await response.json();
    if (!response.ok) return fail(data.error ?? "Those photos couldn't be saved.");
    return ok();
  } catch {
    return updatePropertyInMockStore(id, { images });
  }
}
