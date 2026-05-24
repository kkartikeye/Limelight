# NewsMap — Product & Technical Framework
**A Map-Based Global News Visualization App**
*Founder Framework & Roadmap — Pre-Build Planning Document*

---

## 1. Product Concept

### Core User Experience
The app presents the world as a living, breathing news surface. Instead of a feed or a list, the user opens a globe or 2D world map and immediately sees where the world is "on fire" — countries and regions with high news activity glow red or orange, while quieter areas remain cool. The user can zoom in, hover, click, filter, and explore. It is part situational awareness tool, part data journalism product, part global news explorer.

The experience mirrors the intuition of looking at a weather radar — you understand the story before reading a single word.

### Main Value Proposition
> *"See the world's news before you read it."*

- **For casual users**: A visually compelling, low-friction way to understand what's happening globally — no doomscrolling required.
- **For analysts and researchers**: A geospatial lens on news volume, sentiment, and intensity across regions and time.
- **For journalists and editors**: A real-time signal for where stories are breaking and which regions are underreported.

### Target Users

| User Type | Primary Use Case |
|---|---|
| Informed general public | Daily global awareness at a glance |
| Journalists & media professionals | Identifying breaking story clusters |
| Policy analysts & think tanks | Monitoring regional instability |
| Students & academics | Research, geopolitical education |
| Investors & risk teams | Geopolitical risk signal |
| NGOs & humanitarian orgs | Monitoring crisis regions |

---

## 2. Core Features

### 2.1 Interactive Global Map / Globe View
- Default view: 2D Mercator map or 3D globe
- Smooth pan, zoom, and tilt (if 3D)
- Country-level shading at low zoom; city/region-level at high zoom
- Time scrubber to move backward through 24h, 7d, 30d windows

### 2.2 News Heat Map
- Country or region polygons filled with a color gradient (cool → hot) based on news intensity score
- Intensity = a computed score based on article volume, recency, source credibility, and topic severity
- Heat map updates on a configurable refresh interval (e.g., every 15–30 minutes for MVP)
- Toggle between absolute intensity and relative intensity (to surface underreported stories)

### 2.3 Location Click → News Panel
- Clicking a country/region slides in a right-hand panel
- Panel shows: top 5–10 headlines, article snippets, source names, timestamps, and links
- Stories sorted by relevance + recency hybrid score
- Panel also shows a mini sparkline of news volume over time for that region

### 2.4 Filters
- **Category**: Politics, Conflict, Economy, Climate, Technology, Health, Sports, Culture
- **Time period**: Last 1h, 6h, 24h, 7d, 30d
- **Source type**: Major wire services, regional outlets, government sources, social aggregators
- **Severity / importance**: Breaking news, High importance, General coverage
- Filters update the heat map and scores in real time

### 2.5 Search
- Type-ahead search for countries, cities, topics, named events (e.g., "Gaza," "COP30," "Taiwan Strait")
- Returns matching regions on the map + filtered news panel
- Topic search should support semantic matching (not just keyword)

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│   Map Renderer (Mapbox/Deck.gl) + UI Shell (React/Next.js)     │
│   Heat Map Layer │ Sidebar Panel │ Filters │ Search             │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / WebSocket
┌────────────────────────────▼────────────────────────────────────┐
│                          API LAYER                              │
│         Node.js / FastAPI — Public-facing REST endpoints        │
│   /heatmap  │  /articles  │  /search  │  /regions  │  /scores  │
└────────────────────────────┬────────────────────────────────────┘
                             │
       ┌─────────────────────┼────────────────────────┐
       │                     │                        │
┌──────▼──────┐   ┌──────────▼──────────┐   ┌────────▼────────┐
│  SCORING    │   │    ARTICLE STORE    │   │  GEO/ENTITY     │
│  ENGINE     │   │  PostgreSQL + Redis │   │  EXTRACTION     │
│  (Python)   │   │                     │   │  (NLP Service)  │
└──────┬──────┘   └──────────┬──────────┘   └────────┬────────┘
       │                     │                        │
       └─────────────────────┼────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                    INGESTION PIPELINE                           │
