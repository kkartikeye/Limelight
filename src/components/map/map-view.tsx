"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import HeatLayer from "./heat-layer";
import PinLayer from "./pin-layer";
import Tooltip from "./tooltip";
import StoryPanel from "@/components/panel/story-panel";
import { useMapStore } from "@/lib/stores/map-store";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import FilterBar from "@/components/filters/filter-bar";
import StarToggle from "@/components/ui/star-toggle";
import WatchlistWidget from "@/components/ui/watchlist-widget";
import MapLoader from "@/components/ui/map-loader";
import { useScores } from "@/lib/hooks/use-scores";
import { usePins } from "@/lib/hooks/use-pins";
import type { TopCategory } from "@/lib/types/scores";

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.8,
};

const PANEL_WIDTH = 380;

const FOG_STARS_ON: Parameters<mapboxgl.Map["setFog"]>[0] = {
  color: "rgb(12, 12, 18)",
  "high-color": "#00001a",
  "space-color": "#000010",
  "horizon-blend": 0.06,
  "star-intensity": 0.75,
};

const FOG_STARS_OFF: Parameters<mapboxgl.Map["setFog"]>[0] = {
  color: "rgb(12, 12, 18)",
  "high-color": "#00001a",
  "space-color": "#0a0a1a",
  "horizon-blend": 0.06,
  "star-intensity": 0,
};

// Per-layer label styles — tuned to the dark globe + YlOrRd palette.
// "country-label" uses Approach C: strong opaque halo over any fill color so
// the basemap's MultiPolygon-aware centroid placement avoids duplicate labels.
const LABEL_STYLES: Record<string, { color: string; haloColor: string; haloWidth: number }> = {
  // Country names — warm parchment on opaque black halo; readable on any fill.
  "country-label": {
    color: "#f0e8d8",
    haloColor: "rgba(0,0,0,0.95)",
    haloWidth: 2.8,
  },
  // Continent names — quiet chrome, visually demoted.
  "continent-label": {
    color: "#4e5565",
    haloColor: "rgba(0,0,0,0.7)",
    haloWidth: 1,
  },
  // State / province names — secondary to country
  "state-label": {
    color: "#c8b89c",
    haloColor: "rgba(0,0,0,0.88)",
    haloWidth: 2,
  },
  // Settlement hierarchy
  "settlement-label": {
    color: "#aaaaB4",
    haloColor: "rgba(0,0,0,0.85)",
    haloWidth: 1.5,
  },
  "settlement-subdivision-label": {
    color: "#909098",
    haloColor: "rgba(0,0,0,0.80)",
    haloWidth: 1.5,
  },
  // Physical geography
  "natural-point-label": {
    color: "#9caa96",
    haloColor: "rgba(0,0,0,0.82)",
    haloWidth: 1.5,
  },
  // Water: steel-blue tint, minimal halo
  "water-point-label": {
    color: "#8aaac0",
    haloColor: "rgba(0,0,0,0.5)",
    haloWidth: 1,
  },
};

interface HoverInfo {
  name: string;
  score: number;
  articleCount: number;
  topCategory: TopCategory | null;
  x: number;
  y: number;
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  // Lift scores state here so both HeatLayer and FilterBar can share it
  const { geoJson, isLoading, lastUpdated, nextRefreshIn, isAutoRefreshing } = useScores();
  const { pinsGeoJson } = usePins();

  const {
    isPanelOpen, selectedCountry, selectedCountryName, selectedCountryScore,
    selectCountry, clearSelection, showStars, toggleStars,
  } = useMapStore();
  const { watched: watchedIsos } = useWatchlistStore();

  const closePanel = () => {
    clearSelection();
    mapRef.current?.easeTo({ padding: { right: 0 }, duration: 250 });
  };

