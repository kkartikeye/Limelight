import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHash } from "crypto";

export const maxDuration = 60;

const INGEST_SECRET = process.env.INGEST_SECRET ?? "dev-secret";
const GDELT_BASE = "https://api.gdeltproject.org/api/v2/doc/doc";

interface GdeltArticle {
  url: string;
  title: string;
  seendate: string;
  domain: string;
  sourcecountry: string;
  language: string;
}

interface GdeltResponse {
  articles?: GdeltArticle[];
}

// ─── Severity weights ─────────────────────────────────────────────────────────
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

// ─── Geo-extraction ───────────────────────────────────────────────────────────
// Ordered longest-match first. Covers country names, demonyms, capitals, major
// cities, and all 50 US states so domestic US headlines map to USA.
const COUNTRY_NAME_MAP: [RegExp, string][] = [
  // ── Compound / easily-confused names first ────────────────────────────────
  [/\bUnited Arab Emirates|UAE\b/i,                                        "ARE"],
  [/\bUnited Kingdom|Britain\b|British\b|England\b|London\b/i,             "GBR"],
  [/\bUnited States|U\.S\.\b|USA\b|American\b|Washington\s*D\.?C\.?|White House|Capitol Hill\b/i, "USA"],
  [/\bSouth Korea|Seoul\b/i,                                               "KOR"],
  [/\bNorth Korea|DPRK\b|Pyongyang\b/i,                                    "PRK"],
  [/\bSouth Africa\b/i,                                                     "ZAF"],
  [/\bSouth Sudan|Juba\b/i,                                                 "SSD"],
  [/\bNew Zealand\b/i,                                                      "NZL"],
  [/\bSaudi Arabia|Riyadh\b/i,                                              "SAU"],
  [/\bSri Lanka\b/i,                                                        "LKA"],
  [/\bCzech Republic|Czechia\b|Prague\b/i,                                  "CZE"],
  [/\bDominican Republic\b/i,                                               "DOM"],
  [/\bDR Congo|Kinshasa\b/i,                                                "COD"],
  [/\bPalestine|Palestinian|Gaza\b|West Bank\b/i,                           "PSE"],
  [/\bEl Salvador\b/i,                                                      "SLV"],
  [/\bCosta Rica\b/i,                                                       "CRI"],

  // ── US states → USA (so domestic headlines get tagged) ───────────────────
  [/\b(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|West Virginia|Wisconsin|Wyoming)\b/i, "USA"],
  // Major US cities that appear without state context
  [/\bNew York City|NYC\b|Los Angeles|Chicago\b|Houston\b|Philadelphia\b|Phoenix\b|San Antonio\b|San Diego\b|Dallas\b|San Jose\b|Austin\b|Jacksonville\b|Fort Worth\b|Columbus\b|Charlotte\b|Indianapolis\b|Seattle\b|Denver\b|Boston\b|Nashville\b|Portland\b|Las Vegas\b|Louisville\b|Baltimore\b|Milwaukee\b|Albuquerque\b|Tucson\b|Atlanta\b|Miami\b|Detroit\b/i, "USA"],

  // ── Countries A–Z with demonyms + capital cities ──────────────────────────
  [/\bAfghanistan|Afghan\b|Kabul\b/i,                                       "AFG"],
  [/\bAlbania|Albanian\b|Tirana\b/i,                                        "ALB"],
  [/\bAlgeria|Algerian\b|Algiers\b/i,                                       "DZA"],
  [/\bAngola|Angolan\b|Luanda\b/i,                                          "AGO"],
  [/\bArgentina|Argentine\b|Buenos Aires\b/i,                               "ARG"],
  [/\bArmenia|Armenian\b|Yerevan\b/i,                                       "ARM"],
  [/\bAustralia|Australian\b|Sydney\b|Melbourne\b|Canberra\b/i,             "AUS"],
  [/\bAustria|Austrian\b|Vienna\b/i,                                        "AUT"],
  [/\bAzerbaijan|Azerbaijani\b|Baku\b/i,                                    "AZE"],
  [/\bBahrain|Bahraini\b|Manama\b/i,                                        "BHR"],
  [/\bBangladesh|Bangladeshi\b|Dhaka\b/i,                                   "BGD"],
  [/\bBelarus|Belarusian\b|Minsk\b/i,                                       "BLR"],
  [/\bBelgium|Belgian\b|Brussels\b/i,                                       "BEL"],
  [/\bBolivia|Bolivian\b|La Paz\b/i,                                        "BOL"],
  [/\bBosnia|Bosnian\b|Sarajevo\b/i,                                        "BIH"],
  [/\bBrazil|Brazilian\b|São Paulo\b|Brasilia\b/i,                          "BRA"],
  [/\bBulgaria|Bulgarian\b|Sofia\b/i,                                       "BGR"],
  [/\bBurkina Faso\b/i,                                                      "BFA"],
  [/\bBurundi\b/i,                                                           "BDI"],
  [/\bCambodia|Cambodian\b|Phnom Penh\b/i,                                  "KHM"],
  [/\bCameroon|Cameroonian\b|Yaoundé\b/i,                                   "CMR"],
  [/\bCanada|Canadian\b|Ottawa\b|Toronto\b/i,                               "CAN"],
  [/\bChad\b/i,                                                              "TCD"],
  [/\bChile|Chilean\b|Santiago\b/i,                                          "CHL"],
  [/\bChina|Chinese\b|Beijing\b|Shanghai\b|Hong Kong\b/i,                   "CHN"],
  [/\bColombia|Colombian\b|Bogotá\b|Bogota\b/i,                             "COL"],
  [/\bCongo\b/i,                                                             "COG"],
  [/\bCroatia|Croatian\b|Zagreb\b/i,                                        "HRV"],
  [/\bCuba|Cuban\b|Havana\b/i,                                              "CUB"],
  [/\bCyprus|Cypriot\b|Nicosia\b/i,                                         "CYP"],
  [/\bDenmark|Danish\b|Copenhagen\b/i,                                       "DNK"],
  [/\bEcuador|Ecuadorian\b|Quito\b/i,                                        "ECU"],
  [/\bEgypt|Egyptian\b|Cairo\b/i,                                            "EGY"],
  [/\bEritrea|Eritrean\b|Asmara\b/i,                                         "ERI"],
  [/\bEthiopia|Ethiopian\b|Addis Ababa\b/i,                                  "ETH"],
  [/\bFinland|Finnish\b|Helsinki\b/i,                                        "FIN"],
  [/\bFrance|French\b|Paris\b/i,                                             "FRA"],
  [/\bGabon|Gabonese\b|Libreville\b/i,                                       "GAB"],
  [/\bGeorgia\s+(country|nation|republic|government|president|troops)/i,     "GEO"],
  [/\bGermany|German\b|Berlin\b/i,                                           "DEU"],
  [/\bGhana|Ghanaian\b|Accra\b/i,                                           "GHA"],
  [/\bGreece|Greek\b|Athens\b/i,                                             "GRC"],
  [/\bGuatemala\b/i,                                                          "GTM"],
  [/\bGuinea|Guinean\b|Conakry\b/i,                                          "GIN"],
  [/\bHaiti|Haitian\b|Port-au-Prince\b/i,                                   "HTI"],
  [/\bHonduras|Honduran\b|Tegucigalpa\b/i,                                   "HND"],
  [/\bHungary|Hungarian\b|Budapest\b/i,                                      "HUN"],
  [/\bIndia|Indian\b|New Delhi\b|Mumbai\b|Kolkata\b/i,                      "IND"],
  [/\bIndonesia|Indonesian\b|Jakarta\b/i,                                    "IDN"],
  [/\bIran|Iranian\b|Tehran\b/i,                                             "IRN"],
  [/\bIraq|Iraqi\b|Baghdad\b|Mosul\b/i,                                     "IRQ"],
  [/\bIreland|Irish\b|Dublin\b/i,                                            "IRL"],
  [/\bIsrael|Israeli\b|Tel Aviv\b|Jerusalem\b/i,                             "ISR"],
  [/\bItaly|Italian\b|Rome\b|Milan\b/i,                                      "ITA"],
  [/\bJapan|Japanese\b|Tokyo\b|Osaka\b/i,                                   "JPN"],
  [/\bJordan|Jordanian\b|Amman\b/i,                                          "JOR"],
  [/\bKazakhstan|Kazakh\b|Astana\b/i,                                        "KAZ"],
  [/\bKenya|Kenyan\b|Nairobi\b/i,                                            "KEN"],
  [/\bKuwait\b/i,                                                             "KWT"],
  [/\bKyrgyzstan|Bishkek\b/i,                                                "KGZ"],
  [/\bLebanon|Lebanese\b|Beirut\b/i,                                         "LBN"],
  [/\bLibya|Libyan\b|Tripoli\b/i,                                            "LBY"],
  [/\bMali|Malian\b|Bamako\b/i,                                              "MLI"],
  [/\bMexico|Mexican\b|Mexico City\b/i,                                      "MEX"],
  [/\bMoldova|Moldovan\b|Chisinau\b/i,                                       "MDA"],
  [/\bMongolia|Mongolian\b|Ulaanbaatar\b/i,                                  "MNG"],
  [/\bMorocco|Moroccan\b|Rabat\b|Casablanca\b/i,                            "MAR"],
  [/\bMozambique|Mozambican\b|Maputo\b/i,                                    "MOZ"],
  [/\bMyanmar|Burma\b|Burmese\b|Naypyidaw\b|Yangon\b/i,                    "MMR"],
  [/\bNepal|Nepalese\b|Kathmandu\b/i,                                        "NPL"],
  [/\bNetherlands|Dutch\b|Amsterdam\b|The Hague\b/i,                         "NLD"],
  [/\bNicaragua|Nicaraguan\b|Managua\b/i,                                    "NIC"],
  [/\bNiger\b(?!ia)/i,                                                        "NER"],
  [/\bNigeria|Nigerian\b|Lagos\b|Abuja\b/i,                                  "NGA"],
  [/\bNorway|Norwegian\b|Oslo\b/i,                                           "NOR"],
  [/\bOman|Omani\b|Muscat\b/i,                                               "OMN"],
  [/\bPakistan|Pakistani\b|Islamabad\b|Karachi\b|Lahore\b/i,                "PAK"],
  [/\bPanama|Panamanian\b/i,                                                 "PAN"],
  [/\bParaguay|Paraguayan\b|Asuncion\b/i,                                    "PRY"],
  [/\bPeru|Peruvian\b|Lima\b/i,                                              "PER"],
  [/\bPhilippines|Filipino\b|Manila\b/i,                                     "PHL"],
  [/\bPoland|Polish\b|Warsaw\b/i,                                            "POL"],
  [/\bPortugal|Portuguese\b|Lisbon\b/i,                                      "PRT"],
  [/\bQatar\b|Doha\b/i,                                                      "QAT"],
  [/\bRomania|Romanian\b|Bucharest\b/i,                                      "ROU"],
  [/\bRussia|Russian\b|Moscow\b|Kremlin\b|Putin\b/i,                        "RUS"],
  [/\bRwanda|Rwandan\b|Kigali\b/i,                                           "RWA"],
  [/\bSenegal|Senegalese\b|Dakar\b/i,                                        "SEN"],
  [/\bSerbia|Serbian\b|Belgrade\b/i,                                         "SRB"],
  [/\bSierra Leone\b/i,                                                       "SLE"],
  [/\bSomalia|Somali\b|Mogadishu\b/i,                                        "SOM"],
  [/\bSpain|Spanish\b|Madrid\b|Barcelona\b/i,                                "ESP"],
  [/\bSudan|Sudanese\b|Khartoum\b/i,                                         "SDN"],
  [/\bSweden|Swedish\b|Stockholm\b/i,                                        "SWE"],
  [/\bSwitzerland|Swiss\b|Geneva\b|Zurich\b/i,                              "CHE"],
  [/\bSyria|Syrian\b|Damascus\b|Aleppo\b/i,                                 "SYR"],
  [/\bTaiwan|Taiwanese\b|Taipei\b/i,                                         "TWN"],
  [/\bTajikistan|Dushanbe\b/i,                                               "TJK"],
  [/\bTanzania|Tanzanian\b|Dar es Salaam\b/i,                               "TZA"],
  [/\bThailand|Thai\b|Bangkok\b/i,                                           "THA"],
  [/\bTogo|Togolese\b|Lomé\b/i,                                              "TGO"],
  [/\bTunisia|Tunisian\b|Tunis\b/i,                                          "TUN"],
  [/\bTurkey|Turkish\b|Ankara\b|Istanbul\b/i,                               "TUR"],
  [/\bTurkmenistan|Ashgabat\b/i,                                             "TKM"],
  [/\bUganda|Ugandan\b|Kampala\b/i,                                          "UGA"],
  [/\bUkraine|Ukrainian\b|Kyiv\b|Kiev\b|Zelensky\b/i,                      "UKR"],
  [/\bUruguay|Uruguayan\b|Montevideo\b/i,                                    "URY"],
  [/\bUzbekistan|Uzbek\b|Tashkent\b/i,                                       "UZB"],
  [/\bVenezuela|Venezuelan\b|Caracas\b|Maduro\b/i,                          "VEN"],
  [/\bVietnam|Vietnamese\b|Hanoi\b|Ho Chi Minh\b/i,                         "VNM"],
  [/\bYemen|Yemeni\b|Sanaa\b|Houthi\b/i,                                    "YEM"],
  [/\bZambia|Zambian\b|Lusaka\b/i,                                           "ZMB"],
  [/\bZimbabwe|Zimbabwean\b|Harare\b/i,                                      "ZWE"],
];

