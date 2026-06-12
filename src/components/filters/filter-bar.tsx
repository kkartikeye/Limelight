"use client";

// ─── Filter bar ───────────────────────────────────────────────────────────────
// Time-window pills + a Topics popover + live status. Categories moved out of
// the bar into an upward popover so every topic keeps its full name (no
// "Hum."/"Eco." shorthand) without crowding the strip.

import { useEffect, useRef, useState } from "react";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";
import type { TimeWindow, Category } from "@/lib/stores/map-store";
import { DL } from "@/lib/design-tokens";
import { relativeTimeSince } from "@/lib/utils/time";
import CategoryIcon from "@/components/ui/category-icon";

const TIME_WINDOWS: TimeWindow[] = ["1h", "6h", "24h", "7d", "30d"];

interface FilterBarProps {
  isLoading?: boolean;
  isMock?: boolean;
  lastUpdated?: Date | null;
  nextRefreshIn?: number;
  isAutoRefreshing?: boolean;
}

function TopicsPopover({ onClose }: { onClose: () => void }) {
  const { filters, toggleCategory, resetCategories, setCategories } = useMapStore();
  const filtered = filters.categories.length < ALL_CATEGORIES.length;
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    // Defer registration so the opening click doesn't immediately close it
    const t = setTimeout(() => {
      document.addEventListener("click", onClick);
      document.addEventListener("keydown", onKey);
    }, 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        bottom: "calc(100% + 10px)",
        left: 0,
        width: 340,
        maxWidth: "calc(100vw - 32px)",
        background: DL.CARD,
        border: `1px solid ${DL.RULE}`,
        borderRadius: 16,
        boxShadow: "0 18px 50px rgba(24,22,19,0.16)",
        padding: "14px 14px 12px",
        zIndex: 40,
        animation: "tooltip-fade-in 0.15s ease-out both",
        fontFamily: DL.SANS,
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10, padding: "0 4px" }}>
        <span style={{
          fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.14,
          textTransform: "uppercase", color: DL.DIM,
        }}>
          Filter by topic
        </span>
        {filtered && (
          <button
            onClick={resetCategories}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, fontWeight: 600, color: DL.CORAL, fontFamily: DL.SANS,
              padding: 0,
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Topic grid — full names, two columns */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {ALL_CATEGORIES.map((cat: Category) => {
          // Unfiltered (all topics) renders as neutral — clicking a chip then
          // isolates that topic; once filtered, chips toggle individually.
          const active = filtered && filters.categories.includes(cat);
          return (
            <button
              key={cat}
              onClick={() => (filtered ? toggleCategory(cat) : setCategories([cat]))}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "9px 12px",
                borderRadius: 10,
                border: `1px solid ${active ? DL.CORAL_BD : DL.RULE_2}`,
                background: active ? DL.CORAL_50 : "transparent",
                color: active ? DL.CORAL : DL.INK_2,
                fontWeight: active ? 600 : 500,
                fontSize: 12.5,
                cursor: "pointer",
                fontFamily: DL.SANS,
                transition: "all 0.12s ease",
                textAlign: "left",
              }}
            >
              <CategoryIcon category={cat} size={14} />
              {cat}
              {active && (
                <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto", flexShrink: 0 }}>
                  <polyline points="3,8.5 6.5,12 13,4.5" />
                </svg>
              )}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 10, padding: "0 4px", fontSize: 10.5, color: DL.DIM_2, lineHeight: 1.4 }}>
        {filters.categories.length === 0
          ? "Nothing selected — the map is empty. Hit Reset to restore all topics."
          : filtered
            ? `Showing ${filters.categories.length} of ${ALL_CATEGORIES.length} topics.`
            : "Showing all topics. Pick one to narrow the map."}
      </div>
    </div>
  );
}

