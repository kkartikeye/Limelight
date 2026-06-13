"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/ui/header";
import BottomTabBar from "@/components/ui/bottom-tab-bar";
import MapView from "@/components/map/map-view";
import FilterBar from "@/components/filters/filter-bar";
import HeatLegend, { HeatLegendCompact } from "@/components/ui/heat-legend";
import LiveDateTime from "@/components/ui/live-datetime";
import StoryPanel from "@/components/panel/story-panel";
import { useMapStore } from "@/lib/stores/map-store";
import { useThemeStore } from "@/lib/stores/theme-store";
import { useScores } from "@/lib/hooks/use-scores";
import { countryName as isoToName } from "@/lib/utils/countries";
import { DL } from "@/lib/design-tokens";

export default function Home() {
  const router = useRouter();

  const {
    selectedCountry, selectedCountryName, selectedCountryScore,
    isPanelOpen, clearSelection,
  } = useMapStore();

  const { scores, isLoading, lastUpdated, nextRefreshIn, isAutoRefreshing } = useScores();
  const { theme } = useThemeStore();

  // On mobile (panel sidebar is hidden by CSS), navigate to the full country page
  // instead of trying to open the panel. Desktop behaviour is unchanged.
  const handleSelectCountry = useCallback((iso: string, name: string) => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      router.push(`/country/${iso}?name=${encodeURIComponent(name)}`);
    }
  }, [router]);

  // Find the highest-scoring country to show when nothing is selected
  const topCountry = useMemo(() => {
    if (!scores) return null;
    const entries = Object.entries(scores).sort((a, b) => b[1].score - a[1].score);
    return entries[0] ? { iso: entries[0][0], score: entries[0][1].score } : null;
  }, [scores]);

  // Which country to show in the panel
  const focusIso   = isPanelOpen && selectedCountry ? selectedCountry   : topCountry?.iso  ?? "";
  const focusName  = isPanelOpen && selectedCountry ? selectedCountryName : isoToName(focusIso);
  const focusScore = isPanelOpen && selectedCountry ? selectedCountryScore : topCountry?.score ?? 0;

  return (
    <div className="route-fade" style={{ display: "flex", flexDirection: "column", height: "100vh", background: DL.PAPER, overflow: "hidden" }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <Header active="Today" />

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>

        {/* ── Left: map fills full height; hero + legend overlay it ────────── */}
        <div
          className="map-host"
          style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, padding: "8px 44px 0", position: "relative" }}
        >
          {/* Map takes all remaining height */}
          <div style={{ flex: 1, minHeight: 0, position: "relative" }}>
            {/* key={theme} remounts the map on theme change — Mapbox styles
                can't be hot-swapped without losing all custom layers */}
            <MapView key={theme} onSelectCountry={handleSelectCountry} />

            {/* ── Hero text overlay — top-left of globe ────────────────────── */}
            <div
              className="desktop-only"
              style={{
                position: "absolute", top: 16, left: 16, zIndex: 10,
                pointerEvents: "none", maxWidth: 460,
              }}
            >
              {/* Live date + time eyebrow */}
              <div style={{
                fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18,
                textTransform: "uppercase", color: DL.CORAL,
                display: "flex", alignItems: "center", gap: 8, marginBottom: 8,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL, flexShrink: 0 }} />
                <LiveDateTime variant="full" />
              </div>

              {/* Serif headline */}
              <div
                className="hero-headline"
                style={{
                  fontFamily: DL.DISPLAY, fontSize: 44, fontWeight: 400,
                  letterSpacing: -1.3, lineHeight: 0.95, color: DL.INK,
                }}
              >
                Where the news is <em>loudest</em> right now.
              </div>

              {/* Subtitle */}
              <div style={{ fontSize: 13, color: DL.DIM, marginTop: 10, lineHeight: 1.4, maxWidth: 380, fontFamily: DL.SANS }}>
                Every country weighted by how loudly the world is reporting from it.
              </div>
            </div>

            {/* ── Mobile hero — compact headline so first-time visitors get
                context; desktop hero above is hidden under 768px ───────────── */}
            <div
              className="mobile-only"
              style={{
                position: "absolute", top: 10, left: 12, right: 12, zIndex: 10,
                alignItems: "flex-start", justifyContent: "space-between", gap: 10,
              }}
            >
              <div style={{ pointerEvents: "none", minWidth: 0 }}>
                <div style={{
                  fontFamily: DL.MONO, fontSize: 9, letterSpacing: 0.16,
                  textTransform: "uppercase", color: DL.CORAL,
                  display: "flex", alignItems: "center", gap: 6, marginBottom: 5,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: DL.CORAL, flexShrink: 0 }} />
                  <LiveDateTime variant="compact" />
                </div>
                <div style={{
                  fontFamily: DL.DISPLAY, fontSize: 21, fontWeight: 400,
                  letterSpacing: -0.5, lineHeight: 1.05, color: DL.INK, maxWidth: 210,
                }}>
                  Where the news is <em>loudest</em> right now.
                </div>
              </div>
              {/* Compact legend — tap for the methodology card */}
              <div style={{ flexShrink: 0 }}>
                <HeatLegendCompact />
              </div>
            </div>

            {/* ── Vertical intensity legend — right edge, mid-height ────────── */}
            {/* pointerEvents enabled: hovering the legend opens the
                "how it's measured" methodology card */}
            <div
              className="desktop-only"
              style={{
                position: "absolute", right: 16, top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "all", zIndex: 10,
              }}
            >
              <HeatLegend />
            </div>

            {/* ── Bottom strip: filter bar ──────────────────────────────────── */}
            <div className="filter-bar-container" style={{
              position: "absolute",
              left: 0, right: 0, bottom: 16,
              display: "flex", alignItems: "flex-end",
              pointerEvents: "none",
            }}>
              <div style={{ pointerEvents: "all" }}>
                <FilterBar
                  isLoading={isLoading}
                  lastUpdated={lastUpdated}
                  nextRefreshIn={nextRefreshIn}
                  isAutoRefreshing={isAutoRefreshing}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: story panel (desktop sidebar) ─────────────────────────── */}
        <div className="panel-sidebar" style={{ width: 380, flexShrink: 0, minHeight: 0, overflow: "hidden" }}>
          {focusIso ? (
            <StoryPanel
              countryCode={focusIso}
              countryName={focusName}
              score={focusScore}
              onClose={isPanelOpen ? clearSelection : undefined}
              isAutoSelected={!isPanelOpen}
            />
          ) : (
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
      <div className="bottom-tab-wrapper" style={{ flexShrink: 0 }}>
        <BottomTabBar active="Today" />
      </div>
    </div>
  );
}