// Domain → ISO3 fallback: if the title yields no match, the publisher's country
// gives a weak signal (confidence 0.4) — better than nothing for domestic outlets.
const DOMAIN_COUNTRY: Record<string, string> = {
  "bbc.com": "GBR", "bbc.co.uk": "GBR", "theguardian.com": "GBR",
  "telegraph.co.uk": "GBR", "thetimes.co.uk": "GBR", "independent.co.uk": "GBR",
  "nytimes.com": "USA", "washingtonpost.com": "USA", "wsj.com": "USA",
  "apnews.com": "USA", "reuters.com": "USA", "npr.org": "USA",
  "cnn.com": "USA", "foxnews.com": "USA", "nbcnews.com": "USA",
  "yahoo.com": "USA", "usatoday.com": "USA", "politico.com": "USA",
  "thehill.com": "USA", "axios.com": "USA", "time.com": "USA",
  "newsweek.com": "USA", "businessinsider.com": "USA", "vox.com": "USA",
  "huffpost.com": "USA", "buzzfeednews.com": "USA", "slate.com": "USA",
  "cbsnews.com": "USA", "abcnews.go.com": "USA", "msnbc.com": "USA",
  "iheart.com": "USA", "iheartradio.com": "USA",
  "abc.net.au": "AUS", "smh.com.au": "AUS",
  "lemonde.fr": "FRA", "lefigaro.fr": "FRA",
  "dw.com": "DEU", "spiegel.de": "DEU",
  "xinhuanet.com": "CHN", "chinadaily.com.cn": "CHN",
  "rt.com": "RUS", "tass.ru": "RUS",
  "aljazeera.com": "QAT",
  "dawn.com": "PAK", "geo.tv": "PAK",
  "thehindu.com": "IND", "ndtv.com": "IND", "timesofindia.com": "IND",
  "haaretz.com": "ISR", "timesofisrael.com": "ISR",
  "arabnews.com": "SAU",
  "france24.com": "FRA",
  "kyivindependent.com": "UKR", "ukraineworld.org": "UKR",
  "globo.com": "BRA", "folha.uol.com.br": "BRA",
};

