"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cx } from "@/lib/utils";
import type { NavItem } from "@/constants/navigation";

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * The primary navigation list. `orientation` switches between the header bar
 * and the stacked mobile menu; both render the same links and active states.
 */
export function Navbar({
  items,
  orientation = "horizontal",
  badges,
  label = "Main",
  className,
}: {
  items: NavItem[];
  orientation?: "horizontal" | "vertical";
  /** Optional counts keyed by href, e.g. the number of saved properties. */
  badges?: Record<string, number | undefined>;
  label?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <nav aria-label={label} className={className}>
      <ul className={cx("flex", vertical ? "flex-col" : "items-center gap-1")}>
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const badge = badges?.[item.href];

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "block rounded-control text-sm font-medium transition-colors duration-150",
                  vertical ? "px-3 py-2.5" : "px-3.5 py-2",
                  active
                    ? "bg-cream text-ink"
                    : "text-ink-body hover:bg-surface-2 hover:text-link-hover",
                )}
              >
                {item.label}
                {badge !== undefined && badge > 0 && (
                  <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[11px] font-bold text-brand-ink">
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
