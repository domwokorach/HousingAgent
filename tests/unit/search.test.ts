import { describe, expect, it } from "vitest";
import {
  DEFAULT_CRITERIA,
  criteriaFromParams,
  paramsFromCriteria,
  runSearch,
} from "@/lib/search";
import { properties } from "@/lib/seed";
import type { SearchCriteria } from "@/types/search";

const criteria = (overrides: Partial<SearchCriteria> = {}): SearchCriteria => ({
  ...DEFAULT_CRITERIA,
  ...overrides,
});

describe("runSearch filtering", () => {
  it("returns everything when nothing is set", () => {
    expect(runSearch(properties, criteria()).results).toHaveLength(properties.length);
  });

  it("filters by intent", () => {
    const { results } = runSearch(properties, criteria({ intent: "rent" }));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.property.intent === "rent")).toBe(true);
  });

  it("respects a price range", () => {
    const { results } = runSearch(
      properties,
      criteria({ intent: "rent", minPrice: 1000, maxPrice: 2000 }),
    );
    expect(results.every((r) => r.property.price >= 1000 && r.property.price <= 2000)).toBe(
      true,
    );
  });

  it("respects a bedroom minimum", () => {
    const { results } = runSearch(properties, criteria({ minBeds: 4 }));
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.property.bedrooms >= 4)).toBe(true);
  });

  it("filters by property type", () => {
    const { results } = runSearch(properties, criteria({ types: ["bungalow"] }));
    expect(results.every((r) => r.property.type === "bungalow")).toBe(true);
  });
});

describe("runSearch by location", () => {
  it("resolves a postcode and measures distance from it", () => {
    const { results, centre } = runSearch(
      properties,
      criteria({ query: "SW11", radius: 10 }),
    );
    expect(centre).not.toBeNull();
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((r) => r.distance !== null)).toBe(true);
  });

  it("narrows as the radius shrinks", () => {
    const wide = runSearch(properties, criteria({ query: "SW11", radius: 40 }));
    const tight = runSearch(properties, criteria({ query: "SW11", radius: 1 }));
    expect(tight.results.length).toBeLessThanOrEqual(wide.results.length);
  });

  it("flags a postcode-shaped query it cannot place", () => {
    const outcome = runSearch(properties, criteria({ query: "ZZ99" }));
    expect(outcome.unresolvedLocation).toBe(true);
    expect(outcome.centre).toBeNull();
  });

  it("does not flag a town name as an unresolved postcode", () => {
    expect(runSearch(properties, criteria({ query: "Bristol" })).unresolvedLocation).toBe(
      false,
    );
  });

  it("matches a town by text", () => {
    const { results } = runSearch(properties, criteria({ query: "Cambridge" }));
    expect(results.length).toBeGreaterThan(0);
  });
});

describe("runSearch sorting", () => {
  it("sorts ascending by price", () => {
    const { results } = runSearch(
      properties,
      criteria({ intent: "buy", sort: "price-asc" }),
    );
    const prices = results.map((r) => r.property.price);
    expect([...prices].sort((a, b) => a - b)).toEqual(prices);
  });

  it("sorts descending by price", () => {
    const { results } = runSearch(
      properties,
      criteria({ intent: "buy", sort: "price-desc" }),
    );
    const prices = results.map((r) => r.property.price);
    expect([...prices].sort((a, b) => b - a)).toEqual(prices);
  });

  it("sorts newest first", () => {
    const { results } = runSearch(properties, criteria({ sort: "newest" }));
    const dates = results.map((r) => new Date(r.property.listedAt).getTime());
    expect([...dates].sort((a, b) => b - a)).toEqual(dates);
  });
});

describe("criteria and URL params round-trip", () => {
  it("drops defaults from the query string", () => {
    expect(paramsFromCriteria(DEFAULT_CRITERIA).toString()).toBe("");
  });

  it("survives a round trip", () => {
    const original = criteria({
      intent: "buy",
      query: "BS8",
      radius: 10,
      minPrice: 250_000,
      maxPrice: 800_000,
      minBeds: 3,
      types: ["detached"],
      sort: "newest",
    });

    const restored = criteriaFromParams(paramsFromCriteria(original));
    expect(restored).toEqual(original);
  });

  it("ignores an unknown sort value", () => {
    expect(criteriaFromParams(new URLSearchParams("sort=sideways")).sort).toBe(
      "relevance",
    );
  });

  it("reads plain objects as well as URLSearchParams", () => {
    expect(criteriaFromParams({ q: "LS6", beds: "2" }).minBeds).toBe(2);
  });
});
