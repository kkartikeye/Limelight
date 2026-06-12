import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const { data, error } = await supabase
    .from("articles")
    .select(`
      id, title, url, published_at, category, severity,
      sources ( name, domain, credibility ),
      article_locations ( country_code, is_primary )
    `)
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  // Typed client (Database in src/lib/types/database.ts) infers the joined
  // shape directly — sources is to-one, article_locations is to-many.
  const r = data;

  const locs = Array.isArray(r.article_locations) ? r.article_locations : [];
  const primaryLoc = locs.find((l) => l.is_primary) ?? locs[0] ?? null;

  return NextResponse.json({
    article: {
      id: r.id,
      headline: r.title,
      url: r.url,
      publishedAt: r.published_at,
      category: r.category ?? "Politics",
      severity: r.severity ?? 1,
      source: r.sources?.name ?? r.sources?.domain ?? "Unknown",
      domain: r.sources?.domain ?? "",
      credibilityTier:
        (r.sources?.credibility ?? 0) >= 0.85 ? "high" :
        (r.sources?.credibility ?? 0) >= 0.6  ? "medium" : "low",
      countryCode: primaryLoc?.country_code ?? null,
    },
  });
}
