import { describe, expect, it } from "vitest";
import {
  fromTransactionType,
  toLiveListing,
  toTransactionType,
} from "@/lib/homedata";

/** A listing shaped the way the provider documentation describes. */
const raw = {
  id: "abc123",
  display_address: "Example Road, Manchester",
  latest_price: 280000,
  transaction_type: "Sale",
  latest_status: "For sale",
  bedrooms: 3,
  bathrooms: 1,
  listing_property_type: "Semi-Detached",
  images: ["https://cdn.example.com/1.jpg", "https://cdn.example.com/2.jpg"],
  agent_name: "Example Estate Agents",
  geopoint: { lat: 53.48, lon: -2.24 },
  added_date: "2026-09-01",
};

describe("transaction type mapping", () => {
  it("maps our intents onto the provider's enum", () => {
    // The provider's enum is Sale | Rental — not "Rent".
    expect(toTransactionType("buy")).toBe("Sale");
    expect(toTransactionType("rent")).toBe("Rental");
  });

  it("maps the provider's values back", () => {
    expect(fromTransactionType("Sale")).toBe("buy");
    expect(fromTransactionType("Rental")).toBe("rent");
    expect(fromTransactionType("rental")).toBe("rent");
  });

  it("treats anything unrecognised as a sale rather than throwing", () => {
    expect(fromTransactionType(undefined)).toBe("buy");
    expect(fromTransactionType(null)).toBe("buy");
  });
});

describe("toLiveListing", () => {
  it("maps a well-formed listing", () => {
    const listing = toLiveListing(raw);
    expect(listing).toMatchObject({
      id: "abc123",
      address: "Example Road, Manchester",
      price: 280000,
      intent: "buy",
      status: "For sale",
      bedrooms: 3,
      bathrooms: 1,
      propertyType: "Semi-Detached",
      agentName: "Example Estate Agents",
      addedDate: "2026-09-01",
    });
  });

  it("reads geopoint lat/lon into lat/lng", () => {
    const listing = toLiveListing(raw);
    // geopoint uses `lon`; the app uses `lng`. Getting this wrong puts
    // properties in the sea.
    expect(listing?.lat).toBe(53.48);
    expect(listing?.lng).toBe(-2.24);
  });

  it("accepts a numeric id", () => {
    expect(toLiveListing({ ...raw, id: 99 })?.id).toBe("99");
  });

  it("returns null when the id is missing entirely", () => {
    const withoutId: Record<string, unknown> = { ...raw };
    delete withoutId.id;
    expect(toLiveListing(withoutId)).toBeNull();
  });

  it("returns null for something that isn't a listing", () => {
    expect(toLiveListing(null)).toBeNull();
    expect(toLiveListing("nope")).toBeNull();
  });
});

describe("toLiveListing with missing fields", () => {
  it("uses null rather than undefined, so the UI can test for it", () => {
    const listing = toLiveListing({ id: "1" });
    expect(listing).toMatchObject({
      price: null,
      status: null,
      bedrooms: null,
      bathrooms: null,
      propertyType: null,
      agentName: null,
      lat: null,
      lng: null,
    });
    expect(listing?.images).toEqual([]);
  });

  it("falls back rather than showing an empty address", () => {
    expect(toLiveListing({ id: "1" })?.address).toBe("Address not supplied");
  });

  it("does not turn an empty string into zero", () => {
    expect(toLiveListing({ ...raw, latest_price: "" })?.price).toBeNull();
  });

  it("coerces numeric strings, which JSON feeds often send", () => {
    expect(toLiveListing({ ...raw, latest_price: "280000" })?.price).toBe(280000);
    expect(toLiveListing({ ...raw, bedrooms: "3" })?.bedrooms).toBe(3);
  });

  it("survives a null geopoint", () => {
    const listing = toLiveListing({ ...raw, geopoint: null });
    expect(listing?.lat).toBeNull();
    expect(listing?.lng).toBeNull();
  });
});

describe("image handling", () => {
  it("accepts objects as well as bare URLs", () => {
    const listing = toLiveListing({
      ...raw,
      images: [{ url: "https://cdn.example.com/a.jpg" }, "https://cdn.example.com/b.jpg"],
    });
    expect(listing?.images).toEqual([
      "https://cdn.example.com/a.jpg",
      "https://cdn.example.com/b.jpg",
    ]);
  });

  it("drops anything that isn't an absolute https URL", () => {
    const listing = toLiveListing({
      ...raw,
      images: [
        "javascript:alert(1)",
        "/relative/path.jpg",
        "http://insecure.example.com/x.jpg",
        "https://cdn.example.com/ok.jpg",
        null,
        42,
      ],
    });
    expect(listing?.images).toEqual(["https://cdn.example.com/ok.jpg"]);
  });

  it("copes with images being absent or the wrong type", () => {
    expect(toLiveListing({ ...raw, images: undefined })?.images).toEqual([]);
    expect(toLiveListing({ ...raw, images: "not-an-array" })?.images).toEqual([]);
  });
});

describe("unknown fields", () => {
  it("ignores fields the provider adds later", () => {
    const listing = toLiveListing({ ...raw, some_new_field: { nested: true } });
    expect(listing?.id).toBe("abc123");
  });
});
