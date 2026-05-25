"use client";

import { useEffect, useRef } from "react";
import type mapboxgl from "mapbox-gl";
import { MapTokens, HEAT_RAMP, zoomWidth } from "@/lib/design-tokens";
import type { ScoresMap } from "@/lib/hooks/use-scores";

interface HeatLayerProps {
  map: mapboxgl.Map;
  scores: ScoresMap | null;
  isLoading: boolean;
  selectedIso?: string | null;
  watchedIsos?: string[];
}

// ─── Source: Mapbox's own country boundaries vector tileset ──────────────────
// Same data source the basemap renders from → fill aligns perfectly with the
// borders shown by the basemap. promoteId surfaces ISO_A3 as the feature ID
// so we can target countries directly with setFeatureState.
const SOURCE_ID    = "country-boundaries";
const SOURCE_LAYER = "country_boundaries";

// Polygons only (the source also contains LineString features for disputes),
// limited to the global undisputed + US worldview interpretation.
const POLYGON_FILTER: mapboxgl.Expression = [
  "all",
  ["==", ["geometry-type"], "Polygon"],
  ["any",
    ["==", "all", ["get", "worldview"]],
    ["in", "US", ["get", "worldview"]],
  ],
];

// ─── Fill colour (driven by feature-state.score) ─────────────────────────────
const FILL_COLOR_EXPR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["feature-state", "score"], 0], 0],
  MapTokens.fill.noData,
  [
    "interpolate", ["linear"], ["feature-state", "score"],
    ...HEAT_RAMP.flatMap(([s, c]) => [s, c] as [number, string]),
  ],
];

// ─── Adaptive border colour ──────────────────────────────────────────────────
const BORDER_COLOR_EXPR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["feature-state", "score"], 0], 0],
  MapTokens.border.noData,
  MapTokens.border.scored,
];

const ALL_LAYER_IDS = [
  "heat-selected-outline",
  "heat-selected-glow",
  "heat-watched-outline",
  "heat-hover-outline",
  "heat-outline",
  "heat-fill",
];

export default function HeatLayer({
  map, scores, isLoading, selectedIso, watchedIsos = [],
}: HeatLayerProps) {
  // Keep latest scores accessible from inside the sourcedata handler closure
  const scoresRef = useRef<ScoresMap | null>(null);
  scoresRef.current = scores;

  // ── Add source + all layers once on mount ───────────────────────────────────
  useEffect(() => {
    if (map.getSource(SOURCE_ID)) return; // StrictMode / HMR guard

    map.addSource(SOURCE_ID, {
      type: "vector",
      url: "mapbox://mapbox.country-boundaries-v1",
      promoteId: { [SOURCE_LAYER]: "iso_3166_1_alpha_3" },
    });

    const beforeId = map.getLayer("country-label") ? "country-label" : undefined;

    // 1. Fill
    map.addLayer({
      id: "heat-fill",
      type: "fill",
      source: SOURCE_ID,
      "source-layer": SOURCE_LAYER,
      filter: POLYGON_FILTER,
      paint: {
        "fill-color":   FILL_COLOR_EXPR,
        "fill-opacity": ["interpolate", ["linear"], ["zoom"],
          0, MapTokens.fill.opacityGlobe,
          5, MapTokens.fill.opacityClose,
        ],
      },
    }, beforeId);

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
    }, beforeId);

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
    }, beforeId);

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
    }, beforeId);

    // 5. Selected glow (translucent halo)
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
    }, beforeId);

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
    }, beforeId);

    // ── Apply feature states whenever the vector tiles arrive ─────────────────
    // setFeatureState only works once a tile is loaded for the feature, so we
    // listen on `sourcedata` and re-apply whenever the source finishes loading.
    const applyAllStates = () => {
      const cur = scoresRef.current;
      if (!cur) return;
      // Clear stale states so countries removed from the new scores reset to no-data
      map.removeFeatureState({ source: SOURCE_ID, sourceLayer: SOURCE_LAYER });
      for (const [iso, val] of Object.entries(cur)) {
        map.setFeatureState(
          { source: SOURCE_ID, sourceLayer: SOURCE_LAYER, id: iso },
          { score: val.score },
        );
      }
    };

    const onSourceData = (e: mapboxgl.MapSourceDataEvent) => {
      if (e.sourceId === SOURCE_ID && e.isSourceLoaded) {
        applyAllStates();
      }
    };
    map.on("sourcedata", onSourceData);

    return () => {
      map.off("sourcedata", onSourceData);
      try {
        for (const id of ALL_LAYER_IDS) {
          if (map.getLayer(id)) map.removeLayer(id);
        }
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
      } catch { /* map already torn down (HMR) */ }
    };
  }, [map]);

  // ── Re-apply feature states whenever scores change ──────────────────────────
  useEffect(() => {
    if (!scores || !map.getSource(SOURCE_ID)) return;
    if (!map.isSourceLoaded(SOURCE_ID)) return; // sourcedata handler will catch it
    map.removeFeatureState({ source: SOURCE_ID, sourceLayer: SOURCE_LAYER });
    for (const [iso, val] of Object.entries(scores)) {
      map.setFeatureState(
        { source: SOURCE_ID, sourceLayer: SOURCE_LAYER, id: iso },
        { score: val.score },
      );
    }
  }, [map, scores]);

  // ── Sync watchlist filter ───────────────────────────────────────────────────
  useEffect(() => {
    if (!map.getLayer("heat-watched-outline")) return;
    map.setFilter("heat-watched-outline",
      ["all", POLYGON_FILTER, ["in", ["get", "iso_3166_1_alpha_3"], ["literal", watchedIsos]]],
    );
  }, [map, watchedIsos]);

  // ── Sync selected-country filter (glow + crisp outline) ────────────────────
  useEffect(() => {
    const iso = selectedIso ?? "";
    const filter: mapboxgl.Expression = ["all", POLYGON_FILTER, ["==", ["get", "iso_3166_1_alpha_3"], iso]];
    if (map.getLayer("heat-selected-glow"))    map.setFilter("heat-selected-glow",    filter);
    if (map.getLayer("heat-selected-outline")) map.setFilter("heat-selected-outline", filter);
  }, [map, selectedIso]);

  // ── Dim fill while a filter-change re-fetch is in flight ────────────────────
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
          ],
    );
  }, [map, isLoading]);

  return null;
}
