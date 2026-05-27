# Handoff: Limelight — Daylight design direction

## Overview

Limelight is a news-intensity heatmap of the world. Countries are tinted by how loudly the world's media is reporting from them, and users dive in to read the underlying coverage. **Daylight** is the chosen visual direction: calm, editorial, "Apple News meets Stripe Press" — off-white paper, ink-black serif headlines, soft pastel heatmap (cream → peach → coral, never crimson), and a single coral accent for state.

The hero of the product is the world map, and it must support a **Globe ⇄ Flat** toggle. The globe is intentionally Google-Earth-like (orthographic projection, paper-globe shading, faint atmosphere); the flat view is a natural-earth projection of the same data.

This handoff covers the full product surface: home, country focus, article reader, and mobile home.

---

## About the design files

The files in `reference/` are **design references created in HTML/React** — prototypes that show the intended look and behaviour, not production code to copy directly.

The actual Limelight codebase (this is the `kkartikeye/Limelight` Next.js repo) uses **Mapbox GL** for the map, not the d3-geo SVG renderer used in these prototypes. The task is to recreate the Daylight design **inside that existing codebase**, using its established patterns:

- Map rendering stays in Mapbox GL (`src/components/map/`)
- Heat-fill expression in `src/components/map/heat-layer.tsx` swaps to the Daylight palette
- All UI chrome (header, panels, articles, filters) becomes new React components in the existing Next.js app
- The d3-geo code in the references is for visual reference only — don't port it

The label legibility work from the same study (`reference/Label Legibility Study v2.html`) is the source of truth for how country labels should render in Mapbox.

---

## Fidelity

**High-fidelity.** Colors, type sizes, spacing, and copy are final. Treat the references as pixel-perfect mockups. The few liberties: small differences between Mapbox label rendering and the SVG mockups are expected and acceptable.

---

## Design tokens

All tokens live in one object in `reference/daylight-shared.jsx` (`const DL = {...}`). Port these to your design system (Tailwind config, CSS variables, or a shared TS module — whichever matches the codebase).

### Colors

| Token | Hex | Usage |
|---|---|---|
| `PAPER` | `#f6f3ec` | Page background |
| `PAPER_2` | `#efeadf` | Inset / secondary surface |
| `CARD` | `#ffffff` | Floating cards above paper |
| `INK` | `#181613` | Primary text, headlines |
| `INK_2` | `#3a3025` | Secondary text, source attribution |
| `DIM` | `#7a7568` | Metadata, timestamps, captions |
| `DIM_2` | `#aaa492` | Tertiary text |
| `RULE` | `rgba(24,22,19,0.10)` | Hairline borders |
| `RULE_2` | `rgba(24,22,19,0.05)` | Lighter hairline borders |
| `CORAL` | `#e0573c` | Single accent. Live state, category tags, intense scores |
| `CORAL_50` | `#fff0ea` | Coral pill background |
| `CORAL_BD` | `#fac7b8` | Coral pill border |
| `LIVE` | `#2a8a5e` | "LIVE" indicator green |

### Heatmap palette

A 7-stop ladder, cream through peach through coral. **No black, no crimson.** No-data countries get a soft warm gray.

| Score range | Hex | Reads as |
|---|---|---|
| no data | `#e8e2d0` | warm gray |
| 0 < s < 5 | `#fbe6cd` | palest cream |
| 5–19 | `#fad9b3` | sand |
| 20–39 | `#f6bc8a` | warm peach |
| 40–59 | `#f0936b` | apricot |
| 60–79 | `#e26a4f` | terracotta |
| 80+ | `#c93e2a` | deep coral |

**Mapbox `fill-color` expression** to drop into `heat-layer.tsx`:

```ts
const HEAT_FILL_COLOR: mapboxgl.Expression = [
  "step",
  ["coalesce", ["get", "score"], 0],
  "#e8e2d0",       //   0 (no data)
  0.001, "#fbe6cd",//  >0
  5,     "#fad9b3",
  20,    "#f6bc8a",
  40,    "#f0936b",
  60,    "#e26a4f",
  80,    "#c93e2a",
];
```

Use `"fill-opacity": 1` on Daylight (not `0.8`) — the basemap is paper-cream, not dark, so we don't need transparency to maintain contrast. Switch basemap from `dark-v11` to `light-v11` (or a custom style with cream water).

