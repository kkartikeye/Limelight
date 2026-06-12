import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

// GET /api/pins?window=24h&categories=Conflict,Politics
// Returns a GeoJSON FeatureCollection of Points for articles with known coordinates.
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

  // article_locations is the primary table — lat/lng/city/country are direct
  // columns here. articles!inner joins only rows that have a matching article.
  // referencedTable in .order() ensures the sort is applied on the joined table.
  let query = supabase
    .from("article_locations")
    .select(`
      latitude, longitude, city_name, country_code,
      articles!inner ( id, title, url, published_at, category )
    `)
    .not("latitude",  "is", null)
    .not("longitude", "is", null)
    .gte("articles.published_at", since)
    .limit(500);

  if (filterCategories.length > 0) {
    query = query.in("articles.category", filterCategories);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort newest-first in JS — avoids PostgREST foreign-table order syntax issues
  const sorted = (data ?? []).slice().sort((a, b) =>
    new Date(b.articles.published_at).getTime() - new Date(a.articles.published_at).getTime()
  );

  const features = sorted.map((row) => {
    const article = row.articles;
    return {
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [row.longitude ?? 0, row.latitude ?? 0],
      },
      properties: {
        id:           article.id,
        title:        article.title,
        url:          article.url,
        published_at: article.published_at,
        category:     article.category ?? "Politics",
        country_code: row.country_code,
        city_name:    row.city_name ?? null,
      },
    };
  });

  return NextResponse.json({
    type: "FeatureCollection",
    features,
  });
}
