// ─── Source credibility registry ──────────────────────────────────────────────
// Curated domain → credibility (0–1), loosely following MBFC/NewsGuard tiers:
//   0.95  wire services            0.85  major international/national outlets
//   0.70  established regional     0.50  unknown (default)
//   0.35  tabloids / aggregators   0.25  state-controlled propaganda outlets
// Scores weight article contributions to the heat map; low-credibility sources
// are floored, never excluded (transparency over censorship).

const REGISTRY: Record<string, number> = {
  // Wire services
  "reuters.com": 0.95, "apnews.com": 0.95, "afp.com": 0.95, "upi.com": 0.9,

  // Major international broadcasters / papers
  "bbc.com": 0.9, "bbc.co.uk": 0.9, "theguardian.com": 0.88,
  "nytimes.com": 0.88, "washingtonpost.com": 0.88, "wsj.com": 0.88,
  "ft.com": 0.9, "economist.com": 0.9, "bloomberg.com": 0.88,
  "aljazeera.com": 0.82, "dw.com": 0.85, "france24.com": 0.82,
  "npr.org": 0.88, "pbs.org": 0.85, "cbc.ca": 0.85, "abc.net.au": 0.85,

  // Established national outlets
  "cnn.com": 0.78, "nbcnews.com": 0.8, "cbsnews.com": 0.8,
  "abcnews.go.com": 0.8, "politico.com": 0.78, "axios.com": 0.78,
  "thehill.com": 0.72, "time.com": 0.78, "theatlantic.com": 0.8,
  "telegraph.co.uk": 0.75, "thetimes.co.uk": 0.8, "independent.co.uk": 0.7,
  "lemonde.fr": 0.85, "lefigaro.fr": 0.78, "spiegel.de": 0.85,
  "elpais.com": 0.82, "corriere.it": 0.78, "asahi.com": 0.82,
  "japantimes.co.jp": 0.8, "scmp.com": 0.72, "straitstimes.com": 0.75,
  "smh.com.au": 0.78, "theage.com.au": 0.78, "globeandmail.com": 0.8,
  "irishtimes.com": 0.8, "haaretz.com": 0.78, "timesofisrael.com": 0.72,
  "thehindu.com": 0.78, "indianexpress.com": 0.72, "dawn.com": 0.72,
  "arabnews.com": 0.6, "kyivindependent.com": 0.75,
  "folha.uol.com.br": 0.75, "clarin.com": 0.7, "eltiempo.com": 0.7,

  // Mixed / partisan-leaning
  "foxnews.com": 0.55, "msnbc.com": 0.55, "huffpost.com": 0.55,
  "newsweek.com": 0.5, "businessinsider.com": 0.55, "vox.com": 0.6,
  "slate.com": 0.55, "usatoday.com": 0.7, "ndtv.com": 0.62,
  "timesofindia.com": 0.55, "geo.tv": 0.55,

  // Tabloids / aggregators
  "dailymail.co.uk": 0.35, "thesun.co.uk": 0.3, "mirror.co.uk": 0.35,
  "nypost.com": 0.4, "express.co.uk": 0.32, "yahoo.com": 0.45,
  "msn.com": 0.45, "iheart.com": 0.4,

  // State-controlled
  "rt.com": 0.25, "tass.ru": 0.25, "sputniknews.com": 0.25,
  "xinhuanet.com": 0.3, "chinadaily.com.cn": 0.3, "globaltimes.cn": 0.25,
  "presstv.ir": 0.25, "kcna.kp": 0.2,
};

const DEFAULT_CREDIBILITY = 0.5;

/** Credibility for a domain, falling back to its parent domain, then 0.5. */
export function credibilityFor(domain: string): number {
  if (REGISTRY[domain] != null) return REGISTRY[domain];
  const parent = domain.split(".").slice(-2).join(".");
  return REGISTRY[parent] ?? DEFAULT_CREDIBILITY;
}

/** All registry entries — used by the credibility backfill. */
export function registryEntries(): [string, number][] {
  return Object.entries(REGISTRY);
}
