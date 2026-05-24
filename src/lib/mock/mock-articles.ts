import type { Article } from "@/lib/types/article";

const now = Date.now();
const h = (hours: number) => new Date(now - hours * 3600_000).toISOString();

const STORIES: Record<string, Article[]> = {
  UKR: [
    { id: "ukr-1", headline: "Ukraine launches drone strike deep inside Russian territory", source: "Reuters", credibilityTier: "high", category: "Conflict", publishedAt: h(1), url: "#" },
    { id: "ukr-2", headline: "EU approves fresh €5bn military aid package for Kyiv", source: "BBC News", credibilityTier: "high", category: "Politics", publishedAt: h(3), url: "#" },
    { id: "ukr-3", headline: "Zelensky warns of new Russian offensive in Kharkiv region", source: "The Guardian", credibilityTier: "high", category: "Conflict", publishedAt: h(6), url: "#" },
    { id: "ukr-4", headline: "Civilian casualties mount as shelling hits Zaporizhzhia", source: "Al Jazeera", credibilityTier: "high", category: "Humanitarian", publishedAt: h(9), url: "#" },
    { id: "ukr-5", headline: "NATO allies debate long-range missile use inside Russia", source: "Financial Times", credibilityTier: "high", category: "Politics", publishedAt: h(14), url: "#" },
    { id: "ukr-6", headline: "Grain corridor talks stall amid renewed Black Sea tensions", source: "AP News", credibilityTier: "high", category: "Economics", publishedAt: h(22), url: "#" },
  ],
  PSE: [
    { id: "pse-1", headline: "Gaza ceasefire negotiations resume in Cairo with US mediators", source: "Reuters", credibilityTier: "high", category: "Politics", publishedAt: h(2), url: "#" },
    { id: "pse-2", headline: "UN warns of imminent famine in northern Gaza Strip", source: "BBC News", credibilityTier: "high", category: "Humanitarian", publishedAt: h(4), url: "#" },
    { id: "pse-3", headline: "IDF confirms ground operations expanded into Rafah", source: "The Guardian", credibilityTier: "high", category: "Conflict", publishedAt: h(5), url: "#" },
    { id: "pse-4", headline: "ICJ orders Israel to halt Rafah offensive, ruling disputed", source: "Al Jazeera", credibilityTier: "high", category: "Politics", publishedAt: h(10), url: "#" },
    { id: "pse-5", headline: "Aid trucks blocked at Kerem Shalom crossing for third day", source: "AP News", credibilityTier: "high", category: "Humanitarian", publishedAt: h(16), url: "#" },
    { id: "pse-6", headline: "Hamas releases statement on latest hostage proposal", source: "Reuters", credibilityTier: "high", category: "Politics", publishedAt: h(20), url: "#" },
  ],
  RUS: [
    { id: "rus-1", headline: "Russia claims capture of key village in Donetsk region", source: "Reuters", credibilityTier: "high", category: "Conflict", publishedAt: h(2), url: "#" },
    { id: "rus-2", headline: "Putin signs decree expanding military conscription age", source: "BBC News", credibilityTier: "high", category: "Politics", publishedAt: h(8), url: "#" },
    { id: "rus-3", headline: "Ruble falls sharply as new Western sanctions take effect", source: "Financial Times", credibilityTier: "high", category: "Economics", publishedAt: h(12), url: "#" },
    { id: "rus-4", headline: "Moscow announces new hypersonic missile test", source: "AP News", credibilityTier: "high", category: "Conflict", publishedAt: h(18), url: "#" },
    { id: "rus-5", headline: "Opposition figure sentenced to 19 years in closed trial", source: "The Guardian", credibilityTier: "high", category: "Politics", publishedAt: h(24), url: "#" },
  ],
  USA: [
    { id: "usa-1", headline: "Congress passes emergency foreign aid bill after months of delay", source: "Reuters", credibilityTier: "high", category: "Politics", publishedAt: h(3), url: "#" },
    { id: "usa-2", headline: "Fed signals rates will stay higher for longer amid sticky inflation", source: "Financial Times", credibilityTier: "high", category: "Economics", publishedAt: h(7), url: "#" },
    { id: "usa-3", headline: "Supreme Court hears historic presidential immunity case", source: "BBC News", credibilityTier: "high", category: "Politics", publishedAt: h(10), url: "#" },
    { id: "usa-4", headline: "Border crossing numbers hit record high as policy debate intensifies", source: "AP News", credibilityTier: "high", category: "Politics", publishedAt: h(15), url: "#" },
    { id: "usa-5", headline: "Tech layoffs accelerate as AI reshapes Silicon Valley workforce", source: "The Guardian", credibilityTier: "high", category: "Technology", publishedAt: h(20), url: "#" },
    { id: "usa-6", headline: "US economy adds 250k jobs; unemployment holds at 3.9%", source: "Reuters", credibilityTier: "high", category: "Economics", publishedAt: h(28), url: "#" },
  ],
  CHN: [
    { id: "chn-1", headline: "China conducts military drills around Taiwan Strait", source: "Reuters", credibilityTier: "high", category: "Conflict", publishedAt: h(4), url: "#" },
    { id: "chn-2", headline: "Beijing imposes new export controls on rare earth minerals", source: "Financial Times", credibilityTier: "high", category: "Economics", publishedAt: h(9), url: "#" },
    { id: "chn-3", headline: "China's GDP growth slows to 4.7% amid property sector drag", source: "BBC News", credibilityTier: "high", category: "Economics", publishedAt: h(14), url: "#" },
    { id: "chn-4", headline: "Xi Jinping visits Europe seeking trade concessions", source: "AP News", credibilityTier: "high", category: "Politics", publishedAt: h(18), url: "#" },
    { id: "chn-5", headline: "Huawei unveils new AI chip challenging Nvidia dominance", source: "The Guardian", credibilityTier: "high", category: "Technology", publishedAt: h(22), url: "#" },
  ],
  IRN: [
    { id: "irn-1", headline: "Iran uranium enrichment reaches 84% purity, IAEA warns", source: "Reuters", credibilityTier: "high", category: "Politics", publishedAt: h(5), url: "#" },
    { id: "irn-2", headline: "Tehran launches retaliatory drone strike on Israeli targets", source: "BBC News", credibilityTier: "high", category: "Conflict", publishedAt: h(8), url: "#" },
    { id: "irn-3", headline: "EU sanctions Iranian officials over arms transfers to Russia", source: "Financial Times", credibilityTier: "high", category: "Politics", publishedAt: h(16), url: "#" },
    { id: "irn-4", headline: "Protests erupt in Tehran over economic conditions", source: "Al Jazeera", credibilityTier: "high", category: "Politics", publishedAt: h(24), url: "#" },
  ],
  IND: [
    { id: "ind-1", headline: "India elections: BJP projected to lose outright majority", source: "BBC News", credibilityTier: "high", category: "Politics", publishedAt: h(2), url: "#" },
    { id: "ind-2", headline: "Modi sworn in for third term after coalition deal", source: "Reuters", credibilityTier: "high", category: "Politics", publishedAt: h(6), url: "#" },
    { id: "ind-3", headline: "India overtakes Japan as world's fourth largest economy", source: "Financial Times", credibilityTier: "high", category: "Economics", publishedAt: h(12), url: "#" },
    { id: "ind-4", headline: "Record heatwave kills hundreds across northern states", source: "The Guardian", credibilityTier: "high", category: "Humanitarian", publishedAt: h(18), url: "#" },
  ],
  BRA: [
    { id: "bra-1", headline: "Amazon deforestation falls 50% under Lula government", source: "Reuters", credibilityTier: "high", category: "Environment", publishedAt: h(6), url: "#" },
    { id: "bra-2", headline: "Brazil floods kill 150; Lula declares national emergency", source: "BBC News", credibilityTier: "high", category: "Humanitarian", publishedAt: h(10), url: "#" },
    { id: "bra-3", headline: "Lula pushes BRICS expansion at summit in Rio", source: "AP News", credibilityTier: "high", category: "Politics", publishedAt: h(20), url: "#" },
  ],
  GBR: [
    { id: "gbr-1", headline: "Labour wins UK general election in historic landslide", source: "BBC News", credibilityTier: "high", category: "Politics", publishedAt: h(5), url: "#" },
    { id: "gbr-2", headline: "Keir Starmer unveils economic recovery plan for Britain", source: "The Guardian", credibilityTier: "high", category: "Economics", publishedAt: h(12), url: "#" },
    { id: "gbr-3", headline: "UK GDP growth beats forecasts for second straight quarter", source: "Financial Times", credibilityTier: "high", category: "Economics", publishedAt: h(20), url: "#" },
    { id: "gbr-4", headline: "British army to deploy AI surveillance drones on border", source: "Reuters", credibilityTier: "high", category: "Technology", publishedAt: h(28), url: "#" },
  ],
  SDN: [
    { id: "sdn-1", headline: "Sudan civil war displaces 8 million — world's largest crisis", source: "Al Jazeera", credibilityTier: "high", category: "Humanitarian", publishedAt: h(3), url: "#" },
    { id: "sdn-2", headline: "RSF accused of mass atrocities in Darfur offensive", source: "Reuters", credibilityTier: "high", category: "Conflict", publishedAt: h(7), url: "#" },
    { id: "sdn-3", headline: "UN Security Council fails to agree Sudan ceasefire resolution", source: "BBC News", credibilityTier: "high", category: "Politics", publishedAt: h(14), url: "#" },
  ],
};

const FALLBACK: Article[] = [
  { id: "fb-1", headline: "Diplomatic talks continue amid regional tensions", source: "Reuters", credibilityTier: "high", category: "Politics", publishedAt: h(8), url: "#" },
  { id: "fb-2", headline: "Economic indicators show mixed signals for emerging markets", source: "Financial Times", credibilityTier: "high", category: "Economics", publishedAt: h(16), url: "#" },
  { id: "fb-3", headline: "Humanitarian organisations call for increased aid access", source: "AP News", credibilityTier: "high", category: "Humanitarian", publishedAt: h(24), url: "#" },
];

export function getMockStories(code: string): Article[] {
  return STORIES[code] ?? FALLBACK;
}
