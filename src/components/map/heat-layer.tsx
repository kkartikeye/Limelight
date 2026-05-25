"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";

interface HeatLayerProps {
  map: mapboxgl.Map;
  geoJson: FeatureCollection<Geometry> | null;
  isLoading: boolean;
  selectedIso?: string | null;
  watchedIsos?: string[];
}

// ─── Fill color ───────────────────────────────────────────────────────────────
// Score 0 (no data) → nearly invisible so the globe reads as dark/uncolored.
// Score 1–100 → YlOrRd ColorBrewer ramp: cream → deep crimson.
const FILL_COLOR_EXPR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["get", "score"], 0], 0],
  "rgba(255,255,255,0.04)",
  [
    "interpolate", ["linear"], ["get", "score"],
    1,   "#ffffcc",
    12,  "#ffeda0",
    25,  "#fed976",
    37,  "#feb24c",
    50,  "#fd8d3c",
    62,  "#fc4e2a",
    75,  "#e31a1c",
    87,  "#bd0026",
    100, "#800026",
  ],
];

// ─── Border ───────────────────────────────────────────────────────────────────
const OUTLINE_COLOR = "rgba(255,255,255,0.22)";
const OUTLINE_WIDTH_EXPR: mapboxgl.Expression = [
  "interpolate", ["linear"], ["zoom"],
  1, 0.4,
  3, 0.7,
  5, 1.1,
  8, 1.6,
];

export default function HeatLayer({ map, geoJson, isLoading, selectedIso, watchedIsos = [] }: HeatLayerProps) {
  // Add source + all layers once on mount
  useEffect(() => {
    map.addSource("countries", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // Insert fill + outlines below basemap country labels
    const beforeId = map.getLayer("country-label") ? "country-label" : undefined;

    map.addLayer(
      {
        id: "heat-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": FILL_COLOR_EXPR,
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.85, 5, 0.72],
        },
      },
      beforeId
    );

    // Permanent border outline
    map.addLayer(
      {
        id: "heat-outline",
        type: "line",
        source: "countries",
        paint: {
          "line-color": OUTLINE_COLOR,
          "line-width": OUTLINE_WIDTH_EXPR,
        },
      },
      beforeId
    );

    // Hover-highlight outline — invisible until a country is hovered
    map.addLayer(
      {
        id: "heat-hover-outline",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "ISO_A3"], ""],
        paint: {
          "line-color": "rgba(255,255,255,0.6)",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            1, 1.0,
            3, 1.5,
            5, 2.0,
            8, 2.5,
          ],
          "line-blur": 0.3,
        },
      },
      beforeId
    );

    // Watchlist outline — amber glow for bookmarked countries
    map.addLayer(
      {
        id: "heat-watched-outline",
        type: "line",
        source: "countries",
        filter: ["in", ["get", "ISO_A3"], ["literal", []]],
        paint: {
          "line-color": "rgba(251,191,36,0.8)",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            1, 1.2,
            3, 1.8,
            5, 2.4,
            8, 3.0,
          ],
          "line-blur": 0.4,
        },
      },
      beforeId
    );

    // Selected-country outline — persists while the panel is open
    map.addLayer(
      {
        id: "heat-selected-outline",
        type: "line",
        source: "countries",
        filter: ["==", ["get", "ISO_A3"], ""],
        paint: {
          "line-color": "rgba(255,255,255,0.95)",
          "line-width": [
            "interpolate", ["linear"], ["zoom"],
            1, 1.6,
            3, 2.2,
            5, 3.0,
            8, 3.8,
          ],
          "line-blur": 0.5,
        },
      },
      beforeId
    );

    return () => {
      try {
        if (map.getLayer("heat-selected-outline")) map.removeLayer("heat-selected-outline");
        if (map.getLayer("heat-watched-outline"))  map.removeLayer("heat-watched-outline");
        if (map.getLayer("heat-hover-outline"))    map.removeLayer("heat-hover-outline");
        if (map.getLayer("heat-outline"))       map.removeLayer("heat-outline");
        if (map.getLayer("heat-fill"))          map.removeLayer("heat-fill");
        if (map.getSource("countries"))         map.removeSource("countries");
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

  // Keep watched-country outline in sync with the watchlist
  useEffect(() => {
    if (!map.getLayer("heat-watched-outline")) return;
    map.setFilter(
      "heat-watched-outline",
      ["in", ["get", "ISO_A3"], ["literal", watchedIsos]],
    );
  }, [map, watchedIsos]);

  // Keep selected-country outline in sync with the active panel selection
  useEffect(() => {
    if (!map.getLayer("heat-selected-outline")) return;
    map.setFilter(
      "heat-selected-outline",
      ["==", ["get", "ISO_A3"], selectedIso ?? ""],
    );
  }, [map, selectedIso]);

  // Dim fill while a filter-change re-fetch is in flight
  useEffect(() => {
    if (!map.getLayer("heat-fill")) return;
    map.setPaintProperty(
      "heat-fill",
      "fill-opacity",
      isLoading
        ? 0.3
        : ["interpolate", ["linear"], ["zoom"], 0, 0.85, 5, 0.72]
    );
  }, [map, isLoading]);

  return null;
}
