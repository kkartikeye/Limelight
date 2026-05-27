import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";

export const revalidate = 0;

// GET /api/watchlist — returns the current user's watched countries
export async function GET() {
  const sb = getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ watchlist: [] });
  }

  const { data, error } = await sb
    .from("user_watchlists")
    .select("iso, name")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ watchlist: data ?? [] });
}

// POST /api/watchlist  body: { iso, name }
export async function POST(req: NextRequest) {
  const sb = getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = (await req.json()) as { iso: string; name: string };
  const { error } = await sb.from("user_watchlists").upsert({
    user_id: user.id,
    iso: body.iso,
    name: body.name,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/watchlist  body: { iso }
export async function DELETE(req: NextRequest) {
  const sb = getSupabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const body = (await req.json()) as { iso: string };
  const { error } = await sb
    .from("user_watchlists")
    .delete()
    .eq("user_id", user.id)
    .eq("iso", body.iso);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
