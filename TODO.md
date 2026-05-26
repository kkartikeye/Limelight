# Limelight — Improvement Backlog

Updated 2026-05-26. Items marked ✅ are complete. Remaining work is ordered by priority within each section.

---

## ✅ Completed (this sprint)

| Item | Commit |
|---|---|
| Delete 4 dead files | `ff7bdc1` |
| Extract `relativeTime` / `relativeTimeSince` to `src/lib/utils/time.ts` | `ff7bdc1` |
| Remove dead `hoverCountry` / `setHover` from map-store | `ff7bdc1` |
| Bump vercel.json cron to hourly | `ff7bdc1` |
| `src/lib/utils/countries.ts` ISO3→name, wired into all pages | `3a8ed26` |
| `/article/[id]` routing in StoryPanel; article metadata as URL fallback params | `3a8ed26` |
| `use-articles` limit bumped to 30 | `3a8ed26` |
| `/saved` watchlist page | `3a8ed26` |
| `/regions` and `/topics` stub pages | `3a8ed26` |
| Article reader: fix API route (wrong columns), fallback from URL params | `5cbdc4f` |
| Country name: dynamic font size in StoryPanel, isoToName on auto-select | `5cbdc4f` |
| Globe as centrepiece: hero text moved to map overlay | `5cbdc4f` |
| Intensity legend: vertical frosted glass, repositioned to right-mid | `5cbdc4f` |
| Fix Next.js 14 params error (`use()` on plain objects) | `8b5ab47` |
| `pin-layer.tsx` full Daylight palette rewrite | `98978f8` |
| Filter-bar: `flexWrap: wrap`, shorter category labels | `98978f8` |
| Supabase join filter: restructure `/api/articles` + `/api/pins` | `98978f8` |

---

## 🔧 Remaining functional issues

### 1. Ocean click clears selection unexpectedly
Clicking empty ocean calls `clearSelection()` and snaps back to the auto-selected top country. Misclicks near small island nations are jarring.

**Fix**: only clear on an explicit close/back action (the × button or Escape), not on any ocean click.

### 2. StoryPanel auto-selection has no label
When no country is explicitly clicked, the panel silently shows the highest-scored country. Users can't distinguish auto-select from their own selection.

**Fix**: add a small eyebrow ("Trending now" or "Most coverage today") above the country name when `!isPanelOpen`.

### 3. Scroll-zoom has no discovery hint
Scroll zoom is disabled until the first click. New users may not discover it.

**Fix**: show a subtle one-time tooltip on first hover: "Click map to enable scroll zoom".

---

## ⚡ UX / design improvements

### 1. `/regions` and `/topics` pages — real content
Currently "coming soon" placeholders. Regions page should group countries by continent with a mini heat indicator per region. Topics page should link to filtered country lists per category.

### 2. Article reader — richer content
The reader page currently shows only article metadata and links out. Possible additions:
- Related articles from the same country (reuse `useArticles`)
- Mini country intensity chip linking back to `/country/[iso]`
- Estimated credibility tier badge (already in the data)

### 3. Country page — hero article link routing
The hero article `<a href={heroArticle.url}>` links directly to the source. Should route through `/article/[id]` like the StoryPanel does (consistent internal routing).

### 4. `/saved` page — live pulse on active countries
Countries with score > 60 could show a pulsing coral dot next to the card header (same signal as the map halo). Makes the watchlist feel live.

---

## 🏗️ Architecture improvements

### 1. Supabase RLS & server-side API keys
Currently using the anon key for all Supabase calls from API routes. Production should use the service-role key server-side (never exposed to the client).

### 2. Error boundaries
No React error boundaries anywhere. A failed Supabase call in `useScores` silently shows mock data. Add an `<ErrorBoundary>` at the page level and a toast notification for API failures.

### 3. SWR or React Query
`useScores`, `useArticles`, `usePins` are all manual `useEffect` + `fetch` + `useState` patterns. Migrating to SWR or React Query would give deduplication, background refresh, cache invalidation, and loading/error states for free.

### 4. Typed Supabase client
Generate types from the DB schema (`supabase gen types typescript`) and replace all `as unknown as Row` casts with the generated types. Eliminates runtime cast errors.

### 5. Image optimisation for source favicons
Article cards could show source favicons (DuckDuckGo favicon API or direct `https://domain/favicon.ico`). Should use Next.js `<Image>` with `unoptimized` for external URLs.

---

## 🗓️ Phase 4 and beyond

