// ─── NewsData.io adapter ──────────────────────────────────────────────────────
// Free tier: ~200 credits/day, 10 articles per credit. Crucially, each article
// carries a `country` field, so stories geo-tag themselves — this is what
// broadens the map beyond the Guardian's UK/US skew. No-ops without a key.
//   Get one (free): https://newsdata.io/register  → set NEWSDATA_API_KEY

import type { NormalisedArticle } from "./guardian";
import { resolveCountry } from "./country-codes";

interface NewsDataItem {
  link?: string;
  title?: string;
  pubDate?: string;        // "2026-06-13 12:30:00"
  source_id?: string;
  source_url?: string;
  description?: string;
  country?: string[];      // e.g. ["india", "united states of america"]
}

interface NewsDataResponse {
  status?: string;
  results?: NewsDataItem[];
}

const NEWSDATA_BASE = "https://newsdata.io/api/1/latest";

/** Derive a bare domain from a source URL/id for the credibility registry. */
function domainFrom(item: NewsDataItem): string {
  const raw = item.source_url ?? item.source_id ?? "";
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.replace(/^www\./, "");
  } catch {
    return (item.source_id ?? "newsdata.io").toLowerCase();
  }
}

export async function fetchNewsData(timeoutMs: number): Promise<NormalisedArticle[]> {
  const key = process.env.NEWSDATA_API_KEY;
  if (!key) return []; // not provisioned — skip silently

  const params = new URLSearchParams({
    apikey: key,
    language: "en",
    // No country filter → the "latest" feed spans many countries at once,
    // which is exactly the breadth we want.
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${NEWSDATA_BASE}?${params}`, { signal: controller.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as NewsDataResponse;
    if (data.status !== "success" || !data.results) return [];

    const out: NormalisedArticle[] = [];
    for (const it of data.results) {
      if (!it.link || !it.title) continue;
      // First resolvable country wins as the hint
      const hint = (it.country ?? []).map(resolveCountry).find((c): c is string => !!c);
      out.push({
        url: it.link,
        title: it.title,
        seendate: it.pubDate ? new Date(it.pubDate.replace(" ", "T") + "Z").toISOString() : new Date().toISOString(),
        domain: domainFrom(it),
        ...(it.description && { snippet: it.description.replace(/\s+/g, " ").trim().slice(0, 500) }),
        ...(hint && { countryHint: hint }),
      });
    }
    return out;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
