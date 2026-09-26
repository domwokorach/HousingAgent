import { NextResponse, type NextRequest } from "next/server";
import { dbDeleteProperty, dbUpdateProperty } from "@/lib/properties-db";
import { propertyPatchSchema } from "@/validation/property.schema";

export const dynamic = "force-dynamic";

function unconfigured() {
  return NextResponse.json(
    { error: "Listings storage isn't configured. Set DATABASE_URL in .env.local.", configured: false },
    { status: 503 },
  );
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL) return unconfigured();
  const { id } = await params;

  const parsed = propertyPatchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "That update has invalid fields." }, { status: 400 });
  }

  // `images` goes through PUT /api/listings/[id]/images, not this route.
  const patch = { ...parsed.data };
  delete patch.images;

  try {
    const found = await dbUpdateProperty(id, patch);
    if (!found) {
      return NextResponse.json({ error: "That listing no longer exists." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/listings/[id]]", error);
    return NextResponse.json(
      { error: "That listing couldn't be updated right now." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL) return unconfigured();
  const { id } = await params;

  try {
    const found = await dbDeleteProperty(id);
    if (!found) {
      return NextResponse.json({ error: "That listing no longer exists." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/listings/[id]]", error);
    return NextResponse.json(
      { error: "That listing couldn't be deleted right now." },
      { status: 500 },
    );
  }
}
