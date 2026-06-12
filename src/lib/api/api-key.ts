import { supabase } from "@/lib/supabase";

// API-key validation + fixed-window daily rate limiting backed by Supabase.
// Soft enforcement: the read-then-update isn't atomic, so a burst can briefly
// overshoot a limit — acceptable at this tier (documented trade-off).

export interface KeyCheck {
  ok: boolean;
  status: number;
  error?: string;
  remaining?: number;
}

interface ApiKeyRow {
  id: string;
  daily_limit: number;
  requests_today: number;
  last_request_date: string | null;
  revoked: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

export async function checkApiKey(key: string | null): Promise<KeyCheck> {
  if (!key || !key.startsWith("ll_")) {
    return { ok: false, status: 401, error: "Missing or malformed API key. Pass it as the `key` query param or `x-api-key` header." };
  }

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, daily_limit, requests_today, last_request_date, revoked")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    // Table missing → migration not yet run (message wording varies by
    // PostgREST version: "does not exist" / "Could not find the table")
    if (/does not exist|could not find the table/i.test(error.message)) {
      return { ok: false, status: 503, error: "API not provisioned. Run docs/migration_phase8_api.sql in Supabase." };
    }
    return { ok: false, status: 500, error: error.message };
  }
  if (!data) return { ok: false, status: 401, error: "Unknown API key." };

  const row = data as ApiKeyRow;
  if (row.revoked) return { ok: false, status: 401, error: "API key revoked." };

  const isNewDay = row.last_request_date !== today();
  const used = isNewDay ? 0 : row.requests_today;

  if (used >= row.daily_limit) {
    return { ok: false, status: 429, error: `Daily limit of ${row.daily_limit} requests reached. Resets at 00:00 UTC.`, remaining: 0 };
  }

  await supabase
    .from("api_keys")
    .update({ requests_today: used + 1, last_request_date: today() })
    .eq("id", row.id);

  return { ok: true, status: 200, remaining: row.daily_limit - used - 1 };
}
