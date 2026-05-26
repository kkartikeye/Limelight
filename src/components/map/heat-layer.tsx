"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { MapTokens, zoomWidth } from "@/lib/design-tokens";
import type { ScoresMap } from "@/lib/hooks/use-scores";

interface HeatLayerProps {
  map: mapboxgl.Map;
  scores: ScoresMap | null;
  isLoading: boolean;
  selectedIso?: string | null;
  watchedIsos?: string[];
}

const SOURCE_ID    = "country-boundaries";
const SOURCE_LAYER = "country_boundaries";

const POLYGON_FILTER: mapboxgl.Expression = [
  "all",
  ["==", ["geometry-type"], "Polygon"],
  ["any",
    ["==", "all", ["get", "worldview"]],
    ["in", "US", ["get", "worldview"]],
  ],
];

// ─── Daylight fill: step ladder, cream → peach → coral ───────────────────────
const FILL_COLOR_EXPR: mapboxgl.Expression = [
  "step",
  ["coalesce", ["feature-state", "score"], 0],
  "#e8e2d0",         // 0     → warm gray (no data)
  0.001, "#fbe6cd",  // >0    → palest cream
  5,     "#fad9b3",  // 5+    → sand
  20,    "#f6bc8a",  // 20+   → warm peach
  40,    "#f0936b",  // 40+   → apricot
  60,    "#e26a4f",  // 60+   → terracotta
  80,    "#c93e2a",  // 80+   → deep coral
];

// ─── Adaptive border ──────────────────────────────────────────────────────────
const BORDER_COLOR_EXPR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["feature-state", "score"], 0], 0],
  MapTokens.border.noData,
  MapTokens.border.scored,
];

// ─── Adaptive label colours (dark ink on light fills, light cream on dark) ───
const LABEL_TEXT_COLOR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["feature-state", "score"], 0], 0], "#3a2a1a",
  ["<",  ["coalesce", ["feature-state", "score"], 0], 55], "#1a140a",
  "#fffaef",
];

const LABEL_HALO_COLOR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["feature-state", "score"], 0], 0], "rgba(246,243,236,0.90)",
  ["<",  ["coalesce", ["feature-state", "score"], 0], 55], "rgba(255,255,255,0.75)",
  "rgba(26,14,8,0.95)",
];

const ALL_LAYER_IDS = [
  "heat-selected-outline",
  "heat-selected-glow",
  "heat-watched-outline",
  "heat-hover-outline",
  "heat-outline",
  "heat-fill",
  "heat-pulse-halo",
  "heat-pulse-dot",
  "heat-country-label",
];

