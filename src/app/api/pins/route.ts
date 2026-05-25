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

  let query = supabase
    .from("article_locations")
    .select(`
      latitude, longitude, city_name, country_code,
      articles!inner ( id, title, url, published_at, category )
    `)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .gte("articles.published_at", since)
    .order("articles.published_at", { ascending: false })
    .limit(500);

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
  };

  const features = (data ?? []).map((row) => {
    const article = (row.articles as unknown) as ArticleRow;
    return {
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [row.longitude as number, row.latitude as number],
      },
      properties: {
        id: article.id,
        title: article.title,
        url: article.url,
        published_at: article.published_at,
        category: article.category ?? "Politics",
        country_code: row.country_code,
        city_name: row.city_name ?? null,
      },
    };
  });

  return NextResponse.json({
    type: "FeatureCollection",
    features,
  });
}
