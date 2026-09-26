"use client";

import { RADIUS_OPTIONS } from "@/constants/propertyTypes";
import { IconSearch } from "@/components/ui/Icons";
import { Field, Input, Select } from "@/components/ui";

/** Where to search: a full or partial postcode, a town, or an area name. */
export function LocationFilter({
  idPrefix,
  query,
  onQueryChange,
  size = "md",
  label = "Location or postcode",
  hint = "Try a full or partial postcode such as SW11, or a town like Bristol.",
}: {
  idPrefix: string;
  query: string;
  onQueryChange: (value: string) => void;
  size?: "md" | "lg";
  label?: string;
  hint?: string;
}) {
  return (
    <Field label={label} htmlFor={`${idPrefix}-q`} hint={hint}>
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-ink-muted" />
        <Input
          id={`${idPrefix}-q`}
          name="q"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="e.g. SW11, Didsbury, Cambridge"
          autoComplete="postal-code"
          className={size === "lg" ? "h-12 pl-10" : "pl-10"}
        />
      </div>
    </Field>
  );
}

/** How far around the searched location to look. */
export function RadiusFilter({
  idPrefix,
  radius,
  onChange,
  options = RADIUS_OPTIONS,
  label = "Search radius",
}: {
  idPrefix: string;
  radius: number;
  onChange: (value: number) => void;
  options?: readonly number[];
  label?: string;
}) {
  return (
    <Field label={label} htmlFor={`${idPrefix}-radius`}>
      <Select
        id={`${idPrefix}-radius`}
        value={radius}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {options.map((miles) => (
          <option key={miles} value={miles}>
            Within {miles} mile{miles === 1 ? "" : "s"}
          </option>
        ))}
      </Select>
    </Field>
  );
}
