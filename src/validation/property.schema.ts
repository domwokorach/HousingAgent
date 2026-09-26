import { z } from "zod";
import { ENERGY_RATINGS, PROPERTY_TYPES } from "@/constants/propertyTypes";
import type { EnergyRating, PropertyType, Tenure } from "@/types/property";

const propertyTypeValues = PROPERTY_TYPES as [PropertyType, ...PropertyType[]];
const energyValues = ENERGY_RATINGS as [EnergyRating, ...EnergyRating[]];

/** A complete UK postcode, with or without the space. */
export const UK_POSTCODE_PATTERN = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;

/**
 * Only the shape is checked here. Whether the postcode actually exists is
 * settled by geocoding it (src/services/geocode.service.ts), which is also
 * what produces the coordinates the map needs.
 */
export const postcodeSchema = z
  .string()
  .trim()
  .min(1, "Enter the postcode.")
  .refine(
    (value) => UK_POSTCODE_PATTERN.test(value),
    "Enter a full UK postcode, for example SW1A 1AA.",
  );

/**
 * The listing form. Number fields arrive as strings from the DOM, so they are
 * coerced here rather than in the component.
 */
export const propertyFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(8, "Give the listing a descriptive title of at least 8 characters.")
    .max(120, "Keep the title under 120 characters."),
  intent: z.enum(["rent", "buy"]),
  price: z.coerce
    .number({ error: "Enter a price greater than zero." })
    .positive("Enter a price greater than zero.")
    .max(50_000_000, "That price looks too high."),
  addressLine1: z.string().trim().min(1, "Enter the first line of the address."),
  addressLine2: z.string().trim().optional(),
  town: z.string().trim().min(1, "Enter the town or city."),
  postcode: postcodeSchema,
  type: z.enum(propertyTypeValues),
  bedrooms: z.coerce
    .number({ error: "Enter a number of bedrooms between 0 and 20." })
    .int("Enter a whole number of bedrooms.")
    .min(0, "Enter a number of bedrooms between 0 and 20.")
    .max(20, "Enter a number of bedrooms between 0 and 20."),
  bathrooms: z.coerce
    .number({ error: "Enter a number of bathrooms between 1 and 20." })
    .int("Enter a whole number of bathrooms.")
    .min(1, "Enter a number of bathrooms between 1 and 20.")
    .max(20, "Enter a number of bathrooms between 1 and 20."),
  sizeSqFt: z.coerce
    .number({ error: "Enter the floor area in square feet." })
    .positive("Enter the floor area in square feet.")
    .max(100_000, "That floor area looks too large."),
  description: z
    .string()
    .trim()
    .min(40, "Write at least 40 characters so renters and buyers know what to expect."),
  availableFrom: z
    .string()
    .min(1, "Choose the date it becomes available.")
    .refine((v) => !Number.isNaN(new Date(v).getTime()), "Choose a valid date."),
  furnished: z.enum(["furnished", "unfurnished", "part-furnished"]).or(z.literal("")),
  energyRating: z.enum(energyValues).or(z.literal("")),
  agentId: z.string().min(1, "Choose the agent marketing this property."),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export const propertyImageSchema = z.object({
  id: z.string().min(1),
  src: z.string().min(1),
  category: z.enum([
    "exterior",
    "living",
    "kitchen",
    "bedroom",
    "bathroom",
    "garden",
    "parking",
    "other",
  ]),
  alt: z.string(),
});

/**
 * The full `PropertyDraft` shape (src/types/property.ts), used to validate
 * the body of `POST /api/properties` — a superset of `propertyFormSchema`,
 * which only covers what the create/edit form itself collects. `lat`/`lng`
 * come from geocoding, not the form fields, and `tenure`/`councilTaxBand`/
 * `depositWeeks`/`featured` aren't collected by the form at all today but
 * are valid on the type, so they're accepted here as optional.
 */
export const propertyDraftSchema = z.object({
  title: z.string().trim().min(1),
  intent: z.enum(["rent", "buy"]),
  price: z.coerce.number().positive(),
  addressLine1: z.string().trim().min(1),
  addressLine2: z.string().trim().optional(),
  town: z.string().trim().min(1),
  postcode: z.string().trim().min(1),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  type: z.enum(propertyTypeValues),
  bedrooms: z.coerce.number().int().min(0),
  bathrooms: z.coerce.number().int().min(0),
  sizeSqFt: z.coerce.number().positive(),
  description: z.string().trim().min(1),
  availableFrom: z.string().min(1),
  furnished: z.enum(["furnished", "unfurnished", "part-furnished"]).optional(),
  energyRating: z.enum(energyValues).optional(),
  tenure: z.enum(["freehold", "leasehold"] satisfies Tenure[]).optional(),
  councilTaxBand: z.string().optional(),
  depositWeeks: z.coerce.number().optional(),
  agentId: z.string().min(1),
  images: z.array(propertyImageSchema),
  featured: z.boolean().optional(),
});

export const propertyPatchSchema = propertyDraftSchema.partial();
