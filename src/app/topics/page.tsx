"use client";

import Link from "next/link";
import useSWR from "swr";
import Header from "@/components/ui/header";
import BottomTabBar from "@/components/ui/bottom-tab-bar";
import { DL } from "@/lib/design-tokens";
import { ALL_CATEGORIES } from "@/lib/stores/map-store";

interface TrendingResponse {
  trending: { query: string; count: number }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Category descriptions shown on the card
const CAT_META: Record<string, { desc: string; icon: string }> = {
  Conflict:      { icon: "⚡", desc: "Armed conflict, military operations, warfare" },
  Politics:      { icon: "🏛", desc: "Government, elections, diplomacy, policy" },
  Humanitarian:  { icon: "🤝", desc: "Aid, refugees, human rights, crises" },
  Economics:     { icon: "📈", desc: "Markets, trade, sanctions, development" },
  Technology:    { icon: "💡", desc: "AI, cyber, space, innovation" },
  Environment:   { icon: "🌍", desc: "Climate, energy, disasters, conservation" },
  Sports:        { icon: "🏆", desc: "International sports and major tournaments" },
  Entertainment: { icon: "🎬", desc: "Culture, film, music, global media" },
};

export default function TopicsPage() {
  const { data: trendingData } = useSWR<TrendingResponse>(
    "/api/search/trending",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const trending = trendingData?.trending ?? [];

  return (
    <div
      className="route-fade"
      style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: DL.PAPER, overflow: "hidden", fontFamily: DL.SANS,
      }}
    >
      <Header active="Topics" />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="topics-body" style={{ maxWidth: 960, margin: "0 auto", padding: "36px 44px 60px" }}>

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18,
              textTransform: "uppercase", color: DL.CORAL,
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
              Browse by topic
            </div>
            <h1 className="topics-h1" style={{
              fontFamily: DL.DISPLAY, fontSize: 64, fontWeight: 400,
              letterSpacing: -2.2, lineHeight: 0.90, color: DL.INK,
              margin: "0 0 12px",
            }}>
              Topics
            </h1>
            <p style={{ fontSize: 14, color: DL.DIM, maxWidth: 440, lineHeight: 1.55, margin: 0 }}>
              Every article is categorised automatically on ingest. Click a topic to search recent coverage.
            </p>
          </div>

          {/* ── Trending searches ────────────────────────────────────────── */}
          {trending.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{
                fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.14,
                textTransform: "uppercase", color: DL.DIM, marginBottom: 12,
              }}>
                Trending searches this week
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {trending.map(({ query, count }) => (
                  <Link
                    key={query}
                    href={`/search?q=${encodeURIComponent(query)}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      padding: "7px 14px", borderRadius: 999,
                      background: DL.CORAL_50, color: DL.CORAL,
                      border: `1px solid ${DL.CORAL_BD}`,
                      textDecoration: "none", fontSize: 13, fontWeight: 500,
                      transition: "all 0.12s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#ffe4dc")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = DL.CORAL_50)}
                  >
                    {query}
                    <span style={{ fontFamily: DL.MONO, fontSize: 10, opacity: 0.6 }}>
                      {count}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* ── Category grid ─────────────────────────────────────────────── */}
          <div className="topics-grid" style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
            gap: 14,
          }}>
            {ALL_CATEGORIES.map((cat) => {
              const meta = CAT_META[cat] ?? { icon: "📰", desc: "" };
              return (
                <Link
                  key={cat}
                  href={`/search?q=${encodeURIComponent(cat.toLowerCase())}`}
                  style={{
                    display: "block",
                    textDecoration: "none",
                    background: DL.CARD,
                    border: `1px solid ${DL.RULE_2}`,
                    borderRadius: 14,
                    padding: "18px 20px",
                    transition: "all 0.14s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = DL.CORAL_BD;
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(224,87,60,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = DL.RULE_2;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ fontSize: 22, marginBottom: 8 }}>{meta.icon}</div>
                  <div style={{
                    fontFamily: DL.DISPLAY, fontSize: 20, fontWeight: 500,
                    letterSpacing: -0.3, color: DL.INK, marginBottom: 6,
                  }}>
                    {cat}
                  </div>
                  <div style={{ fontSize: 11, color: DL.DIM, lineHeight: 1.45 }}>
                    {meta.desc}
                  </div>
                  <div style={{
                    marginTop: 14, display: "inline-flex", alignItems: "center", gap: 4,
                    fontSize: 11, fontWeight: 600, color: DL.CORAL,
                  }}>
                    Browse
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                      <line x1="2" y1="7" x2="12" y2="7" /><polyline points="9,4 12,7 9,10" />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>

        </div>
      </div>

      <div className="bottom-tab-wrapper">
        <BottomTabBar active="Topics" />
      </div>
    </div>
  );
}