function extractCountry(title: string, domain?: string): { iso3: string; confidence: number } | null {
  for (const [pattern, iso3] of COUNTRY_NAME_MAP) {
    if (pattern.test(title)) return { iso3, confidence: 0.85 };
  }
  if (domain) {
    // Try exact domain match, then parent domain
    const parentDomain = domain.split(".").slice(-2).join(".");
    const iso3 = DOMAIN_COUNTRY[domain] ?? DOMAIN_COUNTRY[parentDomain];
    if (iso3) return { iso3, confidence: 0.4 };
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function seendateToISO(s: string): string {
  const d = s.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3T$4:$5:$6Z");
  return d || new Date().toISOString();
}

function urlHash(url: string): string {
  return createHash("sha256").update(url).digest("hex").slice(0, 32);
}

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
  if (/war|attack|kill|bomb|shoot|military|troops|missile|conflict|ceasefire|airstrike/.test(t)) return "Conflict";
  if (/flood|earthquake|hurricane|wildfire|drought|disaster|refugee|famine|aid\b|starvation/.test(t)) return "Humanitarian";
  if (/election|government|president|minister|parliament|senate|congress|vote|political|diplomatic/.test(t)) return "Politics";
  if (/economy|gdp|inflation|trade|market|stock|bank|debt|currency|tariff|recession/.test(t)) return "Economics";
  if (/climate|emission|carbon|pollution|forest|deforestation|biodiversity|renewable/.test(t)) return "Environment";
  if (/ai\b|tech|software|cyber|hack|robot|startup|silicon|semiconductor/.test(t)) return "Technology";
  if (/sport|football|soccer|olympic|cricket|tennis|basketball|championship|league/.test(t)) return "Sports";
  return "Politics";
}

// ─── GDELT fetch ──────────────────────────────────────────────────────────────
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

// ─── Article ingestion ────────────────────────────────────────────────────────
async function ingestArticles(
  articles: GdeltArticle[],
  results: { fetched: number; inserted: number; skipped: number; errors: string[] }
) {
  for (const art of articles) {
    const hash = urlHash(art.url);
    const thash = titleHash(art.title);

    const { data: existing } = await supabase
      .from("articles").select("id")
      .or(`external_id.eq.${hash},external_id.eq.${thash}`)
      .maybeSingle();
    if (existing) { results.skipped++; continue; }

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
        external_id: thash,
        title: art.title,
        url: art.url,
        published_at: seendateToISO(art.seendate),
        source_id: sourceId,
        category,
        severity: category === "Conflict" ? 4 : category === "Humanitarian" ? 3 : 2,
      })
      .select("id").single();

    if (insErr || !inserted) { results.errors.push(`Insert: ${insErr?.message}`); continue; }

    const geo = extractCountry(art.title, art.domain);
    if (geo) {
      await supabase.from("article_locations").insert({
        article_id: inserted.id,
        country_code: geo.iso3,
        is_primary: true,
        confidence: geo.confidence,
      });
    }
    results.inserted++;
  }
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
async function computeScores(results: { scored: number; errors: string[] }) {
  const timeBucket = new Date();
  timeBucket.setMinutes(0, 0, 0);
  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString();

  // Use !inner so only locations that have a matching article are returned.
  // Time filter is applied in JS (PostgREST nested filters are unreliable).
  const { data: locations, error } = await supabase
    .from("article_locations")
    .select(`
      country_code,
      confidence,
      articles!inner (
        published_at, category, severity,
        sources ( credibility )
      )
    `)
    .eq("is_primary", true);

  if (error) { results.errors.push(`Scoring fetch: ${error.message}`); return; }

  const raw: Record<string, { sum: number; count: number; cats: Record<string, number> }> = {};

  for (const loc of locations ?? []) {
    const art = (loc.articles as unknown) as {
      published_at: string;
      category: string | null;
      severity: number | null;
      sources: { credibility: number } | null;
    } | null;
    if (!art || art.published_at < since24h) continue;

    const hoursOld = (Date.now() - new Date(art.published_at).getTime()) / 3_600_000;
    const recencyDecay = Math.exp(-0.1 * hoursOld);
    const credibility = art.sources?.credibility ?? 0.5;
    const severityWeight = SEVERITY_WEIGHT[art.category ?? ""] ?? 1.0;
    const weight = credibility * recencyDecay * severityWeight * (loc.confidence ?? 1.0);

    const cc = loc.country_code as string;
    if (!raw[cc]) raw[cc] = { sum: 0, count: 0, cats: {} };
    raw[cc].sum += weight;
    raw[cc].count++;
    const cat = art.category ?? "Other";
    raw[cc].cats[cat] = (raw[cc].cats[cat] ?? 0) + 1;
  }

  const maxSum = Math.max(...Object.values(raw).map((r) => r.sum), 1);
  const scoreRows = Object.entries(raw).map(([cc, r]) => ({
    country_code: cc,
    time_bucket: timeBucket.toISOString(),
    score: (r.sum / maxSum) * 100,
    article_count: r.count,
    top_category: Object.entries(r.cats).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    computed_at: new Date().toISOString(),
  }));

  if (scoreRows.length > 0) {
    const { error: scoreErr } = await supabase
      .from("region_scores")
      .upsert(scoreRows, { onConflict: "country_code,time_bucket" });
    if (scoreErr) results.errors.push(`Score upsert: ${scoreErr.message}`);
    else results.scored = scoreRows.length;
  }
}

