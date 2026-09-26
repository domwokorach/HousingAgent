import { distanceMiles, locatePostcode, looksLikePostcode } from "./postcode";
import type { Property, PropertyType } from "@/types/property";
import type { SearchCriteria, SearchOutcome, SearchResult } from "@/types/search";

export const DEFAULT_CRITERIA: SearchCriteria = {
  intent: "any",
  query: "",
  radius: 5,
  minPrice: null,
  maxPrice: null,
  minBeds: null,
  maxBeds: null,
  types: [],
  sort: "relevance",
};

function textMatchScore(property: Property, query: string): number {
  const needle = query.trim().toLowerCase();
  if (!needle) return 0;

  const haystacks: Array<[string, number]> = [
    [property.postcode.toLowerCase(), 5],
    [property.town.toLowerCase(), 4],
    [property.addressLine1.toLowerCase(), 3],
    [(property.addressLine2 ?? "").toLowerCase(), 2],
    [property.title.toLowerCase(), 2],
    [property.description.toLowerCase(), 1],
  ];

  let score = 0;
  for (const [text, weight] of haystacks) {
    if (!text) continue;
    if (text.startsWith(needle)) score += weight * 2;
    else if (text.includes(needle)) score += weight;
  }
  return score;
}

export function runSearch(
  properties: Property[],
  criteria: SearchCriteria,
): SearchOutcome {
  const query = criteria.query.trim();
  const located = query ? locatePostcode(query) : null;

  // A town name that isn't a postcode still matches on text, so only treat the
  // query as unresolvable when it *looks* like a postcode and isn't one we know.
  const unresolvedLocation = Boolean(query) && !located && looksLikePostcode(query);

  const centre = located
    ? { lat: located.lat, lng: located.lng, label: located.town }
    : null;

  const results: SearchResult[] = [];

  for (const property of properties) {
    if (criteria.intent !== "any" && property.intent !== criteria.intent) continue;
    if (criteria.minPrice !== null && property.price < criteria.minPrice) continue;
    if (criteria.maxPrice !== null && property.price > criteria.maxPrice) continue;
    if (criteria.minBeds !== null && property.bedrooms < criteria.minBeds) continue;
    if (criteria.maxBeds !== null && property.bedrooms > criteria.maxBeds) continue;
    if (criteria.types.length > 0 && !criteria.types.includes(property.type)) continue;

    const distance = centre ? distanceMiles(centre, property) : null;
    const textScore = textMatchScore(property, query);

    if (distance !== null) {
      // Within the radius, or a strong text match elsewhere (e.g. exact town).
      if (distance > criteria.radius && textScore < 4) continue;
    } else if (query && textScore === 0) {
      continue;
    }

    const proximityScore = distance === null ? 0 : Math.max(0, 12 - distance);
    results.push({
      property,
      distance,
      score: textScore * 3 + proximityScore + (property.featured ? 2 : 0),
    });
  }

  const byNewest = (a: SearchResult, b: SearchResult) =>
    new Date(b.property.listedAt).getTime() - new Date(a.property.listedAt).getTime();

  switch (criteria.sort) {
    case "price-asc":
      results.sort((a, b) => a.property.price - b.property.price);
      break;
    case "price-desc":
      results.sort((a, b) => b.property.price - a.property.price);
      break;
    case "newest":
      results.sort(byNewest);
      break;
    default:
      results.sort((a, b) => b.score - a.score || byNewest(a, b));
  }

  return { results, centre, unresolvedLocation };
}

/* --------------------------------------------- URL <-> criteria plumbing */

function num(value: string | null): number | null {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function criteriaFromParams(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
  defaults: Partial<SearchCriteria> = {},
): SearchCriteria {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) return params.get(key);
    const value = params[key];
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
  };

  const intent = get("intent");
  const sort = get("sort");
  const types = (get("type") ?? "")
    .split(",")
    .filter(Boolean) as PropertyType[];

  return {
    ...DEFAULT_CRITERIA,
    ...defaults,
    intent:
      intent === "rent" || intent === "buy" || intent === "any"
        ? intent
        : defaults.intent ?? DEFAULT_CRITERIA.intent,
    query: get("q") ?? "",
    radius: num(get("radius")) ?? defaults.radius ?? DEFAULT_CRITERIA.radius,
    minPrice: num(get("min")),
    maxPrice: num(get("max")),
    minBeds: num(get("beds")),
    maxBeds: num(get("bedsMax")),
    types,
    sort:
      sort === "price-asc" || sort === "price-desc" || sort === "newest"
        ? sort
        : "relevance",
  };
}

export function paramsFromCriteria(criteria: SearchCriteria): URLSearchParams {
  const params = new URLSearchParams();
  if (criteria.intent !== "any") params.set("intent", criteria.intent);
  if (criteria.query.trim()) params.set("q", criteria.query.trim());
  if (criteria.radius !== DEFAULT_CRITERIA.radius) {
    params.set("radius", String(criteria.radius));
  }
  if (criteria.minPrice !== null) params.set("min", String(criteria.minPrice));
  if (criteria.maxPrice !== null) params.set("max", String(criteria.maxPrice));
  if (criteria.minBeds !== null) params.set("beds", String(criteria.minBeds));
  if (criteria.maxBeds !== null) params.set("bedsMax", String(criteria.maxBeds));
  if (criteria.types.length) params.set("type", criteria.types.join(","));
  if (criteria.sort !== "relevance") params.set("sort", criteria.sort);
  return params;
}