### Globe shading

The orthographic globe is a paper-globe metaphor — warm highlight top-left, sand shadow bottom-right.

| Token | Hex |
|---|---|
| `GLOBE_HIGHLIGHT` | `#fbf6e9` |
| `GLOBE_SHADOW` | `#dccfb1` |
| `GLOBE_ATM` (atmosphere) | `#f0936b` |

In Mapbox, this maps to:
```ts
map.setFog({
  color: "#fbf6e9",
  "horizon-blend": 0.08,
  "high-color": "#fad9b3",
  "space-color": "#efeadf",
  "star-intensity": 0,
});
map.setProjection("globe");
```

### Typography

Load via Google Fonts:

```html
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=Manrope:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
```

| Token | Stack | Role |
|---|---|---|
| `DISPLAY` | `Newsreader, Source Serif 4, Georgia, serif` | Headlines, country names, hero numerics |
| `SANS` | `Manrope, IBM Plex Sans, system-ui, sans-serif` | Body, UI labels, article body |
| `MONO` | `IBM Plex Mono, ui-monospace, monospace` | Timestamps, ISO codes, eyebrow labels, metadata |

### Type scale

| Use | Family | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| Hero serif (home) | DISPLAY | 52 | 400 | -1.5 | 0.95 |
| Country name (focus) | DISPLAY | 128 | 400 | -4 | 0.85 |
| Country name (panel) | DISPLAY | 72 | 400 | -2 | 0.9 |
| Article headline | DISPLAY | 54 | 400 | -1.3 | 1.02 |
| Article deck (italic) | DISPLAY italic | 20 | 400 | normal | 1.45 |
| Article body | DISPLAY | 17.5 | 400 | normal | 1.55 |
| Section title | DISPLAY | 16 | 500 | normal | 1.3 |
| Stat number | DISPLAY | 30 | 500 | -0.6 | 1.0 |
| Mini stat number | DISPLAY | 24 | 500 | -0.4 | 1.0 |
| Headline list item | SANS | 14 | 500 | normal | 1.32 |
| Body / UI | SANS | 13 | 500 | normal | 1.4 |
| Metadata | SANS | 11–12 | 500–600 | normal | 1.4 |
| Eyebrow / mono labels | MONO | 10–11 | 500 | 0.12–0.18 (uppercase) | 1.0 |

### Spacing & radii

- Page horizontal padding: **44px**
- Section vertical rhythm: **22–28px** between blocks
- Card / panel inner padding: **14–28px**
- Hairline borders are 1px, always `RULE` or `RULE_2`
- Pill radius: `999px`
- Card radius: `12px` (small), `14px` (tooltips), `16px` (large cards), `18px` (filter pill)
- Phone bezel: `50px`
- No heavy shadows — use `0 10px 30px rgba(24,22,19,0.10)` for floating cards, never harder.

### Iconography

Use stroke-only icons at 1.3px stroke weight, `currentColor`, `round` linejoin/linecap. The reference file `daylight-shared.jsx` has a small `DLIcon` component with the set used: `search`, `bookmark`, `share`, `x`, `back`, `arrow`, `play`, `pause`. Replace or extend with the codebase's existing icon library (Lucide, Phosphor, etc.) if one exists — match the visual weight.

---

## Screens / views

There are five screens in the references. Each is in its own `reference/daylight-*.jsx` file.

### 1. Home — `daylight-home.jsx`

The hero. Renders in two variants based on a `view` prop: `"globe"` (default) or `"flat"`.

**Layout** (1280 × 800 desktop frame):

- **Top nav** (height 80, padding `22px 44px 18px`): logo (left), nav items (`Today`, `Regions`, `Topics`, `Saved`), vertical rule, mono clock (`Mon · 09:14 GMT`), sign-in button. Active nav item has 2px coral underline 22px below it. Active state is bold ink; inactive is `DIM` 500-weight.

- **Map column** (`flex: 1`, padding `8px 44px 0`):
  - Eyebrow + hero serif headline ("The shape of *the day's* news.") + dim subtitle, max-width 540px
  - **View toggle** (top-right): pill containing "Globe" and "Flat" with small icons. Active option is ink-on-paper; inactive is dim text on transparent.
  - Map area (centered, 820 × 480), see "Map specifics" below
  - Coral pulse markers on countries with score ≥ 70 (small circle + soft outer halo)
  - Tooltip card (220px wide) floating over Iran with leader-line. Shows country name, ISO, intensity bar, category, article count.
  - **Bottom strip** (absolute, `left:44 right:44 bottom:22`): filter pill on the left, heat legend on the right.

