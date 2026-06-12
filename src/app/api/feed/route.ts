import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";

export const revalidate = 0;

// ─── For You feed: GET /api/feed?isos=USA,GBR&limit=20 ────────────────────────
// Personalised article feed weighted by the user's watchlist.
//   - Signed in:  watchlist from user_watchlists, already-read articles
//                 (article_reads) are excluded.
//   - Anonymous:  pass the local watchlist via ?isos= (comma-separated ISO3).
// Ranking: source credibility × exponential recency decay (24h half-life-ish),
// the same shape as the country scoring formula.

const WINDOW_HOURS = 72;
const DECAY = 1 / 24; // e-folding time: 24 hours

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 40);

  // Resolve watchlist + read history (server-side when signed in)
  let isos: string[] = [];
  let readIds = new Set<string>();

  const sb = getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  if (user) {
    const [watchRes, readsRes] = await Promise.all([
      sb.from("user_watchlists").select("iso").eq("user_id", user.id),
      sb.from("article_reads").select("article_id").eq("user_id", user.id).limit(500),
    ]);
    isos = (watchRes.data ?? []).map((r) => r.iso);
    readIds = new Set((readsRes.data ?? []).map((r) => r.article_id));
  }

  // Anonymous (or empty server watchlist): fall back to the isos param
  if (isos.length === 0) {
    isos = (searchParams.get("isos") ?? "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]{3}$/.test(s));
  }

  if (isos.length === 0) {
    return NextResponse.json({ articles: [] });
  }

  const since = new Date(Date.now() - WINDOW_HOURS * 3_600_000).toISOString();

  const { data, error } = await supabase
    .from("article_locations")
    .select(`
      country_code,
      articles!inner (
        id, title, url, published_at, category, body_snippet,
        sources ( name, domain, credibility )
      )
    `)
    .in("country_code", isos.slice(0, 30))
    .eq("is_primary", true)
    .gte("articles.published_at", since)
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const now = Date.now();
  const seen = new Set<string>();
  const ranked = (data ?? [])
    .filter((row) => {
      const id = row.articles.id;
      if (seen.has(id) || readIds.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((row) => {
      const a = row.articles;
      const hoursOld = Math.max(0, (now - new Date(a.published_at).getTime()) / 3_600_000);
      const credibility = a.sources?.credibility ?? 0.5;
      return {
        id:          a.id,
        headline:    a.title,
        url:         a.url,
        publishedAt: a.published_at,
        category:    a.category ?? "Politics",
        source:      a.sources?.name ?? a.sources?.domain ?? "Unknown",
        domain:      a.sources?.domain ?? "",
        summary:     a.body_snippet ?? null,
        countryCode: row.country_code,
        _rank:       credibility * Math.exp(-DECAY * hoursOld),
      };
    })
    .sort((a, b) => b._rank - a._rank)
    .slice(0, limit)
    // strip the internal ranking field from the response
    .map(({ _rank, ...rest }) => { void _rank; return rest; });

  return NextResponse.json(
    { articles: ranked, personalised: Boolean(user) },
    { headers: { "Cache-Control": "private, max-age=60" } }
  );
}
