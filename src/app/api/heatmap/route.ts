import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 0; // always fresh

// Returns the latest score per country as { [ISO_A3]: number }
export async function GET() {
  // Pick the most recent scored time bucket
  const { data: latest, error: bucketErr } = await supabase
    .from("region_scores")
    .select("time_bucket")
    .order("time_bucket", { ascending: false })
    .limit(1)
    .single();

  if (bucketErr || !latest) {
    // No scores yet — return empty so the frontend falls back to mock
    return NextResponse.json({});
  }

  const { data, error } = await supabase
    .from("region_scores")
    .select("country_code, score, article_count, top_category")
    .eq("time_bucket", latest.time_bucket);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const scores: Record<string, { score: number; articleCount: number; topCategory: string | null }> = {};
  for (const row of data ?? []) {
    scores[row.country_code] = {
      score: Math.round(row.score),
      articleCount: row.article_count,
      topCategory: row.top_category,
    };
  }

  return NextResponse.json(scores, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