- **Story panel** (`width: 380`, `borderLeft: 1px solid RULE`, padding `16px 36px 22px 28px`):
  - Eyebrow `In focus` + Save action
  - Huge serif country name (Iran, 72px)
  - Intensity pill + #5 globally + LIVE indicator
  - Stats row (Velocity, Articles, Sources) — 3 columns inside top/bottom hairlines, padding 14px
  - "Top headlines" eyebrow
  - 5 headline rows, each: 2-digit mono index, headline (14px sans 500), source · category · time row

### 2. Home / Flat variant

Same component, `view="flat"`. Map switches to natural-earth projection, no globe shading, no atmosphere. Ocean gets a subtle warm tint (`rgba(216,209,189,0.4)`). The view toggle reflects the state. Everything else is identical.

### 3. Country focus — `daylight-country.jsx`

User clicked Iran. Map shrinks; the lower half becomes a curated feed.

**Layout** (1280 × 800):

- Top nav (same as home, `active="Today"`)
- **Breadcrumb row** (padding `16px 44px 0`): back arrow + "Today" · "Middle East" · **Iran** (bold). Right side: mono "Updated 4 min ago"
- **Two-column body** (padding `20px 44px 0`):
  - **Left column** (`flex: 1`, paddingRight 36):
    - Country header: 128px serif name + small mono ISO/coords + LIVE indicator
    - Stats row: 5 stats (Intensity, Articles, Velocity, Sentiment, Rank) — each with eyebrow / 30px number / sub-caption, separated by light vertical rules, inside top/bottom hairlines
    - Hero story block: eyebrow + 38px serif headline + 16px deck in `INK_2` + source/category/Read metadata row
  - **Right column** (`width: 460`, `borderLeft: 1px solid RULE`, paddingLeft 28):
    - "Location" mini-globe card (200px tall, rotated to centre on Iran, with a marker)
    - "All coverage · grouped by theme" eyebrow
    - Three theme groups (`Diplomacy`, `On the ground`, `Markets`), each with serif group title + count + 2 articles. Each article: 13.5px bold headline + 12px summary + source/time meta.

### 4. Article reader — `daylight-article.jsx`

Long-form reading layout.

**Layout** (1280 × 800):

- Top nav
- Breadcrumb (`Iran · Conflict`) + Save / Share actions on the right
- **Two-column body**:
  - **Reading column** (`flex: 1`, padding `28px 44px 0`, content max-width 660):
    - Eyebrow `Live · Conflict · Iran`
    - 54px serif headline (`text-wrap: balance`)
    - 20px italic deck in `INK_2`
    - Byline strip (top/bottom hairlines): avatar circle + source + timestamp + intensity pill + LIVE
    - Body (Newsreader 17.5px, line-height 1.55), with a 62px serif drop cap on the first paragraph (using `float: left` and tight line-height)
  - **Sidebar** (`width: 360`, `borderLeft: 1px solid RULE`):
    - "Story location" mini-globe (180px) with a dashed leader line from Iran → Israel and labels below ("Iran → Israel" + distance)
    - "Mentioned" tag cloud: pills with coral background for high-importance, white background for low
    - "See also" list: 3 related articles with numbered tile + headline + source/time

### 5. Mobile home — `daylight-mobile.jsx`

iPhone-shaped (390 × 844 in a bezel), same design system collapsed to single column.

**Layout**:

- Status bar (9:41 + status icons, with notch placeholder)
- Top nav: logo + wordmark, search icon button (right)
- Hero label: small eyebrow + 36px serif headline
- Globe (300 × 240, centered), with view toggle floating top-right
- Time-window chips row (centered, smaller variant)
- Feed: 3 article rows, each with category eyebrow / 14.5px headline / source · time · country chip
- Bottom tab bar (frosted, 4 tabs: Today / Regions / Topics / Saved). Active is coral; inactive is dim. Home indicator bar at the very bottom.

---

## Interactions & behaviour

The references are static; below is the intended behaviour for the implementation.

### Map (home view)

