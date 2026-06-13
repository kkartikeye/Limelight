// ─── Country-code resolution for ingestion adapters ───────────────────────────
// Free news APIs tag articles with their own country format (ISO-2 codes like
// "us"/"gb", or full names like "united states of america"). This maps those
// to the ISO-3 codes the rest of the pipeline + the map basemap use.
// Scope mirrors the ~75 countries in lib/utils/countries.ts — anything outside
// it returns null, and the caller falls back to title-based geo-tagging.

const ISO2_TO_ISO3: Record<string, string> = {
  // Africa
  dz: "DZA", ao: "AGO", cm: "CMR", cd: "COD", eg: "EGY", et: "ETH", gh: "GHA",
  ke: "KEN", ly: "LBY", ma: "MAR", mz: "MOZ", ng: "NGA", so: "SOM", za: "ZAF",
  sd: "SDN", ss: "SSD", tz: "TZA", tn: "TUN", ug: "UGA", zw: "ZWE",
  // Americas
  ar: "ARG", br: "BRA", ca: "CAN", cl: "CHL", co: "COL", cu: "CUB", mx: "MEX",
  pe: "PER", us: "USA", ve: "VEN",
  // Asia / Middle East
  af: "AFG", bd: "BGD", cn: "CHN", in: "IND", id: "IDN", ir: "IRN", iq: "IRQ",
  il: "ISR", jp: "JPN", jo: "JOR", kz: "KAZ", kp: "PRK", kr: "KOR", kw: "KWT",
  lb: "LBN", my: "MYS", mm: "MMR", np: "NPL", pk: "PAK", ph: "PHL", qa: "QAT",
  sa: "SAU", sg: "SGP", sy: "SYR", tw: "TWN", th: "THA", tr: "TUR", ae: "ARE",
  uz: "UZB", vn: "VNM", ye: "YEM",
  // Europe
  at: "AUT", by: "BLR", be: "BEL", dk: "DNK", fi: "FIN", fr: "FRA", de: "DEU",
  gr: "GRC", hu: "HUN", ie: "IRL", it: "ITA", nl: "NLD", no: "NOR", pl: "POL",
  pt: "PRT", ro: "ROU", ru: "RUS", rs: "SRB", sk: "SVK", es: "ESP", se: "SWE",
  ch: "CHE", ua: "UKR", gb: "GBR", uk: "GBR",
  // Oceania
  au: "AUS", nz: "NZL",
};

// Full-name aliases for APIs that return names instead of codes (lowercased).
const NAME_TO_ISO3: Record<string, string> = {
  "united states": "USA", "united states of america": "USA", "usa": "USA",
  "united kingdom": "GBR", "uk": "GBR", "britain": "GBR", "great britain": "GBR",
  "south korea": "KOR", "korea, republic of": "KOR",
  "north korea": "PRK",
  "russia": "RUS", "russian federation": "RUS",
  "china": "CHN", "iran": "IRN", "syria": "SYR", "vietnam": "VNM",
  "united arab emirates": "ARE", "uae": "ARE",
  "democratic republic of the congo": "COD", "dr congo": "COD", "congo": "COD",
  "south africa": "ZAF", "saudi arabia": "SAU", "czech republic": "CZE",
  "turkey": "TUR", "türkiye": "TUR", "taiwan": "TWN",
};

/**
 * Resolve a free-API country tag to an ISO-3 code, or null if unknown.
 * Accepts 2-letter codes ("us"), 3-letter codes ("USA"), or full names.
 */
export function resolveCountry(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v.length === 2) return ISO2_TO_ISO3[v] ?? null;
  if (v.length === 3) {
    const up = v.toUpperCase();
    // Trust a 3-letter code only if it's one we recognise downstream
    return Object.values(ISO2_TO_ISO3).includes(up) ? up : null;
  }
  return NAME_TO_ISO3[v] ?? null;
}
