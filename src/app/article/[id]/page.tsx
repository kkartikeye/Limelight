"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/ui/header";
import BottomTabBar from "@/components/ui/bottom-tab-bar";
import { DL } from "@/lib/design-tokens";
import { relativeTime } from "@/lib/utils/time";
import { countryName } from "@/lib/utils/countries";
import { useReads } from "@/lib/hooks/use-reads";

interface ApiArticle {
  id: string;
  headline: string;
  url: string;
  publishedAt: string;
  category: string;
  source: string;
  domain: string;
  credibilityTier: string;
  countryCode: string | null;
}

interface PageProps {
  params: { id: string };
  /**
   * Short query params encoded by StoryPanel's HeadlineRow as a fallback
   * so mock articles (not in Supabase) still render correctly.
   * h=headline, s=source, u=url, c=category, t=publishedAt, cc=countryCode
   */
  searchParams: {
    h?: string; s?: string; u?: string;
    c?: string; t?: string; cc?: string;
  };
}

function readingTime(): string {
  return "~3 min read";
}

export default function ArticlePage({ params, searchParams }: PageProps) {
  const { id } = params;
  // Destructure individually so useEffect deps are stable primitives
  const { h: fbH, s: fbS, u: fbU, c: fbC, t: fbT, cc: fbCC } = searchParams;

  const [article, setArticle] = useState<ApiArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const { logRead } = useReads();

  // Log this article as read (no-op for mock IDs or unauthenticated users)
  useEffect(() => {
    logRead(id);
  }, [id, logRead]);

  useEffect(() => {
    fetch(`/api/articles/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.article) {
          setArticle(d.article);
        } else if (fbH) {
          // API returned 404 but we have fallback data (e.g. mock article)
          setArticle({
            id,
            headline: fbH,
            url: fbU ?? "#",
            publishedAt: fbT ?? new Date().toISOString(),
            category: fbC ?? "Politics",
            source: fbS ?? "Unknown",
            domain: "",
            credibilityTier: "medium",
            countryCode: fbCC ?? null,
          });
        }
      })
      .catch(() => {
        if (fbH) {
          setArticle({
            id,
            headline: fbH,
            url: fbU ?? "#",
            publishedAt: fbT ?? new Date().toISOString(),
            category: fbC ?? "Politics",
            source: fbS ?? "Unknown",
            domain: "",
            credibilityTier: "medium",
            countryCode: fbCC ?? null,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id, fbH, fbS, fbU, fbC, fbT, fbCC]);

  const displayCountry = article?.countryCode ? countryName(article.countryCode) : null;

  return (
    <div className="route-fade article-page" style={{ display: "flex", flexDirection: "column", height: "100vh", background: DL.PAPER, overflow: "hidden", fontFamily: DL.SANS }}>
      <Header active="Today" />

      {/* Breadcrumb */}
      <div className="article-breadcrumb" style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "14px 44px 0", color: DL.DIM, fontSize: 12,
      }}>
        <Link
          href={
            article?.countryCode
              ? `/country/${article.countryCode}?name=${encodeURIComponent(countryName(article.countryCode))}`
              : "/"
          }
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: DL.INK_2, fontWeight: 500, textDecoration: "none",
          }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <polyline points="8,3 4,7 8,11" /><line x1="4" y1="7" x2="12" y2="7" />
          </svg>
          {displayCountry ?? "Back"}
        </Link>
        {article && (
          <>
            <span>·</span>
            <span style={{ color: DL.CORAL, fontWeight: 600 }}>{article.category}</span>
          </>
        )}
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 16, alignItems: "center" }}>
          <a
            href={article?.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, color: DL.INK_2, textDecoration: "none", fontSize: 11 }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 1.5h8v11l-4-3-4 3z" />
            </svg>
            Save
          </a>
          <a
            href={article?.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 5, color: DL.INK_2, textDecoration: "none", fontSize: 11 }}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="3" cy="7" r="1.5" /><circle cx="11" cy="3" r="1.5" /><circle cx="11" cy="11" r="1.5" />
              <line x1="4.3" y1="6.3" x2="9.7" y2="3.7" /><line x1="4.3" y1="7.7" x2="9.7" y2="10.3" />
            </svg>
            Share
          </a>
        </span>
      </div>

      {/* Body */}
      <div className="article-body" style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* Reading column */}
        <div className="article-content" style={{ flex: 1, padding: "28px 44px 0", overflowY: "auto" }}>
          {loading ? (
            <div style={{ paddingTop: 80, display: "flex", justifyContent: "center" }}>
              <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={DL.DIM} strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
            </div>
          ) : article ? (
            <div style={{ maxWidth: 660 }}>
              {/* Eyebrow */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.16,
                textTransform: "uppercase", color: DL.CORAL,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
                {article.category}{displayCountry ? ` · ${displayCountry}` : ""}
              </div>

              {/* Headline */}
              <h1 className="article-headline" style={{
                fontFamily: DL.DISPLAY, fontSize: 50, fontWeight: 400,
                letterSpacing: -1.2, lineHeight: 1.02,
                margin: "14px 0 16px", color: DL.INK,
              }}>
                {article.headline}
              </h1>

              {/* Byline strip */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 0",
                borderTop: `1px solid ${DL.RULE}`,
                borderBottom: `1px solid ${DL.RULE}`,
                marginBottom: 28,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 999,
                  background: DL.PAPER_2,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: DL.DISPLAY, fontSize: 12, fontWeight: 500, color: DL.INK_2,
                  border: `1px solid ${DL.RULE_2}`, flexShrink: 0,
                }}>
                  {article.source.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: DL.INK }}>{article.source}</div>
                  <div style={{ fontSize: 11, color: DL.DIM, fontFamily: DL.MONO, letterSpacing: 0.06 }}>
                    {relativeTime(article.publishedAt)} · {readingTime()}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                    background: DL.CORAL_50, color: DL.CORAL, border: `1px solid ${DL.CORAL_BD}`,
                    fontFamily: DL.SANS,
                  }}>
                    {article.category}
                  </span>
                </div>
              </div>

              {/* Body */}
              <div style={{ fontFamily: DL.DISPLAY, fontSize: 17.5, lineHeight: 1.55, color: DL.INK_2, maxWidth: 600 }}>
                <p style={{ margin: "0 0 18px" }}>
                  This article was reported by <strong style={{ color: DL.INK }}>{article.source}</strong>. Limelight surfaces
                  article metadata and directs you to the original source for the full story.
                </p>
                <p style={{ margin: "0 0 18px" }}>
                  The coverage is filed under <strong style={{ color: DL.INK }}>{article.category}</strong> and was
                  published {relativeTime(article.publishedAt)}.
                </p>
                {article.url && article.url !== "#" && (
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 8,
                      padding: "10px 18px", borderRadius: 999,
                      background: DL.INK, color: DL.PAPER,
                      textDecoration: "none", fontSize: 13, fontWeight: 600,
                      fontFamily: DL.SANS,
                    }}
                  >
                    Read full article at {article.source}
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                      <line x1="2" y1="7" x2="12" y2="7" /><polyline points="9,4 12,7 9,10" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div style={{ paddingTop: 80, textAlign: "center" }}>
              <p style={{ fontSize: 14, color: DL.DIM }}>Article not found.</p>
              <Link href="/" style={{ color: DL.CORAL, fontSize: 13, marginTop: 8, display: "block" }}>
                ← Back to map
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar — hidden on mobile */}
        <div className="article-sidebar" style={{
          width: 360, flexShrink: 0,
          borderLeft: `1px solid ${DL.RULE}`,
          padding: "28px 36px 22px 28px",
          display: "flex", flexDirection: "column", gap: 22,
          overflowY: "auto",
        }}>
          {article && (
            <>
              <div>
                <div style={{
                  fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.12,
                  textTransform: "uppercase", color: DL.DIM, marginBottom: 10,
                }}>
                  Filed under
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {[article.category, ...(displayCountry ? [displayCountry] : []), ...(article.domain ? [article.domain] : [])].map((tag) => (
                    <span key={tag} style={{
                      padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500,
                      background: tag === article.category ? DL.CORAL_50 : DL.CARD,
                      color:      tag === article.category ? DL.CORAL    : DL.INK_2,
                      border: `1px solid ${tag === article.category ? DL.CORAL_BD : DL.RULE_2}`,
                      fontFamily: DL.SANS,
                    }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {article.source && (
                <div>
                  <div style={{
                    fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.12,
                    textTransform: "uppercase", color: DL.DIM, marginBottom: 10,
                  }}>
                    Source
                  </div>
                  <p style={{ fontSize: 13, color: DL.INK, fontWeight: 600, margin: 0 }}>{article.source}</p>
                  {article.domain && (
                    <a
                      href={`https://${article.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 11, color: DL.DIM, marginTop: 4, display: "block", textDecoration: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
                      onMouseLeave={(e) => (e.currentTarget.style.color = DL.DIM)}
                    >
                      {article.domain}
                    </a>
                  )}
                </div>
              )}

              {article.countryCode && (
                <div>
                  <div style={{
                    fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.12,
                    textTransform: "uppercase", color: DL.DIM, marginBottom: 10,
                  }}>
                    Explore
                  </div>
                  <Link
                    href={`/country/${article.countryCode}?name=${encodeURIComponent(countryName(article.countryCode))}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      fontSize: 12, color: DL.INK_2, textDecoration: "none", fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = DL.INK_2)}
                  >
                    All coverage from {displayCountry}
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                      <line x1="2" y1="7" x2="12" y2="7" /><polyline points="9,4 12,7 9,10" />
                    </svg>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bottom-tab-wrapper">
        <BottomTabBar active="Today" />
      </div>
    </div>
  );
}