│   Scheduled Jobs (CRON / Celery) → News APIs + RSS Parsers     │
│   Dedup Engine │ Source Registry │ Raw Article Queue (Redis)   │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Frontend Structure
- **Framework**: Next.js (React) — SSR for SEO, fast initial load
- **Map layer**: Mapbox GL JS or Deck.gl rendered inside a React component
- **State management**: Zustand or React Query for filter state and server-synced data
- **UI components**: Tailwind CSS + Radix UI for accessible primitives
- **Real-time updates**: WebSocket or Server-Sent Events (SSE) for live heat map refresh

**Key frontend components:**
```
/components
  MapCanvas.tsx         — Map renderer wrapper
  HeatLayer.tsx         — GeoJSON polygon color layer
  ArticleSidebar.tsx    — Click-to-read panel
  FilterBar.tsx         — Category, time, source filters
  SearchModal.tsx       — Global search UI
  ScoreLegend.tsx       — Heat map color scale key
  TimeSlider.tsx        — Historical scrubbing control
```

### 3.3 Backend Structure
- **API Server**: FastAPI (Python) or Node.js/Express
- **Background Workers**: Celery + Redis (Python) or BullMQ (Node) for scheduled ingestion
- **NLP/Geo Service**: Python microservice (spaCy + custom logic) for entity/location extraction
- **Scoring Engine**: Python service that computes intensity scores per region on a schedule
- **Cache**: Redis for computed heat map scores and frequently requested region data

### 3.4 News Data Ingestion Pipeline

```
News Source (API / RSS / Scrape)
        ↓
  Raw Article Queue (Redis)
        ↓
  Deduplication Check (URL hash + title similarity)
        ↓
  NLP Enrichment:
    - Named Entity Recognition (NER) → People, Orgs, Locations
    - Geolocation tagging → Map coordinates + country code
    - Category classification → Politics, Conflict, Economy, etc.
    - Sentiment/severity scoring → Neutral, Negative, Critical
        ↓
  Enriched Article → PostgreSQL (articles table)
        ↓
  Score Aggregation Job (every 15 min)
        ↓
  Heat Map Scores → Redis cache (keyed by region + time bucket)
        ↓
  Frontend API serves cached scores
```

### 3.5 Geolocation & Entity Extraction
This is the most technically nuanced part of the system. Every article must be tagged to one or more geographic locations.

**Approach (layered):**
1. **Structured metadata**: Some APIs provide country/region tags — use them first.
2. **NER (Named Entity Recognition)**: Use spaCy (`en_core_web_lg`) or a fine-tuned BERT model to extract location mentions from article titles and bodies.
3. **Geo-disambiguation**: Map extracted place names to ISO 3166 country codes and coordinates using a gazetteer (GeoNames dataset or Nominatim).
4. **Primary vs. secondary location**: An article about "EU sanctions on Russia" is primarily about Russia, secondarily about the EU. Use heuristics (first mention, frequency of mention, subject of headline) to assign primary location.
5. **Fallback**: Articles with no extractable location are held in an "untagged" bucket for manual review or discarded.

### 3.6 Heat Map Scoring Engine
*(See also Section 5 for formula detail)*
- Runs as a scheduled job every 15–30 minutes
- Reads articles from the last N hours, grouped by primary location
- Computes intensity score per country/region
- Writes scores to Redis with a TTL matching the refresh interval
- Scores are served as a flat JSON object: `{ "IRN": 87, "UKR": 94, "USA": 45, ... }`

### 3.7 Database Design

**PostgreSQL Tables:**

```sql
-- Core articles
articles
  id            UUID PK
  external_id   VARCHAR (source-side ID or URL hash)
  title         TEXT
  body_snippet  TEXT (first 500 chars)
  url           TEXT
  published_at  TIMESTAMPTZ
  source_id     UUID FK → sources
  category      VARCHAR
  sentiment     FLOAT (-1 to 1)
  severity      INTEGER (1–5)
  created_at    TIMESTAMPTZ

-- Geo tags (many-to-many: one article → many locations)
article_locations
  id            UUID PK
  article_id    UUID FK → articles
  country_code  CHAR(3)  (ISO 3166-1 alpha-3)
  region_name   VARCHAR
  city_name     VARCHAR
  latitude      FLOAT
  longitude     FLOAT
  is_primary    BOOLEAN
  confidence    FLOAT

-- Sources registry
sources
  id            UUID PK
  name          VARCHAR
  domain        VARCHAR
  credibility   FLOAT (0–1, manually or ML-assigned)
  source_type   VARCHAR (wire, national, regional, blog)
  language      CHAR(2)

-- Precomputed scores (for fast heat map rendering)
region_scores
  id            UUID PK
  country_code  CHAR(3)
  time_bucket   TIMESTAMPTZ (e.g., hourly)
  score         FLOAT
  article_count INTEGER
  computed_at   TIMESTAMPTZ
```

