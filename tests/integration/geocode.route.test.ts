import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/geocode/route";

/**
 * The route caches by postcode for the life of the process, so each test uses
 * a postcode of its own rather than relying on isolation.
 */
function request(query: string) {
  return new NextRequest(new URL(`http://localhost/api/geocode${query}`));
}

const realFetch = globalThis.fetch;

beforeEach(() => {
  delete process.env.MAPBOX_SECRET_TOKEN;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("input handling", () => {
  it("rejects a missing postcode", async () => {
    const response = await GET(request(""));
    expect(response.status).toBe(400);
  });

  it("rejects something that isn't a postcode, without calling Mapbox", async () => {
    const spy = vi.fn();
    globalThis.fetch = spy as unknown as typeof fetch;

    const response = await GET(request("?postcode=not-a-postcode"));
    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });

  it("rejects an over-long query", async () => {
    const response = await GET(request(`?postcode=${"S".repeat(120)}`));
    expect(response.status).toBe(400);
  });
});

describe("without a Mapbox token", () => {
  it("falls back to the local outward-code table", async () => {
    const response = await GET(request("?postcode=BS8 1RG"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("local");
    expect(body.lat).toBeCloseTo(51.4553, 3);
    expect(body.lng).toBeCloseTo(-2.6136, 3);
  });

  it("404s a well-formed postcode it cannot place, and explains why", async () => {
    const response = await GET(request("?postcode=ZZ99 9ZZ"));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toMatch(/Mapbox isn't configured/);
  });
});

describe("with a Mapbox token", () => {
  beforeEach(() => {
    process.env.MAPBOX_SECRET_TOKEN = "sk.test-token";
  });

  it("returns Mapbox coordinates, reading [lng, lat] in the right order", async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({
        features: [
          {
            geometry: { coordinates: [-0.1415, 51.5014] },
            properties: { full_address: "London SW1A 1AA, United Kingdom" },
          },
        ],
      }),
    ) as unknown as typeof fetch;

    const response = await GET(request("?postcode=SW1A 1AA"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("mapbox");
    // The API gives [lng, lat]; the route must not hand them back swapped.
    expect(body.lat).toBeCloseTo(51.5014, 4);
    expect(body.lng).toBeCloseTo(-0.1415, 4);
  });

  it("uses the secret token, not the public one", async () => {
    const spy = vi.fn(async () =>
      Response.json({ features: [{ geometry: { coordinates: [-1.5, 53.8] } }] }),
    );
    globalThis.fetch = spy as unknown as typeof fetch;

    await GET(request("?postcode=LS1 1AA"));

    const called = String((spy.mock.calls[0] as unknown[])[0]);
    expect(called).toContain("access_token=sk.test-token");
  });

  it("caches, so a repeated postcode costs one request", async () => {
    const spy = vi.fn(async () =>
      Response.json({ features: [{ geometry: { coordinates: [-2.24, 53.48] } }] }),
    );
    globalThis.fetch = spy as unknown as typeof fetch;

    await GET(request("?postcode=M14 4AA"));
    await GET(request("?postcode=m144aa"));

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("falls back to the local table when Mapbox errors", async () => {
    globalThis.fetch = vi.fn(async () =>
      new Response("upstream is down", { status: 502 }),
    ) as unknown as typeof fetch;
    vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(request("?postcode=NE2 2AR"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("local");
  });

  it("falls back when Mapbox returns no match", async () => {
    globalThis.fetch = vi.fn(async () =>
      Response.json({ features: [] }),
    ) as unknown as typeof fetch;

    const response = await GET(request("?postcode=CF11 0SN"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.source).toBe("local");
  });
});
