/** Whether a listing is advertised to let or for sale. */
export type Intent = "rent" | "buy";

export type PropertyType =
  | "flat"
  | "studio"
  | "terraced"
  | "semi-detached"
  | "detached"
  | "bungalow";

export type ImageCategory =
  | "exterior"
  | "living"
  | "kitchen"
  | "bedroom"
  | "bathroom"
  | "garden"
  | "parking"
  | "other";

export type EnergyRating = "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type FurnishedStatus = "furnished" | "unfurnished" | "part-furnished";

export type Tenure = "freehold" | "leasehold";

export interface PropertyImage {
  id: string;
  src: string;
  category: ImageCategory;
  alt: string;
}

export interface Property {
  id: string;
  title: string;
  intent: Intent;
  /** Monthly rent in GBP for lettings, full asking price in GBP for sales. */
  price: number;
  addressLine1: string;
  addressLine2?: string;
  town: string;
  postcode: string;
  lat: number;
  lng: number;
  type: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sizeSqFt: number;
  description: string;
  /** ISO date the property becomes available. */
  availableFrom: string;
  furnished?: FurnishedStatus;
  energyRating?: EnergyRating;
  tenure?: Tenure;
  councilTaxBand?: string;
  /** Rent only: deposit expressed in weeks of rent. */
  depositWeeks?: number;
  agentId: string;
  images: PropertyImage[];
  /** ISO date the listing went live — used for "newest" sorting. */
  listedAt: string;
  featured?: boolean;
  /** Set when the listing was created in-app by a landlord or agent. */
  ownerEmail?: string;
}

/** The shape accepted when creating a listing; ids and dates are assigned. */
export type PropertyDraft = Omit<Property, "id" | "listedAt" | "ownerEmail">;
