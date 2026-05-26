"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import Header from "@/components/ui/header";
import { useScores } from "@/lib/hooks/use-scores";
import { useArticles } from "@/lib/hooks/use-articles";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { DL } from "@/lib/design-tokens";
import { ALL_CATEGORIES } from "@/lib/stores/map-store";
import { relativeTime } from "@/lib/utils/time";
import { countryName as isoToName } from "@/lib/utils/countries";
import type { Article } from "@/lib/types/article";

interface PageProps {
  params: Promise<{ iso: string }>;
  searchParams: Promise<{ name?: string }>;
}

function ArticleRow({ article, summary }: { article: Article; summary?: string }) {
  return (
    <div style={{ padding: "10px 0", borderTop: `1px solid ${DL.RULE_2}` }}>
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: 13.5, lineHeight: 1.35, fontWeight: 600,
          color: DL.INK, textDecoration: "none", display: "block",
          fontFamily: DL.SANS,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
        onMouseLeave={(e) => (e.currentTarget.style.color = DL.INK)}
      >
        {article.headline}
      </a>
      {summary && (
        <div style={{ fontSize: 12, color: DL.DIM, marginTop: 3, lineHeight: 1.4, fontFamily: DL.SANS }}>
          {summary}
        </div>
      )}
      <div style={{ marginTop: 5, fontSize: 11, color: DL.DIM, display: "flex", gap: 8, fontFamily: DL.SANS }}>
        <span style={{ color: DL.INK_2, fontWeight: 600 }}>{article.source}</span>
        <span>·</span>
        <span>{relativeTime(article.publishedAt)}</span>
      </div>
    </div>
  );
}

