import useSWR from "swr";
import type { FeatureCollection, Point } from "geojson";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";

// Match the heatmap refresh cadence so pins stay in sync with the live layer
const REFRESH_INTERVAL_MS = 90_000;

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

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<PinsGeoJson>;
  });

export function usePins(): PinsResult {
  const { filters } = useMapStore();

  const catParam =
    filters.categories.length < ALL_CATEGORIES.length
      ? `&categories=${filters.categories.join(",")}`
      : "";

  // Null key when no categories are selected — SWR skips the fetch
  const key =
    filters.categories.length > 0
      ? `/api/pins?window=${filters.timeWindow}${catParam}`
      : null;

  const { data } = useSWR(key, fetcher, {
    // Auto-refresh on the same cadence as useScores; SWR skips when tab is hidden
    refreshInterval: REFRESH_INTERVAL_MS,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  // When all categories are deselected return an empty collection immediately
  const pinsGeoJson =
    filters.categories.length === 0
      ? { type: "FeatureCollection" as const, features: [] }
      : (data ?? null);

  return { pinsGeoJson };
}
