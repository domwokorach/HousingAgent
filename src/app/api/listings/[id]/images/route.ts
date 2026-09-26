import { NextResponse, type NextRequest } from "next/server";
import { dbSetPropertyImages } from "@/lib/properties-db";
import { propertyImageSchema } from "@/validation/property.schema";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bodySchema = z.array(propertyImageSchema);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Listings storage isn't configured. Set DATABASE_URL in .env.local.", configured: false },
      { status: 503 },
    );
  }
  const { id } = await params;

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "That image list is invalid." }, { status: 400 });
  }

  try {
    const found = await dbSetPropertyImages(id, parsed.data);
    if (!found) {
      return NextResponse.json({ error: "That listing no longer exists." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/listings/[id]/images]", error);
    return NextResponse.json(
      { error: "Those photos couldn't be saved right now." },
      { status: 500 },
    );
  }
}
