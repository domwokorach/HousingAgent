import { beforeEach, describe, expect, it } from "vitest";
import { getSnapshot, resetForTests } from "@/lib/db";
import { properties as seedProperties } from "@/lib/seed";
import {
  clearFavourites,
  isFavourite,
  listFavouriteIds,
  listFavourites,
  toggleFavourite,
} from "@/services/favourite.service";
import { deleteProperty } from "@/services/property.service";
import { register } from "@/services/auth.service";
import { deleteAccount, listEnquiriesForUser } from "@/services/user.service";
import { sendEnquiry } from "@/services/agent.service";
import { createProperty } from "@/services/property.service";
import { selectUser } from "@/lib/db";

const [first, second] = seedProperties;

beforeEach(() => resetForTests());

describe("favourites as a guest", () => {
  it("starts empty", async () => {
    expect(await listFavouriteIds()).toHaveLength(0);
  });

  it("adds and removes", async () => {
    await toggleFavourite(first.id);
    expect(await isFavourite(first.id)).toBe(true);

    await toggleFavourite(first.id);
    expect(await isFavourite(first.id)).toBe(false);
  });

  it("reports whether the toggle saved or unsaved", async () => {
    const saved = await toggleFavourite(first.id);
    expect(saved.ok && saved.data).toBe(true);

    const unsaved = await toggleFavourite(first.id);
    expect(unsaved.ok && unsaved.data).toBe(false);
  });

  it("keeps the newest save first", async () => {
    await toggleFavourite(first.id);
    await toggleFavourite(second.id);
    expect((await listFavourites()).map((p) => p.id)).toEqual([second.id, first.id]);
  });

  it("drops listings that have since been withdrawn", async () => {
    await toggleFavourite(first.id);
    await deleteProperty(first.id);

    expect(await listFavouriteIds()).toContain(first.id);
    expect(await listFavourites()).toHaveLength(0);
  });

  it("clears everything", async () => {
    await toggleFavourite(first.id);
    await toggleFavourite(second.id);
    await clearFavourites();
    expect(await listFavouriteIds()).toHaveLength(0);
  });
});

describe("favourites are per account", () => {
  it("keeps one account's shortlist separate from a guest's", async () => {
    await toggleFavourite(first.id);

    await register({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "07700 900123",
      password: "Analytical1",
      accountType: "tenant",
    });

    // The guest shortlist carries over on sign-up.
    expect(await isFavourite(first.id)).toBe(true);

    await toggleFavourite(second.id);
    expect(getSnapshot().saved["ada@example.com"]).toContain(second.id);
    expect(getSnapshot().saved.guest).not.toContain(second.id);
  });
});

describe("deleteAccount", () => {
  beforeEach(async () => {
    await register({
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      phone: "07700 900123",
      password: "Analytical1",
      accountType: "landlord",
    });
  });

  it("refuses without the right password", async () => {
    const result = await deleteAccount("wrong");
    expect(result.ok).toBe(false);
    expect(selectUser(getSnapshot())).not.toBeNull();
  });

  it("removes the account, its shortlist, listings and enquiries", async () => {
    await toggleFavourite(first.id);
    await createProperty(
      {
        title: "Bright two-bedroom garden flat",
        intent: "rent",
        price: 1450,
        addressLine1: "Flat 2, 19 Alma Road",
        town: "Battersea, London",
        postcode: "SW11 4PJ",
        lat: 51.46,
        lng: -0.16,
        type: "flat",
        bedrooms: 2,
        bathrooms: 1,
        sizeSqFt: 720,
        description: "A bright ground-floor flat with its own entrance and a garden.",
        availableFrom: "2026-11-01",
        agentId: "harper-quinn",
        images: [],
      },
      selectUser(getSnapshot()),
    );
    await sendEnquiry({
      agentId: "harper-quinn",
      name: "Ada Lovelace",
      email: "ada@example.com",
      phone: "",
      message: "Could I arrange a viewing this week please?",
    });

    const before = getSnapshot();
    expect(before.created).toHaveLength(1);
    expect(before.enquiries).toHaveLength(1);

    const result = await deleteAccount("Analytical1");
    expect(result.ok).toBe(true);

    const after = getSnapshot();
    expect(after.users).toHaveLength(0);
    expect(after.session).toBeNull();
    expect(after.saved["ada@example.com"]).toBeUndefined();
    expect(after.created).toHaveLength(0);
    expect(after.enquiries).toHaveLength(0);
    expect(await listEnquiriesForUser(null)).toHaveLength(0);
  });
});
