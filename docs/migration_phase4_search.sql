-- ─────────────────────────────────────────────────────────────────────────────
-- Phase 4: Full-text search
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Add the tsvector column to articles
ALTER TABLE articles
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 2. Trigger function — rebuilds search_vector on every insert/update.
--    Includes title now; body_summary is coalesced so it's safe to run before
--    that column exists and will automatically pick it up once added.
CREATE OR REPLACE FUNCTION articles_search_vector_update()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.body_summary, '')), 'B');
  RETURN NEW;
END;
$$;

-- 3. Attach trigger (idempotent)
DROP TRIGGER IF EXISTS articles_search_vector_trigger ON articles;
CREATE TRIGGER articles_search_vector_trigger
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION articles_search_vector_update();

-- 4. Back-fill existing rows (safe to re-run)
UPDATE articles
SET search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(body_summary, '')), 'B')
WHERE search_vector IS NULL;

-- 5. GIN index for fast text search
CREATE INDEX IF NOT EXISTS articles_search_vector_idx
  ON articles USING GIN(search_vector);

-- ─── search_log — tracks every search query for trending computation ──────────
CREATE TABLE IF NOT EXISTS search_log (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  query       text        NOT NULL,
  result_count integer    NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS search_log_created_at_idx ON search_log (created_at DESC);
CREATE INDEX IF NOT EXISTS search_log_query_idx      ON search_log (lower(query));
