"use client";

import { useState } from "react";
import {
  ENERGY_RATINGS,
  PROPERTY_TYPES,
  PROPERTY_TYPE_LABELS,
} from "@/constants/propertyTypes";
import { useProperties } from "@/hooks/useProperties";
import { compactPostcode, formatPostcode } from "@/lib/postcode";
import { agents } from "@/lib/seed";
import {
  geocodePostcode,
  type GeocodedPlace,
} from "@/services/geocode.service";
import type {
  EnergyRating,
  FurnishedStatus,
  Property,
  PropertyType,
} from "@/types/property";
import { validate } from "@/validation";
import {
  UK_POSTCODE_PATTERN,
  propertyFormSchema,
  type PropertyFormValues,
} from "@/validation/property.schema";
import { IconPin, IconWarning } from "@/components/ui/Icons";
import {
  Alert,
  Button,
  Field,
  Input,
  Select,
  Spinner,
  Textarea,
} from "@/components/ui";
import { IntentToggle } from "@/components/search/IntentToggle";

type Draft = Record<keyof PropertyFormValues, string> & {
  intent: "rent" | "buy";
  type: PropertyType;
};

function toDraft(property?: Property): Draft {
  return {
    title: property?.title ?? "",
    intent: property?.intent ?? "rent",
    price: property ? String(property.price) : "",
    addressLine1: property?.addressLine1 ?? "",
    addressLine2: property?.addressLine2 ?? "",
    town: property?.town ?? "",
    postcode: property?.postcode ?? "",
    type: property?.type ?? "flat",
    bedrooms: property ? String(property.bedrooms) : "2",
    bathrooms: property ? String(property.bathrooms) : "1",
    sizeSqFt: property ? String(property.sizeSqFt) : "",
    description: property?.description ?? "",
    availableFrom: property?.availableFrom?.slice(0, 10) ?? "",
    furnished: property?.furnished ?? "",
    energyRating: property?.energyRating ?? "",
    agentId: property?.agentId ?? agents[0].id,
  };
}

