// ─── GNews adapter ────────────────────────────────────────────────────────────
// Free tier: 100 requests/day, 10 articles per request. Adds source diversity
// and volume. GNews doesn't tag per-article country, so these rely on the
// title-based gazetteer for geo-tagging. No-ops without a key.
//   Get one (free): https://gnews.io/register  → set GNEWS_API_KEY

import type { NormalisedArticle } from "./guardian";

interface GNewsArticle {
  title?: string;
  description?: string;
  url?: string;
  publishedAt?: string;          // ISO 8601
  source?: { name?: string; url?: string };
}

interface GNewsResponse {
  totalArticles?: number;
  articles?: GNewsArticle[];
}

const GNEWS_BASE = "https://gnews.io/api/v4/top-headlines";

function domainFrom(a: GNewsArticle): string {
  const raw = a.source?.url ?? a.url ?? "";
  try {
    return new URL(raw).hostname.replace(/^www\./, "");
  } catch {
    return (a.source?.name ?? "gnews.io").toLowerCase().replace(/\s+/g, "");
  }
}

export async function fetchGNews(timeoutMs: number): Promise<NormalisedArticle[]> {
  const key = process.env.GNEWS_API_KEY;
  if (!key) return []; // not provisioned — skip silently

  const params = new URLSearchParams({
    category: "world",
    lang: "en",
    max: "10",
    apikey: key,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${GNEWS_BASE}?${params}`, { signal: controller.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as GNewsResponse;
    if (!data.articles) return [];

    return data.articles
      .filter((a): a is GNewsArticle & { url: string; title: string } => !!a.url && !!a.title)
      .map((a) => ({
        url: a.url,
        title: a.title,
        seendate: a.publishedAt ?? new Date().toISOString(),
        domain: domainFrom(a),
        ...(a.description && { snippet: a.description.replace(/\s+/g, " ").trim().slice(0, 500) }),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