// ─── Core ingestion run (shared by GET cron + POST manual) ────────────────────
async function runIngestion(): Promise<NextResponse> {
  const results = { fetched: 0, inserted: 0, skipped: 0, scored: 0, errors: [] as string[] };

  const broad = await fetchGdelt("sourcelang:english", "2h", 100);
  results.fetched += broad.length;
  await ingestArticles(broad, results);

  await new Promise((r) => setTimeout(r, 6_000));

  const conflict = await fetchGdelt("theme:MILITARY OR theme:TERROR", "2h", 75);
  results.fetched += conflict.length;
  await ingestArticles(conflict, results);

  await computeScores(results);
  return NextResponse.json(results);
}

// ─── One-time backfill (POST /api/ingest?backfill=true) ───────────────────────
// Re-tags all articles in the DB using the current (expanded) geo rules.
// Run once after deploying the improved COUNTRY_NAME_MAP, then never again.
async function runBackfill(): Promise<NextResponse> {
  const { data: allArticles } = await supabase
    .from("articles").select("id, title, sources(domain)").limit(1000);

  let tagged = 0, skipped = 0;
  for (const row of allArticles ?? []) {
    const domain = ((row.sources as unknown) as { domain: string } | null)?.domain;
    const geo = extractCountry(row.title as string, domain ?? undefined);
    if (!geo) { skipped++; continue; }

    // Upsert so re-running is idempotent
    const { data: existing } = await supabase
      .from("article_locations").select("id")
      .eq("article_id", row.id).eq("is_primary", true).maybeSingle();

    if (existing) {
      await supabase.from("article_locations")
        .update({ country_code: geo.iso3, confidence: geo.confidence })
        .eq("id", existing.id);
    } else {
      await supabase.from("article_locations").insert({
        article_id: row.id, country_code: geo.iso3,
        is_primary: true, confidence: geo.confidence,
      });
    }
    tagged++;
  }

  // Re-score after backfill
  const scoreResults = { scored: 0, errors: [] as string[] };
  await computeScores(scoreResults);

  return NextResponse.json({ tagged, skipped, ...scoreResults });
}

// ─── Vercel Cron (GET) ────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const isVercelCron = cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`;
  const isManual = req.headers.get("x-ingest-secret") === INGEST_SECRET;
  if (!isVercelCron && !isManual) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return runIngestion();
}

// ─── Manual POST ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  if (req.headers.get("x-ingest-secret") !== INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const backfill = new URL(req.url).searchParams.get("backfill");
  return backfill === "true" ? runBackfill() : runIngestion();
}
