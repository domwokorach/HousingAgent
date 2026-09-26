"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ACCOUNT_NAV, MAIN_NAV, ROUTES } from "@/constants/navigation";
import { ACCOUNT_TYPE_LABELS } from "@/constants/accountTypes";
import { useAuth } from "@/hooks/useAuth";
import { useFavourites } from "@/hooks/useFavourites";
import { cx } from "@/lib/utils";
import {
  IconChevronDown,
  IconClose,
  IconHeart,
  IconLogo,
  IconMenu,
} from "@/components/ui/Icons";
import { Button, ButtonLink } from "@/components/ui";
import { Navbar } from "./Navbar";

export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href={ROUTES.home}
      className={cx("flex shrink-0 items-center gap-2 text-ink", className)}
      aria-label="Housing Agent home"
    >
      <span className="grid size-9 place-items-center rounded-control bg-brand text-brand-ink">
        <IconLogo className="size-6" />
      </span>
      <span className="text-lg font-bold tracking-tight">
        Housing<span className="text-link">Agent</span>
      </span>
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { hydrated, user, logout } = useAuth();
  const { count } = useFavourites();

  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close both menus on navigation. Adjusting state during render rather than
  // in an effect means neither is briefly visible on the new page.
  if (lastPathname !== pathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
    setMobileOpen(false);
  }

  // Dismiss the account dropdown on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const badges = { [ROUTES.saved]: hydrated ? count : undefined };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Brand />

        <Navbar
          items={MAIN_NAV}
          badges={badges}
          className="ml-4 hidden flex-1 lg:block"
        />

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Link
            href={ROUTES.saved}
            className="relative grid size-10 place-items-center rounded-control text-ink-body transition-colors hover:bg-surface-2 hover:text-ink lg:hidden"
            aria-label={`Saved properties${hydrated && count ? ` (${count})` : ""}`}
          >
            <IconHeart className="size-5" />
            {hydrated && count > 0 && (
              <span className="absolute right-1 top-1 size-2 rounded-full bg-brand" />
            )}
          </Link>

          {!hydrated ? (
            <div className="hidden h-10 w-44 animate-pulse rounded-control bg-surface-2 sm:block" />
          ) : user ? (
            <div className="relative hidden sm:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="flex h-10 items-center gap-2 rounded-control border border-line-strong px-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
              >
                <span className="grid size-6 place-items-center rounded-full bg-cream text-xs font-bold text-ink">
                  {user.firstName.charAt(0).toUpperCase()}
                  {user.lastName.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-24 truncate">{user.firstName}</span>
                <IconChevronDown className="size-4 text-ink-muted" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 w-64 overflow-hidden rounded-card border border-line bg-surface shadow-lift"
                >
                  <div className="border-b border-line px-4 py-3">
                    <p className="truncate text-sm font-semibold text-ink">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="truncate text-xs text-ink-muted">{user.email}</p>
                    <p className="mt-1.5 inline-flex rounded-full bg-cream px-2 py-0.5 text-[11px] font-medium text-ink">
                      {ACCOUNT_TYPE_LABELS[user.accountType]}
                    </p>
                  </div>

                  <div className="py-1">
                    {ACCOUNT_NAV.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        role="menuitem"
                        className="block px-4 py-2 text-sm text-ink-body transition-colors hover:bg-surface-2 hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  <div className="border-t border-line p-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void logout()}
                      className="block w-full rounded-control px-3 py-2 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-soft"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <ButtonLink href={ROUTES.login} variant="ghost" size="sm">
                Login
              </ButtonLink>
              <ButtonLink href={ROUTES.register} size="sm">
                Create Account
              </ButtonLink>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            className="grid size-10 place-items-center rounded-control text-ink transition-colors hover:bg-surface-2 lg:hidden"
          >
            {mobileOpen ? <IconClose className="size-5" /> : <IconMenu className="size-5" />}
            <span className="sr-only">{mobileOpen ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div id="mobile-nav" className="border-t border-line bg-surface lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
            <Navbar items={MAIN_NAV} orientation="vertical" label="Mobile" />

            <div className="mt-3 border-t border-line pt-3">
              {hydrated && user ? (
                <div className="flex flex-col gap-2">
                  <p className="px-3 text-xs text-ink-muted">Signed in as {user.email}</p>
                  <Navbar items={ACCOUNT_NAV} orientation="vertical" label="Account" />
                  <Button variant="secondary" onClick={() => void logout()} className="mt-1">
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <ButtonLink href={ROUTES.login} variant="secondary">
                    Login
                  </ButtonLink>
                  <ButtonLink href={ROUTES.register}>Create Account</ButtonLink>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
