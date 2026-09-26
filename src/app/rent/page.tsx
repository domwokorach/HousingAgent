import type { Metadata } from "next";
import { Suspense } from "react";
import { ROUTES } from "@/constants/navigation";
import {
  SearchResults,
  SearchResultsSkeleton,
} from "@/components/search/SearchResults";

export const metadata: Metadata = {
  title: "Property to rent",
  description:
    "Search homes to rent across the UK by postcode, price, bedrooms and property type.",
};

export default function RentPage() {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchResults
        basePath={ROUTES.rent}
        lockedIntent="rent"
        heading="Property to rent"
        intro="Search by postcode or town, set a radius, and see the monthly rent alongside the weekly equivalent and the deposit you'll need."
      />
    </Suspense>
  );
}
