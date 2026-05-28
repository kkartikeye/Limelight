import useSWR from "swr";
import type { FeatureCollection, LineString } from "geojson";
import { useMapStore } from "@/lib/stores/map-store";

const REFRESH_INTERVAL_MS = 90_000;

export interface ArcProperties {
  title: string;
  category: string;
  fromCountry: string;
  toCountry: string;
}

export type ArcsGeoJson = FeatureCollection<LineString, ArcProperties>;

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<ArcsGeoJson>;
  });

export function useArcs(): { arcsGeoJson: ArcsGeoJson | null } {
  const { filters } = useMapStore();

  const key = `/api/arcs?window=${filters.timeWindow}`;

  const { data } = useSWR(key, fetcher, {
    refreshInterval: REFRESH_INTERVAL_MS,
    revalidateOnFocus: false,
    dedupingInterval: 10_000,
  });

  return { arcsGeoJson: data ?? null };
}
