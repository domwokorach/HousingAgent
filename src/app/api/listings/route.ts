import { NextResponse, type NextRequest } from "next/server";
import { dbCreateProperty, dbListProperties } from "@/lib/properties-db";
import { propertyDraftSchema } from "@/validation/property.schema";

/**
 * Postgres-backed listings created in-app by landlords/agents.
 *
 * Not to be confused with `/api/properties`, which proxies Homedata's live
 * listings search (a separate, read-only external feed).
 */

export const dynamic = "force-dynamic";

function unconfigured() {
  return NextResponse.json(
    {
      error: "Listings storage isn't configured. Set DATABASE_URL in .env.local.",
      configured: false,
    },
    { status: 503 },
  );
}

export async function GET() {
  if (!process.env.DATABASE_URL) return unconfigured();

  try {
    const properties = await dbListProperties();
    return NextResponse.json({ properties });
  } catch (error) {
    console.error("[api/listings]", error);
    return NextResponse.json(
      { error: "Listings are unavailable right now." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) return unconfigured();

  const ownerEmail = (request.headers.get("x-owner-email") ?? "").trim();
  if (!ownerEmail) {
    return NextResponse.json({ error: "You must be signed in to list a property." }, {
      status: 401,
    });
  }

  const parsed = propertyDraftSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "That listing has invalid or missing fields." },
      { status: 400 },
    );
  }

  try {
    const id = await dbCreateProperty(parsed.data, { ownerEmail });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("[api/listings]", error);
    return NextResponse.json(
      { error: "That listing couldn't be saved right now." },
      { status: 500 },
    );
  }
}
