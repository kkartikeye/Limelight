import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHash } from "crypto";

export const maxDuration = 60; // Vercel Pro: up to 300s; Hobby: 60s

// Simple guard so only we can trigger ingestion
const INGEST_SECRET = process.env.INGEST_SECRET ?? "dev-secret";

// ─── GDELT DOC API ────────────────────────────────────────────────────────────
// Docs: https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/
const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;       // "20240524T120000Z"
  domain: string;
  sourcecountry: string;  // ISO2 country of source, not article subject
  language: string;
  socialimage?: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

// Severity weights from CLAUDE.md scoring formula
const SEVERITY_WEIGHT: Record<string, number> = {
  Conflict:      2.5,
  Humanitarian:  2.0,
  Politics:      1.5,
  Economics:     1.2,
  Environment:   1.2,
  Technology:    1.0,
  Sports:        0.6,
  Entertainment: 0.5,
};

// Country name → ISO3: extract the story's subject country from the article title.
// Ordered longest-match first so "South Korea" beats "Korea".
const COUNTRY_NAME_MAP: [RegExp, string][] = [
  [/\bUnited States|U\.S\.|USA\b|American\b/i,          "USA"],
  [/\bUnited Kingdom|Britain\b|British\b|England\b/i,    "GBR"],
  [/\bSouth Korea|Korea\b/i,                             "KOR"],
  [/\bNorth Korea\b/i,                                   "PRK"],
  [/\bSouth Africa\b/i,                                  "ZAF"],
  [/\bSouth Sudan\b/i,                                   "SSD"],
  [/\bNew Zealand\b/i,                                   "NZL"],
  [/\bSaudi Arabia\b/i,                                  "SAU"],
  [/\bSri Lanka\b/i,                                     "LKA"],
  [/\bCzech Republic|Czechia\b/i,                        "CZE"],
  [/\bDominican Republic\b/i,                            "DOM"],
  [/\bDR Congo|Congo\b/i,                                "COD"],
  [/\bUnited Arab Emirates|UAE\b/i,                      "ARE"],
  [/\bPalestine|Palestinian|Gaza\b/i,                    "PSE"],
  [/\bAfghanistan|Afghan\b/i,                            "AFG"],
  [/\bAlgeria|Algerian\b/i,                              "DZA"],
  [/\bArgentina|Argentine\b/i,                           "ARG"],
  [/\bAustralia|Australian\b/i,                          "AUS"],
  [/\bBangladesh|Bangladeshi\b/i,                        "BGD"],
  [/\bBrazil|Brazilian\b/i,                              "BRA"],
  [/\bCanada|Canadian\b/i,                               "CAN"],
  [/\bChile|Chilean\b/i,                                 "CHL"],
  [/\bChina|Chinese\b/i,                                 "CHN"],
  [/\bColombia|Colombian\b/i,                            "COL"],
  [/\bEgypt|Egyptian\b/i,                                "EGY"],
  [/\bEthiopia|Ethiopian\b/i,                            "ETH"],
  [/\bFrance|French\b/i,                                 "FRA"],
  [/\bGermany|German\b/i,                                "DEU"],
  [/\bGhana|Ghanaian\b/i,                                "GHA"],
  [/\bGreece|Greek\b/i,                                  "GRC"],
  [/\bHaiti|Haitian\b/i,                                 "HTI"],
  [/\bIndia|Indian\b/i,                                  "IND"],
  [/\bIndonesia|Indonesian\b/i,                          "IDN"],
  [/\bIran|Iranian|Tehran\b/i,                           "IRN"],
  [/\bIraq|Iraqi|Baghdad\b/i,                            "IRQ"],
  [/\bIsrael|Israeli|Jerusalem\b/i,                      "ISR"],
  [/\bItaly|Italian\b/i,                                 "ITA"],
  [/\bJapan|Japanese|Tokyo\b/i,                          "JPN"],
  [/\bJordan|Jordanian\b/i,                              "JOR"],
  [/\bKenya|Kenyan\b/i,                                  "KEN"],
  [/\bLebanon|Lebanese\b/i,                              "LBN"],
  [/\bLibya|Libyan\b/i,                                  "LBY"],
  [/\bMexico|Mexican\b/i,                                "MEX"],
  [/\bMyanmar|Burma\b/i,                                 "MMR"],
  [/\bNigeria|Nigerian\b/i,                              "NGA"],
  [/\bNorth Korea\b|DPRK\b/i,                            "PRK"],
  [/\bPakistan|Pakistani\b/i,                            "PAK"],
  [/\bPhilippines|Filipino\b/i,                          "PHL"],
  [/\bPoland|Polish\b/i,                                 "POL"],
  [/\bRussia|Russian|Moscow|Kremlin\b/i,                 "RUS"],
  [/\bSomalia|Somali\b/i,                                "SOM"],
  [/\bSudan|Sudanese\b/i,                                "SDN"],
  [/\bSyria|Syrian|Damascus\b/i,                         "SYR"],
  [/\bTaiwan|Taiwanese\b/i,                              "TWN"],
  [/\bTurkey|Turkish|Ankara\b/i,                         "TUR"],
  [/\bUkraine|Ukrainian|Kyiv\b/i,                        "UKR"],
  [/\bVenezuela|Venezuelan\b/i,                          "VEN"],
  [/\bYemen|Yemeni\b/i,                                  "YEM"],
  [/\bZimbabwe|Zimbabwean\b/i,                           "ZWE"],
];

