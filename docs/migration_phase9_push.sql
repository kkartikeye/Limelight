-- Phase 9: web-push alert subscriptions
-- Run in the Supabase SQL editor (same as docs/migration_phase8_api.sql).

create table if not exists push_subscriptions (
  id               uuid primary key default gen_random_uuid(),
  endpoint         text not null unique,        -- push service URL (identifies the browser)
  p256dh           text not null,               -- client public key
  auth             text not null,               -- client auth secret
  watched_isos     text[] not null default '{}',-- ISO3 watchlist snapshot from the client
  threshold        int  not null default 80,    -- alert when a watched country's score >= this
  user_id          uuid references auth.users (id) on delete cascade, -- null for anonymous
  last_notified_at timestamptz,                 -- cooldown bookkeeping (6h between alerts)
  created_at       timestamptz not null default now()
);

create index if not exists push_subscriptions_endpoint_idx on push_subscriptions (endpoint);

alter table push_subscriptions enable row level security;
-- No public policies: only the service-role key (API routes) touches this table.
