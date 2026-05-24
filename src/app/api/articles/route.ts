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

  // Start from articles so the published_at filter works as a plain column filter.
  // article_locations!inner ensures we only get articles tagged to this country.
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id, title, url, published_at, category, severity,
      sources ( name, domain, credibility ),
      article_locations!inner ( country_code, is_primary )
    `)
    .eq("article_locations.country_code", country)
    .eq("article_locations.is_primary", true)
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type Row = {
    id: string;
    title: string;
    url: string;
    published_at: string;
    category: string | null;
    severity: number | null;
    sources: { name: string; domain: string; credibility: number } | null;
  };

  const articles = (data ?? []).map((row) => {
    const r = row as unknown as Row;
    return {
      id: r.id,
      headline: r.title,
      url: r.url,
      publishedAt: r.published_at,
      category: r.category,
      severity: r.severity,
      source: r.sources?.name ?? r.sources?.domain ?? "Unknown",
      domain: r.sources?.domain ?? "",
      credibilityTier:
        (r.sources?.credibility ?? 0) >= 0.85 ? "high" :
        (r.sources?.credibility ?? 0) >= 0.6  ? "medium" : "low",
    };
  });

  return NextResponse.json({ articles }, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
