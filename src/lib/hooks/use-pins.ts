import { useEffect, useState } from "react";
import type { FeatureCollection, Point } from "geojson";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";

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

    fetch(`/api/pins?window=${filters.timeWindow}${catParam}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PinsGeoJson | null) => {
        if (active && data) setPinsGeoJson(data);
      })
      .catch(() => {/* keep existing */});

    return () => { active = false; };
  }, [filters.timeWindow, filters.categories]);

  return { pinsGeoJson };
}
