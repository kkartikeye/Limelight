"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import HeatLayer from "./heat-layer";
import Tooltip from "./tooltip";
import StoryPanel from "@/components/panel/story-panel";
import { useMapStore } from "@/lib/stores/map-store";
import FilterBar from "@/components/filters/filter-bar";
import StarToggle from "@/components/ui/star-toggle";
import MapLoader from "@/components/ui/map-loader";

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

// Label layers in Mapbox dark-v11 that need contrast treatment
const LABEL_LAYERS = [
  "country-label",
  "state-label",
  "settlement-label",
  "settlement-subdivision-label",
  "natural-point-label",
  "water-point-label",
];

interface HoverInfo {
  name: string;
  score: number;
  articleCount: number;
  x: number;
  y: number;
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<HoverInfo | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const {
    isPanelOpen, selectedCountry, selectedCountryName, selectedCountryScore,
    selectCountry, clearSelection, showStars, toggleStars,
  } = useMapStore();

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

      // Globe is the only projection — no Mercator toggle
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.setProjection({ name: "globe" } as any);
      map.setFog(FOG_STARS_ON);

      // Improve label contrast over heat-colored countries
      LABEL_LAYERS.filter((id) => map.getLayer(id)).forEach((id) => {
        map.setPaintProperty(id, "text-color", "#ffffff");
        map.setPaintProperty(id, "text-halo-color", "rgba(0, 0, 0, 0.95)");
        map.setPaintProperty(id, "text-halo-width", 2);
        map.setPaintProperty(id, "text-halo-blur", 0.5);
      });

      map.on("mousemove", "heat-fill", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties as {
          ADMIN?: string; score?: number; articleCount?: number;
        } | null;
        map.getCanvas().style.cursor = "pointer";
        setHoverInfo({
          name: props?.ADMIN ?? "Unknown",
          score: props?.score ?? 0,
          articleCount: props?.articleCount ?? 0,
          x: e.point.x,
          y: e.point.y,
        });
      });

      map.on("mouseleave", "heat-fill", () => {
        map.getCanvas().style.cursor = "";
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
      {mapLoaded && mapRef.current && <HeatLayer map={mapRef.current} />}
      {hoverInfo && !isPanelOpen && (
        <Tooltip
          name={hoverInfo.name}
          score={hoverInfo.score}
          articleCount={hoverInfo.articleCount}
          x={hoverInfo.x}
          y={hoverInfo.y}
          containerWidth={containerWidth}
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
      {mapLoaded && <FilterBar />}
      {mapLoaded && <StarToggle onToggle={handleStarToggle} />}
    </div>
  );
}
