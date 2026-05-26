"use client";

import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";
import type { TimeWindow, Category } from "@/lib/stores/map-store";
import { DL } from "@/lib/design-tokens";

const TIME_WINDOWS: TimeWindow[] = ["1h", "6h", "24h", "7d", "30d"];

function relativeTime(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? "1 hr ago" : `${hrs} hrs ago`;
}

interface FilterBarProps {
  isLoading?: boolean;
  isMock?: boolean;
  lastUpdated?: Date | null;
  nextRefreshIn?: number;
  isAutoRefreshing?: boolean;
}

export default function FilterBar({
  isLoading = false,
  isMock = false,
  lastUpdated = null,
  nextRefreshIn = 90,
  isAutoRefreshing = false,
}: FilterBarProps) {
  const { filters, setTimeWindow, toggleCategory } = useMapStore();

  return (
    <div
      style={{
        background: DL.CARD,
        borderRadius: 18,
        padding: "9px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 10px 30px rgba(24,22,19,0.10), 0 2px 6px rgba(24,22,19,0.04)",
        border: `1px solid ${DL.RULE_2}`,
        fontFamily: DL.SANS,
        transition: "opacity 0.2s",
        opacity: isLoading ? 0.7 : 1,
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

      {/* Category pills */}
      <div style={{ display: "flex", gap: 5, flexWrap: "nowrap" }}>
        {ALL_CATEGORIES.map((cat: Category) => {
          const active = filters.categories.includes(cat);
          // Show short labels for space
          const label = cat === "Humanitarian" ? "Hum." : cat === "Entertainment" ? "Ent." : cat;
          return (
            <button
              key={cat}
              onClick={() => toggleCategory(cat)}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: `1px solid ${active ? DL.CORAL_BD : DL.RULE}`,
                background: active ? DL.CORAL_50 : "transparent",
                color: active ? DL.CORAL : DL.DIM,
                fontWeight: active ? 600 : 500,
                fontSize: 11,
                cursor: "pointer",
                fontFamily: DL.SANS,
                transition: "all 0.12s ease",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

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
            background: "#fff8f0", color: DL.CORAL, border: `1px solid ${DL.CORAL_BD}`,
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
          <span>↻ {relativeTime(lastUpdated)}</span>
        ) : null}
      </div>
    </div>
  );
}
