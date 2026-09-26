import type { Metadata } from "next";
import { Suspense } from "react";
import { ROUTES } from "@/constants/navigation";
import {
  SearchResults,
  SearchResultsSkeleton,
} from "@/components/search/SearchResults";

export const metadata: Metadata = {
  title: "Property for sale",
  description:
    "Search homes for sale across the UK by postcode, asking price, bedrooms and property type.",
};

export default function BuyPage() {
  return (
    <Suspense fallback={<SearchResultsSkeleton />}>
      <SearchResults
        basePath={ROUTES.buy}
        lockedIntent="buy"
        heading="Property for sale"
        intro="Search by postcode or town, then open any listing to work out the deposit, mortgage and monthly repayment."
      />
    </Suspense>
  );
}
