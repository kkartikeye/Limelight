import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from("articles")
    .select("id, headline, url, published_at, category, severity, source, domain, credibility_tier, country_code")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  return NextResponse.json({
    article: {
      id: data.id,
      headline: data.headline,
      url: data.url,
      publishedAt: data.published_at,
      category: data.category ?? "Politics",
      severity: data.severity ?? 1,
      source: data.source,
      domain: data.domain,
      credibilityTier: data.credibility_tier ?? "medium",
      countryCode: data.country_code,
    },
  });
}
