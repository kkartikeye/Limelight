"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import HeatLayer from "./heat-layer";
import PinLayer from "./pin-layer";
import Tooltip from "./tooltip";
import MapLoader from "@/components/ui/map-loader";
import ViewToggle from "@/components/ui/view-toggle";
import { useMapStore } from "@/lib/stores/map-store";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { useScores } from "@/lib/hooks/use-scores";
import { usePins } from "@/lib/hooks/use-pins";
import type { TopCategory } from "@/lib/types/scores";
import type { Projection } from "@/lib/stores/map-store";

const INITIAL_VIEW_STATE = {
  longitude: 10,
  latitude: 20,
  zoom: 1.5,
};

// ─── Daylight globe fog — paper-globe metaphor ─────────────────────────────
const FOG_DAYLIGHT: Parameters<mapboxgl.Map["setFog"]>[0] = {
  color:            "#fbf6e9",
  "high-color":     "#fad9b3",
  "space-color":    "#efeadf",
  "horizon-blend":  0.08,
  "star-intensity": 0,
};

// Flat view: minimal fog so sky doesn't show
const FOG_FLAT: Parameters<mapboxgl.Map["setFog"]>[0] = {
  color:            "#f6f3ec",
  "high-color":     "#f6f3ec",
  "space-color":    "#f6f3ec",
  "horizon-blend":  0.0,
  "star-intensity": 0,
};

interface HoverInfo {
  name: string;
  score: number;
  articleCount: number;
  topCategory: TopCategory | null;
  x: number;
  y: number;
}

interface CountryFeatureProps {
  iso_3166_1_alpha_3?: string;
  name_en?: string;
}

interface MapViewProps {
  /** Called when user clicks a country (for parent layout to open its story panel) */
  onSelectCountry?: (iso: string, name: string, score: number) => void;
}

export default function MapView({ onSelectCountry }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const { scores, isLoading } = useScores();
  const { pinsGeoJson } = usePins();

  const scoresRef = useRef(scores);
  scoresRef.current = scores;

  const {
    selectedCountry, selectCountry, clearSelection,
    projection, setProjection,
  } = useMapStore();
  const { watched } = useWatchlistStore();
  const watchedIsos = useMemo(() => watched.map((w) => w.iso), [watched]);

  // ── Read projection preference from localStorage on mount ──────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem("limelight:projection") as Projection | null;
      if (saved === "globe" || saved === "naturalEarth") setProjection(saved);
    } catch { /* SSR / storage unavailable */ }
  }, [setProjection]);

  // ── Sync projection to Mapbox + localStorage when it changes ───────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    map.setProjection({ name: projection } as any);
    map.setFog(projection === "globe" ? FOG_DAYLIGHT : FOG_FLAT);
    try { localStorage.setItem("limelight:projection", projection); } catch { /* ok */ }
  }, [projection, mapLoaded]);

  const handleProjectionChange = (p: Projection) => setProjection(p);

  // ── Initialise Mapbox ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      // Daylight basemap: paper-cream background
      style: "mapbox://styles/mapbox/light-v11",
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom:   INITIAL_VIEW_STATE.zoom,
      scrollZoom: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      setMapLoaded(true);
      setContainerWidth(containerRef.current?.offsetWidth ?? 0);

      // Globe projection + Daylight fog
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setProjection({ name: "globe" } as any);
      map.setFog(FOG_DAYLIGHT);

      // Read saved projection preference immediately
      try {
        const saved = localStorage.getItem("limelight:projection") as Projection | null;
        if (saved === "naturalEarth") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          map.setProjection({ name: "naturalEarth" } as any);
          map.setFog(FOG_FLAT);
        }
      } catch { /* ok */ }

      // ── Hover ────────────────────────────────────────────────────────────
      map.on("mousemove", "heat-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as CountryFeatureProps | null;
        const iso  = props?.iso_3166_1_alpha_3 ?? "";
        const name = props?.name_en ?? "Unknown";

        map.getCanvas().style.cursor = "pointer";
        if (map.getLayer("heat-hover-outline")) {
          map.setFilter("heat-hover-outline", [
            "all",
            ["==", ["geometry-type"], "Polygon"],
            ["any", ["==", "all", ["get", "worldview"]], ["in", "US", ["get", "worldview"]]],
            ["==", ["get", "iso_3166_1_alpha_3"], iso],
          ]);
        }

        const entry = scoresRef.current?.[iso];
        setHoverInfo({
          name,
          score:        entry?.score        ?? 0,
          articleCount: entry?.articleCount ?? 0,
          topCategory:  entry?.topCategory  ?? null,
          x: e.point.x,
          y: e.point.y,
        });
      });

      map.on("mouseleave", "heat-fill", () => {
        map.getCanvas().style.cursor = "";
        if (map.getLayer("heat-hover-outline")) {
          map.setFilter("heat-hover-outline", [
            "all",
            ["==", ["geometry-type"], "Polygon"],
            ["any", ["==", "all", ["get", "worldview"]], ["in", "US", ["get", "worldview"]]],
            ["==", ["get", "iso_3166_1_alpha_3"], ""],
          ]);
        }
        setHoverInfo(null);
      });

      // ── Click ────────────────────────────────────────────────────────────
      map.on("click", "heat-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as CountryFeatureProps | null;
        const iso   = props?.iso_3166_1_alpha_3 ?? "";
        const name  = props?.name_en ?? "Unknown";
        const score = scoresRef.current?.[iso]?.score ?? 0;

        selectCountry(iso, name, score);
        onSelectCountry?.(iso, name, score);
        setHoverInfo(null);
        map.scrollZoom.enable();
      });

      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["heat-fill"] });
        if (!features.length) {
          clearSelection();
        }
      });
    });

    map.on("click", () => map.scrollZoom.enable());

    const handleDocumentClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        map.scrollZoom.disable();
      }
    };
    document.addEventListener("click", handleDocumentClick);

    const resizeObserver = new ResizeObserver(() => {
      map.resize();
      setContainerWidth(containerRef.current?.offsetWidth ?? 0);
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("click", handleDocumentClick);
      map.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative h-full w-full">
      {!mapLoaded && <MapLoader />}

      {/* Mapbox canvas */}
      <div ref={containerRef} className="h-full w-full" />

      {/* Mapbox layers */}
      {mapLoaded && mapRef.current && (
        <>
          <HeatLayer
            map={mapRef.current}
            scores={scores}
            isLoading={isLoading}
            selectedIso={selectedCountry}
            watchedIsos={watchedIsos}
          />
          <PinLayer map={mapRef.current} pinsGeoJson={pinsGeoJson} />
        </>
      )}

      {/* Hover tooltip */}
      {hoverInfo && (
        <Tooltip
          name={hoverInfo.name}
          score={hoverInfo.score}
          articleCount={hoverInfo.articleCount}
          topCategory={hoverInfo.topCategory}
          x={hoverInfo.x}
          y={hoverInfo.y}
          containerWidth={containerWidth}
        />
      )}

      {/* View toggle — top-right of map */}
      {mapLoaded && (
        <div className="absolute top-3 right-3 z-10">
          <ViewToggle value={projection} onChange={handleProjectionChange} />
        </div>
      )}
    </div>
  );
}
