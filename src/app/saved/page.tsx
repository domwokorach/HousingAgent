import type { Metadata } from "next";
import { SavedProperties } from "@/components/properties/SavedProperties";

export const metadata: Metadata = {
  title: "Saved properties",
  description: "The properties you've shortlisted to rent or buy.",
};

export default function SavedPage() {
  return <SavedProperties />;
}
