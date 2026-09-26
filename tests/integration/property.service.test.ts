import { beforeEach, describe, expect, it } from "vitest";
import { resetForTests } from "@/lib/db";
import { properties as seedProperties } from "@/lib/seed";
import {
  createProperty,
  deleteProperty,
  getProperty,
  listProperties,
  listPropertiesForOwner,
  searchProperties,
  setPropertyImages,
  updateProperty,
} from "@/services/property.service";
import { DEFAULT_CRITERIA } from "@/lib/search";
import type { PropertyDraft } from "@/types/property";
import type { User } from "@/types/user";

const landlord: User = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  phone: "07700 900123",
  accountType: "landlord",
  passwordDigest: "x",
  createdAt: new Date().toISOString(),
};

const tenant: User = { ...landlord, email: "tim@example.com", accountType: "tenant" };

const draft: PropertyDraft = {
  title: "Bright two-bedroom garden flat",
  intent: "rent",
  price: 1450,
  addressLine1: "Flat 2, 19 Alma Road",
  town: "Battersea, London",
  postcode: "SW11 4PJ",
  lat: 51.4649,
  lng: -0.1653,
  type: "flat",
  bedrooms: 2,
  bathrooms: 1,
  sizeSqFt: 720,
  description: "A bright ground-floor flat with its own entrance and a garden.",
  availableFrom: "2026-11-01",
  agentId: "harper-quinn",
  images: [],
};

beforeEach(() => resetForTests());

describe("listing the catalogue", () => {
  it("starts with the seed properties", async () => {
    expect(await listProperties()).toHaveLength(seedProperties.length);
  });
});

describe("createProperty", () => {
  it("adds a listing owned by the signed-in account", async () => {
    const result = await createProperty(draft, landlord);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const created = await getProperty(result.data);
    expect(created?.title).toBe(draft.title);
    expect(created?.ownerEmail).toBe(landlord.email);
    expect(await listProperties()).toHaveLength(seedProperties.length + 1);
  });

  it("refuses when nobody is signed in", async () => {
    expect((await createProperty(draft, null)).ok).toBe(false);
  });

  it("refuses a tenant account", async () => {
    const result = await createProperty(draft, tenant);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/landlord/i);
  });

  it("refuses an unknown marketing agent", async () => {
    const result = await createProperty({ ...draft, agentId: "nobody" }, landlord);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.field).toBe("agentId");
  });
});

describe("updateProperty", () => {
  it("patches a seed listing without mutating the seed data", async () => {
    const target = seedProperties[0];
    const originalTitle = target.title;

    expect((await updateProperty(target.id, { title: "Renamed" })).ok).toBe(true);
    expect((await getProperty(target.id))?.title).toBe("Renamed");
    // The module-level seed array must be untouched.
    expect(seedProperties[0].title).toBe(originalTitle);
  });

  it("refuses a listing that does not exist", async () => {
    expect((await updateProperty("nope", { title: "x" })).ok).toBe(false);
  });
});

describe("deleteProperty", () => {
  it("removes a listing from the catalogue", async () => {
    const target = seedProperties[0];
    await deleteProperty(target.id);

    expect(await getProperty(target.id)).toBeNull();
    expect(await listProperties()).toHaveLength(seedProperties.length - 1);
  });
});

describe("setPropertyImages", () => {
  it("replaces the gallery in order", async () => {
    const target = seedProperties[0];
    const images = [
      { id: "a", src: "/images/properties/kitchen-1.svg", category: "kitchen" as const, alt: "" },
      { id: "b", src: "/images/properties/garden-1.svg", category: "garden" as const, alt: "" },
    ];

    await setPropertyImages(target.id, images);
    const updated = await getProperty(target.id);
    expect(updated?.images.map((image) => image.id)).toEqual(["a", "b"]);
  });
});

describe("listPropertiesForOwner", () => {
  it("returns nothing when signed out", async () => {
    expect(await listPropertiesForOwner(null)).toHaveLength(0);
  });

  it("returns only the account's own listings", async () => {
    await createProperty(draft, landlord);
    const mine = await listPropertiesForOwner(landlord);
    expect(mine).toHaveLength(1);
    expect(mine[0].ownerEmail).toBe(landlord.email);
  });
});

describe("searchProperties", () => {
  it("finds a newly created listing by its postcode", async () => {
    await createProperty(draft, landlord);
    const { results } = await searchProperties({
      ...DEFAULT_CRITERIA,
      query: "SW11 4PJ",
      radius: 5,
    });
    expect(results.some((r) => r.property.title === draft.title)).toBe(true);
  });
});
