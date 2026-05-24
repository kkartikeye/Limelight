"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [0, 20],
      zoom: 1.8,
      scrollZoom: false,
    });

    mapRef.current = map;

    // Re-enable scroll zoom when the user clicks into the map
    const handleMapClick = () => map.scrollZoom.enable();

    // Disable scroll zoom when the user clicks outside the map container
    const handleDocumentClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        map.scrollZoom.disable();
      }
    };

    map.on("click", handleMapClick);
    document.addEventListener("click", handleDocumentClick);

    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      document.removeEventListener("click", handleDocumentClick);
      map.remove();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
