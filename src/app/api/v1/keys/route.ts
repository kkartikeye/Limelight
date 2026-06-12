import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { supabase } from "@/lib/supabase";

// ─── Owner-only key minting: POST /api/v1/keys ────────────────────────────────
// Guarded by the same secret as manual ingestion. Body: { name, dailyLimit? }
//   curl -X POST -H "x-ingest-secret: $SECRET" -H "Content-Type: application/json" \
//     -d '{"name":"my-integration"}' https://…/api/v1/keys
export async function POST(req: NextRequest) {
  if (req.headers.get("x-ingest-secret") !== (process.env.INGEST_SECRET ?? "dev-secret")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; dailyLimit?: number } = {};
  try { body = await req.json(); } catch { /* empty body → defaults */ }

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "`name` is required." }, { status: 400 });

  const key = `ll_${randomBytes(16).toString("hex")}`;
  const { error } = await supabase.from("api_keys").insert({
    key,
    name,
    daily_limit: Math.min(Math.max(body.dailyLimit ?? 1000, 1), 10_000),
  });

  if (error) {
    if (/does not exist|could not find the table/i.test(error.message)) {
      return NextResponse.json(
        { error: "API not provisioned. Run docs/migration_phase8_api.sql in Supabase." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ key, name, dailyLimit: body.dailyLimit ?? 1000 }, { status: 201 });
}
