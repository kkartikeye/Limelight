"use client";

import { useEffect } from "react";
import mapboxgl from "mapbox-gl";
import type { ArcsGeoJson } from "@/lib/hooks/use-arcs";

// Category → coral-toned arc colour
const CATEGORY_COLOR: Record<string, string> = {
  Conflict:      "rgba(201,62,42,0.55)",
  Humanitarian:  "rgba(230,106,79,0.50)",
  Politics:      "rgba(180,90,60,0.45)",
  Economics:     "rgba(160,110,70,0.40)",
  Technology:    "rgba(140,120,80,0.38)",
  Environment:   "rgba(120,130,80,0.38)",
  Sports:        "rgba(160,130,90,0.35)",
  Entertainment: "rgba(160,130,90,0.35)",
};

const DEFAULT_ARC_COLOR = "rgba(180,100,70,0.40)";

const ARC_LAYER_IDS = ["arc-lines", "arc-glow"];

interface ArcLayerProps {
  map: mapboxgl.Map;
  arcsGeoJson: ArcsGeoJson | null;
}

export default function ArcLayer({ map, arcsGeoJson }: ArcLayerProps) {
  // ── Mount: add arc layers ────────────────────────────────────────────────────
  useEffect(() => {
    if (map.getSource("arcs")) return;

    map.addSource("arcs", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // Glow pass (wider, more translucent) — rendered below the crisp line
    map.addLayer({
      id: "arc-glow",
      type: "line",
      source: "arcs",
      minzoom: 2,
      paint: {
        "line-color":   DEFAULT_ARC_COLOR,
        "line-width":   ["interpolate", ["linear"], ["zoom"], 2, 2, 5, 4],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0, 3, 0.45],
        "line-blur":    3,
      },
    });

    // Crisp line pass
    map.addLayer({
      id: "arc-lines",
      type: "line",
      source: "arcs",
      minzoom: 2,
      paint: {
        "line-color": [
          "match", ["get", "category"],
          ...Object.entries(CATEGORY_COLOR).flatMap(([k, v]) => [k, v]),
          DEFAULT_ARC_COLOR,
        ],
        "line-width":   ["interpolate", ["linear"], ["zoom"], 2, 0.6, 5, 1.2],
        "line-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0, 3, 0.7],
        "line-dasharray": [4, 3],
      },
    });

    return () => {
      try {
        for (const id of ARC_LAYER_IDS) {
          if (map.getLayer(id)) map.removeLayer(id);
        }
        if (map.getSource("arcs")) map.removeSource("arcs");
      } catch { /* map already torn down */ }
    };
  }, [map]);

  // ── Push fresh arc data whenever it changes ──────────────────────────────────
  useEffect(() => {
    if (!arcsGeoJson) return;
    const source = map.getSource("arcs") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(arcsGeoJson);
  }, [map, arcsGeoJson]);

  return null;
}
