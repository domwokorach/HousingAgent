"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  ENERGY_RATING_TONES,
  FURNISHED_LABELS,
  PROPERTY_TYPE_LABELS,
  TENURE_LABELS,
} from "@/constants/propertyTypes";
import { ROUTES } from "@/constants/navigation";
import { useProperties } from "@/hooks/useProperties";
import { getAgentSync } from "@/services/agent.service";
import { calculateMortgage, rentDeposit, weeklyFromMonthly } from "@/lib/mortgage";
import { formatDate, formatMoney, formatPriceShort, formatRelative } from "@/lib/utils";
import {
  IconArea,
  IconBath,
  IconBed,
  IconCalendar,
  IconCar,
  IconKey,
  IconLeaf,
  IconPhone,
  IconPin,
  IconSofa,
  IconStar,
} from "@/components/ui/Icons";
import { Badge, ButtonLink, EmptyState, Logo } from "@/components/ui";
import { ContactAgentForm } from "@/components/agents/ContactAgentForm";
import { MortgageCalculator } from "@/components/mortgage/MortgageCalculator";
import { RentCalculator } from "@/components/mortgage/RentCalculator";
import { PropertyGallery } from "./PropertyGallery";
import { PropertyGrid } from "./PropertyGrid";
import { PropertyMap } from "@/components/maps/PropertyMap";
import { SaveButton } from "./SaveButton";

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: (props: { className?: string }) => ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-control border border-line bg-surface p-3.5 shadow-soft">
      <span className="grid size-9 shrink-0 place-items-center rounded-control bg-cream text-ink">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt>
        <dd className="truncate text-sm font-medium text-ink">{value}</dd>
      </div>
    </div>
  );
}

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line pt-8">
      <h2 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{title}</h2>
      {description && <p className="mt-1.5 text-ink-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function PropertyDetails({ propertyId }: { propertyId: string }) {
  const { hydrated, getProperty, getSimilar } = useProperties();
  const property = getProperty(propertyId);

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-8 w-2/3 animate-pulse rounded-control bg-surface-2" />
        <div className="mt-6 aspect-[3/2] max-w-3xl animate-pulse rounded-card bg-surface-2" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <EmptyState
          title="This property is no longer listed"
          description="It may have been let, sold or withdrawn by the agent. Try a fresh search to see what's available now."
          action={<ButtonLink href={ROUTES.properties}>Search properties</ButtonLink>}
        />
      </div>
    );
  }

  const agent = getAgentSync(property.agentId);
  const similar = getSimilar(property);
  const outcode = property.postcode.split(" ")[0];

  const mortgage =
    property.intent === "buy"
      ? calculateMortgage({
          price: property.price,
          depositPercent: 10,
          interestRate: 4.5,
          termYears: 30,
        })
      : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-ink-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href={ROUTES.home} className="hover:text-link-hover">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={property.intent === "rent" ? ROUTES.rent : ROUTES.buy}
              className="hover:text-link-hover"
            >
              {property.intent === "rent" ? "Property to rent" : "Property for sale"}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`${ROUTES.properties}?q=${encodeURIComponent(outcode)}`}
              className="hover:text-link-hover"
            >
              {property.town}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate text-ink">
            {property.title}
          </li>
        </ol>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">
              {property.intent === "rent" ? "To rent" : "For sale"}
            </Badge>
            {property.featured && <Badge tone="accent">Featured</Badge>}
            <span className="text-sm text-ink-muted">
              {formatRelative(property.listedAt)}
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {property.title}
          </h1>

          <p className="mt-2 flex items-start gap-1.5 text-ink-muted">
            <IconPin className="mt-0.5 size-5 shrink-0" />
            <span>
              {property.addressLine1}
              {property.addressLine2 && `, ${property.addressLine2}`}, {property.town},{" "}
              <span className="font-medium text-ink">{property.postcode}</span>
            </span>
          </p>
        </div>

        <div className="shrink-0">
          <p className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {formatPriceShort(property.price)}
            {property.intent === "rent" && (
              <span className="text-lg font-normal text-ink-muted"> pcm</span>
            )}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {property.intent === "rent" ? (
              <>
                {formatMoney(weeklyFromMonthly(property.price))} per week ·{" "}
                {formatMoney(rentDeposit(property))} deposit
              </>
            ) : (
              mortgage && <>From {formatMoney(mortgage.monthlyPayment)} pcm with a 10% deposit</>
            )}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="#contact"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-medium text-brand-ink transition-colors hover:bg-brand-strong"
            >
              <IconPhone className="size-4" />
              Contact Agent
            </a>
            <SaveButton propertyId={property.id} variant="full" />
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <PropertyGallery images={property.images} title={property.title} />

          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Fact icon={IconBed} label="Bedrooms" value={String(property.bedrooms)} />
            <Fact icon={IconBath} label="Bathrooms" value={String(property.bathrooms)} />
            <Fact
              icon={IconArea}
              label="Property size"
              value={`${property.sizeSqFt.toLocaleString("en-GB")} sq ft`}
            />
            <Fact
              icon={IconKey}
              label="Property type"
              value={PROPERTY_TYPE_LABELS[property.type]}
            />
            <Fact
              icon={IconCalendar}
              label="Available from"
              value={formatDate(property.availableFrom)}
            />
            {property.intent === "rent" ? (
              <Fact
                icon={IconSofa}
                label="Furnishing"
                value={
                  property.furnished
                    ? FURNISHED_LABELS[property.furnished]
                    : "Ask the agent"
                }
              />
            ) : (
              <Fact
                icon={IconCar}
                label="Tenure"
                value={property.tenure ? TENURE_LABELS[property.tenure] : "Ask the agent"}
              />
            )}
          </dl>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {property.energyRating && (
              <span className="inline-flex items-center gap-2 rounded-control border border-line bg-surface px-3 py-2 text-sm">
                <IconLeaf className="size-4 text-ink-muted" />
                <span className="text-ink-muted">Energy rating</span>
                <span
                  className={`grid size-7 place-items-center rounded font-bold ${ENERGY_RATING_TONES[property.energyRating]}`}
                >
                  {property.energyRating}
                </span>
              </span>
            )}
            {property.councilTaxBand && (
              <span className="rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink-muted">
                Council tax band{" "}
                <span className="font-semibold text-ink">{property.councilTaxBand}</span>
              </span>
            )}
          </div>

          <div className="mt-10 flex flex-col gap-10">
            <Section id="description" title="About this property">
              <div className="max-w-2xl space-y-4 leading-relaxed text-ink-muted">
                {property.description.split("\n\n").map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </Section>

            <Section
              id="costs"
              title={
                property.intent === "rent" ? "Rent and running costs" : "Mortgage and costs"
              }
              description={
                property.intent === "rent"
                  ? "What you'd pay each month, and what you need up front."
                  : "Adjust the deposit, rate and term to see what this would cost you."
              }
            >
              {property.intent === "rent" ? (
                <RentCalculator property={property} />
              ) : (
                <MortgageCalculator property={property} />
              )}
            </Section>

            <Section
              id="location"
              title="Location"
              description={`${property.addressLine1}, ${property.town}, ${property.postcode}`}
            >
              <PropertyMap
                lat={property.lat}
                lng={property.lng}
                title={property.title}
                className="aspect-[16/9]"
                caption="Approximate location. The exact address is confirmed at viewing."
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <ButtonLink
                  href={`${ROUTES.properties}?q=${encodeURIComponent(outcode)}&intent=${property.intent}`}
                  variant="secondary"
                >
                  See more in {outcode}
                </ButtonLink>
                <a
                  href={`https://www.openstreetmap.org/?mlat=${property.lat}&mlon=${property.lng}#map=16/${property.lat}/${property.lng}`}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex h-11 items-center rounded-control border border-line px-4 text-sm font-medium text-ink hover:border-line-strong hover:text-link-hover"
                >
                  Open in OpenStreetMap
                </a>
              </div>
            </Section>

            {agent && (
              <Section
                id="contact"
                title={`Contact ${agent.agency}`}
                description="Ask a question or arrange a viewing. Your message goes straight to the branch."
              >
                <ContactAgentForm
                  agent={agent}
                  propertyId={property.id}
                  propertyTitle={property.title}
                />
              </Section>
            )}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {agent ? (
            <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                Marketed by
              </p>
              <div className="mt-3 flex items-center gap-3">
                <Logo
                  src={agent.logo}
                  alt={`${agent.agency} logo`}
                  className="size-14 rounded-control"
                />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink">{agent.agency}</p>
                  <p className="truncate text-sm text-ink-muted">{agent.name}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-ink-muted">
                    <IconStar className="size-3.5 text-accent" />
                    {agent.rating.toFixed(1)}
                    <span className="text-ink-muted/80">({agent.reviewCount})</span>
                  </p>
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Branch</dt>
                  <dd className="text-right text-ink">{agent.town}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-muted">Phone</dt>
                  <dd className="text-right">
                    <a
                      href={`tel:${agent.phone.replace(/\s/g, "")}`}
                      className="text-link hover:underline"
                    >
                      {agent.phone}
                    </a>
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-col gap-2">
                <a
                  href="#contact"
                  className="inline-flex h-11 items-center justify-center rounded-control bg-brand px-4 text-sm font-medium text-brand-ink hover:bg-brand-strong"
                >
                  Contact Agent
                </a>
                <ButtonLink href={ROUTES.agent(agent.id)} variant="secondary">
                  View agent profile
                </ButtonLink>
                <SaveButton propertyId={property.id} variant="full" className="w-full" />
              </div>
            </div>
          ) : (
            <div className="rounded-card border border-line bg-surface p-5 shadow-soft">
              <p className="font-semibold text-ink">Private listing</p>
              <p className="mt-1.5 text-sm text-ink-muted">
                This property is listed directly by its owner.
              </p>
              <SaveButton propertyId={property.id} variant="full" className="mt-4 w-full" />
            </div>
          )}

          <div className="mt-4 rounded-card border border-line bg-surface p-5 shadow-soft">
            <p className="text-sm font-semibold text-ink">At a glance</p>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                [
                  "Price",
                  `${formatPriceShort(property.price)}${property.intent === "rent" ? " pcm" : ""}`,
                ],
                ["Bedrooms", String(property.bedrooms)],
                ["Bathrooms", String(property.bathrooms)],
                ["Size", `${property.sizeSqFt.toLocaleString("en-GB")} sq ft`],
                ["Type", PROPERTY_TYPE_LABELS[property.type]],
                ["Available", formatDate(property.availableFrom)],
                ["Postcode", property.postcode],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="text-ink-muted">{label}</dt>
                  <dd className="text-right font-medium text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section className="mt-14 border-t border-line pt-10">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Similar properties
          </h2>
          <PropertyGrid properties={similar} className="mt-6" />
        </section>
      )}
    </div>
  );
}
