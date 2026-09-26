import { NextResponse, type NextRequest } from "next/server";
import { formatPostcode, isValidUkPostcode } from "@/lib/postcode";
import { findSoldPropertiesByPostcode } from "@/lib/sold-properties";

/**
 * HM Land Registry sold-price lookup, backed by Postgres (`sold_properties`).
 * Separate data path from `/api/properties` (live listings) — this is
 * historical transaction data keyed by postcode.
 */

export const dynamic = "force-dynamic";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const rawPostcode = (params.get("postcode") ?? "").trim();

  if (!rawPostcode) {
    return NextResponse.json({ error: "A postcode is required." }, { status: 400 });
  }
  if (!isValidUkPostcode(rawPostcode)) {
    return NextResponse.json(
      { error: "That doesn't look like a valid UK postcode." },
      { status: 400 },
    );
  }

  const limit = positiveInt(params.get("limit"), 1, MAX_LIMIT) ?? DEFAULT_LIMIT;
  const postcode = formatPostcode(rawPostcode);

  if (!process.env.RDS_DATABASE_URL) {
    // 503, not 500: the app is fine, this feature just isn't configured.
    return NextResponse.json(
      {
        error:
          "Sold-price data isn't configured. Set RDS_DATABASE_URL in .env.local — see .env.example.",
        configured: false,
      },
      { status: 503 },
    );
  }

  try {
    const sales = await findSoldPropertiesByPostcode(postcode, limit);

    if (sales.length === 0) {
      return NextResponse.json(
        { error: `No sold-price records found for ${postcode}.` },
        { status: 404 },
      );
    }

    return NextResponse.json({ postcode, count: sales.length, sales });
  } catch (error) {
    console.error("[api/sold-properties]", error);
    return NextResponse.json(
      { error: "Sold-price data is unavailable right now." },
      { status: 500 },
    );
  }
}

/** Parses a bounded positive integer, returning null when absent or invalid. */
function positiveInt(raw: string | null, min: number, max: number): number | null {
  if (raw === null || raw.trim() === "") return null;
  const value = Number(raw);
  if (!Number.isFinite(value) || !Number.isInteger(value)) return null;
  if (value < min || value > max) return null;
  return value;
}
