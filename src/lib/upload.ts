import type { ImageCategory, PropertyImage } from "@/types/property";
import { makeId } from "./utils";

/**
 * Uploaded photos are held as data URLs inside a ~5MB localStorage quota, so
 * each file has to stay small. A server-backed deployment would replace this
 * module with a signed-upload call to object storage.
 */
export const MAX_UPLOAD_BYTES = 400_000;

export const ACCEPTED_IMAGE_TYPES = "image/*";

export interface UploadOutcome {
  accepted: PropertyImage[];
  /** Human-readable reasons, one per skipped file. */
  rejected: string[];
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function describeLimit(): string {
  return `${Math.round(MAX_UPLOAD_BYTES / 1000)}KB`;
}

/** Reads the picked files, skipping anything that isn't a small enough image. */
export async function readImageFiles(
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
      accepted.push({
        id: makeId("img"),
        src: await readAsDataUrl(file),
        category: options.category ?? "other",
        alt: options.alt,
      });
    } catch {
      rejected.push(`${file.name} could not be read`);
    }
  }

  return { accepted, rejected };
}
