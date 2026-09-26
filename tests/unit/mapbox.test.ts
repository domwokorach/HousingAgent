import { describe, expect, it } from "vitest";
import { fromLngLat, toLngLat } from "@/lib/mapbox";

/**
 * Coordinate order is the classic Mapbox foot-gun: GeoJSON is
 * [longitude, latitude], the opposite of how coordinates are spoken and of how
 * a Property stores them. These two functions are the only place the swap
 * happens, so they are worth pinning down.
 */
describe("toLngLat", () => {
  it("puts longitude first", () => {
    expect(toLngLat({ lat: 51.501, lng: -0.141 })).toEqual([-0.141, 51.501]);
  });

  it("does not simply pass the object through", () => {
    const [first, second] = toLngLat({ lat: 53.4808, lng: -2.2426 });
    expect(first).toBe(-2.2426);
    expect(second).toBe(53.4808);
  });
});

describe("fromLngLat", () => {
  it("reads a GeoJSON pair back into named fields", () => {
    expect(fromLngLat([-0.141, 51.501])).toEqual({ lat: 51.501, lng: -0.141 });
  });

  it("round-trips", () => {
    const point = { lat: 55.9533, lng: -3.2059 };
    expect(fromLngLat(toLngLat(point))).toEqual(point);
  });
});
