import { describe, expect, it } from "vitest";
import {
  compactPostcode,
  distanceMiles,
  formatPostcode,
  locatePostcode,
  looksLikePostcode,
  normalisePostcode,
  outwardCode,
} from "@/lib/postcode";

describe("normalisePostcode", () => {
  it("uppercases and collapses whitespace", () => {
    expect(normalisePostcode("  sw11   3ab ")).toBe("SW11 3AB");
  });
});

describe("outwardCode", () => {
  it.each([
    ["SW11 3AB", "SW11"],
    ["sw113ab", "SW11"],
    ["M1 4BT", "M1"],
    ["EH3 6QG", "EH3"],
  ])("takes the outward code of %s", (input, expected) => {
    expect(outwardCode(input)).toBe(expected);
  });
});

describe("locatePostcode", () => {
  it("resolves a full postcode", () => {
    expect(locatePostcode("SW11 3RX")?.town).toContain("Battersea");
  });

  it("resolves a bare outward code", () => {
    expect(locatePostcode("BS8")?.town).toContain("Clifton");
  });

  it("averages when a partial code matches several areas", () => {
    const found = locatePostcode("B");
    expect(found).not.toBeNull();
    // Several B* outcodes exist, so the label is the area rather than a town.
    expect(found?.town).toBe("B area");
  });

  it("returns null for an unknown area", () => {
    expect(locatePostcode("ZZ99")).toBeNull();
  });

  it("returns null for empty input", () => {
    expect(locatePostcode("   ")).toBeNull();
  });
});

describe("distanceMiles", () => {
  it("is zero for the same point", () => {
    const point = { lat: 51.5, lng: -0.12 };
    expect(distanceMiles(point, point)).toBeCloseTo(0, 6);
  });

  it("matches a known separation", () => {
    // London to Manchester is roughly 163 miles as the crow flies.
    const london = { lat: 51.5074, lng: -0.1278 };
    const manchester = { lat: 53.4808, lng: -2.2426 };
    expect(distanceMiles(london, manchester)).toBeGreaterThan(155);
    expect(distanceMiles(london, manchester)).toBeLessThan(175);
  });

  it("is symmetric", () => {
    const a = { lat: 51.4, lng: -0.1 };
    const b = { lat: 53.4, lng: -2.2 };
    expect(distanceMiles(a, b)).toBeCloseTo(distanceMiles(b, a), 9);
  });
});

describe("looksLikePostcode", () => {
  it.each(["SW11", "m1", "EH3 6QG"])("accepts %s", (value) => {
    expect(looksLikePostcode(value)).toBe(true);
  });

  it.each(["Bristol", "Didsbury", ""])("rejects %s", (value) => {
    expect(looksLikePostcode(value)).toBe(false);
  });
});

describe("compactPostcode and formatPostcode", () => {
  it.each([
    ["sw11 3ab", "SW113AB"],
    ["SW113AB", "SW113AB"],
    ["  m1   4bt ", "M14BT"],
  ])("compacts %s", (input, expected) => {
    expect(compactPostcode(input)).toBe(expected);
  });

  it.each([
    ["sw113ab", "SW11 3AB"],
    ["SW11 3AB", "SW11 3AB"],
    ["eh36qg", "EH3 6QG"],
    ["m14bt", "M1 4BT"],
  ])("formats %s", (input, expected) => {
    expect(formatPostcode(input)).toBe(expected);
  });

  it("leaves a partial code alone, since it has no inward part", () => {
    expect(formatPostcode("SW11")).toBe("SW11");
  });

  it("gives the same key however the postcode is written", () => {
    expect(compactPostcode("SW11 3AB")).toBe(compactPostcode("sw113ab"));
  });
});
