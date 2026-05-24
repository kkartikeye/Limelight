import { useEffect, useState, useMemo } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { mergeGeoJsonWithScores } from "@/lib/mock/score-utils";
import { mockScores } from "@/lib/mock/mock-scores";
import { useMapStore } from "@/lib/stores/map-store";
import type { TimeWindow, Category } from "@/lib/stores/map-store";

// Seeded variance so filter changes produce visibly different scores
function applyFilterVariance(
  score: number,
  timeWindow: TimeWindow,
  categories: Category[]
): number {
  const twFactor: Record<TimeWindow, number> = {
    "1h": 0.4, "6h": 0.65, "24h": 1.0, "7d": 1.2, "30d": 1.35,
  };
  const catCoverage = categories.length / 8;
  const raw = score * twFactor[timeWindow] * (0.5 + catCoverage * 0.5);
  return Math.min(100, Math.max(0, Math.round(raw)));
}

export function useScores(): FeatureCollection<Geometry> | null {
  const [rawGeoJson, setRawGeoJson] = useState<FeatureCollection<Geometry> | null>(null);
  const { filters } = useMapStore();

  useEffect(() => {
    fetch("/data/countries.geojson.json")
      .then((res) => res.json())
      .then((data: FeatureCollection<Geometry>) => setRawGeoJson(data));
  }, []);

  return useMemo(() => {
    if (!rawGeoJson) return null;

    const filteredScores = mockScores.map((s) => ({
      ...s,
      score: applyFilterVariance(s.score, filters.timeWindow, filters.categories),
    }));

    return mergeGeoJsonWithScores(rawGeoJson, filteredScores);
  }, [rawGeoJson, filters]);
}
