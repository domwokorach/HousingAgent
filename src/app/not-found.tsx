import Link from "next/link";
import { ROUTES } from "@/constants/navigation";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-widest text-link">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 text-ink-muted">
        The link may be out of date, or the property or agent may no longer be listed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <ButtonLink href={ROUTES.properties} size="lg">
          Search properties
        </ButtonLink>
        <ButtonLink href={ROUTES.home} variant="secondary" size="lg">
          Back to home
        </ButtonLink>
      </div>
      <p className="mt-8 text-sm text-ink-muted">
        Looking for an agent?{" "}
        <Link
          href={ROUTES.agents}
          className="font-medium text-link underline underline-offset-4"
        >
          Find an agent
        </Link>
        .
      </p>
    </div>
  );
}