export default function CountryPage({ params, searchParams }: PageProps) {
  const { iso } = use(params);
  const { name: nameParam } = use(searchParams);

  const { scores } = useScores();
  const { articles, loading, isLive } = useArticles(iso, "24h", ALL_CATEGORIES);
  const { toggleWatch, isWatched } = useWatchlistStore();

  const scoreEntry = scores?.[iso];
  const score = scoreEntry?.score ?? 0;
  const displayName = nameParam ?? isoToName(iso);
  const watched = isWatched(iso);

  // Group articles by category
  const grouped = useMemo(() => {
    const groups: Record<string, Article[]> = {};
    for (const a of articles) {
      const key = a.category;
      if (!groups[key]) groups[key] = [];
      groups[key].push(a);
    }
    return Object.entries(groups);
  }, [articles]);

  const heroArticle = articles[0];

  return (
    <div className="route-fade" style={{ display: "flex", flexDirection: "column", height: "100vh", background: DL.PAPER, overflow: "hidden", fontFamily: DL.SANS }}>
      <Header active="Today" />

      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 44px 0", color: DL.DIM, fontSize: 12 }}>
        <Link href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          color: DL.INK_2, fontWeight: 500, textDecoration: "none",
        }}>
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="8,3 4,7 8,11" /><line x1="4" y1="7" x2="12" y2="7" />
          </svg>
          Today
        </Link>
        <span>·</span>
        <span style={{ color: DL.INK, fontWeight: 600 }}>{displayName}</span>
        <span style={{ marginLeft: "auto", fontFamily: DL.MONO, fontSize: 11, letterSpacing: 0.08 }}>
          {isLive ? "Live coverage" : ""}
        </span>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, padding: "20px 44px 0", gap: 0, overflow: "hidden" }}>

        {/* Left: country header + hero story */}
        <div style={{ flex: 1, paddingRight: 36, overflowY: "auto", paddingBottom: 24 }}>
          {/* Hero header */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
            <div style={{
              fontFamily: DL.DISPLAY, fontSize: 100, fontWeight: 400,
              letterSpacing: -3.5, lineHeight: 0.85, color: DL.INK,
            }}>
              {displayName}
            </div>
            <div style={{ paddingBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: DL.MONO, fontSize: 11, color: DL.DIM, letterSpacing: 0.08 }}>
                {iso}
              </span>
              {isLive && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: DL.LIVE, fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.LIVE, display: "inline-block" }} />
                  LIVE COVERAGE
                </span>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex", gap: 0, marginTop: 20,
            borderTop: `1px solid ${DL.RULE}`, borderBottom: `1px solid ${DL.RULE}`,
          }}>
            {[
              ["Intensity",  score.toString(),               DL.CORAL,  "coverage score"],
              ["Articles",   articles.length.toString(),     DL.INK,    `across ${new Set(articles.map((a) => a.source)).size} outlets`],
              ["Top cat.",   articles[0]?.category ?? "—",  DL.CORAL,  "most reported"],
              ["Rank",       scoreEntry ? "#—" : "—",        DL.INK,    "globally today"],
            ].map(([k, v, c, sub], i) => (
              <div key={k} style={{
                flex: 1, padding: "14px 0",
                borderLeft: i > 0 ? `1px solid ${DL.RULE_2}` : "none",
                paddingLeft: i > 0 ? 18 : 0,
              }}>
                <div style={{ fontSize: 10, color: DL.DIM, fontWeight: 500, letterSpacing: 0.04, textTransform: "uppercase" }}>{k}</div>
                <div style={{ fontFamily: DL.DISPLAY, fontSize: 28, fontWeight: 500, marginTop: 3, color: c, letterSpacing: -0.5 }}>{v}</div>
                <div style={{ fontSize: 11, color: DL.DIM, marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Hero story */}
          {heroArticle && (
            <div style={{ marginTop: 26 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.16,
                textTransform: "uppercase", color: DL.CORAL, marginBottom: 10,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
                Top story · {relativeTime(heroArticle.publishedAt)}
              </div>
              <a
                href={heroArticle.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", fontFamily: DL.DISPLAY, fontSize: 36, fontWeight: 400,
                  letterSpacing: -0.9, lineHeight: 1.05, color: DL.INK, textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
                onMouseLeave={(e) => (e.currentTarget.style.color = DL.INK)}
              >
                {heroArticle.headline}
              </a>
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: DL.DIM }}>
                <span style={{ color: DL.INK_2, fontWeight: 600 }}>{heroArticle.source}</span>
                <span>·</span>
                <span style={{ color: DL.CORAL, fontWeight: 600 }}>{heroArticle.category}</span>
                <a
                  href={heroArticle.url} target="_blank" rel="noopener noreferrer"
                  style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 5, color: DL.INK_2, textDecoration: "none" }}
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                    <line x1="2" y1="7" x2="12" y2="7" /><polyline points="9,4 12,7 9,10" />
                  </svg>
                  Read
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right: grouped feed */}
        <div style={{
          width: 460, flexShrink: 0,
          borderLeft: `1px solid ${DL.RULE}`, paddingLeft: 28,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {/* Save button */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <span style={{ fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.12, textTransform: "uppercase", color: DL.DIM }}>
              All coverage · grouped by category
            </span>
            <button
              onClick={() => toggleWatch(iso, displayName)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                color: watched ? DL.CORAL : DL.DIM, background: "none",
                border: "none", cursor: "pointer", fontFamily: DL.SANS, fontSize: 11,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 16 16"
                fill={watched ? "currentColor" : "none"}
                stroke="currentColor" strokeWidth={watched ? "0" : "1.5"}>
                <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
              </svg>
              {watched ? "Saved" : "Save"}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
            {loading ? (
              <div style={{ paddingTop: 48, display: "flex", justifyContent: "center" }}>
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DL.DIM} strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" />
                </svg>
              </div>
            ) : grouped.length > 0 ? (
              grouped.map(([group, items], gi) => (
                <div key={group} style={{ marginTop: gi === 0 ? 0 : 20 }}>
                  {/* Group header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontFamily: DL.DISPLAY, fontSize: 15, fontWeight: 500, color: DL.INK }}>{group}</span>
                    <span style={{ flex: 1, height: 1, background: DL.RULE_2 }} />
                    <span style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM }}>{items.length}</span>
                  </div>
                  {items.map((a) => <ArticleRow key={a.id} article={a} />)}
                </div>
              ))
            ) : (
              <p style={{ fontSize: 13, color: DL.DIM, paddingTop: 40, textAlign: "center" }}>
                No recent coverage found.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