### 3.8 API Layer

| Endpoint | Method | Description |
|---|---|---|
| `/api/heatmap` | GET | Returns score map `{countryCode: score}` for a time window |
| `/api/articles` | GET | Returns paginated articles for a country + filters |
| `/api/regions/:code` | GET | Returns metadata + score history for a region |
| `/api/search` | GET | Semantic search across articles, locations, topics |
| `/api/sources` | GET | Lists available news sources |
| `/api/scores/history` | GET | Score over time for a region (for sparklines) |

---

## 4. Data Sources

### 4.1 Recommended News APIs

| Source | Type | Coverage | Cost | Notes |
|---|---|---|---|---|
| **NewsAPI.org** | Paid API | 80,000+ sources, global | ~$450/mo (dev plan free, limited) | Best for MVP; easy to integrate |
| **GDELT Project** | Free dataset | Global, 100+ languages | Free | Massive dataset; complex; great for NLP |
| **MediaStack** | Paid API | 7,500+ sources | From $19.99/mo | Simpler, cheaper alternative to NewsAPI |
| **NewsCatcher** | Paid API | 60,000+ sources | From $99/mo | Strong NLP metadata included |
| **The Guardian API** | Free API | Guardian content only | Free | Good for English-language, credible content |
| **Reuters / AP** | Syndication | Wire service | Enterprise only | Best for credibility; expensive |
| **RSS Feeds** | DIY | Varies | Free | Aggregating 50–200 curated feeds is viable at MVP |
| **GDELT GKG** | Free dataset | Global Knowledge Graph | Free | Pre-tagged with locations, themes, sentiment |

### 4.2 Tradeoffs: Paid API vs. Free vs. RSS vs. Scraping

| Approach | Pros | Cons | Recommended For |
|---|---|---|---|
| **Paid News API** | Structured, reliable, high volume | Cost scales with usage; ToS restrictions on display | MVP + early growth |
| **Free APIs** (GDELT, Guardian) | No cost; broad coverage | Limited control; complex formats | Supplementary / augmentation |
| **RSS Aggregation** | Free; curated quality | Manual curation; inconsistent schemas | Early MVP fallback |
| **Web Scraping** | Full control; any source | Legal risk; fragile; maintenance burden | Avoid unless necessary |

**Recommended MVP combo**: NewsAPI.org (or MediaStack) as primary, supplemented by GDELT GKG for geo-enrichment, with 20–30 curated RSS feeds for regional diversity.

### 4.3 Source Credibility, Duplicates, and Breaking News

**Credibility:**
- Maintain a manual source registry with a credibility score (0–1) based on Mbfc (Media Bias/Fact Check) or similar.
- Weight article contributions to the heat map by source credibility.
- Flag low-credibility sources in the UI but don't exclude them — transparency matters.

**Deduplication:**
- Hash article URLs to prevent identical re-ingestion.
- Use fuzzy title matching (cosine similarity on TF-IDF vectors) to cluster near-duplicate articles from different sources.
- When duplicates are detected, merge into a canonical story cluster; count the cluster once (not N times) in scoring.

**Breaking News:**
- Apply a "breaking news boost" — articles published within the last 2 hours get a recency multiplier.
- Flag articles with keywords like "breaking," "urgent," "developing" in title for visual callout in the sidebar panel.

---

## 5. Heat Map Logic

### 5.1 What "News Intensity" Represents
Intensity is not raw article count — it is a weighted composite signal representing *how much real-world significance is currently concentrated in a geographic area*, as reflected through news coverage.