- **Globe ⇄ Flat toggle**: switches Mapbox between `setProjection("globe")` and `setProjection("naturalEarth")`. Persist preference in `localStorage` as `limelight:projection`.
- **Hover a country**: tooltip card appears anchored to the country's centroid (offset to avoid covering it). Card shows country name, ISO, intensity bar, category, article count. Use Mapbox `mousemove` on the heat-fill layer.
- **Click a country**: navigate to `/country/[iso]` (the country focus screen).
- **Time-window pills** (`1h`, `6h`, `24h`, `7d`, `30d`): selecting one refetches the heatmap data with that window. Active is ink/paper inversion.
- **Category pills** (Conflict, Politics, etc.): toggle filters; the heatmap recomputes.
- **Live indicator** (`↻ 4 min ago`): polls the heatmap endpoint every 60s. Show "↻ Xs/min/ago" timestamp.
- **Coral pulse markers**: animated SVG / Mapbox circle for score ≥ 70 — soft 0.18-alpha 5px halo + solid 3px dot. Subtle 1.6s opacity pulse on the halo only.

### Country focus

- **Back arrow**: routes back to `/` (home).
- **Stats**: live-updated when polling refreshes.
- **Article click**: routes to `/article/[id]`.

### Article reader

- **Back arrow**: routes to `/country/[iso]`.
- **Save / Share**: standard browser handlers.
- **Mentioned chips**: clicking a country chip routes to its focus screen.
- **See also**: routes to `/article/[id]` for the picked article.

### Header

- Active nav item gets the 2px coral underline transition.

### Animations

Keep them quiet — this is editorial, not playful.
- View toggle: 150ms ease
- Tooltip fade: 120ms
- Coral pulse halo: `1.6s ease-in-out infinite alternate` on opacity (0.4 ↔ 1)
- Route transitions: simple fade, 200ms, no slide

---

## State management

Component-level state for everything except:

- **Filters** (time window, categories): app-wide, lives in a `useFilters()` hook or React Context. Drives both the map heat-color expression and the article-list fetch.
- **Projection** (globe/flat): app-wide, persisted in `localStorage`.
- **Live polling**: a single interval at the top of the tree, dispatches to filters/map state.

Data fetching matches the existing repo:
- `/api/heatmap?window=24h&categories=conflict,politics` → `{ [iso]: { score, articles, velocity, ... } }`
- `/api/articles?country=irn&window=24h` → `[{ id, headline, source, category, time, body, ... }]`
- `/api/articles/[id]` → single article with mentioned places, related, etc.

---

## Map / label specifics

The earlier study (`reference/Label Legibility Study v2.html`) is the source of truth here. Summary of the recommendation, restated for Daylight:

**Country labels** (custom symbol layer on the `countries` source — Mapbox basemap labels suppressed):

```ts
const LABEL_TEXT_COLOR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["get", "score"], 0], 0], "#3a2a1a", // no data → dark ink (works on cream paper)
  ["<",  ["get", "score"], 55],                  "#1a140a", // light bucket
  "#fffaef"                                                  // dark bucket
];

const LABEL_HALO_COLOR: mapboxgl.Expression = [
  "case",
  ["==", ["coalesce", ["get", "score"], 0], 0], "rgba(246,243,236,0.85)", // paper-tone halo
  ["<",  ["get", "score"], 55],                  "rgba(255,255,255,0.7)",
  "rgba(26,14,8,0.95)"
];

map.addLayer({
  id: "country-label-custom",
  type: "symbol",
  source: "countries",
  layout: {
    "text-field": ["get", "ADMIN"],
    "text-font": ["Manrope Medium", "Arial Unicode MS Regular"], // upload to your Mapbox style
    "text-size": ["interpolate", ["linear"], ["zoom"], 2, 10, 4, 12, 6, 14],
    "text-letter-spacing": 0.04,
    "symbol-sort-key": ["-", 100, ["coalesce", ["get", "score"], 0]],
  },
  paint: {
    "text-color": LABEL_TEXT_COLOR,
    "text-halo-color": LABEL_HALO_COLOR,
    "text-halo-width": 1.4,
    "text-halo-blur": 0.3,
  },
});

if (map.getLayer("country-label")) {
  map.setLayoutProperty("country-label", "visibility", "none");
}
```

