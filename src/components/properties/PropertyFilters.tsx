"use client";

import type { SearchCriteria } from "@/types/search";
import { PostcodeSearch } from "@/components/search/PostcodeSearch";

/** The filter panel above a results list. */
export function PropertyFilters({
  criteria,
  onApply,
  lockIntent = false,
}: {
  criteria: SearchCriteria;
  onApply: (next: SearchCriteria) => void;
  lockIntent?: boolean;
}) {
  return (
    <div className="rounded-card border border-line bg-surface p-5 shadow-soft sm:p-6">
      <h2 className="sr-only">Filter properties</h2>
      <PostcodeSearch
        criteria={criteria}
        onSubmit={onApply}
        lockIntent={lockIntent}
        submitLabel="Update results"
      />
    </div>
  );
}