### 5.2 Scoring Inputs

| Signal | What It Captures |
|---|---|
| **Article Volume** | Raw count of articles mentioning this location in the time window |
| **Recency** | How fresh the articles are — recent articles count more |
| **Source Credibility** | Articles from Reuters/BBC count more than a local blog |
| **Topic Severity** | Conflict/disaster/crisis articles count more than sports |
| **Sentiment/Negativity** | Negative sentiment often correlates with high-impact events |
| **Story Diversity** | Multiple independent stories > multiple duplicates of one story |

### 5.3 MVP Scoring Formula

```
Score(region, time_window) =
  Σ over all articles i tagged to region:
    (credibility_weight_i × recency_decay_i × severity_weight_i) / cluster_dedup_factor

Where:
  credibility_weight   = source.credibility (0.2 to 1.0)
  recency_decay        = e^(-λ × hours_since_published)   [λ ≈ 0.1 for 24h window]
  severity_weight      = category_severity_map[article.category]
                         e.g., { Conflict: 2.0, Politics: 1.5, Economy: 1.2, Sports: 0.5 }
  cluster_dedup_factor = max(1, 0.5 × duplicate_cluster_size)

Final score normalized to 0–100 across all regions for display.
```

**Category severity map (starter values):**
```
Conflict / War         → 2.5
Disaster / Emergency   → 2.0
Politics / Elections   → 1.5
Economy / Finance      → 1.2
Technology             → 1.0
Health                 → 1.3
Climate                → 1.2
Sports                 → 0.6
Culture / Entertainment→ 0.5
```

### 5.4 Avoiding Misleading Results

**Problem 1 — Duplicate inflation**: A single event covered by 200 outlets shouldn't score 200x higher than an event covered by 10 outlets.
→ *Solution*: Cluster near-duplicate articles into story groups. Count each cluster once, but boost weight slightly for highly-covered clusters (logarithmic scaling: `log(1 + n_sources)`).

**Problem 2 — Source bias** (US/UK media over-cover Western countries):
→ *Solution*: Apply a "coverage gap" correction — optionally normalize scores by expected baseline coverage for that country, surfacing regions that are "over-performing" their normal coverage baseline.

**Problem 3 — Low-credibility noise**:
→ *Solution*: Floor credibility weight at 0.2; cap contribution from any single low-credibility source per region.

**Problem 4 — Population/country-size bias** (big countries have more news by default):
→ *Solution*: Offer an optional "per capita" view that normalizes by country population.

---

## 6. Map / Visualization Layer

### 6.1 Library Comparison

| Library | Type | Strengths | Weaknesses | Best For |
|---|---|---|---|---|
| **Mapbox GL JS** | 2D/3D web map | Stunning visuals, fast, custom styles, great docs | $0.50/1k map loads (free tier limited) | MVP → Production |
| **Deck.gl** | Data visualization on maps | Built for big data layers, works with Mapbox | More complex API; not a standalone map | Heat layers on top of Mapbox |
| **Leaflet** | 2D web map | Free, lightweight, huge ecosystem | Dated feel; limited 3D support | Budget MVP only |
| **CesiumJS** | 3D globe | Photorealistic globe, great for geospatial | Heavy; complex; overkill for news app | Aerospace/GIS apps |
| **Google Maps Platform** | 2D/3D web map | Familiar UX; good geocoding | $200/mo free then pay-per-use; less visual control | If you need Google's geocoding |
| **Google Earth Engine** | Geospatial analysis | Planet-scale data analysis | Not a web UI library; server-side only | Scientific analysis, not this app |

### 6.2 Recommendation for MVP

**Use Mapbox GL JS + Deck.gl together.**

- Mapbox provides the base map, tiles, and styling engine.
- Deck.gl's `GeoJsonLayer` renders country polygons with your heat scores as fill colors.
- This combination gives you a production-quality visual without CesiumJS complexity.
- Mapbox free tier (50,000 map loads/month) is sufficient for an early MVP.

