import type { Metadata } from "next";
import { Suspense } from "react";
import { ROUTES } from "@/constants/navigation";
import {
  SearchResults,
  SearchResultsSkeleton,
} from "@/components/search/SearchResults";

export const metadata: Metadata = {
  title: "Postcode search",
  description:
    "Search every property to rent or buy by full or partial postcode, with a radius, price, bedroom and property type filter.",
};

export default function PropertiesPage() {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchResults
        basePath={ROUTES.properties}
        heading="Search by postcode"
        intro="Enter a full or partial postcode — SW11, M20 3, LS6 1HZ — or a town name. Choose a radius and switch between rent and sale at any time."
      />
    </Suspense>
  );
}
