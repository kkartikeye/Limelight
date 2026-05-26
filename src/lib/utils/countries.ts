/**
 * ISO 3166-1 alpha-3 → display name lookup.
 * Covers the ~60 most-covered countries (95%+ of ingest volume).
 * Falls back to the raw ISO code if not found.
 */
const ISO3_NAMES: Record<string, string> = {
  // Africa
  DZA: "Algeria",
  AGO: "Angola",
  CMR: "Cameroon",
  COD: "DR Congo",
  EGY: "Egypt",
  ETH: "Ethiopia",
  GHA: "Ghana",
  KEN: "Kenya",
  LBY: "Libya",
  MAR: "Morocco",
  MOZ: "Mozambique",
  NGA: "Nigeria",
  SOM: "Somalia",
  ZAF: "South Africa",
  SDN: "Sudan",
  SSD: "South Sudan",
  TZA: "Tanzania",
  TUN: "Tunisia",
  UGA: "Uganda",
  ZWE: "Zimbabwe",

  // Americas
  ARG: "Argentina",
  BRA: "Brazil",
  CAN: "Canada",
  CHL: "Chile",
  COL: "Colombia",
  CUB: "Cuba",
  MEX: "Mexico",
  PER: "Peru",
  USA: "United States",
  VEN: "Venezuela",

  // Asia
  AFG: "Afghanistan",
  BGD: "Bangladesh",
  CHN: "China",
  IND: "India",
  IDN: "Indonesia",
  IRN: "Iran",
  IRQ: "Iraq",
  ISR: "Israel",
  JPN: "Japan",
  JOR: "Jordan",
  KAZ: "Kazakhstan",
  PRK: "North Korea",
  KOR: "South Korea",
  KWT: "Kuwait",
  LBN: "Lebanon",
  MYS: "Malaysia",
  MMR: "Myanmar",
  NPL: "Nepal",
  PAK: "Pakistan",
  PHL: "Philippines",
  QAT: "Qatar",
  SAU: "Saudi Arabia",
  SGP: "Singapore",
  SYR: "Syria",
  TWN: "Taiwan",
  THA: "Thailand",
  TUR: "Turkey",
  ARE: "UAE",
  UZB: "Uzbekistan",
  VNM: "Vietnam",
  YEM: "Yemen",

  // Europe
  AUT: "Austria",
  BLR: "Belarus",
  BEL: "Belgium",
  DNK: "Denmark",
  FIN: "Finland",
  FRA: "France",
  DEU: "Germany",
  GRC: "Greece",
  HUN: "Hungary",
  IRL: "Ireland",
  ITA: "Italy",
  NLD: "Netherlands",
  NOR: "Norway",
  POL: "Poland",
  PRT: "Portugal",
  ROU: "Romania",
  RUS: "Russia",
  SRB: "Serbia",
  SVK: "Slovakia",
  ESP: "Spain",
  SWE: "Sweden",
  CHE: "Switzerland",
  UKR: "Ukraine",
  GBR: "United Kingdom",

  // Oceania
  AUS: "Australia",
  NZL: "New Zealand",
};

/** Return the display name for an ISO 3166-1 alpha-3 code, or the code itself as fallback. */
export function countryName(iso3: string): string {
  return ISO3_NAMES[iso3.toUpperCase()] ?? iso3;
}
