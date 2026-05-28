"use client";

import Link from "next/link";
import { useMemo } from "react";
import Header from "@/components/ui/header";
import BottomTabBar from "@/components/ui/bottom-tab-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { useScores } from "@/lib/hooks/use-scores";
import { countryName } from "@/lib/utils/countries";
import { DL } from "@/lib/design-tokens";

// ─── World region definitions ─────────────────────────────────────────────────
// Each entry maps a friendly region name + icon to a set of ISO 3166-1 alpha-3 codes.
const WORLD_REGIONS: {
  name: string;
  icon: string;
  desc: string;
  isos: readonly string[];
}[] = [
  {
    name: "Europe",
    icon: "🇪🇺",
    desc: "EU, UK, Russia & neighbours",
    isos: [
      "GBR","FRA","DEU","ITA","ESP","POL","NLD","BEL","SWE","NOR","DNK","FIN",
      "AUT","CHE","PRT","GRC","HUN","ROU","UKR","RUS","BLR","SRB","SVK","IRL",
    ],
  },
  {
    name: "Middle East",
    icon: "🕌",
    desc: "Gulf, Levant & North Africa",
    isos: [
      "ISR","IRN","IRQ","SAU","ARE","QAT","KWT","JOR","LBN","SYR","YEM",
      "EGY","LBY","TUN","MAR","DZA","SDN",
    ],
  },
  {
    name: "Asia Pacific",
    icon: "🌏",
    desc: "East Asia, South Asia & Southeast Asia",
    isos: [
      "CHN","JPN","KOR","PRK","IND","PAK","BGD","NPL","AFG","MMR","THA",
      "VNM","PHL","MYS","IDN","SGP","TWN","KAZ","UZB","TUR","AUS","NZL",
    ],
  },
  {
    name: "Americas",
    icon: "🌎",
    desc: "North America, Latin America & the Caribbean",
    isos: [
      "USA","CAN","MEX","BRA","ARG","COL","CHL","PER","VEN","CUB",
    ],
  },
  {
    name: "Sub-Saharan Africa",
    icon: "🌍",
    desc: "East, West, Central & Southern Africa",
    isos: [
      "NGA","SOM","ETH","KEN","TZA","UGA","ZAF","ZWE","MOZ","AGO",
      "CMR","GHA","SSD","COD",
    ],
  },
];

interface RegionCardProps {
  name: string;
  icon: string;
  desc: string;
  isos: readonly string[];
  scores: Record<string, { score: number; articleCount: number }> | null;
  isLoading: boolean;
}

