"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import HeatLayer from "./heat-layer";
import Tooltip from "./tooltip";

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.8,
};

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

      // Hover: show tooltip when cursor is over a heat-fill feature
      map.on("mousemove", "heat-fill", (e) => {
        if (!e.features?.length) return;
        const feat = e.features[0];
        const props = feat.properties as {
          ADMIN?: string;
          score?: number;
          articleCount?: number;
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
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {mapLoaded && mapRef.current && <HeatLayer map={mapRef.current} />}
      {hoverInfo && (
        <Tooltip
          name={hoverInfo.name}
          score={hoverInfo.score}
          articleCount={hoverInfo.articleCount}
          x={hoverInfo.x}
          y={hoverInfo.y}
          containerWidth={containerWidth}
        />
      )}
    </div>
  );
}
