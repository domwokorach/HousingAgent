import type { Intent, Property, PropertyType } from "./property";
import type { Agent, Specialisation } from "./agent";

export type SortOption = "relevance" | "price-asc" | "price-desc" | "newest";

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** A resolved place: the centre of a postcode search. */
export interface PlacePoint extends GeoPoint {
  label: string;
}

export interface SearchCriteria {
  intent: Intent | "any";
  /** Free text: a postcode, a town, or an area name. */
  query: string;
  radius: number;
  minPrice: number | null;
  maxPrice: number | null;
  minBeds: number | null;
  maxBeds: number | null;
  types: PropertyType[];
  sort: SortOption;
}

export interface SearchResult {
  property: Property;
  /** Miles from the searched location, when the query resolved to a point. */
  distance: number | null;
  score: number;
}

export interface SearchOutcome {
  results: SearchResult[];
  centre: PlacePoint | null;
  /** True when a postcode-looking query matched no known place. */
  unresolvedLocation: boolean;
}

export interface AgentCriteria {
  query: string;
  location: string;
  radius: number;
  specialisation: Specialisation | "";
}

export interface AgentMatch {
  agent: Agent;
  distance: number | null;
}

export interface AgentSearchOutcome {
  matches: AgentMatch[];
  centre: PlacePoint | null;
}
