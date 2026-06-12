"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import type { CityScoreGeoJson, CityScoreProperties } from "@/lib/hooks/use-city-scores";
// ─── Daylight coral ramp (score 0–100) ───────────────────────────────────────
const CITY_FILL_COLOR: mapboxgl.Expression = [
  "step", ["get", "score"],
  "#fbe6cd",
  10, "#fad9b3",
  25, "#f6bc8a",
  40, "#f0936b",
  60, "#e26a4f",
  80, "#c93e2a",
];

// Circle radius scales with sqrt(count) for perceptual uniformity
const CITY_RADIUS: mapboxgl.Expression = [
  "interpolate", ["linear"],
  ["sqrt", ["get", "count"]],
  1,  5,
  2,  7,
  4,  10,
  7,  13,
  10, 16,
];

const LAYER_IDS = ["admin-1-subdivisions", "city-heat-circles", "city-heat-labels"];

interface CityHeatLayerProps {
  map: mapboxgl.Map;
  cityGeoJson: CityScoreGeoJson | null;
  /** Midnight theme — basemap is dark-v11, so flip border/stroke/label colors */
  dark?: boolean;
}

export default function CityHeatLayer({ map, cityGeoJson, dark = false }: CityHeatLayerProps) {
  const router = useRouter();
  const routerRef = useRef(router);
  routerRef.current = router;
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // ── Mount: add admin-1 subdivisions + city heat layers ──────────────────────
  useEffect(() => {
    if (map.getSource("city-heat")) return;

    // ── Admin-1 subdivision outlines (uses built-in composite tileset) ────────
    // The light-v11 composite source includes mapbox-streets-v8 which has an
    // `admin` source layer with admin_level=0 (country) and =1 (state/province).
    try {
      if (map.getSource("composite")) {
        map.addLayer({
          id: "admin-1-subdivisions",
          type: "line",
          source: "composite",
          "source-layer": "admin",
          minzoom: 3,
          filter: [
            "all",
            ["==", ["get", "admin_level"], 1],
            ["!=", ["get", "maritime"], 1],
          ],
          paint: {
            "line-color": dark ? "rgba(241,236,224,0.13)" : "rgba(24,22,19,0.13)",
            "line-width": [
              "interpolate", ["linear"], ["zoom"],
              3, 0.4,
              6, 0.8,
              9, 1.2,
            ],
            "line-opacity": [
              "interpolate", ["linear"], ["zoom"],
              3, 0,
              4.5, 0.5,
              7, 0.75,
            ],
            "line-dasharray": [3, 2],
          },
        });
      }
    } catch {
      // composite source or admin layer unavailable in this style — skip silently
    }

    // ── City heat GeoJSON source ──────────────────────────────────────────────
    map.addSource("city-heat", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // ── City heat circles ─────────────────────────────────────────────────────
    map.addLayer({
      id: "city-heat-circles",
      type: "circle",
      source: "city-heat",
      minzoom: 3.5,
      paint: {
        "circle-color":          CITY_FILL_COLOR,
        "circle-radius":         CITY_RADIUS,
        "circle-opacity":        ["interpolate", ["linear"], ["zoom"], 3.5, 0, 4.5, 0.82],
        "circle-stroke-width":   1.5,
        "circle-stroke-color":   dark ? "rgba(22,20,15,0.88)" : "rgba(246,243,236,0.88)",
        "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 3.5, 0, 4.5, 1],
        "circle-blur":           0.1,
      },
    });

    // ── City name labels (visible at higher zoom) ─────────────────────────────
    map.addLayer({
      id: "city-heat-labels",
      type: "symbol",
      source: "city-heat",
      minzoom: 5.5,
      layout: {
        "text-field":          ["get", "city"],
        "text-font":           ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
        "text-size":           ["interpolate", ["linear"], ["zoom"], 5.5, 9, 8, 12],
        "text-anchor":         "top",
        "text-offset":         [0, 0.6],
        "text-allow-overlap":  false,
        "symbol-sort-key":     ["-", 100, ["get", "score"]],
      },
      paint: {
        "text-color":      dark ? "#e8e2d4" : "#181613",
        "text-halo-color": dark ? "rgba(22,20,15,0.92)" : "rgba(246,243,236,0.92)",
        "text-halo-width": 1.2,
        "text-opacity":    ["interpolate", ["linear"], ["zoom"], 5.5, 0, 6.5, 1],
      },
    });

    // ── Hover: show popup ─────────────────────────────────────────────────────
    const onCircleEnter = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      map.getCanvas().style.cursor = "pointer";

      const props  = e.features[0].properties as CityScoreProperties;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

      popupRef.current?.remove();
      popupRef.current = new mapboxgl.Popup({
        closeButton: false,
        maxWidth: "220px",
        className: "limelight-popup",
        offset: 8,
      })
        .setLngLat(coords)
        .setHTML(`
          <div style="font-family:'Manrope','IBM Plex Sans',system-ui,sans-serif;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="
                background:var(--dl-coral-50);color:var(--dl-coral);border:1px solid var(--dl-coral-bd);
                font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;
                padding:2px 7px;border-radius:99px;letter-spacing:0.06em;text-transform:uppercase;
              ">${props.topCategory}</span>
            </div>
            <p style="margin:0 0 4px;font-size:14px;font-weight:700;line-height:1.2;color:var(--dl-ink);">
              ${props.city}
            </p>
            <p style="margin:0;font-size:11px;color:var(--dl-dim);font-family:'IBM Plex Mono',monospace;">
              ${props.count} article${props.count !== 1 ? "s" : ""} · intensity ${props.score}
            </p>
          </div>
        `)
        .addTo(map);
    };

    const onCircleLeave = () => {
      map.getCanvas().style.cursor = "";
      popupRef.current?.remove();
      popupRef.current = null;
    };

    // ── Click: navigate to region detail page ─────────────────────────────────
    const onCircleClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties as CityScoreProperties;
      routerRef.current.push(
        `/region/${encodeURIComponent(props.city)}?country=${props.country}&score=${props.score}`
      );
    };

    map.on("mouseenter", "city-heat-circles", onCircleEnter);
    map.on("mouseleave", "city-heat-circles", onCircleLeave);
    map.on("click",      "city-heat-circles", onCircleClick);

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      map.off("mouseenter", "city-heat-circles", onCircleEnter);
      map.off("mouseleave", "city-heat-circles", onCircleLeave);
      map.off("click",      "city-heat-circles", onCircleClick);
      try {
        for (const id of LAYER_IDS) {
          if (map.getLayer(id)) map.removeLayer(id);
        }
        if (map.getSource("city-heat")) map.removeSource("city-heat");
      } catch { /* map already torn down */ }
    };
    // `dark` is stable per map instance — MapView remounts on theme change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, dark]);

  // ── Push fresh city data whenever it changes ─────────────────────────────────
  useEffect(() => {
    if (!cityGeoJson) return;
    const source = map.getSource("city-heat") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(cityGeoJson);
  }, [map, cityGeoJson]);

  return null;
}
