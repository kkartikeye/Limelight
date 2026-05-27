-- Phase 5: Auth & Personalisation
-- Run in Supabase SQL editor (Dashboard → SQL Editor → New query)
-- Safe to re-run — uses IF NOT EXISTS / CREATE OR REPLACE.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. user_watchlists — mirrors the localStorage watchlist server-side
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_watchlists (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  iso        text        NOT NULL,          -- 2-letter ISO code (e.g. "US")
  name       text        NOT NULL,          -- display name (e.g. "United States")
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, iso)
);

ALTER TABLE user_watchlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own watchlist"   ON user_watchlists;
DROP POLICY IF EXISTS "Users can insert own watchlist" ON user_watchlists;
DROP POLICY IF EXISTS "Users can delete own watchlist" ON user_watchlists;

CREATE POLICY "Users can view own watchlist"
  ON user_watchlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist"
  ON user_watchlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist"
  ON user_watchlists FOR DELETE
  USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. article_reads — log which articles a user has opened
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_reads (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  article_id uuid        NOT NULL REFERENCES articles(id)  ON DELETE CASCADE,
  read_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, article_id)
);

ALTER TABLE article_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reads"   ON article_reads;
DROP POLICY IF EXISTS "Users can insert own reads" ON article_reads;

CREATE POLICY "Users can view own reads"
  ON article_reads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reads"
  ON article_reads FOR INSERT
  WITH CHECK (auth.uid() = user_id);
