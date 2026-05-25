import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

// GET /api/heatmap?window=24h&categories=Conflict,Politics
// Returns { scores: { [ISO_A3]: { score, articleCount, topCategory } }, lastUpdated: string | null }
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const window = searchParams.get("window") ?? "24h";
  const categoriesParam = searchParams.get("categories");
  const filterCategories = categoriesParam ? categoriesParam.split(",").filter(Boolean) : [];

  const hoursMap: Record<string, number> = {
    "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720,
  };
  const hours = hoursMap[window] ?? 24;
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ scores: {}, lastUpdated: null });
  }

  // Track the most recent bucket seen (for lastUpdated)
  let latestBucket: string | null = null;

  const agg: Record<string, {
    scoreSum: number;
    bucketCount: number;
    articleCount: number;
    cats: Record<string, number>;
  }> = {};

  for (const row of data) {
    const cc = row.country_code as string;
    const bucket = row.time_bucket as string;
    if (!latestBucket || bucket > latestBucket) latestBucket = bucket;

    if (!agg[cc]) agg[cc] = { scoreSum: 0, bucketCount: 0, articleCount: 0, cats: {} };
    agg[cc].scoreSum += row.score as number;
    agg[cc].bucketCount++;
    agg[cc].articleCount += row.article_count as number;
    const cat = row.top_category as string | null;
    if (cat) agg[cc].cats[cat] = (agg[cc].cats[cat] ?? 0) + 1;
  }

  const maxAvg = Math.max(
    ...Object.values(agg).map((a) => a.scoreSum / a.bucketCount),
    1
  );

  const scores: Record<string, { score: number; articleCount: number; topCategory: string | null }> = {};
  for (const [cc, a] of Object.entries(agg)) {
    const avg = a.scoreSum / a.bucketCount;
    scores[cc] = {
      score: Math.round((avg / maxAvg) * 100),
      articleCount: a.articleCount,
      topCategory: Object.entries(a.cats).sort((x, y) => y[1] - x[1])[0]?.[0] ?? null,
    };
  }

  return NextResponse.json(
    { scores, lastUpdated: latestBucket },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