### Phase 4 — Search & Discovery

**Goal**: users can find articles by keyword, not just by country.

| Feature | Description |
|---|---|
| **Global search** | Full-text search across `articles.title` + `articles.body_summary`. Supabase supports `fts` (tsvector) natively. Add a `search_vector` column to `articles`, trigger to populate it, and a `/api/search?q=` endpoint. Wire the mobile search icon in the header. |
| **Search results page** | `/search?q=ukraine+drone` → ranked list of articles grouped by country. Click article → reader. Click country chip → country page. |
| **Keyword alert subscriptions** | Users save search terms. When new articles matching a term ingest, send a push notification (Web Push API) or email (Resend). Requires auth (Phase 5). |
| **Trending searches** | Track search frequency in a `search_log` table. Surface top-5 trending terms on the Topics page. |

### Phase 5 — Auth & Personalisation

**Goal**: persistent identity, cross-device watchlists, personalised feed.

| Feature | Description |
|---|---|
| **Auth** | Supabase Auth (magic link + Google OAuth). No passwords. Session via `@supabase/ssr`. |
| **Server-side watchlist** | Move `useWatchlistStore` from localStorage to a `user_watchlists` Supabase table. Sync on login. |
| **Personalised "For You" feed** | Weight articles by watchlist countries + category preferences. Separate feed on the "Today" page below the map. |
| **Reading history** | Track article views in `article_reads` (user_id, article_id, ts). Power "already read" dimming on headlines. |
| **Notification preferences** | Per-user settings: email digest frequency, push alert threshold (e.g. only alert when intensity > 80). |

### Phase 6 — Sub-country granularity

**Goal**: zoom in to city/region level.

| Feature | Description |
|---|---|
| **Admin-1 regions layer** | At zoom ≥ 5, swap the country GeoJSON source for a Natural Earth admin-1 regions source. Architecture already supports it (`mergeGeoJsonWithScores` is source-agnostic). |
| **City-level heat** | Aggregate `article_locations.city_name` scores into a `city_scores` table (same pipeline as `region_scores`). Render as a circle layer at zoom ≥ 6, sized by intensity. |
| **Region detail page** | `/region/[id]` — mirrors `/country/[iso]` but scoped to a sub-national region. |
| **Cross-border stories** | Articles tagged to multiple locations show a connection arc (Mapbox `line` layer between centroids). |

### Phase 7 — Data quality & ingestion

**Goal**: richer, more accurate coverage.

| Feature | Description |
|---|---|
| **Multi-source ingestion** | Add MediaStack, NewsAPI, and The Guardian API alongside GDELT. Dedup by URL hash + title similarity (already specced). |
| **NER geo-tagging** | Run spaCy + Mordecai3 on article bodies for precise city-level geo-tagging, replacing the coarse GDELT country codes. |
| **Source credibility scoring** | Automate credibility scores using AllSides bias ratings + NewsGuard API. Currently hardcoded in the `sources` table. |
| **Deduplication pipeline** | The BullMQ + Redis dedup queue from the architecture spec. Group reprints of the same AP/Reuters wire into a single canonical article with a reprint count. |
| **Body summary extraction** | Store a 2-sentence AI-generated summary in `articles.body_summary` using Claude API. Surface in the article reader and search index. |

### Phase 8 — Monetisation & Scale

| Feature | Description |
|---|---|
| **Pro tier** | Unlimited watchlist countries (free = 5), 30-min refresh (free = hourly), CSV export, API access. Stripe billing. |
| **Embeds** | `<iframe>` or `<script>` embed for media organisations to put the map widget on their sites. |
| **Public API** | REST API for developers: `/v1/scores`, `/v1/articles`, `/v1/search`. Rate-limited with API keys. |
| **CDN & edge caching** | Move `/api/heatmap` response to Vercel Edge Config or R2 so the globe loads instantly. Score data can be 60s stale globally. |

---

## Deferred polish (project-end)

- Re-enable globe / flat-earth `ViewToggle` (`view-toggle.tsx` + `map-store` projection state already in place)
- Real category iconography (SVG icons per category, replacing text labels)
- **Direct-to-source headline links**: decide whether StoryPanel headlines should skip the internal reader. Current flow: headline → `/article/[id]` → "Read at source" CTA. Revisit once the reader page has more content. (See `story-panel.tsx` `HeadlineRow`)
- Dark mode / night theme (Limelight Midnight palette — inverse of Daylight)
- Offline support / PWA manifest
