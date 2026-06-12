import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSupabaseServer } from "@/lib/supabase-server";

export const revalidate = 0;

// ─── Push subscription management ─────────────────────────────────────────────
// POST   /api/push  { subscription, watchedIsos, threshold }  → upsert
// DELETE /api/push  { endpoint }                              → remove

interface SubscribeBody {
  subscription?: {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  watchedIsos?: string[];
  threshold?: number;
}

const TABLE_MISSING = /does not exist|could not find the table/i;

export async function POST(req: NextRequest) {
  let body: SubscribeBody = {};
  try { body = await req.json(); } catch { /* fall through to validation */ }

  const endpoint = body.subscription?.endpoint;
  const p256dh = body.subscription?.keys?.p256dh;
  const auth = body.subscription?.keys?.auth;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Invalid push subscription." }, { status: 400 });
  }

  const watchedIsos = (body.watchedIsos ?? [])
    .map((s) => String(s).toUpperCase())
    .filter((s) => /^[A-Z]{3}$/.test(s))
    .slice(0, 50);
  const threshold = Math.min(Math.max(Math.round(body.threshold ?? 80), 1), 100);

  // Attach the auth user when signed in (lets us clean up on account deletion)
  const sb = getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      endpoint,
      p256dh,
      auth,
      watched_isos: watchedIsos,
      threshold,
      user_id: user?.id ?? null,
    },
    { onConflict: "endpoint" }
  );

  if (error) {
    if (TABLE_MISSING.test(error.message)) {
      return NextResponse.json(
        { error: "Alerts not provisioned. Run docs/migration_phase9_push.sql in Supabase." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  let body: { endpoint?: string } = {};
  try { body = await req.json(); } catch { /* validation below */ }

  if (!body.endpoint) {
    return NextResponse.json({ error: "endpoint required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", body.endpoint);

  if (error && !TABLE_MISSING.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