**Region labels** (continent caps like ASIA, AFRICA): opacity 0.5, Manrope 700, +0.18 letter-spacing, uppercase. Demote them visually below country labels.

**Ocean labels** (Indian Ocean, etc.): italic Newsreader, `#9ab4c8`, no halo on flat view, halo `rgba(0,0,0,0.6)` 1px on globe view (where ocean is darker).

---

## Component inventory

Components a developer should build (all in TSX or whatever the codebase uses):

- `<DLLogo />` — the concentric-rings mark, sized
- `<Header active="Today" />` — top nav with active underline
- `<ViewToggle value="globe" onChange={...} />` — globe/flat pill
- `<FilterPill window="24h" categories={[...]} onChange={...} />` — combined time + category filter
- `<HeatLegend />` — small gradient strip
- `<Tooltip country={...} />` — hover card for the map
- `<IntensityPill score={85} />` — coral pill
- `<LiveBadge />` — green dot + "LIVE"
- `<Stat label="Velocity" value="+38%" sub="vs 7-day avg" accent={true} />` — stat tile
- `<HeadlineRow index={1} article={...} />` — list-row variant
- `<ArticleCard variant="grouped" article={...} />` — card-row variant with summary
- `<MiniGlobe rotation={[-30,-15,0]} markers={[...]} />` — reusable orthographic locator
- `<MentionedChip importance="high" />` — coral or white pill
- `<RelatedArticle index={1} article={...} />` — see-also tile
- `<BottomTabBar />` — mobile tab bar

---

## Assets

- **Fonts**: Newsreader, Manrope, IBM Plex Mono — Google Fonts (URL above)
- **Logo**: drawn in CSS (concentric circles, coral + paper + coral). Keep as inline SVG/CSS component, not an image file. If you want a "mark + wordmark" SVG export, ask for one.
- **Icons**: small stroke set drawn inline (see `DLIcon` in `daylight-shared.jsx`). Replace with codebase's existing icon library if one exists — match weight (1.3px stroke).
- **Map data**: stays in Mapbox. Country geometries come from your existing `countries` source.
- **No images required** in the design itself. The article reader does not show hero images by design — this is an editorial choice; if the codebase wants them later, they should slot in below the deck and above the byline strip, at full reading-column width.

---

## Files in `reference/`

| File | What it is |
|---|---|
| `Limelight - Daylight.html` | The host HTML — open this in a browser to see all 5 screens on a pan/zoom canvas |
| `world.jsx` | The d3-geo SVG map renderer used by the prototypes. **Reference only** — production uses Mapbox |
| `daylight-shared.jsx` | The `DL` tokens object + shared components (header, toggle, filter pill, legend, icon set) |
| `daylight-home.jsx` | Home screen (globe + flat variants) |
| `daylight-country.jsx` | Country focus screen |
| `daylight-article.jsx` | Article reader |
| `daylight-mobile.jsx` | Mobile home screen |
| `design-canvas.jsx` | The pan/zoom canvas wrapper used to present the screens side-by-side. Not needed in production |
| `Label Legibility Study v2.html` | The companion study on how country labels should render against the heatmap. Source of truth for the Mapbox label expressions above |

---

## Implementation order (suggested)

1. **Tokens first.** Port the `DL` object to your design system. Add the Google Fonts link.
2. **Header.** Get the masthead with active underline in place.
3. **Map palette.** Swap the existing YlOrRd `heat-fill` to the Daylight ladder. Switch basemap to a paper-cream style.
4. **Globe projection.** Add `setProjection("globe")` + fog settings. Wire the view toggle to persist in localStorage.
5. **Labels.** Add the custom symbol layer + label expressions. Suppress basemap country labels.
6. **Home story panel.** Right-side article shelf.
7. **Country focus route** (`/country/[iso]`).
8. **Article reader route** (`/article/[id]`).
9. **Mobile.** Responsive treatment.
10. **Animations & polish.** Coral pulse, live polling, tooltip leader lines.

---

## Questions for the designer

If something is ambiguous, ask before guessing. Common ones:

- Do we want hero images in articles? (Currently no — editorial choice)
- Should the globe rotate on idle? (Currently no — paper-globe is meant to feel stable)
- Dark-mode pairing? (Not yet — Daylight is intentionally a light treatment)
- Mobile country focus / article reader screens? (Not in this handoff — extrapolate from desktop or request)
