import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createHash } from "crypto";
import { fetchGuardian, type NormalisedArticle } from "@/lib/ingest/guardian";
import { dedupeByTitle } from "@/lib/ingest/similarity";
import { credibilityFor, registryEntries } from "@/lib/ingest/credibility";
import { dispatchIntensityAlerts } from "@/lib/push/alerts";

export const maxDuration = 60; // respected on Pro; Hobby is still capped at 10s

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

// ─── City coordinates lookup ─────────────────────────────────────────────────
// Keyed by the city name as it appears in headlines. Each match yields
// lat/lng for pin placement and an ISO3 so we can skip the title regex pass.
const CITY_COORDS: [RegExp, { city: string; lat: number; lng: number; iso3: string }][] = [
  [/\bLondon\b/i,          { city: "London",       lat:  51.509, lng:   -0.118, iso3: "GBR" }],
  [/\bParis\b/i,           { city: "Paris",        lat:  48.857, lng:    2.347, iso3: "FRA" }],
  [/\bBerlin\b/i,          { city: "Berlin",       lat:  52.520, lng:   13.405, iso3: "DEU" }],
  [/\bMoscow\b|Kremlin\b/i,{ city: "Moscow",       lat:  55.755, lng:   37.617, iso3: "RUS" }],
  [/\bBeijing\b/i,         { city: "Beijing",      lat:  39.906, lng:  116.397, iso3: "CHN" }],
  [/\bShanghai\b/i,        { city: "Shanghai",     lat:  31.228, lng:  121.474, iso3: "CHN" }],
  [/\bHong Kong\b/i,       { city: "Hong Kong",    lat:  22.319, lng:  114.170, iso3: "CHN" }],
  [/\bWashington\s*D\.?C\.?|White House|Capitol Hill\b/i, { city: "Washington D.C.", lat: 38.895, lng: -77.037, iso3: "USA" }],
  [/\bNew York City|NYC\b/i,{ city: "New York",    lat:  40.713, lng:  -74.006, iso3: "USA" }],
  [/\bLos Angeles\b/i,     { city: "Los Angeles",  lat:  34.052, lng: -118.244, iso3: "USA" }],
  [/\bChicago\b/i,         { city: "Chicago",      lat:  41.878, lng:  -87.630, iso3: "USA" }],
  [/\bTokyo\b/i,           { city: "Tokyo",        lat:  35.690, lng:  139.692, iso3: "JPN" }],
  [/\bOsaka\b/i,           { city: "Osaka",        lat:  34.694, lng:  135.502, iso3: "JPN" }],
  [/\bSeoul\b/i,           { city: "Seoul",        lat:  37.566, lng:  126.978, iso3: "KOR" }],
  [/\bPyongyang\b/i,       { city: "Pyongyang",    lat:  39.019, lng:  125.755, iso3: "PRK" }],
  [/\bKyiv\b|Kiev\b/i,     { city: "Kyiv",         lat:  50.450, lng:   30.523, iso3: "UKR" }],
  [/\bTehran\b/i,          { city: "Tehran",       lat:  35.689, lng:   51.389, iso3: "IRN" }],
  [/\bBaghdad\b/i,         { city: "Baghdad",      lat:  33.341, lng:   44.401, iso3: "IRQ" }],
  [/\bMosul\b/i,           { city: "Mosul",        lat:  36.340, lng:   43.130, iso3: "IRQ" }],
  [/\bTel Aviv\b/i,        { city: "Tel Aviv",     lat:  32.085, lng:   34.781, iso3: "ISR" }],
  [/\bJerusalem\b/i,       { city: "Jerusalem",    lat:  31.769, lng:   35.216, iso3: "ISR" }],
  [/\bGaza\b/i,            { city: "Gaza",         lat:  31.500, lng:   34.467, iso3: "PSE" }],
  [/\bBeirut\b/i,          { city: "Beirut",       lat:  33.888, lng:   35.495, iso3: "LBN" }],
  [/\bDamascus\b/i,        { city: "Damascus",     lat:  33.510, lng:   36.292, iso3: "SYR" }],
  [/\bAleppo\b/i,          { city: "Aleppo",       lat:  36.203, lng:   37.161, iso3: "SYR" }],
  [/\bKabul\b/i,           { city: "Kabul",        lat:  34.525, lng:   69.178, iso3: "AFG" }],
  [/\bIslamabad\b/i,       { city: "Islamabad",    lat:  33.698, lng:   73.047, iso3: "PAK" }],
  [/\bKarachi\b/i,         { city: "Karachi",      lat:  24.861, lng:   67.010, iso3: "PAK" }],
  [/\bMumbai\b/i,          { city: "Mumbai",       lat:  19.076, lng:   72.878, iso3: "IND" }],
  [/\bNew Delhi\b/i,       { city: "New Delhi",    lat:  28.614, lng:   77.209, iso3: "IND" }],
  [/\bDhaka\b/i,           { city: "Dhaka",        lat:  23.811, lng:   90.413, iso3: "BGD" }],
  [/\bKathmandu\b/i,       { city: "Kathmandu",    lat:  27.717, lng:   85.314, iso3: "NPL" }],
  [/\bKolkata\b/i,         { city: "Kolkata",      lat:  22.573, lng:   88.364, iso3: "IND" }],
  [/\bJakarta\b/i,         { city: "Jakarta",      lat:  -6.211, lng:  106.845, iso3: "IDN" }],
  [/\bManila\b/i,          { city: "Manila",       lat:  14.599, lng:  120.984, iso3: "PHL" }],
  [/\bBangkok\b/i,         { city: "Bangkok",      lat:  13.754, lng:  100.502, iso3: "THA" }],
  [/\bHanoi\b/i,           { city: "Hanoi",        lat:  21.028, lng:  105.854, iso3: "VNM" }],
  [/\bPhnom Penh\b/i,      { city: "Phnom Penh",   lat:  11.562, lng:  104.916, iso3: "KHM" }],
  [/\bNairobi\b/i,         { city: "Nairobi",      lat:  -1.292, lng:   36.822, iso3: "KEN" }],
  [/\bLagos\b/i,           { city: "Lagos",        lat:   6.524, lng:    3.379, iso3: "NGA" }],
  [/\bAbuja\b/i,           { city: "Abuja",        lat:   9.058, lng:    7.499, iso3: "NGA" }],
  [/\bAccra\b/i,           { city: "Accra",        lat:   5.603, lng:   -0.187, iso3: "GHA" }],
  [/\bDakar\b/i,           { city: "Dakar",        lat:  14.693, lng:  -17.448, iso3: "SEN" }],
  [/\bAddis Ababa\b/i,     { city: "Addis Ababa",  lat:   9.025, lng:   38.747, iso3: "ETH" }],
  [/\bKhartoum\b/i,        { city: "Khartoum",     lat:  15.508, lng:   32.560, iso3: "SDN" }],
  [/\bLuanda\b/i,          { city: "Luanda",       lat:  -8.839, lng:   13.290, iso3: "AGO" }],
  [/\bKinshasa\b/i,        { city: "Kinshasa",     lat:  -4.322, lng:   15.322, iso3: "COD" }],
  [/\bMogadishu\b/i,       { city: "Mogadishu",    lat:   2.046, lng:   45.343, iso3: "SOM" }],
  [/\bCairo\b/i,           { city: "Cairo",        lat:  30.044, lng:   31.236, iso3: "EGY" }],
  [/\bTripoli\b/i,         { city: "Tripoli",      lat:  32.887, lng:   13.191, iso3: "LBY" }],
  [/\bTunis\b/i,           { city: "Tunis",        lat:  36.819, lng:   10.166, iso3: "TUN" }],
  [/\bAlgiers\b/i,         { city: "Algiers",      lat:  36.738, lng:    3.086, iso3: "DZA" }],
  [/\bRabat\b/i,           { city: "Rabat",        lat:  34.013, lng:   -6.832, iso3: "MAR" }],
  [/\bCasablanca\b/i,      { city: "Casablanca",   lat:  33.573, lng:   -7.589, iso3: "MAR" }],
  [/\bRiyadh\b/i,          { city: "Riyadh",       lat:  24.688, lng:   46.722, iso3: "SAU" }],
  [/\bDoha\b/i,            { city: "Doha",         lat:  25.285, lng:   51.531, iso3: "QAT" }],
  [/\bDubai\b/i,           { city: "Dubai",        lat:  25.205, lng:   55.271, iso3: "ARE" }],
  [/\bAmman\b/i,           { city: "Amman",        lat:  31.956, lng:   35.945, iso3: "JOR" }],
  [/\bAnkara\b/i,          { city: "Ankara",       lat:  39.921, lng:   32.854, iso3: "TUR" }],
  [/\bIstanbul\b/i,        { city: "Istanbul",     lat:  41.015, lng:   28.979, iso3: "TUR" }],
  [/\bAthens\b/i,          { city: "Athens",       lat:  37.984, lng:   23.728, iso3: "GRC" }],
  [/\bRome\b/i,            { city: "Rome",         lat:  41.900, lng:   12.496, iso3: "ITA" }],
  [/\bMadrid\b/i,          { city: "Madrid",       lat:  40.417, lng:   -3.703, iso3: "ESP" }],
  [/\bBarcelona\b/i,       { city: "Barcelona",    lat:  41.387, lng:    2.170, iso3: "ESP" }],
  [/\bLisbon\b/i,          { city: "Lisbon",       lat:  38.717, lng:   -9.143, iso3: "PRT" }],
  [/\bVienna\b/i,          { city: "Vienna",       lat:  48.208, lng:   16.373, iso3: "AUT" }],
  [/\bWarsaw\b/i,          { city: "Warsaw",       lat:  52.230, lng:   21.012, iso3: "POL" }],
  [/\bBudapest\b/i,        { city: "Budapest",     lat:  47.498, lng:   19.040, iso3: "HUN" }],
  [/\bPrague\b/i,          { city: "Prague",       lat:  50.076, lng:   14.437, iso3: "CZE" }],
  [/\bBucharest\b/i,       { city: "Bucharest",    lat:  44.432, lng:   26.103, iso3: "ROU" }],
  [/\bBelgrade\b/i,        { city: "Belgrade",     lat:  44.787, lng:   20.457, iso3: "SRB" }],
  [/\bSarajevo\b/i,        { city: "Sarajevo",     lat:  43.850, lng:   18.356, iso3: "BIH" }],
  [/\bKiev\b|Kyiv\b/i,     { city: "Kyiv",         lat:  50.450, lng:   30.523, iso3: "UKR" }],
  [/\bMinsk\b/i,           { city: "Minsk",        lat:  53.905, lng:   27.562, iso3: "BLR" }],
  [/\bStockholm\b/i,       { city: "Stockholm",    lat:  59.334, lng:   18.063, iso3: "SWE" }],
  [/\bOslo\b/i,            { city: "Oslo",         lat:  59.913, lng:   10.752, iso3: "NOR" }],
  [/\bHelsinki\b/i,        { city: "Helsinki",     lat:  60.169, lng:   24.935, iso3: "FIN" }],
  [/\bCopenhagen\b/i,      { city: "Copenhagen",   lat:  55.676, lng:   12.568, iso3: "DNK" }],
  [/\bAmsterdam\b/i,       { city: "Amsterdam",    lat:  52.370, lng:    4.895, iso3: "NLD" }],
  [/\bBrussels\b/i,        { city: "Brussels",     lat:  50.850, lng:    4.352, iso3: "BEL" }],
  [/\bZurich\b/i,          { city: "Zurich",       lat:  47.377, lng:    8.540, iso3: "CHE" }],
  [/\bGeneva\b/i,          { city: "Geneva",       lat:  46.204, lng:    6.143, iso3: "CHE" }],
  [/\bMexico City\b/i,     { city: "Mexico City",  lat:  19.433, lng:  -99.133, iso3: "MEX" }],
  [/\bBogotá\b|Bogota\b/i, { city: "Bogotá",       lat:   4.711, lng:  -74.073, iso3: "COL" }],
  [/\bLima\b/i,            { city: "Lima",         lat: -12.046, lng:  -77.043, iso3: "PER" }],
  [/\bSantiago\b/i,        { city: "Santiago",     lat: -33.459, lng:  -70.648, iso3: "CHL" }],
  [/\bBuenos Aires\b/i,    { city: "Buenos Aires", lat: -34.604, lng:  -58.382, iso3: "ARG" }],
  [/\bBrasilia\b/i,        { city: "Brasília",     lat: -15.780, lng:  -47.929, iso3: "BRA" }],
  [/\bSão Paulo\b/i,       { city: "São Paulo",    lat: -23.549, lng:  -46.638, iso3: "BRA" }],
  [/\bCanberra\b/i,        { city: "Canberra",     lat: -35.282, lng:  149.129, iso3: "AUS" }],
  [/\bSydney\b/i,          { city: "Sydney",       lat: -33.869, lng:  151.209, iso3: "AUS" }],
  [/\bMelbourne\b/i,       { city: "Melbourne",    lat: -37.814, lng:  144.963, iso3: "AUS" }],
  [/\bOttawa\b/i,          { city: "Ottawa",       lat:  45.425, lng:  -75.695, iso3: "CAN" }],
  [/\bToronto\b/i,         { city: "Toronto",      lat:  43.653, lng:  -79.383, iso3: "CAN" }],
  [/\bPort-au-Prince\b/i,  { city: "Port-au-Prince", lat: 18.543, lng: -72.338, iso3: "HTI" }],
  [/\bKampala\b/i,         { city: "Kampala",      lat:   0.347, lng:   32.583, iso3: "UGA" }],
  [/\bKigali\b/i,          { city: "Kigali",       lat:  -1.943, lng:   30.060, iso3: "RWA" }],
  [/\bLusaka\b/i,          { city: "Lusaka",       lat: -15.417, lng:   28.283, iso3: "ZMB" }],
  [/\bHarare\b/i,          { city: "Harare",       lat: -17.829, lng:   31.052, iso3: "ZWE" }],
  [/\bMaputo\b/i,          { city: "Maputo",       lat: -25.966, lng:   32.571, iso3: "MOZ" }],
  [/\bYangon\b/i,          { city: "Yangon",       lat:  16.866, lng:   96.195, iso3: "MMR" }],
  [/\bHo Chi Minh\b/i,     { city: "Ho Chi Minh City", lat: 10.823, lng: 106.630, iso3: "VNM" }],
  [/\bKuala Lumpur\b/i,    { city: "Kuala Lumpur", lat:   3.140, lng:  101.687, iso3: "MYS" }],
  [/\bSingapore\b/i,       { city: "Singapore",    lat:   1.290, lng:  103.852, iso3: "SGP" }],
  [/\bTaipei\b/i,          { city: "Taipei",       lat:  25.048, lng:  121.513, iso3: "TWN" }],
];

