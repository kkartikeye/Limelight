import { useMemo } from "react";
import useSWR from "swr";
import { getMockStories } from "@/lib/mock/mock-articles";
import type { Article } from "@/lib/types/article";
import type { TimeWindow, Category } from "@/lib/stores/map-store";
import { ALL_CATEGORIES } from "@/lib/stores/map-store";

interface ApiArticle {
  id: string;
  headline: string;
  url: string;
  publishedAt: string;
  category: string | null;
  severity: number | null;
  source: string;
  domain: string;
  credibilityTier: "high" | "medium" | "low";
}

function mapApiArticle(a: ApiArticle): Article {
  return {
    id: a.id,
    headline: a.headline,
    source: a.source,
    credibilityTier: a.credibilityTier,
    category: (a.category as Article["category"]) ?? "Politics",
    publishedAt: a.publishedAt,
    url: a.url,
  };
}

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<{ articles: ApiArticle[] }>;
  });

export function useArticles(
  countryCode: string,
  timeWindow: TimeWindow = "24h",
  categories: Category[] = ALL_CATEGORIES
): { articles: Article[]; loading: boolean; isLive: boolean; error: string | null } {
  // Serialize categories so SWR treats different subsets as different keys.
  const catParam =
    categories.length > 0 && categories.length < ALL_CATEGORIES.length
      ? `&categories=${categories.join(",")}`
      : "";

  // Null key → SWR skips fetch (no country yet, or all categories deselected).
  const key =
    countryCode && categories.length > 0
      ? `/api/articles?country=${countryCode}&window=${timeWindow}${catParam}&limit=30`
      : null;

  const { data, isLoading, error: swrError } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30_000, // don't re-fetch the same country within 30 s
    shouldRetryOnError: false,
  });

  const { articles, isLive } = useMemo(() => {
    if (data?.articles && data.articles.length > 0) {
      return { articles: data.articles.map(mapApiArticle), isLive: true };
    }
    // Empty response or no fetch yet → fall back to mock data
    return { articles: getMockStories(countryCode), isLive: false };
  }, [data, countryCode]);

  // Show loading skeleton only on the very first fetch for this key
  const loading = isLoading && !data;

  const error = swrError instanceof Error ? swrError.message : swrError ? String(swrError) : null;

  return { articles, loading, isLive, error };
}
