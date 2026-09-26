"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ACCOUNT_NAV, ROUTES } from "@/constants/navigation";
import { ACCOUNT_TYPE_LABELS } from "@/constants/accountTypes";
import { useAuth } from "@/hooks/useAuth";
import { cx } from "@/lib/utils";
import { Logo } from "@/components/ui";
import { IconTrash } from "@/components/ui/Icons";

/**
 * Navigation for the account area. Renders as a sidebar from `lg` up and as a
 * scrollable tab strip on narrower screens, so it never crowds the content.
 */
export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isActive = (href: string) =>
    href === ROUTES.account ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* Tabs — small screens */}
      <nav aria-label="Account" className="border-b border-line lg:hidden">
        <ul className="-mb-px flex gap-1 overflow-x-auto">
          {ACCOUNT_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cx(
                  "inline-block whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "border-brand text-ink"
                    : "border-transparent text-ink-muted hover:border-line-strong hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sidebar — large screens */}
      <aside className="hidden lg:block">
        <div className="sticky top-24">
          {user && (
            <div className="mb-4 flex items-center gap-3 rounded-card border border-line bg-surface p-4 shadow-soft">
              <Logo
                src="/images/users/avatar-default.svg"
                alt=""
                className="size-11 shrink-0 rounded-full"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {ACCOUNT_TYPE_LABELS[user.accountType]}
                </p>
              </div>
            </div>
          )}

          <nav aria-label="Account" className="rounded-card border border-line bg-surface p-2 shadow-soft">
            <ul className="flex flex-col gap-0.5">
              {ACCOUNT_NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cx(
                      "block rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive(item.href)
                        ? "bg-cream text-ink"
                        : "text-ink-body hover:bg-surface-2 hover:text-ink",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-1 border-t border-line pt-1">
              <Link
                href={ROUTES.deleteAccount}
                aria-current={isActive(ROUTES.deleteAccount) ? "page" : undefined}
                className={cx(
                  "flex items-center gap-2 rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(ROUTES.deleteAccount)
                    ? "bg-danger-soft text-danger"
                    : "text-ink-muted hover:bg-danger-soft hover:text-danger",
                )}
              >
                <IconTrash className="size-4" />
                Delete account
              </Link>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}

/** Shared two-column frame for every page in the account area. */
export function AccountLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {title}
        </h1>
        {description && <p className="mt-2 text-ink-muted">{description}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