export default function HeatLayer({
  map, scores, isLoading, selectedIso, watchedIsos = [],
}: HeatLayerProps) {
  const scoresRef = useRef<ScoresMap | null>(null);
  scoresRef.current = scores;

  // ── Add source + all layers once on mount ──────────────────────────────────
  useEffect(() => {
    if (map.getSource(SOURCE_ID)) return;

    map.addSource(SOURCE_ID, {
      type: "vector",
      url: "mapbox://mapbox.country-boundaries-v1",
      promoteId: { [SOURCE_LAYER]: "iso_3166_1_alpha_3" },
    });

    const beforeLabel = map.getLayer("country-label") ? "country-label" : undefined;

    // 1. Fill
    map.addLayer({
      id: "heat-fill",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: POLYGON_FILTER,
      paint: {
        "fill-color":   FILL_COLOR_EXPR,
        "fill-opacity": MapTokens.fill.opacityGlobe,
      },
    }, beforeLabel);

    // 2. Permanent adaptive border
    map.addLayer({
      id: "heat-outline",
      type: "line",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: POLYGON_FILTER,
      paint: {
        "line-color": BORDER_COLOR_EXPR,
        "line-width": zoomWidth(MapTokens.border.widths),
      },
    }, beforeLabel);

    // 3. Hover highlight
    map.addLayer({
      id: "heat-hover-outline",
      type: "line",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: ["all", POLYGON_FILTER, ["==", ["get", "iso_3166_1_alpha_3"], ""]],
      paint: {
        "line-color": MapTokens.hover.color,
        "line-width": zoomWidth(MapTokens.hover.widths),
        "line-blur":  MapTokens.hover.blur,
      },
    }, beforeLabel);

    // 4. Watchlist outline
    map.addLayer({
      id: "heat-watched-outline",
      type: "line",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: ["all", POLYGON_FILTER, ["in", ["get", "iso_3166_1_alpha_3"], ["literal", []]]],
      paint: {
        "line-color": MapTokens.watched.color,
        "line-width": zoomWidth(MapTokens.watched.widths),
        "line-blur":  MapTokens.watched.blur,
      },
    }, beforeLabel);

    // 5. Selected glow (halo)
    map.addLayer({
      id: "heat-selected-glow",
      type: "line",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: ["all", POLYGON_FILTER, ["==", ["get", "iso_3166_1_alpha_3"], ""]],
      paint: {
        "line-color": MapTokens.selectedGlow.color,
        "line-width": zoomWidth(MapTokens.selectedGlow.widths),
        "line-blur":  MapTokens.selectedGlow.blur,
      },
    }, beforeLabel);

    // 6. Selected crisp edge
    map.addLayer({
      id: "heat-selected-outline",
      type: "line",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: ["all", POLYGON_FILTER, ["==", ["get", "iso_3166_1_alpha_3"], ""]],
      paint: {
        "line-color": MapTokens.selected.color,
        "line-width": zoomWidth(MapTokens.selected.widths),
        "line-blur":  MapTokens.selected.blur,
      },
    }, beforeLabel);

    // 7. Pulse halo — countries with score ≥ 70
    map.addLayer({
      id: "heat-pulse-halo",
      type: "circle",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: ["all", POLYGON_FILTER, [">=", ["coalesce", ["feature-state", "score"], 0], 70]],
      paint: {
        "circle-radius":       8,
        "circle-color":        "rgba(224,87,60,0)",
        "circle-stroke-color": "rgba(224,87,60,0.30)",
        "circle-stroke-width": 5,
        "circle-blur":         0.5,
      },
    });

    // 8. Pulse solid dot
    map.addLayer({
      id: "heat-pulse-dot",
      type: "circle",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: ["all", POLYGON_FILTER, [">=", ["coalesce", ["feature-state", "score"], 0], 70]],
      paint: {
        "circle-radius":       3,
        "circle-color":        "#e0573c",
        "circle-stroke-color": "#fff8ee",
        "circle-stroke-width": 1.2,
      },
    });

    // 9. Custom country labels with adaptive feature-state colours
    //    Uses DIN Offc Pro Medium (built into Mapbox's font service).
    map.addLayer({
      id: "heat-country-label",
      type: "symbol",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: POLYGON_FILTER,
      layout: {
        "text-field":          ["get", "name_en"],
        "text-font":           ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
        "text-size":           ["interpolate", ["linear"], ["zoom"], 1, 8, 3, 10, 5, 12, 7, 13],
        "text-letter-spacing": 0.04,
        "text-max-width":      7,
        "text-padding":        2,
        "text-anchor":         "center",
        "text-allow-overlap":  false,
        "symbol-sort-key":     ["-", 100, ["coalesce", ["feature-state", "score"], 0]],
      },
      paint: {
        "text-color":      LABEL_TEXT_COLOR,
        "text-halo-color": LABEL_HALO_COLOR,
        "text-halo-width": 1.4,
        "text-halo-blur":  0.3,
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 1, 0, 2.5, 1],
      },
    });

    // Suppress basemap country labels to avoid duplication
    if (map.getLayer("country-label")) {
      map.setLayoutProperty("country-label", "visibility", "none");
    }

    // Apply feature-states whenever tiles arrive
    const applyAllStates = () => {
      const cur = scoresRef.current;
      if (!cur) return;
      map.removeFeatureState({ source: SOURCE_ID, sourceLayer: SOURCE_LAYER });
      for (const [iso, val] of Object.entries(cur)) {
        map.setFeatureState(
          { source: SOURCE_ID, sourceLayer: SOURCE_LAYER, id: iso },
          { score: val.score },
        );
      }
    };

    const onSourceData = (e: mapboxgl.MapSourceDataEvent) => {
      if (e.sourceId === SOURCE_ID && e.isSourceLoaded) applyAllStates();
    };
    map.on("sourcedata", onSourceData);

    return () => {
      map.off("sourcedata", onSourceData);
      try {
        for (const id of ALL_LAYER_IDS) {
          if (map.getLayer(id)) map.removeLayer(id);
        }
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
        if (map.getLayer("country-label")) {
          map.setLayoutProperty("country-label", "visibility", "visible");
        }
      } catch { /* map torn down (HMR) */ }
    };
  }, [map]);

  // ── Re-apply feature states when scores change ────────────────────────────
  useEffect(() => {
    if (!scores || !map.getSource(SOURCE_ID)) return;
    if (!map.isSourceLoaded(SOURCE_ID)) return;
    map.removeFeatureState({ source: SOURCE_ID, sourceLayer: SOURCE_LAYER });
    for (const [iso, val] of Object.entries(scores)) {
      map.setFeatureState(
        { source: SOURCE_ID, sourceLayer: SOURCE_LAYER, id: iso },
        { score: val.score },
      );
    }
  }, [map, scores]);

  // ── Sync watchlist filter ─────────────────────────────────────────────────
  useEffect(() => {
    if (!map.getLayer("heat-watched-outline")) return;
    map.setFilter("heat-watched-outline",
      ["all", POLYGON_FILTER, ["in", ["get", "iso_3166_1_alpha_3"], ["literal", watchedIsos]]],
    );
  }, [map, watchedIsos]);

  // ── Sync selected-country filter ──────────────────────────────────────────
  useEffect(() => {
    const iso = selectedIso ?? "";
    const filter: mapboxgl.Expression = ["all", POLYGON_FILTER, ["==", ["get", "iso_3166_1_alpha_3"], iso]];
    if (map.getLayer("heat-selected-glow"))    map.setFilter("heat-selected-glow",    filter);
    if (map.getLayer("heat-selected-outline")) map.setFilter("heat-selected-outline", filter);
  }, [map, selectedIso]);

  // ── Dim fill while loading ────────────────────────────────────────────────
  useEffect(() => {
    if (!map.getLayer("heat-fill")) return;
    map.setPaintProperty(
      "heat-fill", "fill-opacity",
      isLoading ? MapTokens.fill.opacityLoading : MapTokens.fill.opacityGlobe,
    );
  }, [map, isLoading]);

  return null;
}
