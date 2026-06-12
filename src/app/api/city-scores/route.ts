import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

// GET /api/city-scores?window=24h&categories=Conflict,Politics
// Aggregates article_locations by city → returns a scored city list
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
    .from("article_locations")
    .select(`
      city_name, country_code, latitude, longitude,
      articles!inner ( id, published_at, category, sources ( credibility ) )
    `)
    .not("city_name", "is", null)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("articles.published_at", since)
    .limit(3000);

  if (filterCategories.length > 0) {
    query = query.in("articles.category", filterCategories);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── JS-side aggregation grouped by (city_name, country_code) ─────────────────

  const cityMap = new Map<string, {
    city: string; country: string;
    lat: number; lng: number;
    count: number; rawScore: number;
    categoryCounts: Record<string, number>;
  }>();

  const now = Date.now();

  for (const row of data ?? []) {
    const key = `${row.city_name}|${row.country_code}`;
    const credibility = row.articles.sources?.credibility ?? 0.7;
    const hoursOld = (now - new Date(row.articles.published_at).getTime()) / 3_600_000;
    const recencyDecay = Math.exp(-0.1 * hoursOld);
    const articleScore = credibility * recencyDecay;
    const cat = row.articles.category ?? "Politics";

    const entry = cityMap.get(key);
    if (entry) {
      entry.count++;
      entry.rawScore += articleScore;
      entry.categoryCounts[cat] = (entry.categoryCounts[cat] ?? 0) + 1;
    } else {
      cityMap.set(key, {
        city: row.city_name,
        country: row.country_code,
        lat: row.latitude,
        lng: row.longitude,
        count: 1,
        rawScore: articleScore,
        categoryCounts: { [cat]: 1 },
      });
    }
  }

  // Normalise 0-100 across all cities
  let maxRaw = 0;
  for (const e of Array.from(cityMap.values())) if (e.rawScore > maxRaw) maxRaw = e.rawScore;

  const cities = Array.from(cityMap.values())
    .map((e) => ({
      city: e.city,
      country: e.country,
      lat: e.lat,
      lng: e.lng,
      count: e.count,
      score: maxRaw > 0 ? Math.round((e.rawScore / maxRaw) * 100) : 0,
      topCategory: (Object.entries(e.categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0]) ?? "Politics",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 250);

  return NextResponse.json({ cities }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