interface GeoResult {
  iso3: string;
  confidence: number;
  cityName?: string;
  lat?: number;
  lng?: number;
}

function extractCountry(title: string, domain?: string): GeoResult | null {
  // Try city lookup first — more specific and carries coordinates
  for (const [pattern, city] of CITY_COORDS) {
    if (pattern.test(title)) {
      return { iso3: city.iso3, confidence: 0.9, cityName: city.city, lat: city.lat, lng: city.lng };
    }
  }
  // Fall back to country-level regex
  for (const [pattern, iso3] of COUNTRY_NAME_MAP) {
    if (pattern.test(title)) return { iso3, confidence: 0.85 };
  }
  if (domain) {
    const parentDomain = domain.split(".").slice(-2).join(".");
    const iso3 = DOMAIN_COUNTRY[domain] ?? DOMAIN_COUNTRY[parentDomain];
    if (iso3) return { iso3, confidence: 0.4 };
  }
  return null;
}

// Extract ALL country / city mentions from a title (for secondary locations / cross-border arcs).
// Returns an ordered list: first entry is the primary (most specific), rest are secondary.
function extractAllLocations(title: string, domain?: string): GeoResult[] {
  const results: GeoResult[] = [];
  const seenIsos = new Set<string>();

  // City matches (high confidence, includes coordinates)
  for (const [pattern, city] of CITY_COORDS) {
    if (pattern.test(title) && !seenIsos.has(city.iso3)) {
      results.push({ iso3: city.iso3, confidence: 0.9, cityName: city.city, lat: city.lat, lng: city.lng });
      seenIsos.add(city.iso3);
    }
  }

  // Country name matches (medium confidence)
  for (const [pattern, iso3] of COUNTRY_NAME_MAP) {
    if (pattern.test(title) && !seenIsos.has(iso3)) {
      results.push({ iso3, confidence: 0.85 });
      seenIsos.add(iso3);
    }
  }

  // Domain fallback adds a secondary location only if nothing else matched
  if (results.length === 0 && domain) {
    const parentDomain = domain.split(".").slice(-2).join(".");
    const iso3 = DOMAIN_COUNTRY[domain] ?? DOMAIN_COUNTRY[parentDomain];
    if (iso3 && !seenIsos.has(iso3)) {
      results.push({ iso3, confidence: 0.4 });
    }
  }

  return results;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function seendateToISO(s: string): string {
  const d = s.replace(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/, "$1-$2-$3T$4:$5:$6Z");
  return d || new Date().toISOString();
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
// On Vercel (VERCEL_ENV is set) keep under the 10 s wall with a 6 s abort.
// Locally (npm run dev) or in GitHub Actions jobs, allow 25 s.
const GDELT_TIMEOUT_MS = process.env.VERCEL_ENV ? 6_000 : 25_000;

async function fetchGdelt(query: string, timespan = "2h", maxrecords = 50): Promise<GdeltArticle[]> {
  const params = new URLSearchParams({
    query, mode: "artlist", maxrecords: String(maxrecords), format: "json", timespan,
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GDELT_TIMEOUT_MS);
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

// ─── Batch article ingestion ──────────────────────────────────────────────────
// All DB work is done in bulk queries (O(6) queries regardless of article count)
// instead of the previous per-article loop (O(4n) queries).
async function ingestArticles(
  articles: NormalisedArticle[],
  results: { inserted: number; skipped: number; reprints: number; errors: string[] }
) {
  if (!articles.length) return;

  // 1. Bulk-check which titles already exist (exact normalized-title hash)
  const thashes = articles.map((a) => titleHash(a.title));
  const { data: existingRows } = await supabase
    .from("articles")
    .select("external_id")
    .in("external_id", thashes);
  const existingSet = new Set((existingRows ?? []).map((r) => r.external_id as string));

  let newArticles = articles.filter((a) => !existingSet.has(titleHash(a.title)));
  results.skipped += articles.length - newArticles.length;
  if (!newArticles.length) return;

  // 1b. Fuzzy reprint detection: drop near-duplicate titles (cross-source
  //     reprints of the same wire story) within the batch and against the
  //     last 24 h of stored headlines.
  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString();
  const { data: recentRows } = await supabase
    .from("articles")
    .select("title")
    .gte("published_at", since24h)
    .limit(400);
  const recentTitles = (recentRows ?? []).map((r) => r.title as string);

  const keptIdx = dedupeByTitle(newArticles.map((a) => a.title), recentTitles);
  results.reprints += newArticles.length - keptIdx.length;
  newArticles = keptIdx.map((i) => newArticles[i]);
  if (!newArticles.length) return;

  // 2. Bulk-fetch existing sources, insert missing ones
  const domains = Array.from(new Set(newArticles.map((a) => a.domain).filter(Boolean)));
  const { data: existingSources } = await supabase
    .from("sources")
    .select("id, domain")
    .in("domain", domains);
  const sourceMap = new Map<string, string>(
    (existingSources ?? []).map((s) => [s.domain as string, s.id as string])
  );

  const newDomains = domains.filter((d) => !sourceMap.has(d));
  if (newDomains.length) {
    const { data: insertedSources } = await supabase
      .from("sources")
      .insert(newDomains.map((d) => ({ name: d, domain: d, credibility: credibilityFor(d), source_type: "news" })))
      .select("id, domain");
    (insertedSources ?? []).forEach((s) => sourceMap.set(s.domain as string, s.id as string));
  }

  // 3. Bulk upsert articles (onConflict = external_id unique constraint)
  const articleRows = newArticles.map((a) => {
    const category = detectCategory(a.title);
    return {
      external_id: titleHash(a.title),
      title: a.title,
      url: a.url,
      published_at: seendateToISO(a.seendate),
      source_id: sourceMap.get(a.domain) ?? null,
      category,
      severity: category === "Conflict" ? 4 : category === "Humanitarian" ? 3 : 2,
      ...(a.snippet && { body_snippet: a.snippet }),
    };
  });

  const { data: insertedArticles, error: artErr } = await supabase
    .from("articles")
    .upsert(articleRows, { onConflict: "external_id", ignoreDuplicates: true })
    .select("id, external_id");

  if (artErr) { results.errors.push(`Batch insert: ${artErr.message}`); return; }

  // 4. Bulk insert locations (articles are new, so no location conflicts)
  const locationRows: {
    article_id: string;
    country_code: string;
    is_primary: boolean;
    confidence: number;
    city_name?: string;
    latitude?: number;
    longitude?: number;
  }[] = [];
  const thashToArticle = new Map(newArticles.map((a) => [titleHash(a.title), a]));

  for (const inserted of insertedArticles ?? []) {
    const orig = thashToArticle.get(inserted.external_id as string);
    if (!orig) continue;

    // Extract primary + all secondary locations for cross-border arc support
    const allGeos = extractAllLocations(orig.title, orig.domain);
    allGeos.forEach((geo, idx) => {
      locationRows.push({
        article_id: inserted.id as string,
        country_code: geo.iso3,
        is_primary: idx === 0,   // first match is primary, rest are secondary
        confidence: geo.confidence,
        ...(geo.cityName && { city_name: geo.cityName }),
        ...(geo.lat != null && { latitude: geo.lat }),
        ...(geo.lng != null && { longitude: geo.lng }),
      });
    });
  }

  if (locationRows.length) {
    // upsert requires the unique constraint: UNIQUE (article_id, country_code)
    // See supabase/schema.sql — run the migration if you haven't yet.
    const { error: locErr } = await supabase
      .from("article_locations")
      .upsert(locationRows, { onConflict: "article_id,country_code", ignoreDuplicates: true });
    if (locErr) results.errors.push(`Location upsert: ${locErr.message}`);
  }

  results.inserted += (insertedArticles ?? []).length;
}

// ─── Scoring ──────────────────────────────────────────────────────────────────
// Queries only articles from the last 24 h (filter on the primary table — reliable).
async function computeScores(results: { scored: number; errors: string[] }) {
  const timeBucket = new Date();
  timeBucket.setMinutes(0, 0, 0);
  const since24h = new Date(Date.now() - 24 * 3_600_000).toISOString();

  // Start from articles (published_at filter is on the primary table — always reliable).
  // article_locations!inner ensures only articles that have a tagged location.
  const { data: articles, error } = await supabase
    .from("articles")
    .select(`
      published_at, category, severity,
      sources ( credibility ),
      article_locations!inner ( country_code, is_primary, confidence )
    `)
    .gte("published_at", since24h);

  if (error) { results.errors.push(`Scoring fetch: ${error.message}`); return; }

  const raw: Record<string, { sum: number; count: number; cats: Record<string, number> }> = {};

  for (const art of articles ?? []) {
    // article_locations is an array (one-to-many from articles)
    const locations = art.article_locations;
    const src = art.sources;

    const hoursOld = (Date.now() - new Date(art.published_at).getTime()) / 3_600_000;
    const recencyDecay = Math.exp(-0.1 * hoursOld);
    const credibility = src?.credibility ?? 0.5;
    const severityWeight = SEVERITY_WEIGHT[art.category ?? ""] ?? 1.0;

    for (const loc of locations) {
      if (!loc.is_primary) continue;
      const weight = credibility * recencyDecay * severityWeight * (loc.confidence ?? 1.0);
      const cc = loc.country_code;
      if (!raw[cc]) raw[cc] = { sum: 0, count: 0, cats: {} };
      raw[cc].sum += weight;
      raw[cc].count++;
      const cat = art.category ?? "Other";
      raw[cc].cats[cat] = (raw[cc].cats[cat] ?? 0) + 1;
    }
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

    // Fire intensity alerts for watchlist subscribers (no-op when push isn't
    // configured or the push_subscriptions table doesn't exist yet)
    const scoreMap = Object.fromEntries(scoreRows.map((r) => [r.country_code, r.score]));
    await dispatchIntensityAlerts(scoreMap, results.errors);
  }

  // ── Retention pruning (free-tier survival) ───────────────────────────────
  // Articles: 60-day retention. ~2k inserts/day would blow Supabase's 500 MB
  // free tier within months if left unbounded; article_locations rows cascade.
  await supabase
    .from("articles")
    .delete()
    .lt("published_at", new Date(Date.now() - 60 * 24 * 3_600_000).toISOString());

  // region_scores: keep a full year — aggregate rows are tiny, and they
  // preserve score history long after the raw articles are pruned.
  await supabase
    .from("region_scores")
    .delete()
    .lt("time_bucket", new Date(Date.now() - 365 * 24 * 3_600_000).toISOString());
}

// ─── Core ingestion run ───────────────────────────────────────────────────────
// Accepts optional gdeltQuery + timespan overrides for seeding / targeted runs.
// Default: broad English news, last 2 h — fits Vercel Hobby's 10-second wall.
async function runIngestion(gdeltQuery = "sourcelang:english", timespan = "2h"): Promise<NextResponse> {
  const results = {
    fetched: 0, fetchedBySource: {} as Record<string, number>,
    inserted: 0, skipped: 0, reprints: 0, scored: 0, errors: [] as string[],
  };

  // Fetch all sources in parallel — Guardian articles first so their richer
  // records (trailText snippets) win when fuzzy dedup drops GDELT reprints.
  const [guardian, gdelt] = await Promise.all([
    fetchGuardian(GDELT_TIMEOUT_MS),
    // 250 is GDELT's per-call max — broadens country coverage beyond the
    // Guardian's UK/US skew so more of the map carries real data.
    fetchGdelt(gdeltQuery, timespan, 250),
  ]);
  results.fetchedBySource = { guardian: guardian.length, gdelt: gdelt.length };
  const articles: NormalisedArticle[] = [...guardian, ...gdelt];
  results.fetched = articles.length;

  if (articles.length > 0) {
    await ingestArticles(articles, results);
  }

  await computeScores(results);
  return NextResponse.json(results);
}

// ─── Credibility backfill (POST /api/ingest?credibility=true) ────────────────
// Re-scores existing sources from the curated registry (skips unknown domains
// so manually-set values aren't clobbered with the 0.5 default).
async function runCredibilityBackfill(): Promise<NextResponse> {
  let updated = 0;
  const errors: string[] = [];
  for (const [domain, credibility] of registryEntries()) {
    const { error, count } = await supabase
      .from("sources")
      .update({ credibility }, { count: "exact" })
      .eq("domain", domain);
    if (error) errors.push(`${domain}: ${error.message}`);
    else updated += count ?? 0;
  }
  const scoreResults = { scored: 0, errors };
  await computeScores(scoreResults);
  return NextResponse.json({ updated, ...scoreResults });
}

// ─── One-time backfill (POST /api/ingest?backfill=true) ───────────────────────
async function runBackfill(): Promise<NextResponse> {
  const { data: allArticles } = await supabase
    .from("articles").select("id, title, sources(domain)").limit(1000);

  let tagged = 0, skipped = 0;
  for (const row of allArticles ?? []) {
    const domain = ((row.sources as unknown) as { domain: string } | null)?.domain;
    const geo = extractCountry(row.title as string, domain ?? undefined);
    if (!geo) { skipped++; continue; }

    const { data: existing } = await supabase
      .from("article_locations").select("id")
      .eq("article_id", row.id).eq("is_primary", true).maybeSingle();

    const geoFields = {
      country_code: geo.iso3,
      confidence:   geo.confidence,
      ...(geo.cityName && { city_name:  geo.cityName }),
      ...(geo.lat != null && { latitude:  geo.lat }),
      ...(geo.lng != null && { longitude: geo.lng }),
    };

    if (existing) {
      await supabase.from("article_locations")
        .update(geoFields)
        .eq("id", existing.id);
    } else {
      await supabase.from("article_locations").insert({
        article_id: row.id, is_primary: true, ...geoFields,
      });
    }
    tagged++;
  }

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

// ─── Manual / GitHub Actions POST ────────────────────────────────────────────
// Supports ?backfill=true, ?query=theme:MILITARY, ?timespan=24h
export async function POST(req: NextRequest) {
  if (req.headers.get("x-ingest-secret") !== INGEST_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const sp = new URL(req.url).searchParams;
  if (sp.get("backfill") === "true") return runBackfill();
  if (sp.get("credibility") === "true") return runCredibilityBackfill();
  const query = sp.get("query") ?? "sourcelang:english";
  const timespan = sp.get("timespan") ?? "2h";
  return runIngestion(query, timespan);
}
