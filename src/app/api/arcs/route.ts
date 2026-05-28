import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

// GET /api/arcs?window=24h
// Returns GeoJSON LineStrings connecting primary ↔ secondary locations for
// articles that span multiple countries (cross-border / multi-region stories).
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const window = searchParams.get("window") ?? "24h";

  const hoursMap: Record<string, number> = {
    "1h": 1, "6h": 6, "24h": 24, "7d": 168, "30d": 720,
  };
  const hours = hoursMap[window] ?? 24;
  const since = new Date(Date.now() - hours * 3_600_000).toISOString();

  // Fetch ALL location rows for articles published in the time window.
  // Articles with more than one location row → cross-border stories.
  const { data, error } = await supabase
    .from("article_locations")
    .select(`
      article_id, country_code, latitude, longitude, is_primary,
      articles!inner ( id, title, category, published_at )
    `)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("articles.published_at", since)
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  type LocationRow = {
    article_id: string;
    country_code: string;
    latitude: number;
    longitude: number;
    is_primary: boolean;
    articles: { id: string; title: string; category: string | null; published_at: string };
  };

  // Group location rows by article_id
  const byArticle = new Map<string, LocationRow[]>();
  for (const row of (data ?? []) as unknown as LocationRow[]) {
    const group = byArticle.get(row.article_id) ?? [];
    group.push(row);
    byArticle.set(row.article_id, group);
  }

  // Build arc features: for each article with ≥2 locations, draw primary → each secondary.
  // Deduplicate: only one arc per unique (sorted) country pair across all articles.
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  const seenPairs = new Set<string>();

  for (const rows of Array.from(byArticle.values())) {
    if (rows.length < 2) continue; // single-location article — no arc

    const primary = rows.find((r) => r.is_primary) ?? rows[0];
    const secondaries = rows.filter((r) => r !== primary);

    for (const sec of secondaries) {
      if (primary.country_code === sec.country_code) continue;

      // Canonical key regardless of arc direction: sort the two ISO codes
      const pairKey = [primary.country_code, sec.country_code].sort().join("|");
      if (seenPairs.has(pairKey)) continue;
      seenPairs.add(pairKey);

      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: [
            [primary.longitude, primary.latitude],
            [sec.longitude, sec.latitude],
          ],
        },
        properties: {
          title: primary.articles.title,
          category: primary.articles.category ?? "Politics",
          fromCountry: primary.country_code,
          toCountry: sec.country_code,
        },
      });
    }
  }

  return NextResponse.json(
    { type: "FeatureCollection", features },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } },
  );
}
