import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const revalidate = 300; // cache for 5 minutes — trending doesn't need real-time

// GET /api/search/trending
// Returns the top-5 most-searched queries from the last 7 days.
export async function GET() {
  const since = new Date(Date.now() - 7 * 24 * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("search_log")
    .select("query")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500); // fetch recent logs and count client-side

  if (error) {
    return NextResponse.json({ trending: [] });
  }

  // Count frequency per normalised query
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const key = row.query.toLowerCase().trim();
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const trending = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([query, count]) => ({ query, count }));

  return NextResponse.json({ trending });
}