**Rendering the heat map:**
1. Load a GeoJSON file of world country polygons (Natural Earth Data — public domain).
2. Join your score data (`{ IRN: 87, UKR: 94, ... }`) to the GeoJSON features by ISO country code.
3. Map score → color using a perceptually uniform scale (e.g., `d3-scale-chromatic` viridis or custom cool-to-hot gradient).
4. Re-fetch scores every 15–30 minutes and re-render the layer.

**For city/region-level zoom:**
- At zoom levels 5+, switch to a point-cluster layer showing city-level news pins.
- Use a different GeoJSON source (admin-level-1 regions from Natural Earth for state/province polygons).

### 6.3 Heat Map Update Strategy
- **Polling**: Frontend polls `/api/heatmap` every 5–15 minutes via React Query with `refetchInterval`.
- **WebSocket (Phase 3+)**: Push score updates from backend when a significant score change occurs (>10 point delta) — avoids unnecessary redraws.
- **Smooth transitions**: Animate fill-color changes with a CSS/WebGL transition over 1–2 seconds so the map doesn't "flash."

---

## 7. MVP Build Plan

### Phase 1 — Static Map with News Pins / Shading *(Weeks 1–4)*

**Goal**: A working map that shows news stories by location. Manual or semi-manual data.

**Tasks:**
- Set up Next.js project with Mapbox GL JS
- Load world GeoJSON and render country polygons
- Manually curate a small dataset of 50–100 articles with country codes
- Color polygons by article count (simple version, no scoring formula yet)
- Click a country → show list of articles in sidebar
- Deploy to Vercel

**Challenges:**
- Getting Mapbox token setup and GeoJSON polygon join working
- Styling the map to look "news-appropriate" (dark base map, clear country borders)

**Success Criteria:**
- Map renders in < 2 seconds
- Clicking 10 countries correctly shows associated articles
- Color gradient visually distinguishes high vs. low activity

---

### Phase 2 — Automated Ingestion + Location Tagging *(Weeks 5–10)*

**Goal**: Articles flow in automatically and get tagged to countries without manual work.

**Tasks:**
- Integrate NewsAPI.org (or MediaStack) with a scheduled ingestion job (every 30 min)
- Build deduplication logic (URL hash + title similarity)
- Integrate spaCy NER for location extraction
- Build geo-disambiguation layer (spaCy → GeoNames lookup → ISO code)
- Store enriched articles in PostgreSQL
- Wire `/api/heatmap` and `/api/articles` endpoints
- Frontend polls the API and renders real data

**Challenges:**
- NER accuracy — "Washington" could be a city, a state, or a person's surname
- Disambiguation failures for ambiguous place names
- API rate limits from news providers

**Success Criteria:**
- >80% of ingested articles successfully tagged to at least one country
- Map auto-updates without manual data entry
- Ingestion pipeline processes 500+ articles/day without crashing

---

### Phase 3 — Scoring Engine + Filters + Search *(Weeks 11–16)*

**Goal**: The heat map reflects real weighted news intensity, and users can filter and search.

**Tasks:**
- Implement the full scoring formula (credibility × recency × severity / dedup)
- Build scheduled scoring job (every 15 min), write results to Redis
- Add category, time, and severity filter UI
- Implement search (Postgres full-text search or Typesense for MVP)
- Add sparkline chart to the region sidebar panel
- Add time scrubber for historical heat map playback

**Challenges:**
- Score normalization — ensuring Iran at "87" and the US at "45" are meaningful comparisons
- Filter performance — recomputing scores on the fly for filtered subsets is expensive; may need precomputed score variants
- Search relevance tuning

**Success Criteria:**
- Heat map scores feel semantically correct (war zones appear hotter than routine news days)
- Filters update the map in < 500ms
- Scoring job completes in < 60 seconds for 5,000 articles

---

### Phase 4 — Personalization, Alerts, and Analytics *(Weeks 17–26)*

**Goal**: Retention features and deeper analytical value.

**Tasks:**
- User accounts (Auth.js / Clerk) with saved filter presets
- Email or push alerts: "Alert me when news intensity in Taiwan exceeds X"
- Region comparison view: side-by-side score history for two countries
- "Trending" panel: regions with fastest score increase in last 2 hours
- Sentiment breakdown by region (% positive/neutral/negative)
- Source bias transparency: show which outlets are driving a country's score
- Optional 3D globe view (switch from 2D Mercator to globe projection)

