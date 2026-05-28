"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/ui/header";
import BottomTabBar from "@/components/ui/bottom-tab-bar";
import BackPill from "@/components/ui/back-pill";
import { useRelativeTime } from "@/lib/hooks/use-relative-time";
import { DL } from "@/lib/design-tokens";
import { countryName as isoToName } from "@/lib/utils/countries";
import { Skeleton } from "@/components/ui/skeleton";
import type { Article } from "@/lib/types/article";

interface PageProps {
  params: { city: string };
  searchParams: { country?: string; score?: string };
}

function ArticleRow({ article }: { article: Article }) {
  const timeAgo = useRelativeTime(article.publishedAt);
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
      <div style={{ marginTop: 5, fontSize: 11, color: DL.DIM, display: "flex", gap: 8, fontFamily: DL.SANS }}>
        <span style={{ color: DL.INK_2, fontWeight: 600 }}>{article.source}</span>
        <span>·</span>
        <span>{timeAgo}</span>
        <span>·</span>
        <span style={{ color: DL.CORAL, fontWeight: 600 }}>{article.category}</span>
      </div>
    </div>
  );
}

export default function RegionPage({ params, searchParams }: PageProps) {
  const city       = decodeURIComponent(params.city);
  const countryIso = searchParams.country ?? "";
  const score      = parseInt(searchParams.score ?? "0", 10);

  const countryDisplay = countryIso ? isoToName(countryIso) : "";

  const [cityArticles, setCityArticles] = useState<Article[]>([]);
  const [cityLoading, setCityLoading]   = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [retryCount, setRetryCount]     = useState(0);

  // Live-updating timestamp for the hero story
  const heroTime = useRelativeTime(cityArticles[0]?.publishedAt ?? "");

  // Memoize source count to avoid recalculating on every render
  const sourceCount = useMemo(
    () => new Set(cityArticles.map((a) => a.source)).size,
    [cityArticles]
  );

  const retry = useCallback(() => {
    setFetchError(null);
    setCityLoading(true);
    setRetryCount((c) => c + 1);
  }, []);

  useEffect(() => {
    const qs = new URLSearchParams({
      city,
      ...(countryIso && { country: countryIso }),
      window: "24h",
      limit: "30",
    });
    fetch(`/api/articles?${qs}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        if (Array.isArray(d.articles)) {
          setCityArticles(
            d.articles.map((a: {
              id: string; title: string; url: string; publishedAt: string;
              category: string | null; source: string; domain: string;
              credibilityTier: string;
            }) => ({
              id: a.id,
              headline: a.title,
              source: a.source,
              credibilityTier: a.credibilityTier,
              category: (a.category ?? "Politics") as Article["category"],
              publishedAt: a.publishedAt,
              url: a.url,
            }))
          );
        }
      })
      .catch(() => setFetchError("Couldn't load coverage. Check your connection."))
      .finally(() => setCityLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, countryIso, retryCount]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, Article[]> = {};
    for (const a of cityArticles) {
      if (!groups[a.category]) groups[a.category] = [];
      groups[a.category].push(a);
    }
    return Object.entries(groups);
  }, [cityArticles]);

  const topCategory = cityArticles[0]?.category ?? "—";

  const backHref  = countryIso ? `/country/${countryIso}?name=${encodeURIComponent(countryDisplay)}` : "/";
  const backLabel = countryDisplay || "Back";

  return (
    <div
      className="route-fade country-page"
      style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: DL.PAPER, overflow: "hidden", fontFamily: DL.SANS,
      }}
    >
      <Header active="Today" />

      {/* Breadcrumb */}
      <div
        className="country-breadcrumb"
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 44px 0", color: DL.DIM, fontSize: 12 }}
      >
        {countryIso ? (
          <>
            <Link
              href="/"
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: DL.INK_2, fontWeight: 500, textDecoration: "none" }}
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="8,3 4,7 8,11" /><line x1="4" y1="7" x2="12" y2="7" />
              </svg>
              Today
            </Link>
            <span>·</span>
            <Link
              href={`/country/${countryIso}?name=${encodeURIComponent(countryDisplay)}`}
              style={{ color: DL.INK_2, fontWeight: 500, textDecoration: "none" }}
            >
              {countryDisplay}
            </Link>
          </>
        ) : (
          <Link
            href="/"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, color: DL.INK_2, fontWeight: 500, textDecoration: "none" }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="8,3 4,7 8,11" /><line x1="4" y1="7" x2="12" y2="7" />
            </svg>
            Today
          </Link>
        )}
        <span>·</span>
        <span style={{ color: DL.INK, fontWeight: 600 }}>{city}</span>
      </div>

      {/* Body */}
      <div
        className="country-body"
        style={{ display: "flex", flex: 1, minHeight: 0, padding: "20px 44px 0", gap: 0, overflow: "hidden" }}
      >
        {/* Left: city header + intensity stats */}
        <div className="country-left" style={{ flex: 1, paddingRight: 36, overflowY: "auto", paddingBottom: 24 }}>
          {/* Hero */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16 }}>
            <div
              className="country-hero-name"
              style={{
                fontFamily: DL.DISPLAY, fontSize: 72, fontWeight: 400,
                letterSpacing: -2.5, lineHeight: 0.88, color: DL.INK,
              }}
            >
              {city}
            </div>
            {countryDisplay && (
              <div style={{ paddingBottom: 8, fontFamily: DL.MONO, fontSize: 11, color: DL.DIM, letterSpacing: 0.08 }}>
                {countryIso}
              </div>
            )}
          </div>

          {/* Stats */}
          <div
            className="country-stats"
            style={{
              display: "flex", gap: 0, marginTop: 20,
              borderTop: `1px solid ${DL.RULE}`, borderBottom: `1px solid ${DL.RULE}`,
            }}
          >
            {([
              ["Intensity",  score.toString(),              DL.CORAL, "city coverage score"],
              ["Articles",   cityArticles.length.toString(), DL.INK,  `across ${sourceCount} outlets`],
              ["Top cat.",   topCategory,                   DL.CORAL, "most reported"],
              ["Country",    countryDisplay || "—",         DL.INK,   countryIso || ""],
            ] as [string, string, string, string][]).map(([k, v, c, sub], i) => (
              <div key={k} className="country-stat" style={{
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

          {/* Hero article */}
          {cityArticles[0] && (
            <div style={{ marginTop: 26 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.16,
                textTransform: "uppercase", color: DL.CORAL, marginBottom: 10,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
                Top story · {heroTime}
              </div>
              <a
                href={cityArticles[0].url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block", fontFamily: DL.DISPLAY, fontSize: 30, fontWeight: 400,
                  letterSpacing: -0.7, lineHeight: 1.08, color: DL.INK, textDecoration: "none",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
                onMouseLeave={(e) => (e.currentTarget.style.color = DL.INK)}
              >
                {cityArticles[0].headline}
              </a>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: DL.DIM }}>
                <span style={{ color: DL.INK_2, fontWeight: 600 }}>{cityArticles[0].source}</span>
                <span>·</span>
                <span style={{ color: DL.CORAL, fontWeight: 600 }}>{cityArticles[0].category}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right: article feed grouped by category */}
        <div
          className="country-right"
          style={{
            width: 460, flexShrink: 0,
            borderLeft: `1px solid ${DL.RULE}`, paddingLeft: 28,
            display: "flex", flexDirection: "column", overflow: "hidden",
          }}
        >
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.12, textTransform: "uppercase", color: DL.DIM }}>
              All coverage · grouped by category
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", paddingBottom: 24 }}>
            {cityLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 4 }}>
                {Array.from({ length: 8 }, (_, i) => {
                  const widths = ["88%", "72%", "80%", "65%", "75%", "90%", "68%", "78%"];
                  return (
                    <div key={i} style={{ padding: "10px 0", borderTop: `1px solid ${DL.RULE_2}` }}>
                      <Skeleton width={widths[i % widths.length]} height={14} style={{ marginBottom: 6 }} />
                      <Skeleton width="45%" height={11} />
                    </div>
                  );
                })}
              </div>
            ) : fetchError ? (
              <div style={{ paddingTop: 48, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: DL.DIM, margin: 0 }}>{fetchError}</p>
                <button
                  onClick={retry}
                  style={{
                    padding: "7px 18px", borderRadius: 999,
                    background: DL.INK, color: DL.PAPER,
                    border: "none", cursor: "pointer",
                    fontFamily: DL.SANS, fontSize: 12, fontWeight: 600,
                  }}
                >
                  Try again
                </button>
              </div>
            ) : grouped.length > 0 ? (
              grouped.map(([group, items], gi) => (
                <div key={group} style={{ marginTop: gi === 0 ? 0 : 20 }}>
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
                No recent coverage for {city}.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: floating back pill */}
      <BackPill href={backHref} label={backLabel} />

      <div className="bottom-tab-wrapper">
        <BottomTabBar active="Today" />
      </div>
    </div>
  );
}
