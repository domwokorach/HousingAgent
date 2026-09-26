"use client";

import { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { ROUTES } from "@/constants/navigation";
import { MAPBOX_STYLE, PUBLIC_MAPBOX_TOKEN, toLngLat } from "@/lib/mapbox";
import { cx, formatPriceShort } from "@/lib/utils";
import type { Property } from "@/types/property";
import type { GeoPoint } from "@/types/search";
import { SchematicMap } from "./SchematicMap";

/** A ring of points approximating a circle of `miles` around `centre`. */
function circlePolygon(centre: GeoPoint, miles: number, steps = 64) {
  const latRadius = miles / 69;
  const lngRadius = miles / (69 * Math.cos((centre.lat * Math.PI) / 180));

  const ring = Array.from({ length: steps + 1 }, (_, index) => {
    const angle = (index / steps) * 2 * Math.PI;
    return [
      centre.lng + lngRadius * Math.cos(angle),
      centre.lat + latRadius * Math.sin(angle),
    ];
  });

  return {
    type: "Feature" as const,
    properties: {},
    geometry: { type: "Polygon" as const, coordinates: [ring] },
  };
}

/**
 * Builds a popup body from DOM nodes rather than an HTML string. Listing
 * titles are user-entered, so nothing here goes through `setHTML`.
 */
function popupContent(property: Property): HTMLElement {
  const root = document.createElement("div");
  root.className = "ha-popup";

  const price = document.createElement("p");
  price.className = "ha-popup__price";
  price.textContent = `${formatPriceShort(property.price)}${
    property.intent === "rent" ? " pcm" : ""
  }`;

  const title = document.createElement("p");
  title.className = "ha-popup__title";
  title.textContent = property.title;

  const facts = document.createElement("p");
  facts.className = "ha-popup__facts";
  facts.textContent = `${property.bedrooms} bed · ${property.bathrooms} bath · ${property.postcode}`;

  const link = document.createElement("a");
  link.className = "ha-popup__link";
  link.href = ROUTES.property(property.id);
  link.textContent = "View Property";

  root.append(price, title, facts, link);
  return root;
}

/**
 * Many properties on one interactive map, each marker opening a card with the
 * price, size and a link through to the listing.
 *
 * Falls back to the schematic map when no public token is configured.
 */
export function PropertiesMap({
  properties,
  centre,
  radiusMiles,
  className,
  caption,
}: {
  properties: Property[];
  centre?: GeoPoint;
  radiusMiles?: number;
  className?: string;
  caption?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const hasToken = PUBLIC_MAPBOX_TOKEN.length > 0;

  // Re-run only when the set of pins actually changes, not on every render.
  const signature = properties.map((property) => property.id).join(",");

  useEffect(() => {
    if (!hasToken || failed) return;
    const node = container.current;
    if (!node || properties.length === 0) return;

    let map: import("mapbox-gl").Map | undefined;
    let cancelled = false;

    void (async () => {
      try {
        const mapboxgl = (await import("mapbox-gl")).default;
        if (cancelled) return;

        mapboxgl.accessToken = PUBLIC_MAPBOX_TOKEN;

        map = new mapboxgl.Map({
          container: node,
          style: MAPBOX_STYLE,
          center: toLngLat(centre ?? properties[0]),
          zoom: 11,
        });

        map.addControl(new mapboxgl.NavigationControl(), "top-right");

        for (const property of properties) {
          const popup = new mapboxgl.Popup({ offset: 18 }).setDOMContent(
            popupContent(property),
          );

          // A cream price pill; it inverts to dark brown while its popup is
          // open, so the selected property is obvious among the others.
          const pill = document.createElement("button");
          pill.type = "button";
          pill.className = "ha-marker";
          pill.textContent = `${formatPriceShort(property.price)}${
            property.intent === "rent" ? " pcm" : ""
          }`;
          pill.setAttribute("aria-label", `${property.title} — view on the map`);
          pill.setAttribute("aria-pressed", "false");

          popup.on("open", () => pill.setAttribute("aria-pressed", "true"));
          popup.on("close", () => pill.setAttribute("aria-pressed", "false"));

          new mapboxgl.Marker({ element: pill, anchor: "bottom" })
            .setLngLat(toLngLat(property))
            .setPopup(popup)
            .addTo(map);
        }

        // Frame every pin, and the search radius when there is one.
        const bounds = new mapboxgl.LngLatBounds();
        properties.forEach((property) => bounds.extend(toLngLat(property)));
        if (centre) bounds.extend(toLngLat(centre));
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, { padding: 56, maxZoom: 14, duration: 0 });
        }

        map.on("load", () => {
          if (!map || !centre || !radiusMiles) return;

          map.addSource("search-radius", {
            type: "geojson",
            data: circlePolygon(centre, radiusMiles),
          });
          map.addLayer({
            id: "search-radius-fill",
            type: "fill",
            source: "search-radius",
            paint: { "fill-color": "#806c58", "fill-opacity": 0.08 },
          });
          map.addLayer({
            id: "search-radius-line",
            type: "line",
            source: "search-radius",
            paint: {
              "line-color": "#806c58",
              "line-width": 2,
              "line-dasharray": [3, 2],
              "line-opacity": 0.6,
            },
          });
        });

        map.on("error", (event) => {
          console.error("[PropertiesMap] Mapbox error:", event.error);
          setFailed(true);
        });
      } catch (error) {
        console.error("[PropertiesMap] could not load Mapbox GL:", error);
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
    // `signature` stands in for the property list; the rest are primitives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasToken, failed, signature, centre?.lat, centre?.lng, radiusMiles]);

  if (!hasToken || failed) {
    return (
      <SchematicMap
        markers={properties.map((property) => ({
          id: property.id,
          lat: property.lat,
          lng: property.lng,
        }))}
        centre={centre}
        radiusMiles={radiusMiles}
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
