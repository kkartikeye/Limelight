import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

// GET /api/articles?country=USA&limit=10&window=24h
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const country = searchParams.get("country");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "10", 10), 50);
  const window = searchParams.get("window") ?? "24h";

  if (!country) {
    return NextResponse.json({ error: "country param required" }, { status: 400 });
  }

  const hoursMap: Record<string, number> = {
    "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720,
  };
  const hours = hoursMap[window] ?? 24;
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  // Join article_locations → articles → sources
  const { data, error } = await supabase
    .from("article_locations")
    .select(`
      is_primary,
      articles (
        id, title, url, published_at, category, severity,
        sources ( name, domain, credibility )
      )
    `)
    .eq("country_code", country)
    .eq("is_primary", true)
    .gte("articles.published_at", since)
    .order("articles(published_at)", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type ArtRow = {
    id: string;
    title: string;
    url: string;
    published_at: string;
    category: string | null;
    severity: number | null;
    sources: { name: string; domain: string; credibility: number } | null;
  };

  const articles = (data ?? [])
    .map((row) => row.articles)
    .filter(Boolean)
    .map((a) => {
      const art = (a as unknown) as ArtRow;
      return {
        id: art.id,
        headline: art.title,
        url: art.url,
        publishedAt: art.published_at,
        category: art.category,
        severity: art.severity,
        source: art.sources?.name ?? "Unknown",
        domain: art.sources?.domain ?? "",
        credibilityTier:
          (art.sources?.credibility ?? 0) >= 0.85 ? "high" :
          (art.sources?.credibility ?? 0) >= 0.6  ? "medium" : "low",
      };
    });

  return NextResponse.json({ articles }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