  const handleStarToggle = () => {
    const map = mapRef.current;
    if (!map) return;
    toggleStars();
    map.setFog(showStars ? FOG_STARS_OFF : FOG_STARS_ON);
  };

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [INITIAL_VIEW_STATE.longitude, INITIAL_VIEW_STATE.latitude],
      zoom: INITIAL_VIEW_STATE.zoom,
      scrollZoom: false,
    });

    mapRef.current = map;

    map.on("load", () => {
      setMapLoaded(true);
      setContainerWidth(containerRef.current?.offsetWidth ?? 0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setProjection({ name: "globe" } as any);
      map.setFog(FOG_STARS_ON);

      Object.entries(LABEL_STYLES).forEach(([id, style]) => {
        if (!map.getLayer(id)) return;
        map.setPaintProperty(id, "text-color", style.color);
        map.setPaintProperty(id, "text-halo-color", style.haloColor);
        map.setPaintProperty(id, "text-halo-width", style.haloWidth);
      });

      map.on("mousemove", "heat-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as {
          ADMIN?: string;
          ISO_A3?: string;
          score?: number;
          articleCount?: number;
          topCategory?: string;
        } | null;
        map.getCanvas().style.cursor = "pointer";
        // Highlight the hovered country's border
        if (map.getLayer("heat-hover-outline")) {
          map.setFilter("heat-hover-outline", [
            "==", ["get", "ISO_A3"], props?.ISO_A3 ?? "",
          ]);
        }
        setHoverInfo({
          name: props?.ADMIN ?? "Unknown",
          score: props?.score ?? 0,
          articleCount: props?.articleCount ?? 0,
          topCategory: (props?.topCategory as TopCategory) ?? null,
          x: e.point.x,
          y: e.point.y,
        });
      });

      map.on("mouseleave", "heat-fill", () => {
        map.getCanvas().style.cursor = "";
        // Clear hover highlight
        if (map.getLayer("heat-hover-outline")) {
          map.setFilter("heat-hover-outline", ["==", ["get", "ISO_A3"], ""]);
        }
        setHoverInfo(null);
      });

      map.on("click", "heat-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as {
          ISO_A3?: string; ADMIN?: string; score?: number;
        } | null;
        selectCountry(props?.ISO_A3 ?? "", props?.ADMIN ?? "Unknown", props?.score ?? 0);
        setHoverInfo(null);
        map.easeTo({ padding: { right: PANEL_WIDTH }, duration: 250 });
        map.scrollZoom.enable();
      });

      map.on("click", (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ["heat-fill"] });
        if (!features.length) {
          clearSelection();
          map.easeTo({ padding: { right: 0 }, duration: 250 });
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
      <div ref={containerRef} className="h-full w-full" />
      {mapLoaded && mapRef.current && (
        <>
          <HeatLayer
            map={mapRef.current}
            geoJson={geoJson}
            isLoading={isLoading}
            selectedIso={selectedCountry}
            watchedIsos={watchedIsos}
          />
          <PinLayer map={mapRef.current} pinsGeoJson={pinsGeoJson} />
        </>
      )}
      {hoverInfo && (
        <Tooltip
          name={hoverInfo.name}
          score={hoverInfo.score}
          articleCount={hoverInfo.articleCount}
          topCategory={hoverInfo.topCategory}
          x={hoverInfo.x}
          y={hoverInfo.y}
          containerWidth={containerWidth - (isPanelOpen ? PANEL_WIDTH : 0)}
        />
      )}
      {isPanelOpen && selectedCountry && (
        <StoryPanel
          countryCode={selectedCountry}
          countryName={selectedCountryName}
          score={selectedCountryScore}
          onClose={closePanel}
        />
      )}
      {mapLoaded && (
        <FilterBar
          isLoading={isLoading}
          lastUpdated={lastUpdated}
          nextRefreshIn={nextRefreshIn}
          isAutoRefreshing={isAutoRefreshing}
        />
      )}
      {mapLoaded && <StarToggle onToggle={handleStarToggle} />}
      {mapLoaded && (
        <WatchlistWidget
          geoJson={geoJson}
          onSelectCountry={(iso, name, score) => {
            selectCountry(iso, name, score);
            mapRef.current?.easeTo({ padding: { right: PANEL_WIDTH }, duration: 250 });
            mapRef.current?.scrollZoom.enable();
          }}
        />
      )}
    </div>
  );
}
