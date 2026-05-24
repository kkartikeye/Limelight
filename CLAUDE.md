# NewsMap

Interactive world map that heat-colors countries by news coverage intensity. Users hover for country-level metrics and click for a side panel of top stories. The metric is called **"Coverage Intensity"** — never "News Importance" — because it reflects media attention, not objective significance.

## Current phase

**Phase 1 — Map Foundation.** Goal: a deployable URL with an interactive heat-shaded world map running on **mock data only**. No backend, no live news, no scoring engine yet.

Phase 1 task breakdown lives in `docs/phase1_tasks.md` (68 tasks across 10 sections). Full architecture and roadmap in `docs/NewsMap_Framework.md`. Read these before making structural decisions.

The two hardest technical challenges in Phase 1, flagged during planning:
1. Syncing Deck.gl `viewState` with the Mapbox camera (single source of truth, controlled by Deck.gl)
2. Getting Deck.gl `updateTriggers` right so the heat layer re-renders when score data changes

Core deliverable target: heat layer rendering by Day 5 of the 12-day schedule. Everything else (filter bar, globe toggle, polish) comes after that.

## Tech stack

**Frontend (Phase 1 scope):**
- Next.js 14 with the App Router
- TypeScript (strict mode)
- Tailwind CSS for styling
- Mapbox GL JS for the base map
- Deck.gl as a Mapbox overlay — `GeoJsonLayer` with `getFillColor` mapped via `d3-scale-chromatic` `interpolateYlOrRd`
- Zustand for client state (map view, selected country, filters)
- Vercel for deployment

**Backend (Phase 2+, do not scaffold yet):**
- Node.js + Express API (modular monolith)
- PostgreSQL + PostGIS, Supabase-hosted
- Redis for the scoring cache
- BullMQ for ingestion job queues
- Python NLP microservice using Mordecai3 + spaCy for geo-tagging
- Data sources: GDELT DOC API (primary), MediaStack (secondary)

## Locked product decisions

These are settled — don't re-litigate them in code or suggestions unless I explicitly raise them:

- Mapbox GL JS + Deck.gl is the map stack. Not Leaflet, not Google Maps, not raw CesiumJS.
- GDELT is the primary news source for Phase 2 (its GKG provides pre-tagged geo data, so we skip building a custom NER pipeline in v1).
- Scoring formula: per-article weight = `source_credibility × exp(-decay × hours_old) × topic_weight × severity`, then summed per country and normalized 0–100 across all countries. Conflict topics weight 1.5; entertainment 0.5.
- Deduplication on ingest: URL hash first, then title similarity. Ten reprints of one AP wire story count as one article.
- UI labels the metric as "Coverage Intensity" with a tooltip clarifying it measures media attention, not objective importance.

## Phase 1 scope boundary (do not build yet)

These belong to later phases — flag, don't implement:
- Any backend, database, or API route beyond what Phase 1 needs (Phase 1 reads a static JSON file)
- Real news ingestion or NER
- WebSocket / real-time updates (Phase 3+)
- Auth, user accounts, alerts (Phase 4)
- 3D globe rendering — keep as a toggle stub only
- Semantic search

## Code conventions

- TypeScript strict mode, no `any` without a comment justifying it
- ESM, not CommonJS
- React Server Components by default; mark client components with `'use client'` only when needed (anything touching Mapbox/Deck.gl is client-only)
- File naming: `kebab-case` for files, `PascalCase` for component exports
- Co-locate component, styles, and test in the same folder: `components/heat-map/heat-map.tsx`, `heat-map.test.tsx`
- Zustand stores live in `lib/stores/`, one store per domain (map, filters, panel)
- Mock data lives in `lib/mock/`, never imported from a component directly — go through a hook so the swap to real data in Phase 2 is a one-line change
- No inline Mapbox tokens. `NEXT_PUBLIC_MAPBOX_TOKEN` from `.env.local`. `.env.local` is gitignored.

## Folder structure (target)

```
app/                  # Next.js App Router pages
components/
  map/                # Map, HeatLayer, viewState sync
  panel/              # Country detail side panel
  filters/            # Filter bar
  ui/                 # Generic UI primitives
lib/
  stores/             # Zustand stores
  mock/               # Mock score data + mock article data
  hooks/              # useScores, useArticles, useMapView
  scoring/            # Pure scoring functions (used by mock now, real data later)
docs/                 # Framework + task list
public/
  data/               # Country GeoJSON (Natural Earth)
```

## Working rhythm

- Stop at section boundaries from `docs/phase1_tasks.md` so I can verify before continuing. Don't try to complete multiple sections in one go.
- Before adding a dependency, check that it isn't already covered by something installed.
- Run `npm run lint` and `npm run typecheck` after each section. Fix errors before moving on.
- For the Mapbox + Deck.gl integration specifically: write the smallest possible reproduction first (one country polygon, hardcoded color), confirm it renders, then generalize.

## Commands

To be filled in as the project takes shape:

```
npm run dev         # local dev server
npm run build       # production build
npm run lint        # eslint
npm run typecheck   # tsc --noEmit
npm test            # vitest (added in Section 1)
```

## Things to ask me about, not assume

- Mapbox style URL (light vs. dark base map) — I'll pick once the heat layer is rendering
- Specific country GeoJSON resolution (50m vs. 110m from Natural Earth) — start with 110m for performance
- Whether to add Storybook in Phase 1 (default: no, defer to Phase 3)
