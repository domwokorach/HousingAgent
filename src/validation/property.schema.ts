import { z } from "zod";
import { ENERGY_RATINGS, PROPERTY_TYPES } from "@/constants/propertyTypes";
import type { EnergyRating, PropertyType } from "@/types/property";

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
