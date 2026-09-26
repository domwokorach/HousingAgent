import Link from "next/link";
import type { ReactNode } from "react";
import { ROUTES } from "@/constants/navigation";
import { IconLogo } from "@/components/ui/Icons";

/** Shared framing for the sign-in, registration and password pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  aside,
  wide = false,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  aside?: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:py-16">
      <div className={wide ? "" : "mx-auto w-full max-w-lg lg:mx-0"}>
        <Link href={ROUTES.home} className="inline-flex items-center gap-2 text-ink">
          <span className="grid size-9 place-items-center rounded-control bg-brand text-brand-ink">
            <IconLogo className="size-6" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Housing<span className="text-link">Agent</span>
          </span>
        </Link>

        <h1 className="mt-8 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-ink-muted">{subtitle}</p>

        <div className="mt-8">{children}</div>
      </div>

      {aside && (
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-card border border-line bg-surface p-6 shadow-soft">
            {aside}
          </div>
        </aside>
      )}
    </div>
  );
}
