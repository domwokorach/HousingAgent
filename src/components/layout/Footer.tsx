import Link from "next/link";
import { FOOTER_COLUMNS, ROUTES } from "@/constants/navigation";
import { IconLogo } from "@/components/ui/Icons";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-footer">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Link href={ROUTES.home} className="flex items-center gap-2 text-ink">
            <span className="grid size-9 place-items-center rounded-control bg-brand text-brand-ink">
              <IconLogo className="size-6" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Housing<span className="text-link">Agent</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-body">
            Search homes to rent and buy across the UK, work out what they really cost,
            and talk to the agent who knows the street.
          </p>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {column.links.map((link) => (
                <li key={link.href + link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-ink-body transition-colors hover:text-link-hover"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="border-t border-line-strong/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-xs text-ink-muted sm:px-6">
          <p>
            © {new Date().getFullYear()} Housing Agent. A demonstration application.{" "}
            <Link href={ROUTES.terms} className="underline underline-offset-2 hover:text-link-hover">
              Terms
            </Link>
          </p>
          <p>
            Listings, agents and accounts are sample data held in your browser — nothing is
            sent to a server.
          </p>
        </div>
      </div>
    </footer>
  );
}
