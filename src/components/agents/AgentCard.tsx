import Link from "next/link";
import { SPECIALISATION_LABELS } from "@/constants/accountTypes";
import { ROUTES } from "@/constants/navigation";
import { properties } from "@/lib/seed";
import { formatMiles } from "@/lib/utils";
import type { Agent } from "@/types/agent";
import { IconMail, IconPhone, IconPin } from "@/components/ui/Icons";
import { Badge, Logo } from "@/components/ui";
import { AgentRating } from "./AgentRating";

export function AgentCard({
  agent,
  distance,
}: {
  agent: Agent;
  distance?: number | null;
}) {
  const listingCount = properties.filter(
    (property) => property.agentId === agent.id,
  ).length;

  return (
    <article className="relative flex flex-col rounded-card border border-line bg-surface p-5 shadow-soft transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift">
      <div className="flex items-start gap-4">
        <Logo
          src={agent.logo}
          alt={`${agent.agency} logo`}
          className="size-16 shrink-0 rounded-control"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-tight text-ink">
            <Link href={ROUTES.agent(agent.id)} className="before:absolute before:inset-0">
              {agent.agency}
            </Link>
          </h3>
          <p className="text-sm text-ink-muted">{agent.name}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <AgentRating rating={agent.rating} />
            <span className="text-sm text-ink-muted">
              {agent.rating.toFixed(1)} · {agent.reviewCount} reviews
            </span>
          </div>
        </div>
      </div>

      <p className="mt-4 flex items-center gap-1.5 text-sm text-ink-muted">
        <IconPin className="size-4 shrink-0" />
        {agent.town} {agent.postcode}
        {typeof distance === "number" && ` · ${formatMiles(distance)} away`}
      </p>

      <ul className="mt-3 flex flex-wrap gap-1.5">
        {agent.specialisations.map((specialisation) => (
          <li key={specialisation}>
            <Badge tone="brand">{SPECIALISATION_LABELS[specialisation]}</Badge>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-sm text-ink-muted">
        <span className="font-medium text-ink">Areas covered:</span>{" "}
        {agent.areasCovered.join(", ")}
      </p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm text-ink-muted">
        <span className="flex items-center gap-1.5">
          <IconPhone className="size-4" />
          {agent.phone}
        </span>
        <span className="flex items-center gap-1.5 truncate">
          <IconMail className="size-4 shrink-0" />
          {agent.email}
        </span>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={`${ROUTES.agent(agent.id)}#contact`}
          className="inline-flex h-10 flex-1 items-center justify-center rounded-control bg-brand px-4 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-strong"
        >
          Contact Agent
        </Link>
        <Link
          href={`${ROUTES.agent(agent.id)}#properties`}
          className="inline-flex h-10 items-center justify-center rounded-control border border-line px-4 text-sm font-medium text-ink hover:border-line-strong hover:text-link-hover"
        >
          View Properties ({listingCount})
        </Link>
      </div>
    </article>
  );
}
