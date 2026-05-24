import { useEffect, useState, useMemo } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { mergeGeoJsonWithScores } from "@/lib/mock/score-utils";
import { mockScores } from "@/lib/mock/mock-scores";
import { useMapStore } from "@/lib/stores/map-store";
import type { TimeWindow, Category } from "@/lib/stores/map-store";
import type { CountryScore, TopCategory } from "@/lib/types/scores";

// Fallback variance for mock data when the API returns no scores
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

type ApiScores = Record<string, { score: number; articleCount: number; topCategory: string | null }>;

export function useScores(): FeatureCollection<Geometry> | null {
  const [rawGeoJson, setRawGeoJson] = useState<FeatureCollection<Geometry> | null>(null);
  const [apiScores, setApiScores] = useState<ApiScores | null>(null);
  const { filters } = useMapStore();

  // Load GeoJSON once
  useEffect(() => {
    fetch("/data/countries.geojson.json")
      .then((res) => res.json())
      .then((data: FeatureCollection<Geometry>) => setRawGeoJson(data));
  }, []);

  // Poll /api/heatmap every 5 minutes; fall back to mock if empty
  useEffect(() => {
    let active = true;

    async function fetchScores() {
      try {
        const res = await fetch(`/api/heatmap?_=${Date.now()}`);
        if (!res.ok) return;
        const data = await res.json() as ApiScores;
        if (active && Object.keys(data).length > 0) {
          setApiScores(data);
        }
      } catch {
        // network error — keep existing scores
      }
    }

    fetchScores();
    const interval = setInterval(fetchScores, 5 * 60_000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  return useMemo(() => {
    if (!rawGeoJson) return null;

    let scores: CountryScore[];

    if (apiScores && Object.keys(apiScores).length > 0) {
      // Real data from DB
      const validCategories = new Set<TopCategory>([
        "Conflict","Politics","Economics","Technology",
        "Humanitarian","Environment","Sports","Entertainment",
      ]);
      scores = Object.entries(apiScores).map(([code, val]) => {
        const cat = val.topCategory as TopCategory;
        return {
          code,
          name: code,
          score: val.score,
          articleCount: val.articleCount,
          topCategory: validCategories.has(cat) ? cat : "Politics" as TopCategory,
        };
      });
    } else {
      // Mock fallback while DB has no scores yet
      scores = mockScores.map((s) => ({
        ...s,
        score: applyFilterVariance(s.score, filters.timeWindow, filters.categories),
      }));
    }

    return mergeGeoJsonWithScores(rawGeoJson, scores);
  }, [rawGeoJson, apiScores, filters]);
}
