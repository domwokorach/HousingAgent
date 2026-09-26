import Link from "next/link";
import { SPECIALISATION_LABELS } from "@/constants/accountTypes";
import { ROUTES } from "@/constants/navigation";
import { formatDate } from "@/lib/utils";
import type { Agent } from "@/types/agent";
import type { Property } from "@/types/property";
import { IconMail, IconPhone, IconPin } from "@/components/ui/Icons";
import { Badge, ButtonLink, Logo } from "@/components/ui";
import { PropertyGrid } from "@/components/properties/PropertyGrid";
import { PropertyMap } from "@/components/maps/PropertyMap";
import { AgentRating } from "./AgentRating";
import { ContactAgentForm } from "./ContactAgentForm";

export function AgentProfile({
  agent,
  listings,
}: {
  agent: Agent;
  listings: Property[];
}) {
  const toRent = listings.filter((property) => property.intent === "rent");
  const forSale = listings.filter((property) => property.intent === "buy");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-ink-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href={ROUTES.home} className="hover:text-link-hover">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={ROUTES.agents} className="hover:text-link-hover">
              Find an agent
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {agent.agency}
          </li>
        </ol>
      </nav>

      <header className="rounded-card border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-start gap-6">
          <Logo
            src={agent.logo}
            alt={`${agent.agency} logo`}
            className="size-20 shrink-0 rounded-xl sm:size-24"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              {agent.agency}
            </h1>
            <p className="mt-1 text-lg text-ink-muted">{agent.name}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-muted">
              <span className="flex items-center gap-1.5">
                <AgentRating rating={agent.rating} />
                <span className="font-medium text-ink">{agent.rating.toFixed(1)}</span>
                <span>from {agent.reviewCount} reviews</span>
              </span>
              <span className="flex items-center gap-1.5">
                <IconPin className="size-4" />
                {agent.town} {agent.postcode}
              </span>
              <a
                href={`tel:${agent.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-1.5 hover:text-link-hover"
              >
                <IconPhone className="size-4" />
                {agent.phone}
              </a>
              <a
                href={`mailto:${agent.email}`}
                className="flex items-center gap-1.5 hover:text-link-hover"
              >
                <IconMail className="size-4" />
                {agent.email}
              </a>
            </div>

            <ul className="mt-4 flex flex-wrap gap-1.5">
              {agent.specialisations.map((specialisation) => (
                <li key={specialisation}>
                  <Badge tone="brand">{SPECIALISATION_LABELS[specialisation]}</Badge>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <ButtonLink href="#contact" size="lg">
              Contact Agent
            </ButtonLink>
            <ButtonLink href="#properties" variant="secondary" size="lg">
              View Properties ({listings.length})
            </ButtonLink>
          </div>
        </div>

        <p className="mt-6 max-w-3xl leading-relaxed text-ink-muted">{agent.bio}</p>

        <div className="mt-6 border-t border-line pt-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Areas covered
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {agent.areasCovered.map((area) => (
              <li
                key={area}
                className="rounded-full border border-line px-3 py-1 text-sm text-ink-muted"
              >
                {area}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <section id="properties" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold tracking-tight text-ink">
          Properties listed by {agent.agency}
        </h2>
        <p className="mt-1.5 text-ink-muted">
          {toRent.length} to rent · {forSale.length} for sale
        </p>

        {listings.length === 0 ? (
          <p className="mt-6 rounded-card border border-dashed border-line bg-surface px-6 py-10 text-center text-ink-muted">
            This agent has no properties listed right now.
          </p>
        ) : (
          <PropertyGrid properties={listings} className="mt-6" />
        )}
      </section>

      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <section id="reviews" className="scroll-mt-24">
          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Ratings and reviews
          </h2>

          <div className="mt-4 flex items-center gap-4 rounded-card border border-line bg-surface px-5 py-4">
            <p className="text-4xl font-semibold tabular-nums text-ink">
              {agent.rating.toFixed(1)}
            </p>
            <div>
              <AgentRating rating={agent.rating} />
              <p className="mt-1 text-sm text-ink-muted">
                Based on {agent.reviewCount} verified reviews
              </p>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-4">
            {agent.reviews.map((review) => (
              <li
                key={`${review.author}-${review.date}`}
                className="rounded-card border border-line bg-surface p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-ink">{review.author}</p>
                  <p className="text-sm text-ink-muted">{formatDate(review.date)}</p>
                </div>
                <AgentRating rating={review.rating} className="mt-1.5" />
                <p className="mt-2 leading-relaxed text-ink-muted">{review.comment}</p>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
              Branch location
            </h3>
            <PropertyMap
              lat={agent.lat}
              lng={agent.lng}
              title={agent.agency}
              zoom={13}
              className="mt-3 aspect-[16/9]"
              caption={`${agent.agency}, ${agent.town} ${agent.postcode}`}
            />
          </div>
        </section>

        <section id="contact" className="scroll-mt-24">
          <div className="rounded-card border border-line bg-surface p-6">
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Contact {agent.name}
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">
              Ask about a property, request a valuation, or arrange a viewing.
            </p>
            <div className="mt-5">
              <ContactAgentForm agent={agent} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
