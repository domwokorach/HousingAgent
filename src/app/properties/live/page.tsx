import type { Metadata } from "next";
import { LiveListingsBrowser } from "@/components/properties/LiveListingsBrowser";

export const metadata: Metadata = {
  title: "Live listings",
  description:
    "Search UK properties currently on the market, supplied by the Homedata live-listings feed.",
};

export default function LiveListingsPage() {
  return <LiveListingsBrowser />;
}
