# Limelight — Improvement Backlog

Updated 2026-06-12. Items marked ✅ are complete. Phases 1–10 are shipped; this
file now tracks the few remaining open items and the historical phase record.

---

## 🔧 Open items

### 1. Provision push alerts (one-time, manual)
Run `docs/migration_phase9_push.sql` in the Supabase SQL editor, then add the
three VAPID env vars from `.env.local` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
`VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`) to Vercel. Until then the alerts UI on
/saved returns a graceful 503 and ingestion skips dispatch.

### 2. Claude article summaries — blocked
GDELT provides no article bodies and no `ANTHROPIC_API_KEY` is configured.
Becomes viable once a body-providing source (NewsAPI/MediaStack) is added.
Guardian trailText snippets cover the gap meanwhile.

### 3. NER geo-tagging upgrade — deferred
Needs a Python microservice (spaCy + Mordecai3) or per-article LLM calls.
The regex gazetteer in the ingest route (~190 countries + 100 cities) holds.

### 4. Stripe / Pro tier — deferred
Charging requires Vercel Pro ($20/mo; Hobby bans commercial use). Revisit when
Mapbox/Vercel/Supabase free ceilings are in sight.

### 5. Admin-1 sub-national regions layer — deferred
Bigger GIS lift (Natural Earth admin-1 source swap at zoom ≥ 5), low priority
without user demand. City-level heat already covers the zoom-in story.

---

## 🗓️ Phase record

| Phase | Scope | Status |
|---|---|---|
| 1 — Map foundation | Globe, heat layer, mock data, Daylight design | ✅ |
| 2 — Live data | Supabase, GDELT ingestion, scoring engine, cron | ✅ |
| 3 — Live UX | 90s auto-refresh, watchlist, city pin clusters | ✅ |
| 4 — Search & discovery | FTS search, results page, trending searches | ✅ |
| 5 — Auth & personalisation | Magic-link auth, server watchlist, reading history | ✅ |
| 6 — Sub-country granularity | City heat circles, cross-border arcs, region pages | ✅ |
| 7 — Data quality | Guardian + GDELT, fuzzy dedup, credibility registry, snippets | ✅ |
| 8 — Distribution (free tier) | Retention pruning, public API, embeds, edge caching | ✅ |
| 9 — Polish & engagement | See below | ✅ |
| 10 — Share-ready | /developers docs page, sitemap/robots, OG share card, ThemePill click-anywhere | ✅ |

### Phase 9 (2026-06-12) — Polish & engagement batch

| Feature | Detail |
|---|---|
| **Midnight dark mode** | ✅ DL tokens converted to CSS variables (`globals.css`); `data-theme="midnight"` flips every inline style. Header sun/moon toggle, localStorage persistence, pre-paint init script (no flash). Map remounts with dark-v11 basemap + midnight fog. |
| **Globe/Flat toggle** | ❌ Removed (2026-06-12, user feedback) — globe is the permanent projection again; the top-right map slot now hosts the Day/Night `ThemePill` instead. |
| **Category icons** | ✅ `category-icon.tsx` — 8 line glyphs (sabres, heart, columns, chart, chip, leaf, ball, clapper) in the Topics popover + Topics cards (replaced emoji). |
| **Filter bar v2** | ✅ (2026-06-12 feedback) Shorthand category pills replaced by a Topics popover — full names + icons in a 2-column grid, isolate-on-first-click, Reset, active-count badge. Regions page emoji replaced with mono region-code badges. Hover tooltip now uses a themed `--dl-glass` surface (was hardcoded white in Midnight). |
| **Dark-mode color sweep** | ✅ (2026-06-12) Heat legend, mobile tab bar, and the regions "no-score" chip now use `--dl-glass`/`--dl-chip`/`--dl-rule*` instead of hardcoded cream/ink. Article-pin and city-circle map popups (raw HTML injected into Mapbox) now use `var(--dl-*)` so their text/chips stay legible on the dark `--dl-card` popup body. `CityHeatLayer` gained a `dark` prop flipping admin-1 border, circle stroke, and city-label colors to match `HeatLayer`'s country-label treatment. |
| **PWA** | ✅ `app/manifest.ts`, generated icons (192/512), `public/sw.js` (SWR for static assets, network-first navigation, `offline.html` fallback), prod-only registration. |
| **Direct-to-source links** | ✅ Decision: keep the internal reader as the primary click; StoryPanel headline rows get an ↗ shortcut straight to the publisher. |
| **Typed Supabase client** | ✅ `src/lib/types/database.ts` hand-generated from the live PostgREST OpenAPI schema (CLI auth unavailable); all three clients typed; every `as unknown as Row` cast in API routes removed — joins now infer. |
| **For You feed** | ✅ `/api/feed` — watchlist countries ranked by credibility × recency decay; signed-in users get read-history exclusion. Rendered on /saved below the watchlist grid. |
| **Push alerts** | ✅ web-push (VAPID) + `push_subscriptions` table (`docs/migration_phase9_push.sql`); threshold prefs UI on /saved; dispatch hooked into the scoring run with 6h cooldown and dead-endpoint pruning. **Needs the one-time provisioning above.** |

### Phase 10 (2026-06-12) — Share-ready batch

| Feature | Detail |
|---|---|
| **ThemePill click-anywhere** | ✅ The Day/Night map pill is now a single button — clicking any part of it (including the active segment) toggles the theme. |
| **/developers page** | ✅ Public docs for `GET /api/v1/scores` (params, response shape, rate limits) and the `/embed` iframe widget, with copy-to-clipboard snippets. Linked as "API" in the desktop header. |
| **SEO routes** | ✅ `app/sitemap.ts` (4 stable pages; live-data pages deliberately excluded) + `app/robots.ts` (blocks /api, /saved, /embed, /auth). |
| **OG share card** | ✅ `app/opengraph-image.tsx` — edge-rendered 1200×630 brand card (rings mark, wordmark, tagline) so shared links unfurl properly. `metadataBase`/OG/Twitter meta already existed in layout.tsx. |

---

## Resolved earlier (kept for the record)

- Ocean-click no longer clears selection (× / Escape only) ✅
- "Trending now" eyebrow distinguishes auto-selection ✅
- Scroll-zoom discovery hint (one-time tooltip) ✅
- Error boundaries (`app/error.tsx`, `app/global-error.tsx`) + skeleton loaders ✅
- SWR for `useArticles`/`usePins`/`useArcs`/`useCityScores`/`useReads`
  (`useScores` deliberately manual — countdown ticker + visibility-resume) ✅
- Source favicons (`SourceFavicon`, DuckDuckGo API + initials fallback) ✅
- Supabase service-role key server-side everywhere ✅
