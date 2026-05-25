import { useEffect, useState } from "react";
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

export function useArticles(
  countryCode: string,
  timeWindow: TimeWindow = "24h",
  categories: Category[] = ALL_CATEGORIES
): { articles: Article[]; loading: boolean; isLive: boolean } {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (!countryCode) return;

    // Zero categories — nothing can match; return empty immediately
    if (categories.length === 0) {
      setArticles([]);
      setIsLive(false);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    // Build category param only when a subset is selected
    const catParam =
      categories.length < ALL_CATEGORIES.length && categories.length > 0
        ? `&categories=${categories.join(",")}`
        : "";

    fetch(`/api/articles?country=${countryCode}&window=${timeWindow}${catParam}&limit=10`)
      .then((res) => res.json())
      .then((data: { articles?: ApiArticle[] }) => {
        if (!active) return;
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles.map(mapApiArticle));
          setIsLive(true);
        } else {
          // Fall back to mock while DB is being populated
          setArticles(getMockStories(countryCode));
          setIsLive(false);
        }
      })
      .catch(() => {
        if (active) {
          setArticles(getMockStories(countryCode));
          setIsLive(false);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [countryCode, timeWindow, categories]);

  return { articles, loading, isLive };
}
