"use client";

import { priceSteps } from "@/constants/propertyTypes";
import { formatPriceShort } from "@/lib/utils";
import type { Intent } from "@/types/property";
import { Field, Select } from "@/components/ui";

/**
 * Minimum and maximum price. The ladder changes with intent, because a monthly
 * rent and an asking price need completely different steps.
 */
export function PriceFilter({
  idPrefix,
  intent,
  minPrice,
  maxPrice,
  onChange,
}: {
  idPrefix: string;
  intent: Intent | "any";
  minPrice: number | null;
  maxPrice: number | null;
  onChange: (next: { minPrice?: number | null; maxPrice?: number | null }) => void;
}) {
  const steps = priceSteps(intent).slice(1);
  const suffix = intent === "buy" ? "" : " pcm";
  const toValue = (raw: string) => (raw === "" ? null : Number(raw));

  return (
    <>
      <Field label={`Minimum price${suffix}`} htmlFor={`${idPrefix}-min`}>
        <Select
          id={`${idPrefix}-min`}
          value={minPrice ?? ""}
          onChange={(event) => onChange({ minPrice: toValue(event.target.value) })}
        >
          <option value="">No minimum</option>
          {steps.map((step) => (
            <option key={step} value={step}>
              {formatPriceShort(step)}
            </option>
          ))}
        </Select>
      </Field>

      <Field label={`Maximum price${suffix}`} htmlFor={`${idPrefix}-max`}>
        <Select
          id={`${idPrefix}-max`}
          value={maxPrice ?? ""}
          onChange={(event) => onChange({ maxPrice: toValue(event.target.value) })}
        >
          <option value="">No maximum</option>
          {steps.map((step) => (
            <option key={step} value={step}>
              {formatPriceShort(step)}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}
