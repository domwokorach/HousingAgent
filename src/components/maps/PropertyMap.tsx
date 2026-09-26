"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MAPBOX_STYLE, PUBLIC_MAPBOX_TOKEN, toLngLat } from "@/lib/mapbox";
import { cx } from "@/lib/utils";
import { SchematicMap } from "./SchematicMap";

/**
 * One property on an interactive Mapbox map.
 *
 * Falls back to the schematic map when no public token is configured, so the
 * location section always renders something.
 */
export function PropertyMap({
  lat,
  lng,
  title,
  label,
  className,
  caption,
  zoom = 14,
  highlighted = true,
}: {
  lat: number;
  lng: number;
  title: string;
  /** Pill text — a price, say. Falls back to the title. */
  label?: string;
  className?: string;
  caption?: string;
  zoom?: number;
  highlighted?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const hasToken = PUBLIC_MAPBOX_TOKEN.length > 0;

  useEffect(() => {
    if (!hasToken || failed) return;
    const node = container.current;
    if (!node) return;

    let map: import("mapbox-gl").Map | undefined;
    let cancelled = false;

    // Imported here rather than at module scope: GL JS touches browser globals
    // as it initialises, and client components are still rendered on the server.
    void (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (cancelled) return;

        mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

        map = new mapboxgl.Map({
          container: node,
          style: MAPBOX_STYLE,
          center: toLngLat({ lat, lng }),
          zoom,
          attributionControl: true,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");
        map.addControl(new mapboxgl.FullscreenControl(), "top-right");

        // setText, not setHTML — listing titles are user-entered.
        const popup = new mapboxgl.Popup({ offset: 18 }).setText(title);

        // A rounded pill rather than Mapbox's default pin. This one is the
        // subject of the page, so it uses the selected (dark) treatment.
        const pill = document.createElement("button");
        pill.type = "button";
        pill.className = highlighted ? "ha-marker ha-marker--selected" : "ha-marker";
        pill.textContent = label ?? title;
        pill.setAttribute("aria-label", title);

        new mapboxgl.Marker({ element: pill, anchor: "bottom" })
          .setLngLat(toLngLat({ lat, lng }))
          .setPopup(popup)
          .addTo(map);

        map.on("error", (event) => {
          console.error("[PropertyMap] Mapbox error:", event.error);
          setFailed(true);
        });
      } catch (error) {
        console.error("[PropertyMap] could not load Mapbox GL:", error);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [hasToken, failed, lat, lng, title, label, zoom, highlighted]);

  if (!hasToken || failed) {
    return (
      <SchematicMap
        markers={[{ id: "property", lat, lng, highlighted }]}
        centre={{ lat, lng }}
        className={className}
        caption={caption}
      />
    );
  }

  return (
    <figure
      className={cx("overflow-hidden rounded-card border border-line", className)}
    >
      <div ref={container} className="h-full min-h-72 w-full" />
      {caption && (
        <figcaption className="border-t border-line bg-surface px-4 py-2.5 text-xs text-ink-muted">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