function RegionCard({ name, icon, desc, isos, scores, isLoading }: RegionCardProps) {
  // Sort countries in this region by live score descending
  const ranked = useMemo(() => {
    if (!scores) return [];
    return isos
      .map((iso) => ({ iso, score: scores[iso]?.score ?? 0, articles: scores[iso]?.articleCount ?? 0 }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }, [scores, isos]);

  const regionTotal = ranked.reduce((sum, e) => sum + e.articles, 0);
  const topScore    = ranked[0]?.score ?? 0;

  return (
    <div
      style={{
        background: DL.CARD,
        border: `1px solid ${DL.RULE_2}`,
        borderRadius: 16,
        padding: "22px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 0,
        transition: "border-color 0.14s, box-shadow 0.14s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = DL.CORAL_BD;
        e.currentTarget.style.boxShadow   = "0 4px 20px rgba(224,87,60,0.07)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = DL.RULE_2;
        e.currentTarget.style.boxShadow   = "none";
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 22, marginBottom: 5, lineHeight: 1 }}>{icon}</div>
          <h2 style={{
            fontFamily: DL.DISPLAY, fontSize: 24, fontWeight: 400,
            letterSpacing: -0.5, color: DL.INK, margin: 0, lineHeight: 1.1,
          }}>
            {name}
          </h2>
          <p style={{ fontSize: 11, color: DL.DIM, margin: "4px 0 0", fontFamily: DL.SANS }}>
            {desc}
          </p>
        </div>
        {topScore > 0 && (
          <span style={{
            padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
            background: topScore >= 60 ? DL.CORAL_50 : "#f0ede7",
            color: topScore >= 60 ? DL.CORAL : DL.DIM,
            border: `1px solid ${topScore >= 60 ? DL.CORAL_BD : "rgba(24,22,19,0.10)"}`,
            fontFamily: DL.SANS, flexShrink: 0, marginTop: 2,
          }}>
            {topScore}
          </span>
        )}
      </div>

      {/* Country list */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[70, 55, 80, 50, 65].map((w, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 0",
              borderTop: `1px solid ${DL.RULE_2}`,
            }}>
              <Skeleton width={14} height={10} />
              <Skeleton width={`${w}%`} height={12} />
              <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
                <Skeleton width={52} height={4} />
                <Skeleton width={24} height={10} />
              </div>
            </div>
          ))}
        </div>
      ) : ranked.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {ranked.map((entry, i) => (
            <Link
              key={entry.iso}
              href={`/country/${entry.iso}?name=${encodeURIComponent(countryName(entry.iso))}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 0",
                borderTop: i === 0 ? `1px solid ${DL.RULE_2}` : `1px solid ${DL.RULE_2}`,
                textDecoration: "none",
                transition: "opacity 0.1s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              {/* Rank */}
              <span style={{
                fontFamily: DL.MONO, fontSize: 10, color: DL.DIM,
                width: 16, flexShrink: 0,
              }}>
                {i + 1}
              </span>
              {/* Country name */}
              <span style={{
                flex: 1, fontFamily: DL.SANS, fontSize: 13, fontWeight: 500,
                color: DL.INK,
              }}>
                {countryName(entry.iso)}
              </span>
              {/* Score bar */}
              <div style={{
                width: 52, height: 4, borderRadius: 2,
                background: DL.RULE_2, overflow: "hidden",
                flexShrink: 0,
              }}>
                <div style={{
                  height: "100%",
                  width: `${entry.score}%`,
                  background: entry.score >= 60 ? DL.CORAL : entry.score >= 30 ? "#f0936b" : "#fad9b3",
                  borderRadius: 2,
                  transition: "width 0.4s ease",
                }} />
              </div>
              {/* Score number */}
              <span style={{
                fontFamily: DL.MONO, fontSize: 11, color: DL.CORAL,
                fontWeight: 600, width: 28, textAlign: "right", flexShrink: 0,
              }}>
                {entry.score}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <div style={{
          paddingTop: 16, textAlign: "center",
          borderTop: `1px solid ${DL.RULE_2}`,
        }}>
          <p style={{ fontSize: 12, color: DL.DIM, margin: 0 }}>
            No live coverage in current window
          </p>
        </div>
      )}

      {/* Footer */}
      {regionTotal > 0 && (
        <div style={{
          marginTop: 12,
          paddingTop: 10,
          borderTop: `1px solid ${DL.RULE_2}`,
          fontSize: 11, color: DL.DIM, fontFamily: DL.SANS,
        }}>
          {regionTotal.toLocaleString()} articles across top {ranked.length} countries
        </div>
      )}
    </div>
  );
}

export default function RegionsPage() {
  const { scores, isLoading } = useScores();

  return (
    <div
      className="route-fade"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: DL.PAPER,
        overflow: "hidden",
        fontFamily: DL.SANS,
      }}
    >
      <Header active="Regions" />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div
          className="regions-body"
          style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 44px 80px" }}
        >
          {/* Page header */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18,
              textTransform: "uppercase", color: DL.CORAL,
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
              {!isLoading && (
                <span style={{ width: 5, height: 5, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
              )}
              {isLoading ? "Loading…" : "Live coverage"}
            </div>
            <h1
              className="regions-h1"
              style={{
                fontFamily: DL.DISPLAY, fontSize: 72, fontWeight: 400,
                letterSpacing: -2.5, lineHeight: 0.88, color: DL.INK,
                margin: "0 0 12px",
              }}
            >
              Regions
            </h1>
            <p style={{ fontSize: 14, color: DL.DIM, maxWidth: 440, lineHeight: 1.55, margin: 0 }}>
              Top-5 most-covered countries per world region, ranked by live coverage intensity.
              Click any country to see all recent stories.
            </p>
          </div>

          {/* Region grid */}
          <div
            className="regions-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))",
              gap: 18,
            }}
          >
            {WORLD_REGIONS.map((region) => (
              <RegionCard
                key={region.name}
                name={region.name}
                icon={region.icon}
                desc={region.desc}
                isos={region.isos}
                scores={scores}
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-tab-wrapper">
        <BottomTabBar active="Regions" />
      </div>
    </div>
  );
}
