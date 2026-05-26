"use client";

import { useMemo } from "react";
import Header from "@/components/ui/header";
import BottomTabBar from "@/components/ui/bottom-tab-bar";
import MapView from "@/components/map/map-view";
import FilterBar from "@/components/filters/filter-bar";
import HeatLegend from "@/components/ui/heat-legend";
import StoryPanel from "@/components/panel/story-panel";
import { useMapStore } from "@/lib/stores/map-store";
import { useScores } from "@/lib/hooks/use-scores";
import { DL } from "@/lib/design-tokens";

export default function Home() {
  const {
    selectedCountry, selectedCountryName, selectedCountryScore,
    isPanelOpen, clearSelection,
  } = useMapStore();

  const { scores, isLoading, isMock, lastUpdated, nextRefreshIn, isAutoRefreshing } = useScores();

  // Find the highest-scoring country to show when nothing is selected
  const topCountry = useMemo(() => {
    if (!scores) return null;
    const entries = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
    return entries[0] ? { iso: entries[0][0], score: entries[0][1].score } : null;
  }, [scores]);

  // Which country to show in the panel
  const focusIso   = isPanelOpen && selectedCountry ? selectedCountry  : topCountry?.iso  ?? "";
  const focusName  = isPanelOpen && selectedCountry ? selectedCountryName : focusIso;
  const focusScore = isPanelOpen && selectedCountry ? selectedCountryScore : topCountry?.score ?? 0;

  return (
    <div className="route-fade" style={{ display: "flex", flexDirection: "column", height: "100vh", background: DL.PAPER, overflow: "hidden" }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Header active="Today" />

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* ── Left: headline + map ─────────────────────────────────────────── */}
        <div className="map-host" style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, padding: "8px 44px 0", position: "relative" }}>

          {/* Hero text — hidden on mobile to save space */}
          <div className="desktop-only" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 8 }}>
            <div style={{ maxWidth: 520 }}>
              {/* Coral eyebrow */}
              <div style={{
                fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18,
                textTransform: "uppercase", color: DL.CORAL,
                display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL, flexShrink: 0 }} />
                Today · global news intensity
              </div>

              {/* Serif headline */}
              <div className="hero-headline" style={{
                fontFamily: DL.DISPLAY, fontSize: 44, fontWeight: 400,
                letterSpacing: -1.3, lineHeight: 0.95, color: DL.INK,
              }}>
                The shape of <em>the day&apos;s</em> news.
              </div>

              {/* Subtitle */}
              <div style={{ fontSize: 13.5, color: DL.DIM, marginTop: 10, lineHeight: 1.4, maxWidth: 440, fontFamily: DL.SANS }}>
                Every country weighted by how loudly the world is reporting from it.
              </div>
            </div>
          </div>

          {/* Map — fills remaining height */}
          <div style={{ flex: 1, minHeight: 0, marginTop: 18, position: "relative" }}>
            <MapView />
          </div>

          {/* Bottom strip: filter pill + legend */}
          <div style={{
            position: "absolute",
            left: 44, right: 44, bottom: 16,
            display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16,
            pointerEvents: "none",
          }}>
            <div style={{ pointerEvents: "all" }}>
              <FilterBar
                isLoading={isLoading}
                isMock={isMock}
                lastUpdated={lastUpdated}
                nextRefreshIn={nextRefreshIn}
                isAutoRefreshing={isAutoRefreshing}
              />
            </div>
            <div className="desktop-only" style={{ pointerEvents: "none" }}>
              <HeatLegend />
            </div>
          </div>
        </div>

        {/* ── Right: story panel (desktop sidebar, hidden on mobile) ───────── */}
        <div className="panel-sidebar" style={{ width: 380, flexShrink: 0, minHeight: 0, overflow: "hidden" }}>
          {focusIso ? (
            <StoryPanel
              countryCode={focusIso}
              countryName={focusName}
              score={focusScore}
              onClose={isPanelOpen ? clearSelection : undefined}
            />
          ) : (
            /* Loading placeholder */
            <div style={{
              height: "100%", display: "flex", alignItems: "center", justifyContent: "center",
              borderLeft: `1px solid ${DL.RULE}`, background: DL.PAPER,
            }}>
              <p style={{ fontSize: 12, color: DL.DIM_2, fontFamily: DL.SANS }}>
                Click a country to explore
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom tab bar (mobile only) ────────────────────────────────────── */}
      <div className="mobile-only" style={{ flexDirection: "column", flexShrink: 0 }}>
        <BottomTabBar active="Today" />
      </div>
    </div>
  );
}
