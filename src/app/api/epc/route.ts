import { NextResponse, type NextRequest } from "next/server";
import { formatPostcode, isValidUkPostcode } from "@/lib/postcode";

/**
 * Energy Performance Certificate lookup by postcode, proxied through the
 * server so EPC_API_TOKEN never reaches the browser.
 */

export const dynamic = "force-dynamic";

const EPC_SEARCH_URL =
  "https://api.get-energy-performance-data.communities.gov.uk/api/domestic/search";
const REQUEST_TIMEOUT_MS = 10_000;

export async function GET(request: NextRequest) {
  const rawPostcode = (request.nextUrl.searchParams.get("postcode") ?? "").trim();

  if (!rawPostcode) {
    return NextResponse.json({ error: "A postcode is required." }, { status: 400 });
  }
  if (!isValidUkPostcode(rawPostcode)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid UK postcode." },
      { status: 400 },
    );
  }

  const token = process.env.EPC_API_TOKEN;
  if (!token) {
    // 503, not 500: the app is fine, this feature just isn't configured.
    return NextResponse.json(
      {
        error:
          "EPC lookups aren't configured. Set EPC_API_TOKEN in .env.local — see .env.example.",
        configured: false,
      },
      { status: 503 },
    );
  }

  const postcode = formatPostcode(rawPostcode);
  const url = `${EPC_SEARCH_URL}?postcode=${encodeURIComponent(postcode)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: `No EPC records found for ${postcode}.` },
        { status: 404 },
      );
    }

    if (!response.ok) {
      console.error(`[api/epc] provider returned ${response.status} for ${postcode}`);
      return NextResponse.json(
        { error: "EPC data is unavailable right now." },
        { status: 502 },
      );
    }

    const data: unknown = await response.json();
    return NextResponse.json({ postcode, data });
  } catch (error) {
    console.error("[api/epc]", error);
    return NextResponse.json(
      { error: "EPC data is unavailable right now." },
      { status: 500 },
    );
  }
}
