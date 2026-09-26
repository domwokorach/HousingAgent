import { cx } from "@/lib/utils";

import type { GeoPoint } from "@/types/search";

export interface MapMarker extends GeoPoint {
  id: string;
  label?: string;
  highlighted?: boolean;
}

/**
 * The no-Mapbox fallback: a schematic map that plots markers in true relative
 * position over a stylised street grid.
 *
 * `PropertyMap` and `PropertiesMap` render this instead of real tiles when no
 * Mapbox token is configured, so a fresh clone of the repository still shows
 * something meaningful on the location section.
 */
export function SchematicMap({
  markers,
  centre,
  radiusMiles,
  className,
  caption,
}: {
  markers: MapMarker[];
  centre?: GeoPoint;
  radiusMiles?: number;
  className?: string;
  caption?: string;
}) {
  const W = 800;
  const H = 480;

  const points = markers.length
    ? markers
    : centre
      ? [{ id: "centre", lat: centre.lat, lng: centre.lng }]
      : [];

  if (points.length === 0) {
    return (
      <div className={cx("grid place-items-center rounded-card bg-surface-2 p-8 text-sm text-ink-muted", className)}>
        No location data.
      </div>
    );
  }

  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const pad = 0.012;
  const minLat = Math.min(...lats) - pad;
  const maxLat = Math.max(...lats) + pad;
  const minLng = Math.min(...lngs) - pad * 1.6;
  const maxLng = Math.max(...lngs) + pad * 1.6;

  const x = (lng: number) => ((lng - minLng) / (maxLng - minLng || 1)) * W;
  const y = (lat: number) => H - ((lat - minLat) / (maxLat - minLat || 1)) * H;

  // One degree of latitude is ~69 miles; use it to scale the radius ring.
  const radiusPx =
    radiusMiles && centre
      ? (radiusMiles / 69 / (maxLat - minLat || 1)) * H
      : null;

  return (
    <figure className={cx("overflow-hidden rounded-card border border-line bg-surface", className)}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block h-full w-full"
        role="img"
        aria-label={
          caption ??
          `Schematic map showing ${markers.length} propert${markers.length === 1 ? "y" : "ies"}`
        }
      >
        <defs>
          <pattern id="mp-grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0v64" fill="none" stroke="currentColor" strokeOpacity=".08" strokeWidth="1.5" />
          </pattern>
        </defs>

        <rect width={W} height={H} className="fill-surface-2" />
        <rect width={W} height={H} fill="url(#mp-grid)" className="text-ink" />

        {/* A couple of arterial roads and a river for visual orientation. */}
        <path
          d={`M0 ${H * 0.62} C ${W * 0.25} ${H * 0.52}, ${W * 0.45} ${H * 0.78}, ${W} ${H * 0.66}`}
          fill="none"
          stroke="currentColor"
          className="text-link"
          strokeOpacity=".45"
          strokeWidth="26"
          strokeLinecap="round"
        />
        <path
          d={`M${W * 0.18} 0 L${W * 0.3} ${H}`}
          stroke="currentColor"
          className="text-ink"
          strokeOpacity=".07"
          strokeWidth="16"
        />
        <path
          d={`M${W * 0.72} 0 L${W * 0.62} ${H}`}
          stroke="currentColor"
          className="text-ink"
          strokeOpacity=".07"
          strokeWidth="16"
        />

        {radiusPx && centre && (
          <circle
            cx={x(centre.lng)}
            cy={y(centre.lat)}
            r={radiusPx}
            className="fill-brand stroke-brand"
            fillOpacity=".08"
            strokeOpacity=".5"
            strokeDasharray="8 6"
            strokeWidth="2"
          />
        )}

        {centre && (
          <g>
            <circle cx={x(centre.lng)} cy={y(centre.lat)} r="9" className="fill-brand" fillOpacity=".25" />
            <circle cx={x(centre.lng)} cy={y(centre.lat)} r="4" className="fill-brand" />
          </g>
        )}

        {markers.map((marker) => (
          <g key={marker.id} transform={`translate(${x(marker.lng)} ${y(marker.lat)})`}>
            <ellipse cy="2" rx="9" ry="3" className="fill-ink" fillOpacity=".18" />
            <path
              d="M0 0c0 0-11-11.5-11-19a11 11 0 1 1 22 0C11-11.5 0 0 0 0Z"
              className={marker.highlighted ? "fill-ink" : "fill-brand"}
              stroke="currentColor"
              strokeWidth="2"
              strokeOpacity=".35"
            />
            <circle
              cy="-19"
              r="4"
              className={marker.highlighted ? "fill-cream" : "fill-ink"}
            />
          </g>
        ))}
      </svg>

      {caption && (
        <figcaption className="border-t border-line px-4 py-2.5 text-xs text-ink-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
