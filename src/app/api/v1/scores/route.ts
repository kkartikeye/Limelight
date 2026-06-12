import { NextRequest, NextResponse } from "next/server";
import { aggregateScores, WINDOW_HOURS } from "@/lib/api/score-query";
import { checkApiKey } from "@/lib/api/api-key";

export const revalidate = 0;

// ─── Public API: GET /api/v1/scores?key=ll_…&window=24h ──────────────────────
// Returns Limelight's computed coverage-intensity scores per country.
// This endpoint serves derived data only (never raw article content), so it
// carries no upstream licensing constraints.
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const key = searchParams.get("key") ?? req.headers.get("x-api-key");

  const check = await checkApiKey(key);
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const window = searchParams.get("window") ?? "24h";
  if (!WINDOW_HOURS[window]) {
    return NextResponse.json(
      { error: `Invalid window. Use one of: ${Object.keys(WINDOW_HOURS).join(", ")}` },
      { status: 400 }
    );
  }

  const result = await aggregateScores(window);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json(
    {
      window,
      lastUpdated: result.lastUpdated,
      scores: result.scores,
      meta: {
        metric: "Coverage Intensity (0–100, normalised across countries)",
        attribution: "Limelight — https://limelight.news",
        docs: "Scores reflect media attention, not objective significance.",
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-RateLimit-Remaining": String(check.remaining ?? 0),
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
}
