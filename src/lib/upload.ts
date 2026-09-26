import { upload } from "@vercel/blob/client";
import type { ImageCategory, PropertyImage } from "@/types/property";
import { makeId } from "./utils";

/**
 * Uploaded photos go straight to Vercel Blob from the browser (the token
 * endpoint is `/api/blob/upload`), so file bytes never pass through a
 * Next.js function body. `MAX_UPLOAD_BYTES` here just gives the picker a
 * client-side limit to check before starting an upload — the enforced limit
 * lives server-side in the token route.
 */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ACCEPTED_IMAGE_TYPES = "image/*";

export interface UploadOutcome {
  accepted: PropertyImage[];
  /** Human-readable reasons, one per skipped file. */
  rejected: string[];
}

export function describeLimit(): string {
  return `${Math.round(MAX_UPLOAD_BYTES / 1_000_000)}MB`;
}

/** Uploads the picked files to Vercel Blob, skipping anything invalid. */
export async function uploadImageFiles(
  files: FileList | File[] | null,
  options: { alt: string; category?: ImageCategory } = { alt: "Property photo" },
): Promise<UploadOutcome> {
  const list = files ? Array.from(files) : [];
  const accepted: PropertyImage[] = [];
  const rejected: string[] = [];

  for (const file of list) {
    if (!file.type.startsWith("image/")) {
      rejected.push(`${file.name} is not an image`);
      continue;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      rejected.push(`${file.name} is over ${describeLimit()}`);
      continue;
    }

    try {
      const blob = await upload(`properties/${makeId("img")}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/blob/upload",
      });
      accepted.push({
        id: makeId("img"),
        src: blob.url,
        category: options.category ?? "other",
        alt: options.alt,
      });
    } catch {
      rejected.push(`${file.name} could not be uploaded`);
    }
  }

  return { accepted, rejected };
}
