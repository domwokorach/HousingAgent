"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ROUTES } from "@/constants/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useFavourites } from "@/hooks/useFavourites";
import { useProperties } from "@/hooks/useProperties";
import { formatDate } from "@/lib/utils";
import { IconCheck, IconHeart, IconKey, IconMail } from "@/components/ui/Icons";
import { Alert, Button, ButtonLink, Card } from "@/components/ui";
import { EnquiryList } from "./EnquiryList";

export function AccountDashboard() {
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "1";

  const { user, enquiries, logout } = useAuth();
  const { savedIds } = useFavourites();
  const { myListings } = useProperties();

  if (!user) return null;

  const stats = [
    {
      icon: IconHeart,
      label: "Saved properties",
      value: savedIds.length,
      href: ROUTES.saved,
      cta: "View shortlist",
    },
    {
      icon: IconKey,
      label: "Your listings",
      value: myListings.length,
      href: ROUTES.myProperties,
      cta: "Manage properties",
    },
    {
      icon: IconMail,
      label: "Enquiries sent",
      value: enquiries.length,
      href: "#enquiries",
      cta: "View enquiries",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {welcome && (
        <Alert tone="success">
          <p className="flex items-center gap-2 font-medium">
            <IconCheck className="size-5 shrink-0" />
            Welcome to Housing Agent, {user.firstName}.
          </p>
          <p className="mt-1">
            Your account is ready. Start by saving a few properties you like.
          </p>
        </Alert>
      )}

      <p className="text-sm text-ink-muted">
        Signed in as <span className="font-medium text-ink">{user.email}</span> · member
        since {formatDate(user.createdAt)}
      </p>

      <div className="grid gap-6 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5">
            <span className="grid size-10 place-items-center rounded-control bg-cream text-ink">
              <stat.icon className="size-5" />
            </span>
            <p className="mt-3 text-3xl font-semibold tabular-nums text-ink">
              {stat.value}
            </p>
            <p className="text-sm text-ink-muted">{stat.label}</p>
            <Link
              href={stat.href}
              className="mt-3 inline-block text-sm font-medium text-link underline underline-offset-4"
            >
              {stat.cta}
            </Link>
          </Card>
        ))}
      </div>

      <section id="enquiries" className="scroll-mt-24">
        <h2 className="text-xl font-semibold tracking-tight text-ink">Your enquiries</h2>
        <div className="mt-4">
          <EnquiryList enquiries={enquiries} />
        </div>
      </section>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <h2 className="font-semibold text-ink">Finished for now?</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Logging out keeps your account and shortlist for next time.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={ROUTES.settings} variant="secondary">
            Settings
          </ButtonLink>
          <Button variant="secondary" onClick={() => void logout()}>
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}
