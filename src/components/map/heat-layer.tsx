"use client";

import { useEffect } from "react";
import type mapboxgl from "mapbox-gl";
import type { FeatureCollection, Geometry } from "geojson";

interface HeatLayerProps {
  map: mapboxgl.Map;
  geoJson: FeatureCollection<Geometry> | null;
  isLoading: boolean;
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

export default function HeatLayer({ map, geoJson, isLoading }: HeatLayerProps) {
  // Add source + layers once with empty data; keep for the map's lifetime
  useEffect(() => {
    map.addSource("countries", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

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

    return () => {
      try {
        if (map.getLayer("heat-outline")) map.removeLayer("heat-outline");
        if (map.getLayer("heat-fill")) map.removeLayer("heat-fill");
        if (map.getSource("countries")) map.removeSource("countries");
      } catch {
        // Map style already torn down (HMR or parent unmount)
      }
    };
  }, [map]);

  // Push new score data whenever it changes
  useEffect(() => {
    if (!geoJson) return;
    const source = map.getSource("countries") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(geoJson);
  }, [map, geoJson]);

  // Dim the fill while a filter-change re-fetch is in flight
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
