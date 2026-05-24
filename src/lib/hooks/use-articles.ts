import { useEffect, useState } from "react";
import { getMockStories } from "@/lib/mock/mock-articles";
import type { Article } from "@/lib/types/article";
import type { TimeWindow } from "@/lib/stores/map-store";

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
  timeWindow: TimeWindow = "24h"
): { articles: Article[]; loading: boolean } {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!countryCode) return;
    let active = true;
    setLoading(true);

    fetch(`/api/articles?country=${countryCode}&window=${timeWindow}&limit=10`)
      .then((res) => res.json())
      .then((data: { articles?: ApiArticle[] }) => {
        if (!active) return;
        if (data.articles && data.articles.length > 0) {
          setArticles(data.articles.map(mapApiArticle));
        } else {
          // Fall back to mock while DB is being populated
          setArticles(getMockStories(countryCode));
        }
      })
      .catch(() => {
        if (active) setArticles(getMockStories(countryCode));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [countryCode, timeWindow]);

  return { articles, loading };
}
