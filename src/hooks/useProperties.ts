"use client";

import { useCallback, useMemo } from "react";
import { selectListings, selectUser } from "@/lib/db";
import * as propertyService from "@/services/property.service";
import type { Property, PropertyDraft, PropertyImage } from "@/types/property";
import { useAppState } from "./useAppState";

export function useProperties() {
  const state = useAppState();

  const listings = useMemo(() => selectListings(state), [state]);
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
    (draft: PropertyDraft) => propertyService.createProperty(draft, user),
    [user],
  );
  const updateProperty = useCallback(
    (id: string, patch: Partial<Property>) =>
      propertyService.updateProperty(id, patch),
    [],
  );
  const deleteProperty = useCallback(
    (id: string) => propertyService.deleteProperty(id),
    [],
  );
  const setPropertyImages = useCallback(
    (id: string, images: PropertyImage[]) =>
      propertyService.setPropertyImages(id, images),
    [],
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
