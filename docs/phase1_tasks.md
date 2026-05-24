# NewsMap — Phase 1 task list

68 tasks across 10 sections. Stop at each section boundary for a verification pass before continuing.

Difficulty tags: `setup` = configuration only · `easy` = straightforward implementation · `medium` = requires care · `hard` = known tricky integration point

---

## Section 1 — Project setup & tooling
**Days 1–2 · 8 tasks**

- [ ] Run `npx create-next-app@latest newsmap --typescript --tailwind --app` `setup`
- [ ] Configure `tsconfig.json` with `@/` path alias pointing to `./src/` `setup`
- [ ] Install ESLint + Prettier; add `.eslintrc.json` and `.prettierrc` configs `setup`
- [ ] Create `src/` directory structure: `components/`, `lib/`, `store/`, `types/`, `data/` `setup`
- [ ] Create `.env.local` with `NEXT_PUBLIC_MAPBOX_TOKEN` placeholder; add to `.gitignore` `setup`
- [ ] Initialize Git repo, push to GitHub, connect to Vercel for CI/CD `setup`
- [ ] Trigger first empty Vercel deploy to verify the pipeline works `easy`
- [ ] Install core deps: `mapbox-gl`, `@deck.gl/react`, `@deck.gl/layers`, `zustand`, `d3-scale`, `d3-scale-chromatic` `setup`

---

## Section 2 — Mapbox map component
**Days 2–4 · 9 tasks**

- [ ] Add `mapbox-gl` CSS import to `app/layout.tsx` global styles `easy`
- [ ] Create `MapView` component with `useRef<HTMLDivElement>` for map container `easy`
- [ ] Initialize `mapboxgl.Map` inside `useEffect` with token, style (`dark-v11`), center `[0, 20]`, zoom `1.8` `medium`
- [ ] Store map instance in `useRef` (not state) to prevent re-renders `medium`
- [ ] Add cleanup: call `map.remove()` on component unmount to prevent memory leaks `easy`
- [ ] Disable scroll-zoom when map is not focused; re-enable on map click (UX) `easy`
- [ ] Add `ResizeObserver` to call `map.resize()` when container dimensions change `medium`
- [ ] Gate Mapbox init behind `typeof window !== "undefined"` for SSR safety `medium`
- [ ] Test: map renders, pans, zooms without console errors `easy`

---

## Section 3 — Country GeoJSON & mock data
**Days 3–4 · 7 tasks**

- [ ] Download Natural Earth 110m countries GeoJSON (~500KB); place at `src/data/countries.geojson.json` `setup`
- [ ] Run simplification pass via `mapshaper -simplify 15%` to reduce to ~150KB `easy`
- [ ] Strip unnecessary feature properties; keep only `ISO_A3` and `ADMIN` fields `easy`
- [ ] Define `CountryScore` TypeScript type: `{ code, name, score, articleCount, topCategory }` `easy`
- [ ] Create `src/data/mockScores.ts` with realistic scores for ~60 countries (distribute 5–95, cluster "hot" in conflict regions) `medium`
- [ ] Write `getCountryScore(code: string): number` utility returning 0 for unlisted countries `easy`
- [ ] Write `mergeGeoJsonWithScores()` to attach score as a feature property for Deck.gl access `medium`

---

## Section 4 — Deck.gl heat layer
**Days 4–5 · 9 tasks**

> Core deliverable. The map should be rendering heat colors by end of Day 5.

- [ ] Create `useColorScale` hook: `scaleSequential(interpolateYlOrRd).domain([0, 100])` `medium`
- [ ] Write `hexToRgba(hex: string, alpha: number): [number,number,number,number]` converter for Deck.gl `medium`
- [ ] Create `HeatLayer` component wrapping `DeckGL` with a `GeoJsonLayer` `hard`
- [ ] Configure `GeoJsonLayer`: `getFillColor` from score, `getLineColor` white at low opacity, `lineWidthMinPixels: 0.5` `medium`
- [ ] Set `pickable: true` on layer to enable hover and click event detection `easy`
- [ ] Sync `DeckGL` viewState with Mapbox camera via `onViewStateChange` callback (no double navigation) `hard`
- [ ] Set `controller={false}` on `DeckGL` — Mapbox owns all user interaction `easy`
- [ ] Verify layer re-renders (new color array) when score data or filters change via `updateTriggers` `hard`
- [ ] Test: heat gradient visible from blue (low) through orange to red (high) `easy`

---

## Section 5 — Hover tooltip
**Days 5–6 · 7 tasks**

- [ ] Add `onHover` callback to `GeoJsonLayer`; extract `{ object, x, y }` from event `medium`
- [ ] Store `hoverInfo` in local state: `{ name, score, articleCount, x, y } | null` `easy`
- [ ] Create `Tooltip` component: absolutely positioned div showing country name, score bar, article count `medium`
- [ ] Score bar: small colored rectangle (width proportional to score) using same YlOrRd color as map `medium`
- [ ] Handle viewport edges: if `x > containerWidth - 180` flip tooltip to left of cursor `medium`
- [ ] Add 150ms CSS fade in/out via opacity transition; use `pointer-events: none` `easy`
- [ ] Change cursor to `pointer` on hover using `getCursor` prop of DeckGL `easy`

---

## Section 6 — Click side panel
**Days 6–8 · 9 tasks**

