"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { selectListings, selectUser } from "@/lib/db";
import * as propertyService from "@/services/property.service";
import type { Property, PropertyDraft, PropertyImage } from "@/types/property";
import { useAppState } from "./useAppState";

export function useProperties() {
  const state = useAppState();

  // Real, Postgres-backed listings (created in-app via /api/listings) are
  // fetched once on mount and merged with the seed/demo catalog — the mock
  // store's reads are synchronous, but the DB's aren't, so they're held in
  // local state and refreshed after any mutation that might touch them.
  const [dbListings, setDbListings] = useState<Property[]>([]);

  const refetchDbListings = useCallback(async () => {
    setDbListings(await propertyService.fetchDbListings());
  }, []);

  useEffect(() => {
    let active = true;
    propertyService.fetchDbListings().then((properties) => {
      if (active) setDbListings(properties);
    });
    return () => {
      active = false;
    };
  }, []);

  const seedListings = useMemo(() => selectListings(state), [state]);
  const listings = useMemo(
    () => [...dbListings, ...seedListings.filter((p) => !dbListings.some((d) => d.id === p.id))],
    [dbListings, seedListings],
  );
  const user = useMemo(() => selectUser(state), [state]);

  const myListings = useMemo(
    () =>
      user
        ? listings.filter(
            (property) =>
              property.ownerEmail === user.email ||
              (user.accountType === "agent" && property.agentId === user.email),
          )
        : [],
    [listings, user],
  );

  const getProperty = useCallback(
    (id: string): Property | undefined =>
      listings.find((property) => property.id === id),
    [listings],
  );

  const getSimilar = useCallback(
    (property: Property, limit = 3) =>
      listings
        .filter(
          (other) =>
            other.id !== property.id &&
            other.intent === property.intent &&
            (other.town === property.town ||
              Math.abs(other.bedrooms - property.bedrooms) <= 1),
        )
        .slice(0, limit),
    [listings],
  );

  const createProperty = useCallback(
    async (draft: PropertyDraft) => {
      const result = await propertyService.createProperty(draft, user);
      if (result.ok) void refetchDbListings();
      return result;
    },
    [user, refetchDbListings],
  );
  const updateProperty = useCallback(
    async (id: string, patch: Partial<Property>) => {
      const result = await propertyService.updateProperty(id, patch);
      if (result.ok) void refetchDbListings();
      return result;
    },
    [refetchDbListings],
  );
  const deleteProperty = useCallback(
    async (id: string) => {
      const result = await propertyService.deleteProperty(id);
      if (result.ok) void refetchDbListings();
      return result;
    },
    [refetchDbListings],
  );
  const setPropertyImages = useCallback(
    async (id: string, images: PropertyImage[]) => {
      const result = await propertyService.setPropertyImages(id, images);
      if (result.ok) void refetchDbListings();
      return result;
    },
    [refetchDbListings],
  );

  return {
    hydrated: state.hydrated,
    listings,
    myListings,
    getProperty,
    getSimilar,
    createProperty,
    updateProperty,
    deleteProperty,
    setPropertyImages,
  };
}
