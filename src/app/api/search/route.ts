import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

// GET /api/search?q=ukraine+drone&window=24h&limit=30
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() ?? "";
  const window = searchParams.get("window") ?? "24h";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "30", 10), 50);

  if (q.length < 2) {
    return NextResponse.json(
      { error: "q param required (minimum 2 characters)" },
      { status: 400 }
    );
  }

  const hoursMap: Record<string, number> = {
    "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720,
  };
  const hours = hoursMap[window] ?? 24;
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  // Full-text search on the pre-built tsvector column.
  // "websearch" mode supports phrases ("ukraine drone"), AND, OR, NOT natively.
  const { data, error } = await supabase
    .from("articles")
    .select(`
      id, title, url, published_at, category,
      sources ( name, domain, credibility ),
      article_locations ( country_code, is_primary )
    `)
    .textSearch("search_vector", q, { type: "websearch", config: "english" })
    .gte("published_at", since)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type LocationRow = { country_code: string; is_primary: boolean };
  type SourceRow = { name: string; domain: string; credibility: number } | null;

  const results = (data ?? []).map((row) => {
    const src = row.sources as unknown as SourceRow;
    const locs = (row.article_locations ?? []) as unknown as LocationRow[];
    // Prefer the primary location; fall back to first available
    const loc = locs.find((l) => l.is_primary) ?? locs[0] ?? null;

    return {
      id:             row.id,
      headline:       row.title,
      url:            row.url,
      publishedAt:    row.published_at,
      category:       (row.category as string) ?? "Politics",
      source:         src?.name ?? src?.domain ?? "Unknown",
      domain:         src?.domain ?? "",
      credibilityTier:
        (src?.credibility ?? 0) >= 0.85 ? "high" :
        (src?.credibility ?? 0) >= 0.6  ? "medium" : "low",
      countryCode:    loc?.country_code ?? null,
    };
  });

  // Log the query asynchronously — fire-and-forget, never block the response.
  void supabase
    .from("search_log")
    .insert({ query: q.toLowerCase(), result_count: results.length });

  return NextResponse.json(
    { query: q, total: results.length, results },
    { headers: { "Cache-Control": "no-store" } }
  );
}
