"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { PinsGeoJson, PinProperties } from "@/lib/hooks/use-pins";
import { DL } from "@/lib/design-tokens";

// ─── Daylight coral ramp for clusters ─────────────────────────────────────────
const CLUSTER_COLOR: mapboxgl.Expression = [
  "step", ["get", "point_count"],
  "#f0936b",   // apricot   (< 5)
  5,  "#e26a4f",   // terracotta (5–14)
  15, "#c93e2a",   // deep coral (15+)
];

const CLUSTER_RADIUS: mapboxgl.Expression = [
  "step", ["get", "point_count"],
  14,
  5, 18,
  15, 22,
];

interface PinLayerProps {
  map: mapboxgl.Map;
  pinsGeoJson: PinsGeoJson | null;
}

export default function PinLayer({ map, pinsGeoJson }: PinLayerProps) {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Add source + cluster layers once on mount
  useEffect(() => {
    if (map.getSource("pins")) return;

    map.addSource("pins", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 9,
      clusterRadius: 45,
    });

    // ── Cluster circles — coral ramp ──────────────────────────────────────────
    map.addLayer({
      id: "pin-clusters",
      type: "circle",
      source: "pins",
      filter: ["has", "point_count"],
      paint: {
        "circle-color":          CLUSTER_COLOR,
        "circle-radius":         CLUSTER_RADIUS,
        "circle-opacity":        ["interpolate", ["linear"], ["zoom"], 2, 0, 3.5, 0.88],
        "circle-stroke-width":   2,
        "circle-stroke-color":   "rgba(246,243,236,0.90)",   // cream — fits paper basemap
        "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0, 3.5, 1],
      },
    });

    // ── Cluster count label ───────────────────────────────────────────────────
    map.addLayer({
      id: "pin-cluster-count",
      type: "symbol",
      source: "pins",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font":  ["DIN Offc Pro Medium", "Arial Unicode MS Regular"],
        "text-size":  11,
      },
      paint: {
        "text-color":   "#fff8ee",   // warm cream — readable on coral clusters
        "text-opacity": ["interpolate", ["linear"], ["zoom"], 2, 0, 3.5, 1],
      },
    });

    // ── Individual pin dots — single coral accent ─────────────────────────────
    map.addLayer({
      id: "pin-points",
      type: "circle",
      source: "pins",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color":          DL.CORAL,            // single accent — no per-category palette
        "circle-radius":         ["interpolate", ["linear"], ["zoom"], 6, 4.5, 10, 7],
        "circle-opacity":        ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 0.88],
        "circle-stroke-width":   1.5,
        "circle-stroke-color":   "#f6f3ec",           // paper cream stroke — visible on dark areas
        "circle-stroke-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 6, 1],
      },
    });

    // ── Cluster click → zoom in ───────────────────────────────────────────────
    const onClusterClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ["pin-clusters"] });
      if (!features.length) return;
      const clusterId = features[0].properties?.cluster_id as number;
      (map.getSource("pins") as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
        clusterId,
        (err, zoom) => {
          if (err || zoom == null) return;
          map.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
          });
        }
      );
    };

    // ── Individual pin click → Daylight article popup ─────────────────────────
    const onPinClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const props  = e.features[0].properties as PinProperties;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

      popupRef.current?.remove();

      const location  = props.city_name ?? props.country_code;
      const published = new Date(props.published_at).toLocaleDateString(undefined, {
        month: "short", day: "numeric",
      });

      // ── Popup HTML — Daylight tokens, Manrope + IBM Plex Mono ──────────────
      // The .limelight-popup CSS class in globals.css handles the card chrome
      // (background, border, border-radius, shadow). We only style the content.
      popupRef.current = new mapboxgl.Popup({
        closeButton: true,
        maxWidth: "290px",
        className: "limelight-popup",
        offset: 10,
      })
        .setLngLat(coords)
        .setHTML(`
          <div style="font-family:'Manrope','IBM Plex Sans',system-ui,sans-serif;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:9px;">
              <span style="
                background:#fff0ea;color:#e0573c;border:1px solid #fac7b8;
                font-family:'IBM Plex Mono',monospace;
                font-size:9px;font-weight:700;
                padding:2px 7px;border-radius:99px;letter-spacing:0.06em;
                text-transform:uppercase;
              ">${props.category}</span>
              <span style="
                color:#7a7568;font-size:10px;
                font-family:'IBM Plex Mono',monospace;
                letter-spacing:0.04em;
              ">${location} · ${published}</span>
            </div>
            <p style="
              margin:0 0 11px;font-size:13px;font-weight:500;
              line-height:1.40;color:#181613;
            ">${props.title}</p>
            <a href="${props.url}" target="_blank" rel="noopener noreferrer"
              style="
                display:inline-flex;align-items:center;gap:4px;
                font-size:11px;color:#e0573c;
                text-decoration:none;font-weight:600;
                letter-spacing:0.01em;
              ">
              Read at source
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                <line x1="2" y1="7" x2="12" y2="7"/>
                <polyline points="9,4 12,7 9,10"/>
              </svg>
            </a>
          </div>
        `)
        .addTo(map);
    };

    const onClusterEnter = () => { map.getCanvas().style.cursor = "pointer"; };
    const onClusterLeave = () => { map.getCanvas().style.cursor = ""; };
    const onPinEnter     = () => { map.getCanvas().style.cursor = "pointer"; };
    const onPinLeave     = () => { map.getCanvas().style.cursor = ""; };

    map.on("click",      "pin-clusters", onClusterClick);
    map.on("click",      "pin-points",   onPinClick);
    map.on("mouseenter", "pin-clusters", onClusterEnter);
    map.on("mouseleave", "pin-clusters", onClusterLeave);
    map.on("mouseenter", "pin-points",   onPinEnter);
    map.on("mouseleave", "pin-points",   onPinLeave);

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;

      map.off("click",      "pin-clusters", onClusterClick);
      map.off("click",      "pin-points",   onPinClick);
      map.off("mouseenter", "pin-clusters", onClusterEnter);
      map.off("mouseleave", "pin-clusters", onClusterLeave);
      map.off("mouseenter", "pin-points",   onPinEnter);
      map.off("mouseleave", "pin-points",   onPinLeave);

      try {
        if (map.getLayer("pin-points"))        map.removeLayer("pin-points");
        if (map.getLayer("pin-cluster-count")) map.removeLayer("pin-cluster-count");
        if (map.getLayer("pin-clusters"))      map.removeLayer("pin-clusters");
        if (map.getSource("pins"))             map.removeSource("pins");
      } catch { /* map already torn down */ }
    };
  }, [map]);

  // Push fresh pin data whenever it changes
  useEffect(() => {
    if (!pinsGeoJson) return;
    const source = map.getSource("pins") as mapboxgl.GeoJSONSource | undefined;
    source?.setData(pinsGeoJson);
  }, [map, pinsGeoJson]);

  return null;
}
