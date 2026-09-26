export type Specialisation =
  | "lettings"
  | "sales"
  | "new-builds"
  | "student"
  | "luxury"
  | "commercial";

export interface Review {
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Agent {
  id: string;
  name: string;
  agency: string;
  logo: string;
  town: string;
  postcode: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  specialisations: Specialisation[];
  areasCovered: string[];
  rating: number;
  reviewCount: number;
  reviews: Review[];
  bio: string;
}
