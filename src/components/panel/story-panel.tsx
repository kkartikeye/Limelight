"use client";

import { useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useArticles } from "@/lib/hooks/use-articles";
import { useMapStore } from "@/lib/stores/map-store";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { useUser } from "@/lib/hooks/use-user";
import { useReads } from "@/lib/hooks/use-reads";
import { useRelativeTime } from "@/lib/hooks/use-relative-time";
import { DL } from "@/lib/design-tokens";
import { HeadlineSkeleton } from "@/components/ui/skeleton";
import type { Article } from "@/lib/types/article";

interface StoryPanelProps {
  countryCode: string;
  countryName: string;
  score: number;
  onClose?: () => void;
  /** True when no country was explicitly clicked — showing the highest-scored country automatically */
  isAutoSelected?: boolean;
}

function HeadlineRow({
  article, index, countryCode, isRead,
}: {
  article: Article; index: number; countryCode: string; isRead?: boolean;
}) {
  // Encode article metadata as search params so the reader page can render
  // even when the article ID isn't in Supabase (e.g. mock articles).
  const params = new URLSearchParams({
    h: article.headline,
    s: article.source,
    u: article.url,
    c: article.category ?? "Politics",
    t: article.publishedAt,
    cc: countryCode,
  });

  const timeAgo = useRelativeTime(article.publishedAt);
  const baseColor = isRead ? DL.DIM : DL.INK;

  return (
    <div style={{
      padding: "12px 0",
      borderBottom: `1px solid ${DL.RULE_2}`,
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
      opacity: isRead ? 0.65 : 1,
    }}>
      <span style={{
        width: 24, flexShrink: 0,
        fontFamily: DL.MONO, fontSize: 11, color: DL.DIM,
        paddingTop: 2, fontVariantNumeric: "tabular-nums",
      }}>
        {String(index + 1).padStart(2, "0")}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/article/${article.id}?${params}`}
          style={{
            display: "block",
            fontFamily: DL.SANS,
            fontSize: 14,
            lineHeight: 1.32,
            color: baseColor,
            fontWeight: isRead ? 400 : 500,
            textDecoration: "none",
            transition: "color 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
          onMouseLeave={(e) => (e.currentTarget.style.color = baseColor)}
        >
          {article.headline}
        </Link>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          marginTop: 5, fontSize: 11, color: DL.DIM, fontFamily: DL.SANS,
        }}>
          <span style={{ fontWeight: 600, color: DL.INK_2 }}>{article.source}</span>
          <span>·</span>
          <span style={{ color: DL.CORAL, fontWeight: 600 }}>{article.category}</span>
          <span style={{ marginLeft: "auto", fontFamily: DL.MONO, fontSize: 10 }}>
            {timeAgo}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function StoryPanel({ countryCode, countryName, score, onClose, isAutoSelected = false }: StoryPanelProps) {
  const { filters } = useMapStore();
  const { toggleWatch, isWatched } = useWatchlistStore();
  const { user } = useUser();
  const { readIds } = useReads();
  const watched = isWatched(countryCode);
  const { articles, loading, isLive } = useArticles(countryCode, filters.timeWindow, filters.categories);

  useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Mirror watchlist toggle to server when signed in
  const handleToggleWatch = useCallback(() => {
    const adding = !isWatched(countryCode);
    toggleWatch(countryCode, countryName);
    if (user) {
      void fetch("/api/watchlist", {
        method: adding ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(adding ? { iso: countryCode, name: countryName } : { iso: countryCode }),
      });
    }
  }, [user, toggleWatch, isWatched, countryCode, countryName]);

  const sourceCount = useMemo(
    () => new Set(articles.map((a) => a.source)).size,
    [articles]
  );

  const chipBg    = score >= 70 ? DL.CORAL_50 : "#f0ede7";
  const chipColor = score >= 70 ? DL.CORAL    : DL.DIM;
  const chipBd    = score >= 70 ? DL.CORAL_BD : "rgba(24,22,19,0.10)";

  return (
    <div style={{
      display: "flex", flexDirection: "column", height: "100%",
      padding: "16px 36px 22px 28px",
      background: DL.PAPER,
      borderLeft: `1px solid ${DL.RULE}`,
      overflow: "hidden",
    }}>
      {/* Eyebrow + actions */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18,
          textTransform: "uppercase",
          color: isAutoSelected ? DL.CORAL : DL.DIM,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          {isAutoSelected && (
            <span style={{ width: 5, height: 5, borderRadius: 999, background: DL.CORAL, display: "inline-block", flexShrink: 0 }} />
          )}
          {isAutoSelected ? "Trending now" : "In focus"}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={handleToggleWatch}
            title={watched ? "Remove from watchlist" : "Watch this country"}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              color: watched ? DL.CORAL : DL.DIM,
              background: "none", border: "none", cursor: "pointer",
              fontFamily: DL.SANS, fontSize: 11,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16"
              fill={watched ? "currentColor" : "none"}
              stroke="currentColor" strokeWidth={watched ? "0" : "1.5"}>
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
            </svg>
            Save
          </button>
          {onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: DL.DIM, padding: 2 }}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Serif country name — font scales down for longer names */}
      <div style={{
        fontFamily: DL.DISPLAY,
        fontSize: countryName.length <= 7 ? 68 : countryName.length <= 11 ? 52 : countryName.length <= 15 ? 42 : 34,
        fontWeight: 400,
        letterSpacing: -1.5,
        lineHeight: 0.92,
        marginTop: 14, color: DL.INK,
        wordBreak: "break-word",
      }}>
        {countryName}
      </div>

      {/* Intensity + live */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
        <span style={{
          padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
          background: chipBg, color: chipColor, border: `1px solid ${chipBd}`,
          fontFamily: DL.SANS,
        }}>
          {score} intensity
        </span>
        <span style={{ fontSize: 11, color: DL.DIM, fontFamily: DL.SANS }}>
          · {articles.length} stories
        </span>
        {isLive && (
          <span style={{
            marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, color: DL.LIVE, fontWeight: 600, fontFamily: DL.SANS,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.LIVE, flexShrink: 0, display: "inline-block" }} />
            LIVE
          </span>
        )}
      </div>

      {/* Stats */}
      <div style={{
        display: "flex", gap: 0, marginTop: 20,
        borderTop: `1px solid ${DL.RULE}`,
        borderBottom: `1px solid ${DL.RULE}`,
      }}>
        {[
          ["Articles", articles.length.toString(), DL.INK],
          ["Sources",  sourceCount.toString(), DL.INK],
          ["Top cat.", articles[0]?.category ?? "—", DL.CORAL],
        ].map(([k, v, c], i) => (
          <div key={k} style={{
            flex: 1, padding: "12px 0",
            borderLeft: i > 0 ? `1px solid ${DL.RULE}` : "none",
            paddingLeft: i > 0 ? 14 : 0,
          }}>
            <div style={{ fontSize: 10, color: DL.DIM, fontWeight: 500, letterSpacing: 0.04, fontFamily: DL.SANS }}>
              {k}
            </div>
            <div style={{
              fontFamily: DL.DISPLAY, fontSize: 22, fontWeight: 500,
              marginTop: 3, color: c, letterSpacing: -0.4,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {v}
            </div>
          </div>
        ))}
      </div>

      {/* Headlines */}
      <div style={{
        marginTop: 18, fontSize: 10.5, color: DL.DIM, fontWeight: 600,
        letterSpacing: 0.06, textTransform: "uppercase", fontFamily: DL.SANS,
      }}>
        Top headlines
      </div>

      <div style={{ flex: 1, overflowY: "auto", marginTop: 4 }}>
        {loading ? (
          // Skeleton placeholder — 5 headline rows while articles load
          <div>
            {Array.from({ length: 5 }, (_, i) => (
              <HeadlineSkeleton key={i} index={i} />
            ))}
          </div>
        ) : articles.length > 0 ? (
          articles.map((a, i) => (
            <HeadlineRow key={a.id} article={a} index={i} countryCode={countryCode} isRead={readIds.has(a.id)} />
          ))
        ) : (
          <div style={{ paddingTop: 40, textAlign: "center" }}>
            <p style={{ fontSize: 13, color: DL.DIM, fontFamily: DL.SANS }}>No recent coverage</p>
            <p style={{ fontSize: 11, color: DL.DIM_2, marginTop: 4, fontFamily: DL.SANS }}>
              Low media activity in this region.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
