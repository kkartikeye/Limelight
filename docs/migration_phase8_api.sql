-- Phase 8: public API keys with daily rate limiting
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS api_keys (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key                text UNIQUE NOT NULL,          -- "ll_" + 32 hex chars
  name               text NOT NULL,                 -- who/what this key is for
  daily_limit        integer NOT NULL DEFAULT 1000,
  requests_today     integer NOT NULL DEFAULT 0,
  last_request_date  date,
  created_at         timestamptz NOT NULL DEFAULT now(),
  revoked            boolean NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys (key) WHERE NOT revoked;

-- Service-role access only: no anon policies. The Next.js API routes are the
-- sole consumers (they use the service-role key), so RLS just locks anon out.
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
