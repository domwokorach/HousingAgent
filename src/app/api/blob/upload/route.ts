import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

/**
 * Token endpoint for client-side property photo uploads (`@vercel/blob/client`
 * `upload()` in `src/lib/upload.ts`). The browser talks to Vercel Blob
 * directly once it has a token from here — file bytes never pass through
 * this Next.js function, so there's no 4.5MB request-body ceiling to worry
 * about.
 */

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        maximumSizeInBytes: MAX_UPLOAD_BYTES,
        addRandomSuffix: true,
      }),
      onUploadCompleted: async () => {
        // Nothing to record server-side — the client attaches the resulting
        // blob URL to the property via PUT /api/listings/[id]/images.
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("[api/blob/upload]", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Upload failed." },
      { status: 400 },
    );
  }
}
