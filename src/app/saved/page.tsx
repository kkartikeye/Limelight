"use client";

import { useCallback } from "react";
import Link from "next/link";
import Header from "@/components/ui/header";
import BottomTabBar from "@/components/ui/bottom-tab-bar";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { useUser } from "@/lib/hooks/use-user";
import { useScores } from "@/lib/hooks/use-scores";
import { DL } from "@/lib/design-tokens";
import ForYouFeed from "@/components/ui/for-you-feed";
import AlertSettings from "@/components/ui/alert-settings";
import { useMemo } from "react";

export default function SavedPage() {
  const { watched, toggleWatch } = useWatchlistStore();
  const { user } = useUser();
  const watchedIsos = useMemo(() => watched.map((w) => w.iso), [watched]);

  // Mirror unwatch to server when signed in
  const handleUnwatch = useCallback((iso: string, name: string) => {
    toggleWatch(iso, name);
    if (user) {
      void fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iso }),
      });
    }
  }, [user, toggleWatch]);
  const { scores } = useScores();

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
      <Header active="Saved" />

      <div className="saved-body" style={{ flex: 1, overflowY: "auto", padding: "32px 44px" }}>
        {/* Page header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.16,
            textTransform: "uppercase", color: DL.CORAL, marginBottom: 10,
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
            Watchlist
          </div>
          <h1 className="saved-h1" style={{
            fontFamily: DL.DISPLAY, fontSize: 72, fontWeight: 400,
            letterSpacing: -2.5, lineHeight: 0.88, color: DL.INK,
            margin: 0,
          }}>
            Saved
          </h1>
          <p style={{
            fontSize: 13, color: DL.DIM, marginTop: 14, fontFamily: DL.SANS, maxWidth: 480,
          }}>
            Countries you&apos;re tracking. Click any entry to see the latest coverage.
          </p>
        </div>

        {watched.length === 0 ? (
          /* Empty state */
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            paddingTop: 80, gap: 12,
          }}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="20" fill={DL.CARD} />
              <path
                d="M20 8.5a1.5 1.5 0 0 1 1.347.836l3.762 7.63 8.42 1.224a1.5 1.5 0 0 1 .832 2.558l-6.09 5.94 1.438 8.386a1.502 1.502 0 0 1-2.176 1.582L20 32.193l-7.533 3.96a1.5 1.5 0 0 1-2.176-1.58l1.437-8.388-6.09-5.94a1.5 1.5 0 0 1 .833-2.558l8.42-1.224 3.762-7.63A1.5 1.5 0 0 1 20 8.5Z"
                stroke={DL.DIM} strokeWidth="1.5" fill="none"
              />
            </svg>
            <p style={{ fontSize: 14, color: DL.INK_2, fontWeight: 500 }}>No countries saved yet</p>
            <p style={{ fontSize: 12, color: DL.DIM, textAlign: "center", maxWidth: 300 }}>
              Click the star icon on any country panel to add it here.
            </p>
            <Link
              href="/"
              style={{
                marginTop: 8,
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "9px 18px", borderRadius: 999,
                background: DL.INK, color: DL.PAPER,
                textDecoration: "none", fontSize: 13, fontWeight: 600,
                fontFamily: DL.SANS,
              }}
            >
              Explore the map
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                <line x1="2" y1="7" x2="12" y2="7" /><polyline points="9,4 12,7 9,10" />
              </svg>
            </Link>
          </div>
        ) : (
          /* Watchlist grid */
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            maxWidth: 1200,
          }}>
            {watched.map((entry) => {
              const scoreData = scores?.[entry.iso];
              const score = scoreData?.score ?? null;
              const articleCount = scoreData?.articleCount ?? null;
              const topCat = scoreData?.topCategory ?? null;
              const hasActivity = score !== null && score > 0;

              return (
                <div
                  key={entry.iso}
                  style={{
                    background: DL.CARD,
                    border: `1px solid ${DL.RULE_2}`,
                    borderRadius: 12,
                    padding: "20px 20px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    transition: "border-color 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = DL.CORAL_BD)}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = DL.RULE_2)}
                >
                  {/* Card header */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                    <div>
                      <div style={{
                        fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.14,
                        textTransform: "uppercase", color: DL.DIM, marginBottom: 4,
                        display: "flex", alignItems: "center", gap: 6,
                      }}>
                        {entry.iso}
                        {score !== null && score > 60 && (
                          <span
                            title="High coverage intensity right now"
                            style={{
                              width: 6, height: 6, borderRadius: 999,
                              background: DL.CORAL, display: "inline-block",
                              animation: "pulse-halo 1.2s ease-in-out infinite alternate",
                            }}
                          />
                        )}
                      </div>
                      <Link
                        href={`/country/${entry.iso}?name=${encodeURIComponent(entry.name)}`}
                        style={{
                          fontFamily: DL.DISPLAY, fontSize: 26, fontWeight: 400,
                          letterSpacing: -0.6, color: DL.INK, textDecoration: "none",
                          display: "block", lineHeight: 1.1,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = DL.INK)}
                      >
                        {entry.name}
                      </Link>
                    </div>
                    <button
                      onClick={() => handleUnwatch(entry.iso, entry.name)}
                      title="Remove from watchlist"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: DL.CORAL, padding: 2, flexShrink: 0,
                        display: "inline-flex", alignItems: "center",
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
                      </svg>
                    </button>
                  </div>

                  {/* Metrics */}
                  <div style={{
                    display: "flex", gap: 12,
                    borderTop: `1px solid ${DL.RULE_2}`, paddingTop: 12,
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: DL.DIM, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 2 }}>
                        Intensity
                      </div>
                      <div style={{
                        fontFamily: DL.DISPLAY, fontSize: 22, fontWeight: 500, letterSpacing: -0.4,
                        color: hasActivity ? DL.CORAL : DL.DIM,
                      }}>
                        {score !== null ? score : "—"}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: DL.DIM, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 2 }}>
                        Articles
                      </div>
                      <div style={{ fontFamily: DL.DISPLAY, fontSize: 22, fontWeight: 500, letterSpacing: -0.4, color: DL.INK }}>
                        {articleCount !== null ? articleCount : "—"}
                      </div>
                    </div>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontSize: 10, color: DL.DIM, textTransform: "uppercase", letterSpacing: 0.04, marginBottom: 2 }}>
                        Top topic
                      </div>
                      <div style={{
                        fontFamily: DL.SANS, fontSize: 13, fontWeight: 600,
                        color: topCat ? DL.CORAL : DL.DIM,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {topCat ?? "No data"}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <Link
                    href={`/country/${entry.iso}?name=${encodeURIComponent(entry.name)}`}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      fontSize: 11, color: DL.INK_2, textDecoration: "none", fontWeight: 500,
                      fontFamily: DL.SANS,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
                    onMouseLeave={(e) => (e.currentTarget.style.color = DL.INK_2)}
                  >
                    See all coverage
                    <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
                      <line x1="2" y1="7" x2="12" y2="7" /><polyline points="9,4 12,7 9,10" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {/* Alerts + personalised feed — only meaningful with a watchlist */}
        {watched.length > 0 && (
          <>
            <AlertSettings watchedIsos={watchedIsos} />
            <ForYouFeed watchedIsos={watchedIsos} />
          </>
        )}
      </div>

      <div className="bottom-tab-wrapper">
        <BottomTabBar active="Saved" />
      </div>
    </div>
  );
}
