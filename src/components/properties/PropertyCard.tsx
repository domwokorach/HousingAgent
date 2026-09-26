import Link from "next/link";
import { PROPERTY_TYPE_LABELS } from "@/constants/propertyTypes";
import { ROUTES } from "@/constants/navigation";
import { getAgentSync } from "@/services/agent.service";
import { weeklyFromMonthly } from "@/lib/mortgage";
import { formatMiles, formatPriceShort, formatRelative } from "@/lib/utils";
import type { Property } from "@/types/property";
import { IconArea, IconBath, IconBed, IconPin } from "@/components/ui/Icons";
import { Badge, Photo } from "@/components/ui";
import { SaveButton } from "./SaveButton";

export function PropertyCard({
  property,
  distance,
  priority = false,
}: {
  property: Property;
  distance?: number | null;
  priority?: boolean;
}) {
  const agent = getAgentSync(property.agentId);
  const cover = property.images[0];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-soft transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-line-strong hover:shadow-lift">
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-2">
        {cover ? (
          <Photo
            src={cover.src}
            alt={cover.alt}
            priority={priority}
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-ink-muted">
            No photos yet
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <Badge tone="brand" className="shadow-soft">
            {property.intent === "rent" ? "To rent" : "For sale"}
          </Badge>
          {property.featured && (
            <Badge tone="accent" className="bg-surface shadow-soft">
              Featured
            </Badge>
          )}
        </div>

        <SaveButton propertyId={property.id} className="absolute right-3 top-3 z-10" />

        {property.images.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-full bg-ink/75 px-2 py-0.5 text-[11px] font-medium text-white">
            {property.images.length} photos
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xl font-bold tracking-tight text-ink">
            {formatPriceShort(property.price)}
            {property.intent === "rent" && (
              <span className="text-sm font-normal text-ink-muted"> pcm</span>
            )}
          </p>
          {property.intent === "rent" && (
            <p className="text-xs text-ink-subtle">
              {formatPriceShort(weeklyFromMonthly(property.price))} pw
            </p>
          )}
        </div>

        <h3 className="mt-1.5 text-[15px] font-semibold leading-snug text-ink">
          <Link
            href={ROUTES.property(property.id)}
            className="before:absolute before:inset-0"
          >
            {property.title}
          </Link>
        </h3>

        <p className="mt-1 flex items-start gap-1 text-sm text-ink-body">
          <IconPin className="mt-0.5 size-4 shrink-0" />
          <span>
            {property.addressLine1}, {property.town} {property.postcode}
          </span>
        </p>

        <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-subtle">
          <div className="flex items-center gap-1.5">
            <IconBed className="size-4" />
            <dt className="sr-only">Bedrooms</dt>
            <dd>{property.bedrooms}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <IconBath className="size-4" />
            <dt className="sr-only">Bathrooms</dt>
            <dd>{property.bathrooms}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <IconArea className="size-4" />
            <dt className="sr-only">Floor area</dt>
            <dd>{property.sizeSqFt.toLocaleString("en-GB")} sq ft</dd>
          </div>
          <div>
            <dt className="sr-only">Property type</dt>
            <dd>{PROPERTY_TYPE_LABELS[property.type]}</dd>
          </div>
        </dl>

        <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-ink-subtle">
          <span className="truncate">
            {agent ? agent.agency : "Private listing"}
            {typeof distance === "number" && ` · ${formatMiles(distance)} away`}
          </span>
          <span className="shrink-0">{formatRelative(property.listedAt)}</span>
        </div>

        <div className="relative z-10 mt-3 flex gap-2">
          <Link
            href={ROUTES.property(property.id)}
            className="inline-flex h-10 flex-1 items-center justify-center rounded-control bg-brand px-4 text-sm font-semibold text-brand-ink transition-colors duration-150 hover:bg-brand-strong"
          >
            View Details
          </Link>
          {agent && (
            <Link
              href={ROUTES.agent(agent.id)}
              className="inline-flex h-10 items-center justify-center rounded-control border border-line-strong px-3.5 text-sm font-semibold text-ink-body transition-colors duration-150 hover:bg-surface-2 hover:text-ink"
            >
              Agent
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