function extractCountry(title: string): string | null {
  for (const [pattern, iso3] of COUNTRY_NAME_MAP) {
    if (pattern.test(title)) return iso3;
  }
  return null;
}

function seendateToISO(s: string): string {
  // "20240524T120000Z" → "2024-05-24T12:00:00Z"
  const d = s.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3T$4:$5:$6Z");
  return d || new Date().toISOString();
}

function urlHash(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

// Normalise a headline so syndicated copies hash identically:
// lowercase, collapse whitespace, strip punctuation, drop common filler words
function titleHash(title: string): string {
  const normalised = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(a|an|the|in|on|at|to|of|and|or|for|with|says|say|report|reports)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return "t:" + createHash("sha256").update(normalised).digest("hex").slice(0, 32);
}

function detectCategory(title: string): string {
  const t = title.toLowerCase();
  if (/war|attack|kill|bomb|shoot|military|troops|missile|conflict|ceasefire/.test(t)) return "Conflict";
  if (/election|government|president|minister|parliament|senate|congress|vote|political/.test(t)) return "Politics";
  if (/economy|gdp|inflation|trade|market|stock|bank|debt|currency|tariff/.test(t)) return "Economics";
  if (/ai|tech|software|cyber|hack|robot|startup|silicon/.test(t)) return "Technology";
  if (/flood|earthquake|hurricane|climate|wildfire|drought|disaster|refugee|aid/.test(t)) return "Humanitarian";
  if (/environment|emission|carbon|pollution|forest|ocean|biodiversity/.test(t)) return "Environment";
  if (/sport|football|soccer|olympic|cricket|tennis|basketball|championship/.test(t)) return "Sports";
  return "Politics"; // default
}

async function fetchGdelt(query: string, timespan = "2h", maxrecords = 100): Promise<GdeltArticle[]> {
  const params = new URLSearchParams({ query, mode: "artlist", maxrecords: String(maxrecords), format: "json", timespan });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  try {
    const res = await fetch(`${GDELT_BASE}?${params}`, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json() as GdeltResponse;
    return data.articles ?? [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

async function ingestArticles(
  articles: GdeltArticle[],
  results: { fetched: number; inserted: number; skipped: number; errors: string[] }
) {
  for (const art of articles) {
    const hash = urlHash(art.url);
    const thash = titleHash(art.title);

    // Dedup by URL hash first, then by normalised title hash
    const { data: existing } = await supabase
      .from("articles").select("id")
      .or(`external_id.eq.${hash},external_id.eq.${thash}`)
      .maybeSingle();
    if (existing) { results.skipped++; continue; }

    // Use title hash as the canonical external_id so future syndicated copies skip
    const canonicalId = thash;

    let sourceId: string | null = null;
    const { data: src } = await supabase
      .from("sources").select("id").eq("domain", art.domain).maybeSingle();
    if (src) {
      sourceId = src.id;
    } else {
      const { data: newSrc } = await supabase
        .from("sources")
        .insert({ name: art.domain, domain: art.domain, credibility: 0.5, source_type: "news" })
        .select("id").single();
      if (newSrc) sourceId = newSrc.id;
    }

    const category = detectCategory(art.title);
    const { data: inserted, error: insErr } = await supabase
      .from("articles")
      .insert({
        external_id: canonicalId,
        title: art.title,
        url: art.url,
        published_at: seendateToISO(art.seendate),
        source_id: sourceId,
        category,
        severity: category === "Conflict" ? 4 : category === "Humanitarian" ? 3 : 2,
      })
      .select("id").single();

    if (insErr || !inserted) { results.errors.push(`Insert: ${insErr?.message}`); continue; }

    // Extract subject country from title (more accurate than sourcecountry field)
    const iso3 = extractCountry(art.title);
    if (iso3) {
      await supabase.from("article_locations").insert({
        article_id: inserted.id,
        country_code: iso3,
        is_primary: true,
        confidence: 0.8,
      });
    }
    results.inserted++;
  }
}

// ─── Vercel Cron entry point (GET) ───────────────────────────────────────────
// Vercel calls GET /api/ingest on schedule with Authorization: Bearer <CRON_SECRET>
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const manualSecret = req.headers.get("x-ingest-secret");

  const isVercelCron = cronSecret && authHeader === `Bearer ${cronSecret}`;
  const isManual = manualSecret === INGEST_SECRET;

  if (!isVercelCron && !isManual) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return runIngestion();
}

async function runIngestion(): Promise<NextResponse> {
  const results = { fetched: 0, inserted: 0, skipped: 0, scored: 0, errors: [] as string[] };

  // Backfill: tag any existing articles that have no location entry
  const { data: taggedIds } = await supabase
    .from("article_locations").select("article_id");
  const taggedSet = new Set((taggedIds ?? []).map((r) => r.article_id as string));

  const { data: allArticles } = await supabase
    .from("articles").select("id, title").limit(500);

  let backfilled = 0;
  for (const row of allArticles ?? []) {
    if (taggedSet.has(row.id as string)) continue;
    const iso3 = extractCountry(row.title as string);
    if (iso3) {
      await supabase.from("article_locations").insert({
        article_id: row.id, country_code: iso3, is_primary: true, confidence: 0.8,
      });
      backfilled++;
    }
  }
  results.errors.push(`backfilled ${backfilled} locations`);

  // One broad fetch + one conflict-specific fetch (5s apart to respect rate limit)
  const broadArticles = await fetchGdelt("sourcelang:english", "2h", 100);
  results.fetched += broadArticles.length;
  await ingestArticles(broadArticles, results);

  await new Promise((r) => setTimeout(r, 6_000));

  const conflictArticles = await fetchGdelt("theme:MILITARY OR theme:TERROR", "2h", 75);
  results.fetched += conflictArticles.length;
  await ingestArticles(conflictArticles, results);

  // ─── Scoring job ─────────────────────────────────────────────────────────────
  // Compute scores for the current hour bucket from the last 24h of articles
  const timeBucket = new Date();
  timeBucket.setMinutes(0, 0, 0);

  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString();

  const { data: locations } = await supabase
    .from("article_locations")
    .select(`
      country_code,
      confidence,
      articles (
        published_at, category, severity,
        sources ( credibility )
      )
    `)
    .eq("is_primary", true)
    .gte("articles.published_at", since24h);

  // Aggregate raw weighted scores per country
  const raw: Record<string, { sum: number; count: number; categories: Record<string, number> }> = {};

  for (const loc of locations ?? []) {
    const art = (loc.articles as unknown) as {
      published_at: string;
      category: string | null;
      severity: number | null;
      sources: { credibility: number } | null;
    } | null;
    if (!art) continue;

    const hoursOld = (Date.now() - new Date(art.published_at).getTime()) / 3_600_000;
    const recencyDecay = Math.exp(-0.1 * hoursOld);
    const credibility = art.sources?.credibility ?? 0.5;
    const severityWeight = SEVERITY_WEIGHT[art.category ?? ""] ?? 1.0;

    const weight = credibility * recencyDecay * severityWeight * (loc.confidence ?? 1.0);

    const cc = loc.country_code;
    if (!raw[cc]) raw[cc] = { sum: 0, count: 0, categories: {} };
    raw[cc].sum += weight;
    raw[cc].count++;
    const cat = art.category ?? "Other";
    raw[cc].categories[cat] = (raw[cc].categories[cat] ?? 0) + 1;
  }

  // Normalize 0–100 across all countries
  const maxSum = Math.max(...Object.values(raw).map((r) => r.sum), 1);
  const scoreRows = Object.entries(raw).map(([cc, r]) => ({
    country_code: cc,
    time_bucket: timeBucket.toISOString(),
    score: (r.sum / maxSum) * 100,
    article_count: r.count,
    top_category: Object.entries(r.categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    computed_at: new Date().toISOString(),
  }));

  if (scoreRows.length > 0) {
    const { error: scoreErr } = await supabase
      .from("region_scores")
      .upsert(scoreRows, { onConflict: "country_code,time_bucket" });

    if (scoreErr) results.errors.push(`Scoring upsert: ${scoreErr.message}`);
    else results.scored = scoreRows.length;
  }

  return NextResponse.json(results);
}

// ─── Manual POST trigger ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-ingest-secret");
  if (secret !== INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runIngestion();
}
