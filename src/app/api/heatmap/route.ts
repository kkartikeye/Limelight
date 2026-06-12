import { NextRequest, NextResponse } from "next/server";
import { aggregateScores } from "@/lib/api/score-query";

export const revalidate = 0;

// GET /api/heatmap?window=24h&categories=Conflict,Politics
// Returns { scores: { [ISO_A3]: { score, articleCount, topCategory } }, lastUpdated: string | null }
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const window = searchParams.get("window") ?? "24h";
  const categoriesParam = searchParams.get("categories");
  const filterCategories = categoriesParam ? categoriesParam.split(",").filter(Boolean) : [];

  const result = await aggregateScores(window, filterCategories);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
  });
}
