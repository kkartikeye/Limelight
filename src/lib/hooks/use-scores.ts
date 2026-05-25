import { useEffect, useState, useMemo } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { mergeGeoJsonWithScores } from "@/lib/mock/score-utils";
import { mockScores } from "@/lib/mock/mock-scores";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";
import type { CountryScore, TopCategory } from "@/lib/types/scores";

// Fallback variance for mock data when the API has no scores yet
function applyFilterVariance(score: number, timeWindow: string, catCount: number): number {
  const twFactor: Record<string, number> = {
    "1h": 0.4, "6h": 0.65, "24h": 1.0, "7d": 1.2, "30d": 1.35,
  };
  const catCoverage = catCount / ALL_CATEGORIES.length;
  const raw = score * (twFactor[timeWindow] ?? 1) * (0.5 + catCoverage * 0.5);
  return Math.min(100, Math.max(0, Math.round(raw)));
}

type ApiScores = Record<string, { score: number; articleCount: number; topCategory: string | null }>;

interface HeatmapResponse {
  scores: ApiScores;
  lastUpdated: string | null;
}

export interface ScoresResult {
  geoJson: FeatureCollection<Geometry> | null;
  isLoading: boolean;
  lastUpdated: Date | null;
}

export function useScores(): ScoresResult {
  const [rawGeoJson, setRawGeoJson] = useState<FeatureCollection<Geometry> | null>(null);
  const [apiScores, setApiScores] = useState<ApiScores | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { filters } = useMapStore();

  // Load GeoJSON once
  useEffect(() => {
    fetch("/data/countries.geojson.json")
      .then((res) => res.json())
      .then((data: FeatureCollection<Geometry>) => setRawGeoJson(data));
  }, []);

  // Poll /api/heatmap every 5 minutes; re-fetch immediately when filters change.
  useEffect(() => {
    // Zero-categories: skip API entirely — return dimmed GeoJSON via useMemo
    if (filters.categories.length === 0) {
      setApiScores(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);

    const catParam =
      filters.categories.length < ALL_CATEGORIES.length
        ? `&categories=${filters.categories.join(",")}`
        : "";

    async function fetchScores() {
      try {
        const res = await fetch(
          `/api/heatmap?window=${filters.timeWindow}${catParam}&_=${Date.now()}`
        );
        if (!res.ok) return;
        const data = (await res.json()) as HeatmapResponse;
        if (!active) return;

        if (data.scores && Object.keys(data.scores).length > 0) {
          setApiScores(data.scores);
          if (data.lastUpdated) setLastUpdated(new Date(data.lastUpdated));
        } else {
          setApiScores(null); // empty → useMemo falls back to mock
        }
      } catch {
        // Network error — keep existing scores
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchScores();
    const interval = setInterval(fetchScores, 5 * 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [filters.timeWindow, filters.categories]); // re-fetch on filter change

  const geoJson = useMemo(() => {
    if (!rawGeoJson) return null;

    // Zero categories → dim the whole map (all scores = 0)
    if (filters.categories.length === 0) {
      return mergeGeoJsonWithScores(rawGeoJson, []);
    }

    const validCategories = new Set<TopCategory>([
      "Conflict", "Politics", "Economics", "Technology",
      "Humanitarian", "Environment", "Sports", "Entertainment",
    ]);

    let scores: CountryScore[];

    if (apiScores && Object.keys(apiScores).length > 0) {
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
      scores = mockScores.map((s) => ({
        ...s,
        score: applyFilterVariance(s.score, filters.timeWindow, filters.categories.length),
      }));
    }

    return mergeGeoJsonWithScores(rawGeoJson, scores);
  }, [rawGeoJson, apiScores, filters]);

  return { geoJson, isLoading, lastUpdated };
}
