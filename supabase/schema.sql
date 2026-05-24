-- Limelight Phase 2 schema
-- Run this once in: Supabase Dashboard → SQL Editor → New query → Run

-- Enable PostGIS for geo queries (needed for city-level Phase 3)
create extension if not exists postgis;

-- ─── Sources registry ────────────────────────────────────────────────────────
create table if not exists sources (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  domain        text not null unique,
  credibility   float not null default 0.7 check (credibility between 0 and 1),
  source_type   text not null default 'news',  -- wire | national | regional | blog
  created_at    timestamptz not null default now()
);

-- ─── Articles ─────────────────────────────────────────────────────────────────
create table if not exists articles (
  id            uuid primary key default gen_random_uuid(),
  external_id   text not null unique,          -- URL hash (dedup key)
  title         text not null,
  body_snippet  text,                          -- first ~500 chars
  url           text not null,
  published_at  timestamptz not null,
  source_id     uuid references sources(id),
  category      text,                          -- Conflict | Politics | Economics …
  sentiment     float,                         -- -1 to 1
  severity      int default 1 check (severity between 1 and 5),
  created_at    timestamptz not null default now()
);

create index if not exists articles_published_at_idx on articles (published_at desc);
create index if not exists articles_external_id_idx  on articles (external_id);

-- ─── Article → location mapping (many-to-many) ────────────────────────────────
create table if not exists article_locations (
  id            uuid primary key default gen_random_uuid(),
  article_id    uuid not null references articles(id) on delete cascade,
  country_code  char(3) not null,              -- ISO 3166-1 alpha-3
  region_name   text,
  city_name     text,
  latitude      float,
  longitude     float,
  is_primary    boolean not null default true,
  confidence    float default 1.0
);

create index if not exists article_locations_country_idx    on article_locations (country_code);
create index if not exists article_locations_article_id_idx on article_locations (article_id);

-- ─── Precomputed scores (written by the scoring job) ─────────────────────────
create table if not exists region_scores (
  id            uuid primary key default gen_random_uuid(),
  country_code  char(3) not null,
  time_bucket   timestamptz not null,          -- truncated to the hour
  score         float not null default 0,
  article_count int not null default 0,
  top_category  text,
  computed_at   timestamptz not null default now(),
  unique (country_code, time_bucket)
);

create index if not exists region_scores_bucket_idx on region_scores (time_bucket desc);
create index if not exists region_scores_country_idx on region_scores (country_code);

-- ─── Seed a handful of known sources with credibility weights ─────────────────
insert into sources (name, domain, credibility, source_type) values
  ('Reuters',               'reuters.com',       1.0,  'wire'),
  ('Associated Press',      'apnews.com',        1.0,  'wire'),
  ('BBC News',              'bbc.com',           0.95, 'national'),
  ('The Guardian',          'theguardian.com',   0.90, 'national'),
  ('Al Jazeera',            'aljazeera.com',     0.85, 'national'),
  ('NPR',                   'npr.org',           0.88, 'national'),
  ('The New York Times',    'nytimes.com',       0.90, 'national'),
  ('Washington Post',       'washingtonpost.com',0.88, 'national'),
  ('France 24',             'france24.com',      0.82, 'national'),
  ('DW',                    'dw.com',            0.82, 'national')
on conflict (domain) do nothing;