/** Create or edit a listing. Validation lives in the zod schema, not here. */
export function PropertyForm({
  property,
  onSaved,
  onCancel,
}: {
  property?: Property;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const { createProperty, updateProperty } = useProperties();
  const [draft, setDraft] = useState<Draft>(() => toDraft(property));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // The coordinates the map will use. Seeded from the listing being edited so
  // an unchanged postcode is never geocoded again.
  const [located, setLocated] = useState<GeocodedPlace | null>(
    property
      ? {
          lat: property.lat,
          lng: property.lng,
          postcode: formatPostcode(property.postcode),
          label: `${property.town} ${property.postcode}`,
          source: "local",
        }
      : null,
  );
  const [locating, setLocating] = useState(false);

  const postcodeMatches = (place: GeocodedPlace | null, value: string) =>
    Boolean(place) && compactPostcode(place!.postcode) === compactPostcode(value);

  /** Resolves the postcode to coordinates, reusing the last result. */
  const resolvePostcode = async (value: string): Promise<GeocodedPlace | null> => {
    if (postcodeMatches(located, value)) return located;
    if (!UK_POSTCODE_PATTERN.test(value.trim())) return null;

    setLocating(true);
    try {
      const result = await geocodePostcode(value);
      if (!result.ok) {
        setErrors((prev) => ({ ...prev, postcode: result.error }));
        setLocated(null);
        return null;
      }
      setLocated(result.data);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.postcode;
        return next;
      });
      return result.data;
    } finally {
      setLocating(false);
    }
  };

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    // A new postcode invalidates the coordinates we hold.
    if (key === "postcode" && !postcodeMatches(located, String(value))) {
      setLocated(null);
    }
    setDraft((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key as string];
      delete next.form;
      return next;
    });
  };

  const handleSubmit = async () => {
    const parsed = validate(propertyFormSchema, draft);
    if (!parsed.ok) {
      setErrors(parsed.errors);
      return;
    }

    const values = parsed.data;

    const place = await resolvePostcode(values.postcode);
    if (!place) {
      setErrors((prev) => ({
        ...prev,
        postcode:
          prev.postcode ?? "We couldn't place that postcode on the map.",
      }));
      return;
    }

    const shared = {
      title: values.title,
      intent: values.intent,
      price: values.price,
      addressLine1: values.addressLine1,
      addressLine2: values.addressLine2 || undefined,
      town: values.town,
      postcode: values.postcode.toUpperCase(),
      lat: place.lat,
      lng: place.lng,
      type: values.type,
      bedrooms: values.bedrooms,
      bathrooms: values.bathrooms,
      sizeSqFt: values.sizeSqFt,
      description: values.description,
      availableFrom: values.availableFrom,
      furnished:
        values.intent === "rent" && values.furnished
          ? (values.furnished as FurnishedStatus)
          : undefined,
      energyRating: (values.energyRating || undefined) as EnergyRating | undefined,
      agentId: values.agentId,
    };

    setSaving(true);
    try {
      if (property) {
        const result = await updateProperty(property.id, shared);
        if (!result.ok) {
          setErrors({ [result.field ?? "form"]: result.error });
          return;
        }
        onSaved(property.id);
      } else {
        const result = await createProperty({ ...shared, images: [] });
        if (!result.ok) {
          setErrors({ [result.field ?? "form"]: result.error });
          return;
        }
        onSaved(result.data);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void handleSubmit();
      }}
    >
      {errors.form && <Alert>{errors.form}</Alert>}
      {Object.keys(errors).filter((key) => key !== "form").length > 0 && (
        <Alert>Please correct the highlighted fields before saving.</Alert>
      )}

      <div>
        <p className="mb-2 text-sm font-medium text-ink">Listing type</p>
        <IntentToggle value={draft.intent} onChange={(intent) => set("intent", intent)} />
      </div>

      <Field label="Listing title" htmlFor="lf-title" required error={errors.title}>
        <Input
          id="lf-title"
          value={draft.title}
          invalid={Boolean(errors.title)}
          placeholder="e.g. Two-bedroom garden flat with parking"
          onChange={(event) => set("title", event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={draft.intent === "rent" ? "Monthly rent (£)" : "Asking price (£)"}
          htmlFor="lf-price"
          required
          error={errors.price}
        >
          <Input
            id="lf-price"
            type="number"
            min={0}
            step={draft.intent === "rent" ? 25 : 1000}
            value={draft.price}
            invalid={Boolean(errors.price)}
            onChange={(event) => set("price", event.target.value)}
          />
        </Field>

        <Field label="Property type" htmlFor="lf-type" required error={errors.type}>
          <Select
            id="lf-type"
            value={draft.type}
            onChange={(event) => set("type", event.target.value as PropertyType)}
          >
            {PROPERTY_TYPES.map((value) => (
              <option key={value} value={value}>
                {PROPERTY_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Address line 1" htmlFor="lf-a1" required error={errors.addressLine1}>
        <Input
          id="lf-a1"
          value={draft.addressLine1}
          autoComplete="address-line1"
          invalid={Boolean(errors.addressLine1)}
          onChange={(event) => set("addressLine1", event.target.value)}
        />
      </Field>

      <Field label="Address line 2" htmlFor="lf-a2" hint="Optional.">
        <Input
          id="lf-a2"
          value={draft.addressLine2}
          autoComplete="address-line2"
          onChange={(event) => set("addressLine2", event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Town or city" htmlFor="lf-town" required error={errors.town}>
          <Input
            id="lf-town"
            value={draft.town}
            autoComplete="address-level2"
            invalid={Boolean(errors.town)}
            onChange={(event) => set("town", event.target.value)}
          />
        </Field>

        <Field
          label="Postcode"
          htmlFor="lf-postcode"
          required
          error={errors.postcode}
          hint={errors.postcode ? undefined : "e.g. SW11 3RX — we'll place it on the map"}
        >
          <Input
            id="lf-postcode"
            value={draft.postcode}
            autoComplete="postal-code"
            invalid={Boolean(errors.postcode)}
            onChange={(event) => set("postcode", event.target.value)}
            onBlur={(event) => void resolvePostcode(event.target.value)}
          />

          {locating && (
            <p className="flex items-center gap-1.5 text-sm text-ink-muted">
              <Spinner className="size-3.5" />
              Locating…
            </p>
          )}

          {!locating && located && postcodeMatches(located, draft.postcode) && (
            <p className="flex items-start gap-1.5 text-sm text-ink-muted">
              <IconPin className="mt-0.5 size-4 shrink-0 text-link" />
              <span>
                {located.label}
                {located.source === "local" && (
                  <span className="flex items-center gap-1 text-xs text-accent">
                    <IconWarning className="size-3.5 shrink-0" />
                    Approximate — Mapbox isn&apos;t configured, so this is the centre
                    of the postcode district.
                  </span>
                )}
              </span>
            </p>
          )}
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Bedrooms" htmlFor="lf-beds" required error={errors.bedrooms}>
          <Input
            id="lf-beds"
            type="number"
            min={0}
            max={20}
            value={draft.bedrooms}
            invalid={Boolean(errors.bedrooms)}
            onChange={(event) => set("bedrooms", event.target.value)}
          />
        </Field>

        <Field label="Bathrooms" htmlFor="lf-baths" required error={errors.bathrooms}>
          <Input
            id="lf-baths"
            type="number"
            min={1}
            max={20}
            value={draft.bathrooms}
            invalid={Boolean(errors.bathrooms)}
            onChange={(event) => set("bathrooms", event.target.value)}
          />
        </Field>

        <Field label="Size (sq ft)" htmlFor="lf-size" required error={errors.sizeSqFt}>
          <Input
            id="lf-size"
            type="number"
            min={1}
            value={draft.sizeSqFt}
            invalid={Boolean(errors.sizeSqFt)}
            onChange={(event) => set("sizeSqFt", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="lf-description" required error={errors.description}>
        <Textarea
          id="lf-description"
          rows={6}
          value={draft.description}
          invalid={Boolean(errors.description)}
          placeholder="Describe the rooms, the condition, the outside space and what's nearby."
          onChange={(event) => set("description", event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field
          label="Available from"
          htmlFor="lf-available"
          required
          error={errors.availableFrom}
        >
          <Input
            id="lf-available"
            type="date"
            value={draft.availableFrom}
            invalid={Boolean(errors.availableFrom)}
            onChange={(event) => set("availableFrom", event.target.value)}
          />
        </Field>

        {draft.intent === "rent" ? (
          <Field label="Furnishing" htmlFor="lf-furnished">
            <Select
              id="lf-furnished"
              value={draft.furnished}
              onChange={(event) => set("furnished", event.target.value)}
            >
              <option value="">Not specified</option>
              <option value="furnished">Furnished</option>
              <option value="part-furnished">Part furnished</option>
              <option value="unfurnished">Unfurnished</option>
            </Select>
          </Field>
        ) : (
          <div />
        )}

        <Field label="Energy rating" htmlFor="lf-epc">
          <Select
            id="lf-epc"
            value={draft.energyRating}
            onChange={(event) => set("energyRating", event.target.value)}
          >
            <option value="">Not available</option>
            {ENERGY_RATINGS.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Marketing agent"
        htmlFor="lf-agent"
        error={errors.agentId}
        hint={errors.agentId ? undefined : "Enquiries about this property go to this branch."}
      >
        <Select
          id="lf-agent"
          value={draft.agentId}
          onChange={(event) => set("agentId", event.target.value)}
        >
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.agency} — {agent.town}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={saving}>
          {property ? "Save changes" : "Create listing"}
        </Button>
        <Button type="button" variant="secondary" size="lg" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
