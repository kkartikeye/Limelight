import { useEffect, useState } from "react";
import type { FeatureCollection, Point } from "geojson";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";

// Match the heatmap refresh cadence so pins stay in sync with the live layer
const REFRESH_INTERVAL_S = 90;

export interface PinProperties {
  id: string;
  title: string;
  url: string;
  published_at: string;
  category: string;
  country_code: string;
  city_name: string | null;
}

export type PinsGeoJson = FeatureCollection<Point, PinProperties>;

export interface PinsResult {
  pinsGeoJson: PinsGeoJson | null;
}

export function usePins(): PinsResult {
  const [pinsGeoJson, setPinsGeoJson] = useState<PinsGeoJson | null>(null);
  const { filters } = useMapStore();

  useEffect(() => {
    if (filters.categories.length === 0) {
      setPinsGeoJson({ type: "FeatureCollection", features: [] });
      return;
    }

    let active = true;

    const catParam =
      filters.categories.length < ALL_CATEGORIES.length
        ? `&categories=${filters.categories.join(",")}`
        : "";

    async function doFetch() {
      if (!active) return;
      try {
        const res = await fetch(
          `/api/pins?window=${filters.timeWindow}${catParam}&_=${Date.now()}`
        );
        if (!res.ok || !active) return;
        const data = (await res.json()) as PinsGeoJson;
        if (active) setPinsGeoJson(data);
      } catch {
        // Network error — keep existing pins
      }
    }

    doFetch();

    // Auto-refresh on the same cadence as useScores; skip when tab is hidden
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") doFetch();
    }, REFRESH_INTERVAL_S * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [filters.timeWindow, filters.categories]);

  return { pinsGeoJson };
}
