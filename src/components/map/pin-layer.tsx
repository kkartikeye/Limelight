"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { PinsGeoJson, PinProperties } from "@/lib/hooks/use-pins";

interface PinLayerProps {
  map: mapboxgl.Map;
  pinsGeoJson: PinsGeoJson | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  Conflict:      "#f87171",
  Humanitarian:  "#fb923c",
  Politics:      "#60a5fa",
  Economics:     "#34d399",
  Technology:    "#a78bfa",
  Environment:   "#2dd4bf",
  Sports:        "#fbbf24",
  Entertainment: "#f472b6",
};

export default function PinLayer({ map, pinsGeoJson }: PinLayerProps) {
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Add source + cluster layers once on mount
  useEffect(() => {
    // Guard: already set up (React StrictMode double-invoke or HMR)
    if (map.getSource("pins")) return;

    map.addSource("pins", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
      cluster: true,
      clusterMaxZoom: 9,
      clusterRadius: 45,
    });

    // Cluster circles
    map.addLayer({
      id: "pin-clusters",
      type: "circle",
      source: "pins",
      filter: ["has", "point_count"],
      paint: {
        "circle-color": [
          "step", ["get", "point_count"],
          "#f97316", 5,
          "#ef4444", 15,
          "#dc2626",
        ],
        "circle-radius": [
          "step", ["get", "point_count"],
          14, 5,
          18, 15,
          22,
        ],
        "circle-opacity": [
          "interpolate", ["linear"], ["zoom"],
          2, 0,
          3.5, 0.85,
        ],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "rgba(255,255,255,0.25)",
      },
    });

    // Cluster count label
    map.addLayer({
      id: "pin-cluster-count",
      type: "symbol",
      source: "pins",
      filter: ["has", "point_count"],
      layout: {
        "text-field": ["get", "point_count_abbreviated"],
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": 11,
      },
      paint: {
        "text-color": "#fff",
        "text-opacity": [
          "interpolate", ["linear"], ["zoom"],
          2, 0,
          3.5, 1,
        ],
      },
    });

    // Individual pin dots (visible at zoom ≥ 6)
    map.addLayer({
      id: "pin-points",
      type: "circle",
      source: "pins",
      filter: ["!", ["has", "point_count"]],
      paint: {
        "circle-color": [
          "match", ["get", "category"],
          "Conflict",      "#f87171",
          "Humanitarian",  "#fb923c",
          "Politics",      "#60a5fa",
          "Economics",     "#34d399",
          "Technology",    "#a78bfa",
          "Environment",   "#2dd4bf",
          "Sports",        "#fbbf24",
          "Entertainment", "#f472b6",
          "#9ca3af",
        ],
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          6, 4,
          10, 7,
        ],
        "circle-opacity": [
          "interpolate", ["linear"], ["zoom"],
          5, 0,
          6, 0.9,
        ],
        "circle-stroke-width": 1.5,
        "circle-stroke-color": "rgba(0,0,0,0.5)",
      },
    });

    // Cluster click → zoom in
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

    // Individual pin click → article popover
    const onPinClick = (e: mapboxgl.MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
      if (!e.features?.length) return;
      const props = e.features[0].properties as PinProperties;
      const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

      popupRef.current?.remove();

      const color = CATEGORY_COLORS[props.category] ?? "#9ca3af";
      const location = props.city_name ?? props.country_code;
      const published = new Date(props.published_at).toLocaleDateString(undefined, {
        month: "short", day: "numeric",
      });

      popupRef.current = new mapboxgl.Popup({ closeButton: true, maxWidth: "280px" })
        .setLngLat(coords)
        .setHTML(`
          <div style="font-family:system-ui,sans-serif;padding:4px 2px;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
              <span style="background:${color};color:#000;font-size:10px;font-weight:600;padding:2px 7px;border-radius:99px;">${props.category}</span>
              <span style="color:#6b7280;font-size:10px;">${location} · ${published}</span>
            </div>
            <p style="margin:0 0 8px;font-size:13px;font-weight:500;line-height:1.4;color:#f3f4f6;">${props.title}</p>
            <a href="${props.url}" target="_blank" rel="noopener noreferrer"
              style="font-size:11px;color:#60a5fa;text-decoration:none;">Read article →</a>
          </div>
        `)
        .addTo(map);
    };

    const onClusterEnter  = () => { map.getCanvas().style.cursor = "pointer"; };
    const onClusterLeave  = () => { map.getCanvas().style.cursor = ""; };
    const onPinEnter      = () => { map.getCanvas().style.cursor = "pointer"; };
    const onPinLeave      = () => { map.getCanvas().style.cursor = ""; };

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
