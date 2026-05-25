"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";

interface HeatLayerProps {
  map: mapboxgl.Map;
  geoJson: FeatureCollection<Geometry> | null;
  isLoading: boolean;
}

// ─── Heat fill: YlOrRd ColorBrewer ───────────────────────────────────────────
const FILL_COLOR_EXPR: mapboxgl.Expression = [
  "interpolate", ["linear"], ["coalesce", ["get", "score"], 0],
  0,   "#ffffcc",
  12,  "#ffeda0",
  25,  "#fed976",
  37,  "#feb24c",
  50,  "#fd8d3c",
  62,  "#fc4e2a",
  75,  "#e31a1c",
  87,  "#bd0026",
  100, "#800026",
];

// ─── Adaptive label ink (Approach B from the legibility study) ────────────────
// The effective on-screen palette runs much darker than raw YlOrRd because
// fill-opacity 0.8 blends over the dark-v11 basemap (~#0c0c12).
// Crossover at score 55: below → light fill, dark ink; above → dark fill, warm ink.
//
// score = 0 (no data) → warm parchment on dark basemap  (#f0e0c8 + dark halo)
// score 1–54           → near-black ink + cream halo    (#1a140a + cream halo)
// score 55+            → warm-white ink + dark halo     (#fff3df + dark halo)
const LABEL_TEXT_COLOR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["get", "score"], 0], 0], "#f0e0c8",
  ["<",  ["get", "score"], 55],                 "#1a140a",
  "#fff3df",
];

const LABEL_HALO_COLOR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["get", "score"], 0], 0], "rgba(0,0,0,0.92)",
  ["<",  ["get", "score"], 55],                 "rgba(240,224,200,0.75)",
  "rgba(0,0,0,0.92)",
];

export default function HeatLayer({ map, geoJson, isLoading }: HeatLayerProps) {
  // Add source + all layers once on mount; hot-swap data in a sibling effect
  useEffect(() => {
    map.addSource("countries", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // Insert fill + outline below country labels
    const beforeId = map.getLayer("country-label") ? "country-label" : undefined;

    map.addLayer(
      {
        id: "heat-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": FILL_COLOR_EXPR,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.85, 5, 0.7],
        },
      },
      beforeId
    );

    map.addLayer(
      {
        id: "heat-outline",
        type: "line",
        source: "countries",
        paint: {
          "line-color": "rgba(255,255,255,0.15)",
          "line-width": 0.5,
        },
      },
      beforeId
    );

    // Custom country label layer — score-adaptive ink, drawn on top of everything
    // Replaces the basemap's country-label (hidden in map-view.tsx on load).
    // symbol-sort-key surfaces high-score countries first when labels collide.
    map.addLayer({
      id: "country-label-custom",
      type: "symbol",
      source: "countries",
      layout: {
        "text-field": ["get", "ADMIN"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": [
          "interpolate", ["linear"], ["zoom"],
          2, 11,
          4, 13,
          6, 15,
        ],
        "text-letter-spacing": 0.02,
        "text-max-width": 7,
        // High-score countries win label collisions
        "symbol-sort-key": ["-", 100, ["coalesce", ["get", "score"], 0]],
      },
      paint: {
        "text-color": LABEL_TEXT_COLOR,
        "text-halo-color": LABEL_HALO_COLOR,
        "text-halo-width": 1.6,
        "text-halo-blur": 0.3,
      },
    });

    return () => {
      try {
        if (map.getLayer("country-label-custom")) map.removeLayer("country-label-custom");
        if (map.getLayer("heat-outline")) map.removeLayer("heat-outline");
        if (map.getLayer("heat-fill")) map.removeLayer("heat-fill");
        if (map.getSource("countries")) map.removeSource("countries");
        // Restore basemap country-label on unmount (HMR / dev cleanup)
        if (map.getLayer("country-label")) {
          map.setLayoutProperty("country-label", "visibility", "visible");
        }
      } catch {
        // Map style already torn down (HMR or parent unmount)
      }
    };
  }, [map]);

  // Push fresh GeoJSON whenever scores change
  useEffect(() => {
    if (!geoJson) return;
    const source = map.getSource("countries") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(geoJson);
  }, [map, geoJson]);

  // Dim fill while a filter-change re-fetch is in flight
  useEffect(() => {
    if (!map.getLayer("heat-fill")) return;
    map.setPaintProperty(
      "heat-fill",
      "fill-opacity",
      isLoading
        ? 0.35
        : ["interpolate", ["linear"], ["zoom"], 0, 0.85, 5, 0.7]
    );
  }, [map, isLoading]);

  return null;
}
