"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import HeatLayer from "./heat-layer";
import PinLayer from "./pin-layer";
import CityHeatLayer from "./city-heat-layer";
import ArcLayer from "./arc-layer";
import Tooltip from "./tooltip";
import MapLoader from "@/components/ui/map-loader";
import { ThemePill } from "@/components/ui/theme-toggle";
import { useMapStore } from "@/lib/stores/map-store";
import { useThemeStore } from "@/lib/stores/theme-store";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { useScores } from "@/lib/hooks/use-scores";
import { usePins } from "@/lib/hooks/use-pins";
import { useCityScores } from "@/lib/hooks/use-city-scores";
import { useArcs } from "@/lib/hooks/use-arcs";
import { DL } from "@/lib/design-tokens";
import type { TopCategory } from "@/lib/types/scores";

// ─── Daylight globe fog — paper-globe metaphor ─────────────────────────────
const FOG_DAYLIGHT: Parameters<mapboxgl.Map["setFog"]>[0] = {
  color:            "#fbf6e9",
  "high-color":     "#fad9b3",
  "space-color":    "#efeadf",
  "horizon-blend":  0.08,
  "star-intensity": 0,
};

// ─── Midnight globe fog — paper globe in dark space ─────────────────────────
const FOG_MIDNIGHT: Parameters<mapboxgl.Map["setFog"]>[0] = {
  color:            "#2a2620",
  "high-color":     "#3a3022",
  "space-color":    "#100e0a",
  "horizon-blend":  0.06,
  "star-intensity": 0.25,
};

const HINT_KEY = "ll:scroll-hint-seen";

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

  // ── Scroll-zoom discovery hint ─────────────────────────────────────────────
  // Show once on first hover; dismissed permanently after any click on the map.
  const [showScrollHint, setShowScrollHint] = useState(false);
  const hintDismissed = useRef(
    typeof window !== "undefined" && localStorage.getItem(HINT_KEY) === "1"
  );

  const dismissHint = () => {
    setShowScrollHint(false);
    hintDismissed.current = true;
    try { localStorage.setItem(HINT_KEY, "1"); } catch { /* ignore */ }
  };

  const { scores, isLoading } = useScores();
  const { pinsGeoJson } = usePins();
  const { cityGeoJson } = useCityScores();
  const { arcsGeoJson } = useArcs();

  const scoresRef = useRef(scores);
  scoresRef.current = scores;

  const { selectedCountry, selectCountry } = useMapStore();
  const { theme } = useThemeStore();
  const dark = theme === "midnight";
  const { watched } = useWatchlistStore();
  const watchedIsos = useMemo(() => watched.map((w) => w.iso), [watched]);

  // ── Initialise Mapbox ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    // Restore the camera position the user left the globe at (in-memory, per session)
    const { viewState: saved, setViewState } = useMapStore.getState();
    const isDark = useThemeStore.getState().theme === "midnight";

    const map = new mapboxgl.Map({
      container: containerRef.current,
      // Daylight: paper-cream basemap. Midnight: dark basemap.
      // MapView remounts on theme change (key={theme} in page.tsx), so the
      // style is fixed for the lifetime of this map instance.
      style: isDark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/light-v11",
      center: [saved.longitude, saved.latitude],
      zoom:   saved.zoom,
      scrollZoom: false,
    });

    mapRef.current = map;

    // Persist camera position so returning to "/" restores the last view
    map.on("moveend", () => {
      const c = map.getCenter();
      setViewState({ longitude: c.lng, latitude: c.lat, zoom: map.getZoom() });
    });

    map.on("load", () => {
      setMapLoaded(true);
      setContainerWidth(containerRef.current?.offsetWidth ?? 0);

      // Globe projection (permanent) + theme fog
      map.setProjection({ name: "globe" });
      map.setFog(isDark ? FOG_MIDNIGHT : FOG_DAYLIGHT);

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

        // Show scroll-zoom hint on first hover (if not yet dismissed)
        if (!hintDismissed.current) {
          setShowScrollHint(true);
        }
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
        dismissHint();
      });

      // Ocean click intentionally does NOT call clearSelection() —
      // clearing only happens via the × button or Escape key in StoryPanel.
      // We still enable scroll-zoom on any click so users can explore.
    });

    map.on("click", () => {
      map.scrollZoom.enable();
      dismissHint();
    });

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
            dark={dark}
          />
          {/* Arc layer sits between heat fill and city circles */}
          <ArcLayer map={mapRef.current} arcsGeoJson={arcsGeoJson} />
          {/* City heat circles + admin-1 subdivision outlines */}
          <CityHeatLayer map={mapRef.current} cityGeoJson={cityGeoJson} />
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

      {/* Scroll-zoom discovery hint — shown once on first hover, dismissed on click */}
      {showScrollHint && (
        <div
          className="desktop-only"
          style={{
            position: "absolute",
            bottom: 72, // sits above the filter bar
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
            zIndex: 20,
            animation: "tooltip-fade-in 0.25s ease-out both",
          }}
        >
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            background: "rgba(24,22,19,0.82)",
            backdropFilter: "blur(8px)",
            color: "#f6f3ec",
            borderRadius: 999,
            padding: "7px 14px",
            fontFamily: DL.SANS,
            fontSize: 12,
            fontWeight: 500,
            letterSpacing: 0.01,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 16px rgba(24,22,19,0.18)",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z"/>
              <path d="M8 16a6 6 0 0 0 8 0"/>
              <line x1="12" y1="22" x2="12" y2="19"/>
            </svg>
            Click the map to enable scroll zoom
          </div>
        </div>
      )}

      {/* Day/Night switch — top-right of the map (legend sits right-mid) */}
      <div
        className="desktop-only"
        style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
      >
        <ThemePill />
      </div>
    </div>
  );
}
