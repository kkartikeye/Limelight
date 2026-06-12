"use client";

import { HEAT_RAMP, DL } from "@/lib/design-tokens";
import type { TopCategory } from "@/lib/types/scores";

interface TooltipProps {
  name: string;
  score: number;
  articleCount: number;
  topCategory: TopCategory | null;
  x: number;
  y: number;
  containerWidth: number;
}

/** Derive accent color from the shared Daylight ramp. */
function scoreToColor(score: number): string {
  for (let i = HEAT_RAMP.length - 1; i >= 0; i--) {
    if (score >= HEAT_RAMP[i][0]) return HEAT_RAMP[i][1];
  }
  return HEAT_RAMP[0][1];
}

const TOOLTIP_W = 220;

export default function Tooltip({
  name, score, articleCount, topCategory, x, y, containerWidth,
}: TooltipProps) {
  const flipped = x > containerWidth - TOOLTIP_W - 20;
  const left = flipped ? x - TOOLTIP_W - 14 : x + 16;
  const accent = scoreToColor(score);

  return (
    <div
      className="pointer-events-none absolute z-20"
      style={{
        left,
        top: y - 8,
        width: TOOLTIP_W,
        animation: "tooltip-fade-in 120ms ease-out",
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          background: DL.GLASS,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: 14,
          padding: 14,
          boxShadow: "0 20px 40px rgba(24,22,19,0.15)",
          border: `1px solid ${DL.RULE}`,
        }}
      >
        {/* Country name + ISO */}
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <span style={{ fontFamily: DL.DISPLAY, fontSize: 20, fontWeight: 500, letterSpacing: -0.3, color: DL.INK }}>
            {name}
          </span>
          <span style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM }}>
            {/* ISO shown via score rank position */}
          </span>
        </div>

        {/* Score bar */}
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: DL.CHIP, borderRadius: 999 }}>
            <div style={{
              width: `${Math.max(4, score)}%`,
              height: "100%",
              borderRadius: 999,
              background: `linear-gradient(90deg, ${HEAT_RAMP[2][1]}, ${accent})`,
            }} />
          </div>
          <span style={{ fontFamily: DL.MONO, fontSize: 11, fontWeight: 600, color: DL.INK, minWidth: 20, textAlign: "right" }}>
            {score}
          </span>
        </div>

        {/* Category + article count */}
        {(topCategory || articleCount > 0) && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, fontSize: 11 }}>
            {topCategory ? (
              <span style={{ color: DL.CORAL, fontWeight: 600, fontFamily: DL.SANS }}>
                {topCategory}
              </span>
            ) : <span />}
            {articleCount > 0 && (
              <span style={{ color: DL.DIM, fontFamily: DL.MONO, fontSize: 10 }}>
                {articleCount.toLocaleString()} articles
              </span>
            )}
          </div>
        )}

        {/* Dashed leader line */}
        {!flipped && (
          <svg
            style={{ position: "absolute", left: -22, top: 18, width: 22, height: 2, overflow: "visible", pointerEvents: "none" }}
          >
            <line x1="0" y1="1" x2="22" y2="1" stroke={DL.CORAL} strokeWidth="1" strokeDasharray="2 2" />
          </svg>
        )}
      </div>
    </div>
  );
}
