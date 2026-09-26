import Link from "next/link";
import { Suspense } from "react";
import { POPULAR_AREAS, ROUTES } from "@/constants/navigation";
import { agents, properties } from "@/lib/seed";
import { getFeaturedProperties } from "@/services/property.service";
import { DeletedBanner } from "@/components/account/DeletedBanner";
import { SignedOutCta } from "@/components/account/SignedOutCta";
import {
  IconArea,
  IconCheck,
  IconKey,
  IconLeaf,
  IconPin,
  IconSearch,
  IconUser,
} from "@/components/ui/Icons";
import { ButtonLink, Logo, SectionHeading } from "@/components/ui";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { SearchBar } from "@/components/search/SearchBar";

const rentCount = properties.filter((p) => p.intent === "rent").length;
const buyCount = properties.filter((p) => p.intent === "buy").length;

const STEPS = [
  {
    icon: IconSearch,
    title: "Search your area",
    body: "Enter a full or partial postcode, set a radius, and filter by price, bedrooms and property type.",
  },
  {
    icon: IconArea,
    title: "See the real cost",
    body: "Every listing shows the weekly equivalent and deposit, or a full mortgage breakdown with running costs.",
  },
  {
    icon: IconUser,
    title: "Talk to the agent",
    body: "Contact the agent who holds the keys, or browse agent profiles to find one who covers your area.",
  },
];

const PANELS = [
  {
    href: ROUTES.rent,
    eyebrow: "Renting",
    title: "Homes to rent",
    body: "See the monthly rent, the weekly equivalent, the deposit you'll need up front and an estimate of household bills before you book a viewing.",
    cta: "Search rentals",
    count: rentCount,
  },
  {
    href: ROUTES.buy,
    eyebrow: "Buying",
    title: "Homes for sale",
    body: "Set your deposit, rate and term to see the monthly mortgage payment on any listing, plus stamp duty and the total interest over the life of the loan.",
    cta: "Search homes for sale",
    count: buyCount,
  },
];

export default async function HomePage() {
  const featured = await getFeaturedProperties(6);

  return (
    <>
      <Suspense fallback={null}>
        <DeletedBanner />
      </Suspense>

      {/* ------------------------------------------------------------ hero */}
      <section className="relative overflow-hidden border-b border-line bg-surface-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.55]"
          style={{
            backgroundImage:
              "radial-gradient(60rem 30rem at 85% -10%, var(--color-cream), transparent 70%), radial-gradient(42rem 24rem at 4% 108%, var(--color-cream), transparent 70%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-link">
              <IconKey className="size-4" />
              {rentCount} homes to rent · {buyCount} for sale
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              Find the place that
              <br />
              <span className="text-link">feels like home</span>
            </h1>

            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-body">
              Search properties to rent and buy across the UK by postcode. Compare what
              they actually cost each month, shortlist your favourites, and speak to the
              agent who knows the street.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <ButtonLink href={ROUTES.rent} size="lg">
                Browse homes to rent
              </ButtonLink>
              <ButtonLink href={ROUTES.agents} variant="secondary" size="lg">
                <IconUser className="size-5" />
                Find an Agent
              </ButtonLink>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Popular areas
              </p>
              <ul className="mt-3 flex flex-wrap gap-2">
                {POPULAR_AREAS.map((area) => (
                  <li key={area.postcode}>
                    <Link
                      href={`${ROUTES.properties}?q=${area.postcode}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-sm text-ink-muted transition-colors hover:border-line-strong hover:text-link-hover"
                    >
                      <IconPin className="size-3.5" />
                      {area.label}
                      <span className="text-ink-muted/70">{area.postcode}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-card border border-line bg-surface p-5 shadow-lift sm:p-7">
            <h2 className="text-lg font-semibold text-ink">Search properties</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Choose rent or buy, then narrow by area, price, bedrooms and type.
            </p>
            <div className="mt-5">
              <SearchBar />
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- featured */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Hand-picked"
          title="Featured properties"
          description="A selection of homes our agents think deserve a closer look this week."
          action={
            <ButtonLink href={ROUTES.properties} variant="secondary">
              See all {properties.length} properties
            </ButtonLink>
          }
        />
        <PropertyGrid properties={featured} className="mt-8" />
      </section>

      {/* ------------------------------------------------------ rent / buy */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2">
          {PANELS.map((panel) => (
            <div
              key={panel.href}
              className="flex flex-col rounded-card border border-line bg-surface p-7 shadow-soft"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-link">
                {panel.eyebrow}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
                {panel.title}
              </h3>
              <p className="mt-3 flex-1 leading-relaxed text-ink-muted">{panel.body}</p>
              <div className="mt-6 flex items-center gap-3">
                <ButtonLink href={panel.href}>{panel.cta}</ButtonLink>
                <span className="text-sm text-ink-muted">{panel.count} listings</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------- how it works */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <SectionHeading eyebrow="How it works" title="Three steps from search to keys" />
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.title} className="rounded-card border border-line bg-canvas p-6">
                <span className="grid size-11 place-items-center rounded-control bg-cream text-ink">
                  <step.icon className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- agents */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <SectionHeading
          eyebrow="Local expertise"
          title="Find an agent who knows your area"
          description="Search by name, postcode, town or specialisation and see what they currently have on their books."
          action={
            <ButtonLink href={ROUTES.agents} variant="secondary">
              Find an Agent
            </ButtonLink>
          }
        />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.slice(0, 4).map((agent) => (
            <li key={agent.id}>
              <Link
                href={ROUTES.agent(agent.id)}
                className="flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
              >
                <Logo
                  src={agent.logo}
                  alt={`${agent.agency} logo`}
                  className="size-12 rounded-control"
                />
                <p className="mt-3 font-semibold text-ink">{agent.agency}</p>
                <p className="text-sm text-ink-muted">{agent.name}</p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-ink-muted">
                  <IconPin className="size-4" />
                  {agent.town}
                </p>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-link">
                  <IconCheck className="size-4" />
                  {agent.rating.toFixed(1)} from {agent.reviewCount} reviews
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SignedOutCta />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-center gap-4 rounded-card border border-line bg-surface px-6 py-5 text-sm text-ink-muted">
          <IconLeaf className="size-5 shrink-0 text-link" />
          <p>
            Every listing shows its EPC rating, so you can weigh running costs before you
            commit. Filter for A and B rated homes on the{" "}
            <Link
              href={ROUTES.properties}
              className="font-medium text-link underline underline-offset-4"
            >
              full search page
            </Link>
            .
          </p>
        </div>
      </section>
    </>
  );
}
