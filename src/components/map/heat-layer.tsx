"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import { useScores } from "@/lib/hooks/use-scores";

interface HeatLayerProps {
  map: mapboxgl.Map;
}

// YlOrRd ColorBrewer stops — matches d3 interpolateYlOrRd breakpoints
const FILL_COLOR_EXPR: mapboxgl.Expression = [
  "interpolate",
  ["linear"],
  ["coalesce", ["get", "score"], 0],
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

export default function HeatLayer({ map }: HeatLayerProps) {
  const geoJson = useScores();

  // Add source + layers once with empty data; keep them for the lifetime of the map
  useEffect(() => {
    map.addSource("countries", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // Insert fill below country labels so text stays readable
    const beforeId = map.getLayer("country-label") ? "country-label" : undefined;

    map.addLayer(
      {
        id: "heat-fill",
        type: "fill",
        source: "countries",
        paint: {
          "fill-color": FILL_COLOR_EXPR,
          "fill-opacity": 0.8,
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

    return () => {
      try {
        if (map.getLayer("heat-outline")) map.removeLayer("heat-outline");
        if (map.getLayer("heat-fill")) map.removeLayer("heat-fill");
        if (map.getSource("countries")) map.removeSource("countries");
      } catch {
        // Map style already torn down (e.g. during HMR or parent unmount)
      }
    };
  }, [map]);

  // Push score data as soon as it's ready; no-op if source was already removed
  useEffect(() => {
    if (!geoJson) return;
    const source = map.getSource("countries") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(geoJson);
  }, [map, geoJson]);

  return null;
}
