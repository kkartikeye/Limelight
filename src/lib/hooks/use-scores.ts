import { useEffect, useRef, useState, useMemo } from "react";
import type { FeatureCollection, Geometry } from "geojson";
import { mergeGeoJsonWithScores } from "@/lib/mock/score-utils";
import { mockScores } from "@/lib/mock/mock-scores";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";
import type { CountryScore, TopCategory } from "@/lib/types/scores";

const REFRESH_INTERVAL_S = 90;

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
  nextRefreshIn: number;      // seconds until next auto-refresh
  isAutoRefreshing: boolean;  // false when zero categories selected
}

export function useScores(): ScoresResult {
  const [rawGeoJson, setRawGeoJson] = useState<FeatureCollection<Geometry> | null>(null);
  const [apiScores, setApiScores] = useState<ApiScores | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL_S);
  // fetchTrigger increments when the tab comes back into view and data is overdue
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const { filters } = useMapStore();

  // Refs for things that shouldn't re-run effects
  const lastUpdatedStrRef = useRef<string | null>(null);
  const nextRefreshAtRef = useRef<number>(Date.now() + REFRESH_INTERVAL_S * 1000);

  // ─── Load GeoJSON once ─────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/data/countries.geojson.json")
      .then((res) => res.json())
      .then((data: FeatureCollection<Geometry>) => setRawGeoJson(data));
  }, []);

  // ─── Page Visibility: resume + immediate fetch if overdue ──────────────────
  useEffect(() => {
    const handler = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() >= nextRefreshAtRef.current
      ) {
        setFetchTrigger((t) => t + 1);
      }
    };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, []);

  // ─── Main fetch + 90s interval ─────────────────────────────────────────────
  useEffect(() => {
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

    async function doFetch() {
      if (!active) return;
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/heatmap?window=${filters.timeWindow}${catParam}&_=${Date.now()}`
        );
        if (!res.ok || !active) return;
        const data = (await res.json()) as HeatmapResponse;
        if (!active) return;

        if (data.scores && Object.keys(data.scores).length > 0) {
          // Only update state when the server has fresher data
          if (data.lastUpdated !== lastUpdatedStrRef.current) {
            lastUpdatedStrRef.current = data.lastUpdated;
            setApiScores(data.scores);
            if (data.lastUpdated) setLastUpdated(new Date(data.lastUpdated));
          }
        } else {
          setApiScores(null);
        }
      } catch {
        // Network error — keep existing scores
      } finally {
        if (active) setIsLoading(false);
      }
      // Reset countdown after every fetch attempt
      nextRefreshAtRef.current = Date.now() + REFRESH_INTERVAL_S * 1000;
    }

    doFetch();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        doFetch();
      } else {
        // Tab hidden — mark as overdue so the next visibilitychange triggers immediately
        nextRefreshAtRef.current = Date.now();
      }
    }, REFRESH_INTERVAL_S * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // fetchTrigger in deps: re-runs the effect (and fetches immediately) when
    // the tab becomes visible after the interval was skipped
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.timeWindow, filters.categories, fetchTrigger]);

  // ─── 1-second countdown ticker ─────────────────────────────────────────────
  useEffect(() => {
    const ticker = setInterval(() => {
      setNextRefreshIn(
        Math.max(0, Math.round((nextRefreshAtRef.current - Date.now()) / 1000))
      );
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // ─── Merge GeoJSON with scores ─────────────────────────────────────────────
  const geoJson = useMemo(() => {
    if (!rawGeoJson) return null;

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

  const isAutoRefreshing = filters.categories.length > 0;

  return { geoJson, isLoading, lastUpdated, nextRefreshIn, isAutoRefreshing };
}