**Challenges:**
- Alert system infrastructure (email provider, job queues, user preferences DB)
- Performance at scale — 10,000+ articles/day requires more robust infrastructure
- Avoiding alert fatigue

**Success Criteria:**
- Alert delivery < 5 min from trigger event
- User retention metric: >40% of users return within 7 days
- NPS > 40 from beta users

---

## 8. Recommended Tech Stack

### Full Stack Summary

| Layer | Tool | Rationale |
|---|---|---|
| **Frontend Framework** | Next.js 14 (App Router) | SSR, SEO, file-based routing, Vercel-native |
| **Map Rendering** | Mapbox GL JS + Deck.gl | Best visual quality + data layer performance |
| **UI Styling** | Tailwind CSS + shadcn/ui | Fast, consistent, accessible |
| **State / Data Fetching** | React Query (TanStack) | Built-in polling, caching, loading states |
| **Backend Framework** | FastAPI (Python) | Fast, typed, great for ML/NLP co-location |
| **Background Jobs** | Celery + Redis | Reliable task queue for ingestion + scoring |
| **NLP / Entity Extraction** | spaCy + GeoNames | Production-grade NER; GeoNames for disambiguation |
| **Primary Database** | PostgreSQL (Supabase) | Relational, full-text search, managed |
| **Cache / Queue** | Redis (Upstash) | Heat map score cache + job queue |
| **Search** | Typesense (self-hosted) or Supabase FTS | Fast, typo-tolerant; free to self-host |
| **News Data** | NewsAPI.org + GDELT GKG | Broad coverage; GDELT is free and pre-geo-tagged |
| **Hosting — Frontend** | Vercel | Zero-config Next.js, global CDN |
| **Hosting — Backend** | Railway or Render | Easy Python deployment, affordable |
| **Auth (Phase 4)** | Clerk or Auth.js | Auth with least setup overhead |
| **Monitoring** | Sentry + Posthog | Error tracking + product analytics |
| **GeoJSON Data** | Natural Earth Data | Free, public domain world polygon files |

### Why Not X?
- **Not Django**: FastAPI is leaner and async-native; better for high-throughput ingestion.
- **Not MongoDB**: Articles have relational structure (articles → locations → sources); Postgres is better.
- **Not CesiumJS**: Overkill for this use case; adds 3MB+ to bundle.
- **Not Google Maps**: More expensive and less visual flexibility than Mapbox.

---

## 9. Risks and Challenges

### 9.1 News Bias
**Risk**: Western media dominates English-language news APIs. Africa, Central Asia, and Southeast Asia will be systematically underrepresented, making those regions appear "cold" regardless of actual activity.

**Mitigations:**
- Include regional RSS feeds from outlets like Al Jazeera, Africa News, Rappler, Dawn.
- Add an "Expected vs. Actual Coverage" mode showing deviations from baseline.
- Use GDELT, which ingests from 100+ language sources.
- Surface a "Coverage Gap" indicator in the UI.

