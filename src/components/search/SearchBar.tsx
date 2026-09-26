"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ROUTES } from "@/constants/navigation";
import { DEFAULT_CRITERIA, paramsFromCriteria } from "@/lib/search";
import type { SearchCriteria } from "@/types/search";
import { PostcodeSearch } from "./PostcodeSearch";

/**
 * The home page search. Sends the visitor to /rent or /buy with the filters
 * already applied, so the results page is a shareable URL from the first click.
 */
export function SearchBar() {
  const router = useRouter();
  const [criteria] = useState<SearchCriteria>({
    ...DEFAULT_CRITERIA,
    intent: "rent",
  });

  return (
    <PostcodeSearch
      criteria={criteria}
      submitLabel="Search"
      onSubmit={(next) => {
        const params = paramsFromCriteria(next);
        params.delete("intent");
        const basePath = next.intent === "buy" ? ROUTES.buy : ROUTES.rent;
        const query = params.toString();
        router.push(query ? `${basePath}?${query}` : basePath);
      }}
    />
  );
}