export default function FilterBar({
  isLoading = false,
  isMock = false,
  lastUpdated = null,
  nextRefreshIn = 90,
  isAutoRefreshing = false,
}: FilterBarProps) {
  const { filters, setTimeWindow } = useMapStore();
  const [topicsOpen, setTopicsOpen] = useState(false);
  // All categories selected = unfiltered default; only a subset counts as a filter
  const isFiltered = filters.categories.length < ALL_CATEGORIES.length;
  const activeCount = isFiltered ? filters.categories.length : 0;

  return (
    <div
      style={{
        background: DL.CARD,
        borderRadius: 18,
        padding: "9px 12px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 10,
        maxWidth: "min(100%, 880px)",
        boxShadow: "0 10px 30px rgba(24,22,19,0.10), 0 2px 6px rgba(24,22,19,0.04)",
        border: `1px solid ${DL.RULE_2}`,
        fontFamily: DL.SANS,
        transition: "opacity 0.2s",
        opacity: isLoading ? 0.7 : 1,
        position: "relative",
      }}
    >
      {/* Time window pills */}
      <div style={{ display: "flex", gap: 2 }}>
        {TIME_WINDOWS.map((tw) => {
          const active = filters.timeWindow === tw;
          return (
            <button
              key={tw}
              onClick={() => setTimeWindow(tw)}
              style={{
                fontSize: 12,
                padding: "5px 11px",
                borderRadius: 999,
                border: "none",
                background: active ? DL.INK : "transparent",
                color: active ? DL.PAPER : DL.DIM,
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                fontFamily: DL.SANS,
                transition: "all 0.12s ease",
              }}
            >
              {tw}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: DL.RULE, flexShrink: 0 }} />

      {/* Topics popover trigger */}
      <button
        onClick={() => setTopicsOpen((v) => !v)}
        style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 12px",
          borderRadius: 999,
          border: `1px solid ${isFiltered ? DL.CORAL_BD : DL.RULE}`,
          background: isFiltered ? DL.CORAL_50 : "transparent",
          color: isFiltered ? DL.CORAL : DL.DIM,
          fontWeight: 600,
          fontSize: 12,
          cursor: "pointer",
          fontFamily: DL.SANS,
          transition: "all 0.12s ease",
          whiteSpace: "nowrap",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 3.5h12M4.5 8h7M6.5 12.5h3" />
        </svg>
        Topics
        {isFiltered && (
          <span style={{
            fontFamily: DL.MONO, fontSize: 10, fontWeight: 600,
            background: DL.CORAL, color: "#fff",
            borderRadius: 999, padding: "1px 6px", lineHeight: 1.4,
          }}>
            {activeCount}
          </span>
        )}
        <svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: topicsOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <polyline points="3,10 8,5 13,10" />
        </svg>
      </button>

      {topicsOpen && <TopicsPopover onClose={() => setTopicsOpen(false)} />}

      {/* Divider */}
      <div style={{ width: 1, height: 18, background: DL.RULE, flexShrink: 0 }} />

      {/* Status */}
      <div style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM, letterSpacing: 0.08, whiteSpace: "nowrap" }}>
        {isLoading ? (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg className="animate-spin" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
            Updating…
          </span>
        ) : isMock ? (
          <span style={{
            padding: "2px 7px", borderRadius: 999, fontSize: 9.5, fontWeight: 600,
            background: DL.CORAL_50, color: DL.CORAL, border: `1px solid ${DL.CORAL_BD}`,
          }}>
            Demo data
          </span>
        ) : isAutoRefreshing ? (
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: DL.LIVE, display: "inline-block" }} />
            <span style={{ color: DL.LIVE, fontWeight: 600 }}>Live</span>
            {nextRefreshIn > 0 && <span style={{ color: DL.DIM_2 }}>· {nextRefreshIn}s</span>}
          </span>
        ) : lastUpdated ? (
          <span>↻ {relativeTimeSince(lastUpdated)}</span>
        ) : null}
      </div>
    </div>
  );
}