### 9.2 Misinformation
**Risk**: Amplifying false or misleading stories through the heat map (e.g., a coordinated disinformation campaign generates high article volume, inflating a country's score).

**Mitigations:**
- Weight low-credibility sources at minimum; don't exclude them, but flag them visually.
- Do not display article content directly — link out to sources.
- Use MBFC or NewsGuard ratings for source credibility scores.
- Consider a "credible sources only" filter mode.

### 9.3 API Cost
**Risk**: NewsAPI costs scale with request volume; at 10,000+ users, ingestion cost could become significant.

**Mitigations:**
- Cache aggressively — don't re-fetch articles already ingested.
- Use GDELT (free) as a primary source; use paid APIs as supplementary.
- Build your RSS aggregator as a cost-free fallback layer.
- Set hard rate limits and budget alerts from day one.

### 9.4 Geolocation Accuracy
**Risk**: NER misidentifies location, or correctly identifies a place name but assigns it to the wrong country (e.g., "Georgia" = US state or country in the Caucasus).

**Mitigations:**
- Use context-aware disambiguation (surrounding entities provide context).
- When confidence is below a threshold, tag the article as "unconfirmed location" and exclude from scoring.
- Allow users to report mislabeled stories (crowdsourced correction signal).
- Audit NER accuracy regularly with a small labeled test set.

### 9.5 Performance at Global Scale
**Risk**: Rendering and scoring thousands of articles across 195 countries in near-real-time is computationally expensive.

**Mitigations:**
- Never compute heat map scores on request — always serve precomputed, cached scores.
- Use time-bucketed scoring (compute per 15-min bucket) rather than rolling windows.
- Paginate article queries; never return >50 articles per API call.
- Use Postgres connection pooling (PgBouncer) at scale.

### 9.6 Legal / Copyright Issues
**Risk**: Displaying article body content may violate publisher copyrights. Aggregators have faced lawsuits.

**Mitigations:**
- Display only headlines, snippet (≤150 chars), source name, and a link out — this aligns with standard fair use / linking conventions.
- Never cache or store full article bodies.
- Comply with `robots.txt` for any scraping; do not scrape sites that disallow it.
- Include clear attribution ("Source: Reuters") next to every article reference.
- Consult a media lawyer before scaling past MVP.

---

## 10. Final Output

### 10.1 Architecture Diagram (Text Form)

```
┌──────────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                                │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │  Next.js App (Vercel CDN)                                  │    │
│   │                                                            │    │
│   │  ┌─────────────────┐   ┌─────────────┐  ┌─────────────┐  │    │
│   │  │  Mapbox GL JS   │   │  Filter Bar │  │  Sidebar    │  │    │
│   │  │  + Deck.gl      │   │  + Search   │  │  Panel      │  │    │
│   │  │  (Heat Layer)   │   │             │  │  (Articles) │  │    │
│   │  └────────┬────────┘   └──────┬──────┘  └──────┬──────┘  │    │
│   │           │                   │                │          │    │
│   │           └───────────────────┴────────────────┘          │    │
│   │                               │                           │    │
│   │                     React Query (TanStack)                 │    │
│   └───────────────────────────────┬────────────────────────────┘    │
└───────────────────────────────────┼────────────────────────────────┘
                                    │ HTTPS REST / WebSocket
                    ┌───────────────▼────────────────┐
                    │    FastAPI Backend (Railway)    │
                    │                                │
                    │  /heatmap  /articles  /search  │
                    │  /regions  /scores/history     │
                    └──────┬──────────────┬──────────┘
                           │              │
              ┌────────────▼──┐    ┌──────▼──────────────┐
              │  Redis Cache  │    │  PostgreSQL          │
              │  (Upstash)    │    │  (Supabase)          │
              │               │    │                      │
              │  Heat scores  │    │  articles            │
              │  Session data │    │  article_locations   │
              │  Job queue    │    │  sources             │
              └──────┬────────┘    │  region_scores       │
                     │             └──────────────────────┘
        ┌────────────▼──────────────────────┐
        │  Celery Workers (Railway)         │
        │                                  │
        │  ┌──────────────┐  ┌──────────┐  │
        │  │  Ingestion   │  │ Scoring  │  │
        │  │  Job         │  │ Job      │  │
        │  │  (every 30m) │  │ (every   │  │
        │  └──────┬───────┘  │  15m)    │  │
        │         │          └──────────┘  │
        └─────────┼──────────────────────-─┘
                  │
    ┌─────────────▼──────────────────────────┐
    │       NLP Enrichment Service           │
    │  spaCy NER → GeoNames Lookup →         │
    │  ISO Code → Credibility Score →        │
    │  Category + Sentiment                  │
    └─────────────┬──────────────────────────┘
                  │
    ┌─────────────▼──────────────────────────┐
    │         External Data Sources          │
    │                                        │
    │  NewsAPI.org   GDELT GKG   RSS Feeds   │
    │  (paid API)    (free)      (curated)   │
    └────────────────────────────────────────┘
```

---

### 10.2 Phased Roadmap

```
PHASE 1 — Foundation (Weeks 1–4)
  ├── Next.js + Mapbox setup
  ├── World GeoJSON polygon rendering
  ├── Manual article dataset (50–100 items)
  ├── Country shading by article count
  ├── Click → sidebar with articles
  └── Deploy to Vercel

PHASE 2 — Automation (Weeks 5–10)
  ├── News API integration (scheduled ingestion)
  ├── PostgreSQL schema + Supabase setup
  ├── spaCy NER + GeoNames disambiguation
  ├── Deduplication engine
  ├── /heatmap + /articles API endpoints
  └── Frontend polls live data

PHASE 3 — Intelligence (Weeks 11–16)
  ├── Weighted scoring formula
  ├── Redis score caching
  ├── Category + time + severity filters
  ├── Search (Typesense or Postgres FTS)
  ├── Sparkline charts in sidebar
  └── Historical time scrubber

PHASE 4 — Product (Weeks 17–26)
  ├── User accounts + saved filters
  ├── Alerting system
  ├── Trending panel
  ├── Sentiment breakdown
  ├── Source transparency layer
  └── Optional 3D globe toggle
```

---

### 10.3 Recommended MVP Scope

For a solo founder shipping in 4–8 weeks, the MVP should be:

| ✅ Include | ❌ Defer |
|---|---|
| 2D world map with country-level heat shading | 3D globe / CesiumJS |
| Auto-ingestion from 1 news API (NewsAPI.org) | Multi-API aggregation |
| Basic NER location tagging (spaCy) | City-level granularity |
| Simple scoring (volume + recency only) | Full credibility/severity weighting |
| Click → top 5 articles in sidebar | Full article reading experience |
| Category filter (1–2 categories) | All 8 categories + severity sliders |
| Static refresh (every 30 min) | Real-time WebSocket updates |
| Basic search by country name | Semantic topic search |
| Vercel + Railway deployment | Custom infrastructure |

**MVP goal**: Something a journalist or curious person would spend 5 minutes exploring and share with a colleague.

---

### 10.4 First 5 Technical Decisions to Make Before Building

---

**Decision 1: Map library — Mapbox GL JS or Leaflet?**

- If you want a professional, visually compelling product from day one: **Mapbox GL JS**.
- If you need zero cost and can accept a less polished UI: **Leaflet**.
- *Recommendation*: Mapbox. The free tier (50k loads/month) covers your entire early beta. Leaflet's look-and-feel will hurt your product's first impression.

---

**Decision 2: News data source — NewsAPI.org, GDELT, or RSS-first?**

- NewsAPI is the easiest integration but costs money and has display restrictions.
- GDELT is free and globally broad but complex to ingest and not designed for real-time.
- RSS is free and curated but requires manual source selection.
- *Recommendation*: Start with **NewsAPI.org dev tier** for Phase 1–2, layer in **GDELT** for Phase 3 geographic enrichment. Budget $50–100/month from the start.

---

**Decision 3: NLP for location extraction — spaCy, off-the-shelf API, or GDELT's built-in tags?**

- Rolling your own with spaCy gives control but requires tuning and maintenance.
- Using GDELT's GKG sidesteps the problem entirely — every article is pre-tagged with locations, themes, and sentiment.
- A commercial NLP API (AWS Comprehend, Google Natural Language) is accurate but adds cost per article.
- *Recommendation*: Use **GDELT GKG as your geo-tagging source** in MVP. It is already solved. Bring spaCy in-house only when you outgrow GDELT's format or need custom entity types.

---

**Decision 4: Backend language — Python or Node.js?**

- Python is the right choice if you want to colocate NLP/ML work with your API (spaCy, scikit-learn, pandas all live there).
- Node.js is natural if you want a single-language stack with your Next.js frontend.
- *Recommendation*: **Python (FastAPI)** for the backend + worker layer. Keep Next.js on the frontend. Two runtimes is a small tradeoff for keeping ML/NLP in their native language.

---

**Decision 5: Scoring formula now or later?**

- Building a sophisticated scoring formula before you have real article data is premature optimization.
- A naive formula (article count × recency decay) is completely viable for Phase 1–2.
- *Recommendation*: **Ship with the simple formula first.** Get real data flowing, look at the outputs, and tune the formula empirically. The formula is a dial you adjust, not a foundation you must build correctly before proceeding.

---

*Document version: 1.0 | Built for founder pre-build planning | No code required to apply this framework*
