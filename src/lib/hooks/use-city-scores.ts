import { useMemo } from "react";
import useSWR from "swr";
import type { FeatureCollection, Point } from "geojson";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";

const REFRESH_INTERVAL_MS = 90_000;

export interface CityScoreProperties {
  city: string;
  country: string;
  count: number;
  score: number;       // 0–100
  topCategory: string;
}

export type CityScoreGeoJson = FeatureCollection<Point, CityScoreProperties>;

interface ApiCity {
  city: string;
  country: string;
  lat: number;
  lng: number;
  count: number;
  score: number;
  topCategory: string;
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<{ cities: ApiCity[] }>;
  });

export function useCityScores(): { cityGeoJson: CityScoreGeoJson | null } {
  const { filters } = useMapStore();

  const catParam =
    filters.categories.length < ALL_CATEGORIES.length
      ? `&categories=${filters.categories.join(",")}`
      : "";

  const key =
    filters.categories.length > 0
      ? `/api/city-scores?window=${filters.timeWindow}${catParam}`
      : null;

  const { data } = useSWR(key, fetcher, {
    refreshInterval: REFRESH_INTERVAL_MS,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  const cityGeoJson = useMemo<CityScoreGeoJson | null>(() => {
    if (filters.categories.length === 0) {
      return { type: "FeatureCollection", features: [] };
    }
    if (!data?.cities) return null;

    return {
      type: "FeatureCollection",
      features: data.cities.map((c) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        properties: {
          city: c.city,
          country: c.country,
          count: c.count,
          score: c.score,
          topCategory: c.topCategory,
        },
      })),
    };
  }, [data, filters.categories.length]);

  return { cityGeoJson };
}
