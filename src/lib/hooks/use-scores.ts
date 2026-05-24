import { useEffect, useState, useMemo } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { mergeGeoJsonWithScores } from "@/lib/mock/score-utils";
import { mockScores } from "@/lib/mock/mock-scores";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";
import type { CountryScore, TopCategory } from "@/lib/types/scores";

// Fallback variance for mock data when the API returns no scores
function applyFilterVariance(score: number, timeWindow: string, catCount: number): number {
  const twFactor: Record<string, number> = {
    "1h": 0.4, "6h": 0.65, "24h": 1.0, "7d": 1.2, "30d": 1.35,
  };
  const catCoverage = catCount / ALL_CATEGORIES.length;
  const raw = score * (twFactor[timeWindow] ?? 1) * (0.5 + catCoverage * 0.5);
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

  // Poll /api/heatmap every 5 minutes, re-fetch immediately when filters change.
  // Passes time window and active categories so the API aggregates accordingly.
  useEffect(() => {
    let active = true;

    // Build category param only when not all categories are selected
    const catParam =
      filters.categories.length < ALL_CATEGORIES.length && filters.categories.length > 0
        ? `&categories=${filters.categories.join(",")}`
        : "";

    async function fetchScores() {
      try {
        const res = await fetch(
          `/api/heatmap?window=${filters.timeWindow}${catParam}&_=${Date.now()}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as ApiScores;
        if (!active) return;
        if (Object.keys(data).length > 0) {
          setApiScores(data);
        } else {
          // Empty response → fall through to mock in useMemo
          setApiScores(null);
        }
      } catch {
        // Network error — keep existing scores
      }
    }

    fetchScores();
    const interval = setInterval(fetchScores, 5 * 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [filters.timeWindow, filters.categories]); // re-fetch when filters change

  return useMemo(() => {
    if (!rawGeoJson) return null;

    const validCategories = new Set<TopCategory>([
      "Conflict", "Politics", "Economics", "Technology",
      "Humanitarian", "Environment", "Sports", "Entertainment",
    ]);

    let scores: CountryScore[];

    if (apiScores && Object.keys(apiScores).length > 0) {
      // Real data from DB
      scores = Object.entries(apiScores).map(([code, val]) => {
        const cat = val.topCategory as TopCategory;
        return {
          code,
          name: code,
          score: val.score,
          articleCount: val.articleCount,
          topCategory: validCategories.has(cat) ? cat : ("Politics" as TopCategory),
        };
      });
    } else {
      // Mock fallback while DB is being populated
      scores = mockScores.map((s) => ({
        ...s,
        score: applyFilterVariance(s.score, filters.timeWindow, filters.categories.length),
      }));
    }

    return mergeGeoJsonWithScores(rawGeoJson, scores);
  }, [rawGeoJson, apiScores, filters]);
}
