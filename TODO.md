# Limelight — Improvement Backlog

Generated from the codebase audit on 2026-05-25 after the Daylight design
implementation. Work through this in priority order; each section is roughly
self-contained.

---

## 🗑️ Dead code to delete

These files are not imported anywhere and can be removed without changing behavior:

| File | Why it's dead |
|---|---|
| `src/components/panel/article-card.tsx` | Replaced by inline `HeadlineRow` in `story-panel.tsx`. Still on old dark Tailwind theme. |
| `src/components/ui/watchlist-widget.tsx` | Removed from `map-view.tsx` during the Daylight refactor. Dark amber / `gray-950` palette, wrong for Daylight. |
| `src/lib/hooks/use-color-scale.ts` | d3 color scale hook from the Deck.gl era. |
| `src/lib/mock/color-utils.ts` | Deck.gl hex→RGBA converter. |

Optional: `src/components/ui/view-toggle.tsx` — kept intentionally for the end of the project when we re-enable the globe/flat toggle. Leave it.

---

## 🎨 Design inconsistencies

### `pin-layer.tsx` — entire file is still pre-Daylight
- Cluster circles: `#f97316` / `#ef4444` / `#dc2626` (vivid orange/red — clashes with cream paper)
- Individual pins: 8 distinct category colors (red, blue, green, purple, teal, yellow, pink) — violates the single-coral-accent rule
- Cluster stroke: `rgba(255,255,255,0.25)` — assumes dark background
- Popup HTML: raw `system-ui` font inline style, not Daylight tokens
- Pin stroke: `rgba(0,0,0,0.5)` — dark assumption

**Fix**: pins should be coral `#e0573c` with cream stroke; clusters should follow the coral heatmap ramp; popup HTML should use DL tokens.

---

## 🔧 Functional issues

### 1. `relativeTime` is copy-pasted 5×
Defined separately in:
- `src/components/panel/story-panel.tsx`
- `src/app/country/[iso]/page.tsx`
- `src/app/article/[id]/page.tsx`
- `src/components/filters/filter-bar.tsx` (Date-based variant)
- `src/components/panel/article-card.tsx` (dead — will go away)

**Fix**: create `src/lib/utils/time.ts` exporting `relativeTime(iso: string)` and `relativeTimeSince(date: Date)`. Import everywhere.

### 2. Ingest cron is once per day
`vercel.json` has `"schedule": "0 0 * * *"` — midnight UTC daily. For a live news map this should be at least hourly. Bump to `"0 * * * *"` (every hour) or `"*/30 * * * *"` (every 30 min) if on Pro.

### 3. Dead store state in `map-store.ts`
`hoverCountry: string | null` and `setHover` are defined but never called anywhere — hover is managed entirely by local state in `map-view.tsx`. Remove from the store.

### 4. `use-articles` limit hardcoded to 10
The country page groups *all* articles by category, but `use-articles.ts` always passes `limit=10`. If a country has 40 articles in the window you only see 10. Bump default to 30, or make it a parameter.

### 5. Supabase join filter in `/api/articles` may be broken
Uses `.eq("article_locations.country_code", country)` — in Supabase JS v2 this dot-notation on a joined table may silently fail and return all articles regardless of country. This would explain why `useArticles` falls back to mock for many ISOs.

**Fix**: use the explicit `{ referencedTable: "article_locations" }` filter form, or restructure to query `article_locations` as the parent table with an inner join to `articles`.

Same issue applies to `/api/pins` (filters `articles.published_at` and `articles.category` on a join).

### 6. Country name displays as ISO code
Navigating to `/country/USA` without a `?name=United+States` query string shows "USA" as the 100px hero headline. Happens whenever you arrive from an article breadcrumb or a direct link.

**Fix**: create `src/lib/utils/countries.ts` with an ISO3→display name lookup (~60 most-covered countries should cover 95%+ of the cases; fallback to the ISO code).

### 7. StoryPanel headlines link to external source
`article.url` opens the publisher directly. Design spec says clicking a headline should route to `/article/[id]` (our reader). Our reader screen is currently unreachable from the main flow.

**Fix**: change `<a href={article.url}>` to `<Link href={`/article/${article.id}`}>` in `HeadlineRow`. The reader screen already shows a "Read at source" CTA.

---

## ❌ Missing pages / broken nav

The header and bottom tab bar link to routes that don't exist:

- `/regions` → 404 (Today/Regions/Topics/Saved nav item)
- `/topics` → 404
- `/saved` → 404 (also the highest-value one — watchlist lives here)

**Fix**: at minimum stub each one. `/saved` should render the watched countries from `useWatchlistStore`. The other two can be a "coming soon" placeholder until we have content.

---

## ⚡ UX improvements

### 1. Filter bar overflows on narrow screens
`flexWrap: "nowrap"` with 8 category pills + 5 time windows clips on viewports under ~1280px. Even on 1440px laptops with the sidebar open, it crowds.

**Fix**: switch to `flexWrap: "wrap"` with max-width, or collapse categories behind a "Filter" popover that opens upward.

### 2. Ocean click clears selection
Clicking empty ocean calls `clearSelection()` and drops back to the auto-selected top country. Misclicks near small countries are jarring.

**Fix**: only clear on an explicit back/close action. Or shrink the "outside any country" click area to require a much larger margin.

### 3. Article breadcrumb shows ISO code
Same root cause as #6 above — the article reader breadcrumb shows `← GBR` instead of `← United Kingdom`.

### 4. StoryPanel auto-selection has no label
When no country is clicked, the panel silently shows the top-scored country. Users can't tell auto-selected vs. their explicit choice.

**Fix**: add a small eyebrow ("Trending now" or "Most coverage today") when in auto-select mode.

### 5. Scroll zoom has no discovery hint
Map scroll zoom is disabled until first click. A small "click map to zoom" affordance on first hover would help.

---

## 🏗️ Architecture / new utilities

Create these shared modules:

- `src/lib/utils/time.ts` — `relativeTime`, `relativeTimeSince`
- `src/lib/utils/countries.ts` — ISO3 → display name (Iso3CountryName map)
- Consider `src/lib/utils/category-icons.ts` if we add category iconography per the design

---

## Priority order for the next session

### Quick wins (≤ 1 hour total)
1. Delete 4 dead files (`article-card`, `watchlist-widget`, `use-color-scale`, `color-utils`)
2. Extract `relativeTime` to `src/lib/utils/time.ts`, fix all import sites
3. Remove dead `hoverCountry` / `setHover` from `map-store`
4. Fix `vercel.json` cron to hourly

### Medium effort (1–2 hours each)
5. Create `src/lib/utils/countries.ts` ISO3→name lookup, wire into country + article pages
6. Wire `/article/[id]` routing in StoryPanel headlines
7. Bump `use-articles` limit to 30
8. Create `/saved` page (watchlist view)
9. Stub `/regions` and `/topics` pages

### Bigger work (2–4 hours each)
10. Rewrite `pin-layer.tsx` for Daylight palette (coral pins, Daylight popup HTML, coral cluster ramp)
11. Fix `filter-bar` overflow handling on narrower viewports
12. Investigate + fix Supabase join filter in `/api/articles` and `/api/pins`
13. Add "click to interact" scroll-zoom hint on map

### Deferred (project-end polish)
- Re-enable the globe / flat-earth `ViewToggle` (`view-toggle.tsx` and `map-store` projection state are already there waiting)
- Search functionality behind the mobile search icon
- Real category iconography
