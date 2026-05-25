"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";
import { MapTokens, HEAT_RAMP, zoomWidth } from "@/lib/design-tokens";

interface HeatLayerProps {
  map: mapboxgl.Map;
  geoJson: FeatureCollection<Geometry> | null;
  isLoading: boolean;
  selectedIso?: string | null;
  watchedIsos?: string[];
}

// ─── Fill colour ──────────────────────────────────────────────────────────────
// Score 0 (no data) → nearly transparent; the dark globe shows through.
// Score 1–100 → YlOrRd ramp defined in design-tokens.ts.
const FILL_COLOR_EXPR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["get", "score"], 0], 0],
  MapTokens.fill.noData,
  [
    "interpolate", ["linear"], ["get", "score"],
    ...HEAT_RAMP.flatMap(([s, c]) => [s, c] as [number, string]),
  ],
];

// ─── Adaptive border colour ───────────────────────────────────────────────────
// No-data → faint white (readable on the dark basemap).
// Scored   → dark ink that recedes into any YlOrRd fill without competing.
const BORDER_COLOR_EXPR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["get", "score"], 0], 0],
  MapTokens.border.noData,
  MapTokens.border.scored,
];

export default function HeatLayer({
  map, geoJson, isLoading, selectedIso, watchedIsos = [],
}: HeatLayerProps) {

  // ── Add source + all layers once on mount ────────────────────────────────────
  useEffect(() => {
    map.addSource("countries", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // Insert fill + outlines below basemap country labels
    const beforeId = map.getLayer("country-label") ? "country-label" : undefined;

    // 1. Fill
    map.addLayer(
      {
        id: "heat-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color":   FILL_COLOR_EXPR,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"],
            0, MapTokens.fill.opacityGlobe,
            5, MapTokens.fill.opacityClose,
          ],
        },
      },
      beforeId
    );

    // 2. Permanent adaptive border
    map.addLayer(
      {
        id: "heat-outline",
        type: "line",
        source: "countries",
        paint: {
          "line-color": BORDER_COLOR_EXPR,
          "line-width": zoomWidth(MapTokens.border.widths),
        },
      },
      beforeId
    );

    // 3. Hover highlight (filter set to nothing by default)
    map.addLayer(
      {
        id: "heat-hover-outline",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "ISO_A3"], ""],
        paint: {
          "line-color": MapTokens.hover.color,
          "line-width": zoomWidth(MapTokens.hover.widths),
          "line-blur":  MapTokens.hover.blur,
        },
      },
      beforeId
    );

    // 4. Watchlist outline — amber glow for bookmarked countries
    map.addLayer(
      {
        id: "heat-watched-outline",
        type: "line",
        source: "countries",
        filter: ["in", ["get", "ISO_A3"], ["literal", []]],
        paint: {
          "line-color": MapTokens.watched.color,
          "line-width": zoomWidth(MapTokens.watched.widths),
          "line-blur":  MapTokens.watched.blur,
        },
      },
      beforeId
    );

    // 5. Selected-country glow — wide, translucent halo beneath the crisp edge
    map.addLayer(
      {
        id: "heat-selected-glow",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "ISO_A3"], ""],
        paint: {
          "line-color": MapTokens.selectedGlow.color,
          "line-width": zoomWidth(MapTokens.selectedGlow.widths),
          "line-blur":  MapTokens.selectedGlow.blur,
        },
      },
      beforeId
    );

    // 6. Selected-country crisp outline — on top of the glow
    map.addLayer(
      {
        id: "heat-selected-outline",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "ISO_A3"], ""],
        paint: {
          "line-color": MapTokens.selected.color,
          "line-width": zoomWidth(MapTokens.selected.widths),
          "line-blur":  MapTokens.selected.blur,
        },
      },
      beforeId
    );

    return () => {
      try {
        if (map.getLayer("heat-selected-outline")) map.removeLayer("heat-selected-outline");
        if (map.getLayer("heat-selected-glow"))    map.removeLayer("heat-selected-glow");
        if (map.getLayer("heat-watched-outline"))  map.removeLayer("heat-watched-outline");
        if (map.getLayer("heat-hover-outline"))    map.removeLayer("heat-hover-outline");
        if (map.getLayer("heat-outline"))          map.removeLayer("heat-outline");
        if (map.getLayer("heat-fill"))             map.removeLayer("heat-fill");
        if (map.getSource("countries"))            map.removeSource("countries");
      } catch {
        // Map style already torn down (HMR or parent unmount)
      }
    };
  }, [map]);

  // ── Push fresh GeoJSON whenever scores change ────────────────────────────────
  useEffect(() => {
    if (!geoJson) return;
    const source = map.getSource("countries") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(geoJson);
  }, [map, geoJson]);

  // ── Sync watchlist filter ────────────────────────────────────────────────────
  useEffect(() => {
    if (!map.getLayer("heat-watched-outline")) return;
    map.setFilter("heat-watched-outline", ["in", ["get", "ISO_A3"], ["literal", watchedIsos]]);
  }, [map, watchedIsos]);

  // ── Sync selected-country filters (glow + crisp outline share the same filter)
  useEffect(() => {
    const filter: mapboxgl.Expression = ["==", ["get", "ISO_A3"], selectedIso ?? ""];
    if (map.getLayer("heat-selected-glow"))    map.setFilter("heat-selected-glow",    filter);
    if (map.getLayer("heat-selected-outline")) map.setFilter("heat-selected-outline", filter);
  }, [map, selectedIso]);

  // ── Dim fill while a filter-change re-fetch is in flight ─────────────────────
  useEffect(() => {
    if (!map.getLayer("heat-fill")) return;
    map.setPaintProperty(
      "heat-fill",
      "fill-opacity",
      isLoading
        ? MapTokens.fill.opacityLoading
        : ["interpolate", ["linear"], ["zoom"],
            0, MapTokens.fill.opacityGlobe,
            5, MapTokens.fill.opacityClose,
          ]
    );
  }, [map, isLoading]);

  return null;
}
