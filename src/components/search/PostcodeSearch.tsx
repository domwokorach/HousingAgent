"use client";

import { useId, useState } from "react";
import { BEDROOM_OPTIONS, PROPERTY_TYPES, PROPERTY_TYPE_LABELS } from "@/constants/propertyTypes";
import { cx } from "@/lib/utils";
import type { PropertyType } from "@/types/property";
import type { SearchCriteria } from "@/types/search";
import { IconSearch } from "@/components/ui/Icons";
import { Button, Field, Select } from "@/components/ui";
import { IntentToggle } from "./IntentToggle";
import { LocationFilter, RadiusFilter } from "./LocationFilter";
import { PriceFilter } from "./PriceFilter";

/**
 * The full property search form: where, how much, how many bedrooms and what
 * kind of home. Holds its own draft state and only reports on submit, so
 * changing three filters is one navigation rather than three.
 */
export function PostcodeSearch({
  criteria,
  onSubmit,
  lockIntent = false,
  showRadius = true,
  submitLabel = "Search properties",
  className,
}: {
  criteria: SearchCriteria;
  onSubmit: (next: SearchCriteria) => void;
  lockIntent?: boolean;
  showRadius?: boolean;
  submitLabel?: string;
  className?: string;
}) {
  const id = useId();
  const [draft, setDraft] = useState(criteria);
  const [lastCriteria, setLastCriteria] = useState(criteria);

  // When the URL changes elsewhere, reset the form to match. Adjusting state
  // during render is React's documented alternative to a syncing effect.
  if (lastCriteria !== criteria) {
    setLastCriteria(criteria);
    setDraft(criteria);
  }

  const patch = (next: Partial<SearchCriteria>) =>
    setDraft((prev) => ({ ...prev, ...next }));

  return (
    <form
      className={cx("flex flex-col gap-4", className)}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(draft);
      }}
    >
      {!lockIntent && (
        <IntentToggle
          value={draft.intent}
          // Price ceilings don't transfer between the rent and sale ladders.
          onChange={(intent) => patch({ intent, minPrice: null, maxPrice: null })}
          className="self-start"
        />
      )}

      <LocationFilter
        idPrefix={id}
        query={draft.query}
        onQueryChange={(query) => patch({ query })}
        size="lg"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PriceFilter
          idPrefix={id}
          intent={draft.intent}
          minPrice={draft.minPrice}
          maxPrice={draft.maxPrice}
          onChange={patch}
        />

        <Field label="Bedrooms (minimum)" htmlFor={`${id}-beds`}>
          <Select
            id={`${id}-beds`}
            value={draft.minBeds ?? ""}
            onChange={(event) =>
              patch({
                minBeds: event.target.value === "" ? null : Number(event.target.value),
              })
            }
          >
            <option value="">Any</option>
            {BEDROOM_OPTIONS.map((beds) => (
              <option key={beds} value={beds}>
                {beds}+ bedroom{beds > 1 ? "s" : ""}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Property type" htmlFor={`${id}-type`}>
          <Select
            id={`${id}-type`}
            value={draft.types[0] ?? ""}
            onChange={(event) =>
              patch({
                types: event.target.value ? [event.target.value as PropertyType] : [],
              })
            }
          >
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((value) => (
              <option key={value} value={value}>
                {PROPERTY_TYPE_LABELS[value]}
              </option>
            ))}
          </Select>
        </Field>

        {showRadius && (
          <RadiusFilter
            idPrefix={id}
            radius={draft.radius}
            onChange={(radius) => patch({ radius })}
          />
        )}

        <div className="flex items-end">
          <Button type="submit" size="lg" className="w-full">
            <IconSearch className="size-5" />
            {submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
