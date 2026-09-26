"use client";

import { useSearchParams } from "next/navigation";
import { IconCheck } from "@/components/ui/Icons";
import { Alert } from "@/components/ui";

/** Confirmation shown on the home page after an account is deleted. */
export function DeletedBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("deleted") !== "1") return null;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <Alert tone="success">
        <p className="flex items-center gap-2 font-medium">
          <IconCheck className="size-5 shrink-0" />
          Your account has been permanently deleted.
        </p>
        <p className="mt-1">
          Your profile, saved properties, listings and enquiry history have all been
          removed. You can create a new account at any time.
        </p>
      </Alert>
    </div>
  );
}
