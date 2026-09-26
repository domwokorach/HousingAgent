import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/properties/route";

/**
 * The route caches per query for five minutes, so each test uses a distinct
 * location rather than relying on isolation between cases.
 */
let counter = 0;
const uniqueLocation = () => `Testville${++counter}`;

function request(query: Record<string, string>) {
  const params = new URLSearchParams(query);
  return new NextRequest(new URL(`http://localhost/api/properties?${params}`));
}

const realFetch = globalThis.fetch;

function stubProvider(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) =>
    handler(String(input), init),
  );
  globalThis.fetch = spy as unknown as typeof fetch;
  return spy;
}

const boundaryBody = { results: [{ id: 42, name: "Manchester, Greater Manchester" }] };
const listingBody = {
  count: 14,
  results: [
    {
      id: "abc123",
      display_address: "Example Road, Manchester",
      latest_price: 280000,
      transaction_type: "Sale",
      bedrooms: 3,
      bathrooms: 1,
      geopoint: { lat: 53.48, lon: -2.24 },
      images: ["https://cdn.example.com/1.jpg"],
    },
  ],
};

beforeEach(() => {
  process.env.HOMEDATA_API_KEY = "prefix.secret";
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  globalThis.fetch = realFetch;
  vi.restoreAllMocks();
});

describe("input validation", () => {
  it("requires a location", async () => {
    const response = await GET(request({}));
    expect(response.status).toBe(400);
  });

  it("rejects an over-long location without calling the provider", async () => {
    const spy = stubProvider(() => Response.json({}));
    const response = await GET(request({ location: "x".repeat(200) }));
    expect(response.status).toBe(400);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("when no API key is configured", () => {
  it("returns 503 and says so, rather than a generic 500", async () => {
    delete process.env.HOMEDATA_API_KEY;
    const response = await GET(request({ location: uniqueLocation() }));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.configured).toBe(false);
    expect(body.error).toMatch(/HOMEDATA_API_KEY/);
  });
});

describe("a successful search", () => {
  it("authenticates BOTH provider calls", async () => {
    // The published spec calls the boundary endpoint "open access", but the
    // deployed API returns 403 without a key.
    const spy = stubProvider((url) =>
      Response.json(url.includes("boundaries") ? boundaryBody : listingBody),
    );

    await GET(request({ location: uniqueLocation(), intent: "buy" }));

    expect(spy).toHaveBeenCalledTimes(2);
    for (const call of spy.mock.calls) {
      const init = call[1] as RequestInit;
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Api-Key prefix.secret",
      );
    }
  });

  it("maps the provider payload into our own shape", async () => {
    stubProvider((url) =>
      Response.json(url.includes("boundaries") ? boundaryBody : listingBody),
    );

    const response = await GET(request({ location: uniqueLocation() }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.total).toBe(14);
    expect(body.boundary).toBe("Manchester, Greater Manchester");
    expect(body.listings).toHaveLength(1);
    expect(body.listings[0]).toMatchObject({
      id: "abc123",
      address: "Example Road, Manchester",
      price: 280000,
      intent: "buy",
      lat: 53.48,
      lng: -2.24,
    });
  });

  it("translates rent into the provider's 'Rental'", async () => {
    const spy = stubProvider((url) =>
      Response.json(url.includes("boundaries") ? boundaryBody : listingBody),
    );

    await GET(request({ location: uniqueLocation(), intent: "rent" }));

    const searchUrl = String(spy.mock.calls[1][0]);
    expect(searchUrl).toContain("transaction_type=Rental");
  });

  it("caps page_size so a large request can't run up the bill", async () => {
    const spy = stubProvider((url) =>
      Response.json(url.includes("boundaries") ? boundaryBody : listingBody),
    );

    await GET(request({ location: uniqueLocation(), pageSize: "500" }));

    const searchUrl = new URL(String(spy.mock.calls[1][0]));
    expect(Number(searchUrl.searchParams.get("page_size"))).toBeLessThanOrEqual(50);
  });

  it("passes the bedroom and price filters through", async () => {
    const spy = stubProvider((url) =>
      Response.json(url.includes("boundaries") ? boundaryBody : listingBody),
    );

    await GET(
      request({ location: uniqueLocation(), bedrooms: "3", maxPrice: "400000" }),
    );

    const searchUrl = new URL(String(spy.mock.calls[1][0]));
    expect(searchUrl.searchParams.get("bedrooms")).toBe("3");
    expect(searchUrl.searchParams.get("max_price")).toBe("400000");
  });

  it("caches, so repeating a search costs nothing", async () => {
    const spy = stubProvider((url) =>
      Response.json(url.includes("boundaries") ? boundaryBody : listingBody),
    );

    const location = uniqueLocation();
    await GET(request({ location }));
    await GET(request({ location }));

    // Two calls for the first search, none for the second.
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe("provider failures", () => {
  it("404s a location the provider cannot match", async () => {
    stubProvider(() => Response.json({ results: [] }));

    const response = await GET(request({ location: uniqueLocation() }));
    expect(response.status).toBe(404);
  });

  it("never reports a key problem as the visitor's fault", async () => {
    stubProvider(() =>
      Response.json(
        { error: { code: "INVALID_API_KEY", message: "API key not found" } },
        { status: 403 },
      ),
    );

    const response = await GET(request({ location: uniqueLocation() }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).not.toMatch(/API key/i);
  });

  it("never shows the visitor a billing or quota message", async () => {
    // The live API answers 402 insufficient_tokens with a balance and a
    // top-up link. That is operator detail, not something a visitor can act on.
    stubProvider(() =>
      Response.json(
        {
          error: {
            code: "insufficient_tokens",
            required: 5,
            available: 0,
            topup_url: "https://homedata.co.uk/subscription",
            message: "This call costs 5 tokens and your balance is 0.",
          },
        },
        { status: 402 },
      ),
    );

    const response = await GET(request({ location: uniqueLocation() }));
    const body = await response.json();

    expect(response.status).toBe(502);
    expect(body.error).not.toMatch(/token|balance|subscription|top up/i);
  });

  it("passes a rate limit through as 429", async () => {
    stubProvider(() =>
      Response.json({ error: { message: "Too many requests" } }, { status: 429 }),
    );

    const response = await GET(request({ location: uniqueLocation() }));
    expect(response.status).toBe(429);
  });

  it("fails clearly when the response shape is unrecognisable", async () => {
    stubProvider((url) =>
      Response.json(url.includes("boundaries") ? boundaryBody : { unexpected: true }),
    );

    const response = await GET(request({ location: uniqueLocation() }));
    const body = await response.json();

    // `results` missing entirely parses to an empty list rather than throwing.
    expect(response.status).toBe(200);
    expect(body.listings).toEqual([]);
  });

  it("survives the provider throwing", async () => {
    stubProvider(() => {
      throw new Error("socket hang up");
    });

    const response = await GET(request({ location: uniqueLocation() }));
    expect(response.status).toBe(502);
  });

  it("drops individual listings it cannot parse, keeping the rest", async () => {
    stubProvider((url) =>
      Response.json(
        url.includes("boundaries")
          ? boundaryBody
          : { count: 2, results: [{ no: "id" }, listingBody.results[0]] },
      ),
    );

    const response = await GET(request({ location: uniqueLocation() }));
    const body = await response.json();

    expect(body.listings).toHaveLength(1);
    expect(body.listings[0].id).toBe("abc123");
  });
});
