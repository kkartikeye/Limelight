import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const revalidate = 0;

// GET /api/reads — returns { ids: string[] } of article UUIDs read by the current user
export async function GET() {
  const sb = getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ ids: [] });
  }

  const { data, error } = await sb
    .from("article_reads")
    .select("article_id")
    .eq("user_id", user.id)
    .order("read_at", { ascending: false })
    .limit(500);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ids: (data ?? []).map((r) => r.article_id) });
}

// POST /api/reads  body: { articleId }
export async function POST(req: NextRequest) {
  const sb = getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    // Graceful no-op — unauthenticated reads are not logged
    return NextResponse.json({ ok: false });
  }

  const { articleId } = (await req.json()) as { articleId: string };

  // upsert avoids unique constraint errors on repeated visits
  await sb.from("article_reads").upsert({
    user_id: user.id,
    article_id: articleId,
  });

  return NextResponse.json({ ok: true });
}
