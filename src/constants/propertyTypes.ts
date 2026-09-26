import type {
  EnergyRating,
  FurnishedStatus,
  ImageCategory,
  Intent,
  PropertyType,
  Tenure,
} from "@/types/property";

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  flat: "Flat / apartment",
  studio: "Studio",
  terraced: "Terraced house",
  "semi-detached": "Semi-detached house",
  detached: "Detached house",
  bungalow: "Bungalow",
};

export const PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[];

export const IMAGE_CATEGORY_LABELS: Record<ImageCategory, string> = {
  exterior: "Exterior",
  living: "Living room",
  kitchen: "Kitchen",
  bedroom: "Bedroom",
  bathroom: "Bathroom",
  garden: "Garden",
  parking: "Parking",
  other: "Other",
};

export const IMAGE_CATEGORIES = Object.keys(IMAGE_CATEGORY_LABELS) as ImageCategory[];

export const FURNISHED_LABELS: Record<FurnishedStatus, string> = {
  furnished: "Furnished",
  unfurnished: "Unfurnished",
  "part-furnished": "Part furnished",
};

export const TENURE_LABELS: Record<Tenure, string> = {
  freehold: "Freehold",
  leasehold: "Leasehold",
};

export const ENERGY_RATINGS: EnergyRating[] = ["A", "B", "C", "D", "E", "F", "G"];

/**
 * EPC badge colours. The A-to-G scale is a recognised statutory rating, so the
 * green-to-red progression is kept rather than flattened into the cream
 * palette — it carries meaning the way a traffic light does. The hues are
 * desaturated to sit calmly alongside the rest of the theme.
 */
export const ENERGY_RATING_TONES: Record<EnergyRating, string> = {
  A: "bg-[#3f6b4a] text-white",
  B: "bg-[#59804f] text-white",
  C: "bg-[#8a9a5b] text-[#20260f]",
  D: "bg-[#c9a94f] text-[#2f2a24]",
  E: "bg-[#c08a4a] text-[#2f2a24]",
  F: "bg-[#b06a45] text-white",
  G: "bg-[#a34a42] text-white",
};

export const BEDROOM_OPTIONS = [1, 2, 3, 4, 5, 6] as const;

export const RADIUS_OPTIONS = [0.5, 1, 3, 5, 10, 20, 40] as const;

export const AGENT_DISTANCE_OPTIONS = [...RADIUS_OPTIONS, 60, 100] as const;

/** Price ladders differ hugely between a monthly rent and a purchase price. */
export const RENT_PRICE_STEPS = [
  0, 500, 750, 1000, 1250, 1500, 1750, 2000, 2500, 3000, 4000, 5000,
];

export const BUY_PRICE_STEPS = [
  0, 150_000, 200_000, 250_000, 300_000, 400_000, 500_000, 650_000, 800_000,
  1_000_000, 1_500_000, 2_000_000,
];

export function priceSteps(intent: Intent | "any"): number[] {
  return intent === "buy" ? BUY_PRICE_STEPS : RENT_PRICE_STEPS;
}

export const SORT_OPTIONS = [
  { value: "relevance", label: "Most relevant" },
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
] as const;
