"use client";

import { useRef, useState } from "react";
import { IMAGE_CATEGORIES, IMAGE_CATEGORY_LABELS } from "@/constants/propertyTypes";
import { useProperties } from "@/hooks/useProperties";
import { ACCEPTED_IMAGE_TYPES, describeLimit, readImageFiles } from "@/lib/upload";
import { makeId } from "@/lib/utils";
import type { ImageCategory, Property, PropertyImage } from "@/types/property";
import {
  IconChevronLeft,
  IconChevronRight,
  IconSwap,
  IconTrash,
  IconUpload,
} from "@/components/ui/Icons";
import { Alert, Button, Modal, Photo, Select } from "@/components/ui";

/** The stock illustrations, three palettes per room type. */
const LIBRARY: PropertyImage[] = IMAGE_CATEGORIES.flatMap((category) =>
  [1, 2, 3].map((variant) => ({
    id: `lib-${category}-${variant}`,
    src: `/images/properties/${category}-${variant}.svg`,
    category,
    alt: `${IMAGE_CATEGORY_LABELS[category]} photo`,
  })),
);

type Picker = { mode: "add" } | { mode: "replace"; index: number };

export function PropertyImageManager({ property }: { property: Property }) {
  const { setPropertyImages } = useProperties();
  const [picker, setPicker] = useState<Picker | null>(null);
  const [notice, setNotice] = useState<string>();
  const [error, setError] = useState<string>();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<number | null>(null);

  const images = property.images;

  const commit = async (next: PropertyImage[], message: string) => {
    await setPropertyImages(property.id, next);
    setNotice(message);
    setError(undefined);
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    void commit(next, `Photo moved to position ${target + 1}.`);
  };

  const remove = (index: number) => {
    void commit(
      images.filter((_, i) => i !== index),
      "Photo removed.",
    );
  };

  const setCategory = (index: number, category: ImageCategory) => {
    void commit(
      images.map((image, i) =>
        i === index
          ? {
              ...image,
              category,
              alt: `${IMAGE_CATEGORY_LABELS[category]} at ${property.title}`,
            }
          : image,
      ),
      "Photo label updated.",
    );
  };

  const addFromLibrary = (choice: PropertyImage) => {
    const image: PropertyImage = {
      ...choice,
      id: makeId(`${property.id}-img`),
      alt: `${IMAGE_CATEGORY_LABELS[choice.category]} at ${property.title}`,
    };

    if (picker?.mode === "replace") {
      const { index } = picker;
      void commit(
        images.map((existing, i) => (i === index ? image : existing)),
        `Photo ${index + 1} replaced.`,
      );
    } else {
      void commit([...images, image], "Photo added.");
    }
    setPicker(null);
  };

  const handleFiles = async (files: FileList | null, replaceIndex: number | null) => {
    const { accepted, rejected } = await readImageFiles(files, {
      alt: `Photo of ${property.title}`,
    });

    if (accepted.length > 0) {
      if (replaceIndex !== null) {
        await commit(
          images.map((existing, i) => (i === replaceIndex ? accepted[0] : existing)),
          `Photo ${replaceIndex + 1} replaced.`,
        );
      } else {
        await commit(
          [...images, ...accepted],
          `${accepted.length} photo${accepted.length === 1 ? "" : "s"} uploaded.`,
        );
      }
    }

    setError(
      rejected.length > 0
        ? `Skipped ${rejected.length} file${rejected.length === 1 ? "" : "s"}: ${rejected.join("; ")}. Uploads are held in your browser, so they must stay under ${describeLimit()}.`
        : undefined,
    );

    if (fileRef.current) fileRef.current.value = "";
    replaceTarget.current = null;
  };

  const openFilePicker = (replaceIndex: number | null) => {
    replaceTarget.current = replaceIndex;
    fileRef.current?.click();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-ink">Photos</h3>
          <p className="text-sm text-ink-muted">
            {images.length} photo{images.length === 1 ? "" : "s"}. The first is used as the
            cover image.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => openFilePicker(null)}>
            <IconUpload className="size-4" />
            Upload photos
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPicker({ mode: "add" })}>
            Add from library
          </Button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES}
        multiple
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files, replaceTarget.current)}
      />

      {notice && (
        <Alert tone="success" className="mt-4">
          {notice}
        </Alert>
      )}
      {error && <Alert className="mt-4">{error}</Alert>}

      {images.length === 0 ? (
        <p className="mt-4 rounded-card border border-dashed border-line px-6 py-10 text-center text-sm text-ink-muted">
          No photos yet. Upload your own, or pick from the library to get started.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="rounded-card border border-line bg-surface p-3">
              <div className="relative aspect-[3/2] overflow-hidden rounded-control bg-surface-2">
                <Photo src={image.src} alt={image.alt} sizes="300px" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                    Cover
                  </span>
                )}
                <span className="absolute right-2 top-2 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] font-medium text-white">
                  {index + 1}
                </span>
              </div>

              <label className="mt-3 block text-xs font-medium text-ink-muted">
                Room
                <Select
                  className="mt-1 h-9 text-sm"
                  value={image.category}
                  onChange={(event) =>
                    setCategory(index, event.target.value as ImageCategory)
                  }
                >
                  {IMAGE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {IMAGE_CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </Select>
              </label>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move photo ${index + 1} earlier`}
                  className="grid size-9 place-items-center rounded-control border border-line text-ink hover:border-line-strong hover:text-link-hover disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink"
                >
                  <IconChevronLeft className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label={`Move photo ${index + 1} later`}
                  className="grid size-9 place-items-center rounded-control border border-line text-ink hover:border-line-strong hover:text-link-hover disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink"
                >
                  <IconChevronRight className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPicker({ mode: "replace", index })}
                  className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line px-2.5 text-xs font-medium text-ink hover:border-line-strong hover:text-link-hover"
                >
                  <IconSwap className="size-4" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  aria-label={`Remove photo ${index + 1}`}
                  className="ml-auto grid size-9 place-items-center rounded-control border border-line text-danger hover:border-danger hover:bg-danger-soft"
                >
                  <IconTrash className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={picker !== null}
        onClose={() => setPicker(null)}
        size="lg"
        title={
          picker?.mode === "replace"
            ? `Replace photo ${picker.index + 1}`
            : "Add a photo from the library"
        }
        description={
          <>
            Pick one below, or{" "}
            <button
              type="button"
              className="font-medium text-link underline underline-offset-4"
              onClick={() => {
                const index = picker?.mode === "replace" ? picker.index : null;
                setPicker(null);
                openFilePicker(index);
              }}
            >
              upload your own photo
            </button>{" "}
            from this device (under {describeLimit()}).
          </>
        }
      >
        {IMAGE_CATEGORIES.map((category) => (
          <section key={category} className="mb-6 last:mb-0">
            <h3 className="text-sm font-semibold text-ink">
              {IMAGE_CATEGORY_LABELS[category]}
            </h3>
            <ul className="mt-2 grid grid-cols-3 gap-3">
              {LIBRARY.filter((image) => image.category === category).map((image) => (
                <li key={image.id}>
                  <button
                    type="button"
                    onClick={() => addFromLibrary(image)}
                    className="block w-full overflow-hidden rounded-control border-2 border-transparent transition-colors hover:border-line-strong"
                  >
                    <span className="block aspect-[3/2]">
                      <Photo src={image.src} alt="" sizes="200px" />
                    </span>
                    <span className="sr-only">
                      Use this {IMAGE_CATEGORY_LABELS[category]} photo
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </Modal>
    </div>
  );
}
