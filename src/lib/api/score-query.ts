import { supabase } from "@/lib/supabase";

// Shared score aggregation used by /api/heatmap (internal) and /api/v1/scores
// (public). Averages each country's region_scores buckets over the window,
// then normalises 0–100 against the hottest country.

export interface ScoreEntry {
  score: number;
  articleCount: number;
  topCategory: string | null;
}

export interface AggregatedScores {
  scores: Record<string, ScoreEntry>;
  lastUpdated: string | null;
}

export const WINDOW_HOURS: Record<string, number> = {
  "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720,
};

export async function aggregateScores(
  window: string,
  filterCategories: string[] = []
): Promise<AggregatedScores | { error: string }> {
  const hours = WINDOW_HOURS[window] ?? 24;
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  let query = supabase
    .from("region_scores")
    .select("country_code, score, article_count, top_category, time_bucket")
    .gte("time_bucket", since)
    .order("time_bucket", { ascending: false });

  if (filterCategories.length > 0) {
    query = query.in("top_category", filterCategories);
  }

  const { data, error } = await query;
  if (error) return { error: error.message };
  if (!data || data.length === 0) return { scores: {}, lastUpdated: null };

  let latestBucket: string | null = null;
  const agg: Record<string, {
    scoreSum: number;
    bucketCount: number;
    articleCount: number;
    cats: Record<string, number>;
  }> = {};

  // Rows arrive newest-first (ordered by time_bucket desc).
  for (const row of data) {
    const cc = row.country_code as string;
    const bucket = row.time_bucket as string;
    if (!latestBucket || bucket > latestBucket) latestBucket = bucket;

    const firstForCc = !agg[cc];
    if (firstForCc) agg[cc] = { scoreSum: 0, bucketCount: 0, articleCount: 0, cats: {} };
    agg[cc].scoreSum += row.score as number;
    agg[cc].bucketCount++;
    // Each hourly bucket already holds a trailing-24h article count, so the
    // buckets overlap heavily — summing them massively over-counts. Take the
    // most-recent bucket's count (the first row seen for this country).
    if (firstForCc) agg[cc].articleCount = row.article_count as number;
    const cat = row.top_category as string | null;
    if (cat) agg[cc].cats[cat] = (agg[cc].cats[cat] ?? 0) + 1;
  }

  const maxAvg = Math.max(
    ...Object.values(agg).map((a) => a.scoreSum / a.bucketCount),
    1
  );

  // Perceptual (square-root) scaling. English-language sources genuinely
  // over-cover the US/UK, so a linear scale leaves every other country looking
  // dead next to them. sqrt keeps the loudest country at 100 and preserves
  // ranking, but lifts mid-tier countries into visible warmth so the map shows
  // global activity. (Pure log over-saturated everything to orange.)
  const scores: Record<string, ScoreEntry> = {};
  for (const [cc, a] of Object.entries(agg)) {
    const avg = a.scoreSum / a.bucketCount;
    scores[cc] = {
      score: Math.round(Math.sqrt(avg / maxAvg) * 100),
      articleCount: a.articleCount,
      topCategory: Object.entries(a.cats).sort((x, y) => y[1] - x[1])[0]?.[0] ?? null,
    };
  }

  return { scores, lastUpdated: latestBucket };
}
