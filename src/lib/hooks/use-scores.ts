import { useEffect, useRef, useState, useMemo } from "react";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";
import type { TopCategory } from "@/lib/types/scores";

const REFRESH_INTERVAL_S = 90;

export interface ScoreEntry {
  score: number;
  articleCount: number;
  topCategory: TopCategory | null;
}

/** ISO_A3 → score data. The map's heat-fill reads this directly via feature-state. */
export type ScoresMap = Record<string, ScoreEntry>;

interface HeatmapResponse {
  scores: Record<string, { score: number; articleCount: number; topCategory: string | null }>;
  lastUpdated: string | null;
}

export interface ScoresResult {
  scores: ScoresMap | null;
  isLoading: boolean;
  isMock: boolean;
  lastUpdated: Date | null;
  nextRefreshIn: number;
  isAutoRefreshing: boolean;
}

const VALID_CATEGORIES = new Set<TopCategory>([
  "Conflict", "Politics", "Economics", "Technology",
  "Humanitarian", "Environment", "Sports", "Entertainment",
]);

function normaliseTopCategory(raw: string | null): TopCategory | null {
  if (!raw) return null;
  return VALID_CATEGORIES.has(raw as TopCategory) ? (raw as TopCategory) : "Politics";
}

export function useScores(): ScoresResult {
  const [apiScores, setApiScores] = useState<HeatmapResponse["scores"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL_S);
  const [fetchTrigger, setFetchTrigger] = useState(0);
  const { filters } = useMapStore();

  const lastUpdatedStrRef = useRef<string | null>(null);
  const nextRefreshAtRef = useRef<number>(Date.now() + REFRESH_INTERVAL_S * 1000);

  // ── Page Visibility: re-fetch immediately on resume if overdue ──────────────
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

  // ── Main fetch + 90s interval ───────────────────────────────────────────────
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
          if (data.lastUpdated !== lastUpdatedStrRef.current) {
            lastUpdatedStrRef.current = data.lastUpdated;
            setApiScores(data.scores);
            if (data.lastUpdated) setLastUpdated(new Date(data.lastUpdated));
          }
        } else {
          setApiScores(null);
        }
      } catch { /* keep existing scores */ }
      finally {
        if (active) setIsLoading(false);
      }
      nextRefreshAtRef.current = Date.now() + REFRESH_INTERVAL_S * 1000;
    }

    doFetch();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        doFetch();
      } else {
        nextRefreshAtRef.current = Date.now();
      }
    }, REFRESH_INTERVAL_S * 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.timeWindow, filters.categories, fetchTrigger]);

  // ── 1-second countdown ticker ───────────────────────────────────────────────
  useEffect(() => {
    const ticker = setInterval(() => {
      setNextRefreshIn(
        Math.max(0, Math.round((nextRefreshAtRef.current - Date.now()) / 1000))
      );
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // ── Build the final scores map — real API data only, no mock fallback ───────
  const scores = useMemo<ScoresMap | null>(() => {
    if (filters.categories.length === 0) return {};
    if (!apiScores || Object.keys(apiScores).length === 0) return {};

    const out: ScoresMap = {};
    for (const [iso, val] of Object.entries(apiScores)) {
      out[iso] = {
        score: val.score,
        articleCount: val.articleCount,
        topCategory: normaliseTopCategory(val.topCategory),
      };
    }
    return out;
  }, [apiScores, filters]);

  const isAutoRefreshing = filters.categories.length > 0;

  // isMock retained in the result shape for API compatibility; always false now.
  return { scores, isLoading, isMock: false, lastUpdated, nextRefreshIn, isAutoRefreshing };
}