- [ ] Create `StoryPanel` component: right-side drawer, 380px wide, full viewport height `medium`
- [ ] Animate: `transform: translateX(100%)` → `translateX(0)` on open, 250ms ease-out `medium`
- [ ] Panel header: country name, ISO code badge, intensity score chip, close (X) button `easy`
- [ ] Define `Article` type: `{ id, headline, source, sourceCredibility, category, publishedAt, url }` `easy`
- [ ] Create `ArticleCard` component: 2-line clamped headline, source name, credibility tier dot, category tag, relative timestamp `medium`
- [ ] Create `getMockStories(code: string): Article[]` returning 6–8 varied articles for ~30 major countries `medium`
- [ ] Add empty state: "No recent coverage" illustration for low-score or unknown countries `easy`
- [ ] Close on: X button, `Escape` keydown listener, click on map backdrop `medium`
- [ ] Shift map center left by 190px when panel opens so selected country stays visible `hard`

---

## Section 7 — Zustand state management
**Days 6–7 · 7 tasks**

- [ ] Create `src/store/mapStore.ts` with `create<MapState>()(...)` pattern `medium`
- [ ] State: `selectedCountry: string | null`, `hoverCountry: string | null`, `isPanelOpen: boolean` `easy`
- [ ] State: `filters: { timeWindow: TimeWindow; categories: string[] }` `easy`
- [ ] Actions: `selectCountry`, `clearSelection`, `setHover`, `setTimeWindow`, `toggleCategory` `easy`
- [ ] Connect map `onClick` event → `selectCountry(ISO_A3)` → triggers panel open `medium`
- [ ] Connect `StoryPanel` open/close to `isPanelOpen` — single source of truth `easy`
- [ ] Derive `filteredScores` as a computed selector from `mockScores + filters` (vary scores per time window) `medium`

---

## Section 8 — Filter bar UI
**Day 8 · 6 tasks**

- [ ] Create `FilterBar` component, positioned at bottom-left of map as a floating card `medium`
- [ ] Time window: 5 pill buttons (`1h / 6h / 24h / 7d / 30d`), active state with solid fill `easy`
- [ ] Category filters: 8 toggleable pills (Conflict, Politics, Economics, Technology, Humanitarian, Environment, Sports, Entertainment) `medium`
- [ ] On filter change: call `getFilteredScores()` which applies seeded variance to mock data (simulates real filtering) `medium`
- [ ] Ensure Deck.gl `GeoJsonLayer` updates with `updateTriggers` on filter state change `medium`
- [ ] On narrow viewports (<600px): collapse categories behind a "Filters" button popover `hard`

---

## Section 9 — Globe toggle
**Day 9 · 5 tasks**

- [ ] Add globe icon SVG button to map UI (top-right controls area) `easy`
- [ ] Add `isGlobe: boolean` + `toggleGlobe` action to `mapStore` `easy`
- [ ] On toggle: call `map.setProjection({ name: isGlobe ? "globe" : "mercator" })` `easy`
- [ ] Add Mapbox `sky` layer (atmosphere effect) visible only in globe mode `medium`
- [ ] Ensure Deck.gl overlay position still tracks Mapbox camera correctly in globe mode `hard`

---

## Section 10 — Polish, performance & deploy
**Days 10–12 · 9 tasks**

- [ ] Add full-screen loading state: centered spinner, fade to map on `map.on("load")` firing `easy`
- [ ] Add `will-change: transform` on Tooltip and StoryPanel for GPU composite layer promotion `easy`
- [ ] Add `aria-label` to all icon buttons; `role="dialog"` + `aria-labelledby` on StoryPanel `medium`
- [ ] Test touch UX on mobile: panel opens on tap, no tooltip flash, map pans correctly `medium`
- [ ] Add `<head>` metadata: title, description, OG image with map screenshot `easy`
- [ ] Run `next build` locally; fix any TypeScript errors before pushing `medium`
- [ ] Add `NEXT_PUBLIC_MAPBOX_TOKEN` to Vercel project environment variables (production) `setup`
- [ ] Push to `main` → verify Vercel auto-deploy succeeds; test production URL end-to-end `easy`
- [ ] Add `@vercel/analytics` for basic visit tracking on the production URL `easy`

---

## Known hard integration points

Three tasks across the list are flagged as the highest-risk — resolve them before moving on:

1. **Section 4 · Deck.gl + Mapbox viewState sync** — `DeckGL` must follow Mapbox's camera, not fight it. Set `controller={false}` on `DeckGL` and wire `onViewStateChange` to call `map.jumpTo()` (not `flyTo`) with the Deck.gl viewState. If panning feels doubled or jittery, this sync is broken.

2. **Section 4 · `updateTriggers`** — Deck.gl's `GeoJsonLayer` will not re-compute `getFillColor` unless you list the dependencies in `updateTriggers: { getFillColor: [scores, filters] }`. Forgetting this means the map silently shows stale colors after a filter change.

3. **Section 9 · Globe mode + Deck.gl overlay** — Mapbox's `globe` projection changes how lat/lng maps to screen pixels. The Deck.gl overlay must be set to `views={new MapView({ repeat: true })}` and the same viewport must be passed from Mapbox to keep the heat layer registered correctly in globe mode.

---

## Suggested day-by-day schedule

| Days | Focus | Exit criterion |
|------|-------|----------------|
| 1–2 | Sections 1–2: scaffold + Mapbox rendering | Map renders in browser with no console errors |
| 3–5 | Sections 3–4: GeoJSON + Deck.gl heat layer | Countries shaded by mock scores — heat gradient visible |
| 6–7 | Sections 5–7: tooltip + panel + Zustand | Hover shows tooltip; click opens panel with mock articles |
| 8 | Section 8: filter bar | Selecting a filter visibly changes country colors |
| 9 | Section 9: globe toggle | Toggle switches projection; heat layer stays aligned |
| 10–12 | Section 10: polish + deploy | Production Vercel URL live, passing mobile + a11y QA |
