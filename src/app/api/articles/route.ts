import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

// GET /api/articles?country=USA&limit=10&window=24h&categories=Conflict,Politics
// GET /api/articles?city=Kyiv&country=UKR&window=24h   ← city-scoped query
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const country = searchParams.get("country");
  const city    = searchParams.get("city");          // optional city filter
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 50);
  const window = searchParams.get("window") ?? "24h";
  const categoriesParam = searchParams.get("categories");
  const filterCategories = categoriesParam ? categoriesParam.split(",").filter(Boolean) : [];

  if (!country && !city) {
    return NextResponse.json({ error: "country or city param required" }, { status: 400 });
  }

  const hoursMap: Record<string, number> = {
    "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720,
  };
  const hours = hoursMap[window] ?? 24;
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  // Query from article_locations so country_code and is_primary are direct column
  // filters — avoids the Supabase JS v2 dot-notation ambiguity on joined tables.
  // articles!inner enforces an INNER JOIN so only located articles are returned.
  // City-scoped query: filter by city_name (and optionally country_code)
  // Country-scoped query: filter by country_code + is_primary
  let query = supabase
    .from("article_locations")
    .select(`
      articles!inner (
        id, title, url, published_at, category, severity, body_snippet,
        sources ( name, domain, credibility )
      )
    `)
    .gte("articles.published_at", since)
    .limit(limit);

  if (city) {
    query = query.eq("city_name", city);
    if (country) query = query.eq("country_code", country);
  } else {
    query = query.eq("country_code", country!).eq("is_primary", true);
  }

  if (filterCategories.length > 0) {
    query = query.in("articles.category", filterCategories);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type ArticleRow = {
    id: string;
    title: string;
    url: string;
    published_at: string;
    category: string | null;
    severity: number | null;
    body_snippet: string | null;
    sources: { name: string; domain: string; credibility: number } | null;
  };

  type LocationRow = {
    articles: ArticleRow;
  };

  // Sort newest-first in JS — avoids PostgREST foreign-table order syntax issues
  const sorted = (data ?? []).slice().sort((a, b) => {
    const aRow = a as unknown as { articles: { published_at: string } };
    const bRow = b as unknown as { articles: { published_at: string } };
    return new Date(bRow.articles.published_at).getTime() - new Date(aRow.articles.published_at).getTime();
  });

  // Deduplicate: one article can appear via multiple article_locations rows
  // (e.g. an article tagged to both Moscow and Saint Petersburg for the same country).
  const seenIds = new Set<string>();
  const deduped = sorted.filter((row) => {
    const id = (row as unknown as LocationRow).articles.id;
    if (seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });

  const articles = deduped.map((row) => {
    const r  = row as unknown as LocationRow;
    const a  = r.articles;
    return {
      id:       a.id,
      headline: a.title,
      url:      a.url,
      publishedAt: a.published_at,
      category: a.category,
      severity: a.severity,
      source:   a.sources?.name ?? a.sources?.domain ?? "Unknown",
      domain:   a.sources?.domain ?? "",
      summary:  a.body_snippet ?? null,
      credibilityTier:
        (a.sources?.credibility ?? 0) >= 0.85 ? "high" :
        (a.sources?.credibility ?? 0) >= 0.6  ? "medium" : "low",
    };
  });

  return NextResponse.json({ articles }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
