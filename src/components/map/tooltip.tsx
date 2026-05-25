"use client";

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

function scoreToColor(score: number): string {
  if (score >= 87) return "#bd0026";
  if (score >= 75) return "#e31a1c";
  if (score >= 62) return "#fc4e2a";
  if (score >= 50) return "#fd8d3c";
  if (score >= 37) return "#feb24c";
  if (score >= 25) return "#fed976";
  if (score >= 12) return "#ffeda0";
  return "#ffffcc";
}

const CATEGORY_COLOR: Record<TopCategory, string> = {
  Conflict:      "#f87171",
  Humanitarian:  "#fb923c",
  Politics:      "#60a5fa",
  Economics:     "#34d399",
  Technology:    "#a78bfa",
  Environment:   "#2dd4bf",
  Sports:        "#fbbf24",
  Entertainment: "#f472b6",
};

const TOOLTIP_W = 172;

export default function Tooltip({
  name, score, articleCount, topCategory, x, y, containerWidth,
}: TooltipProps) {
  const flipped = x > containerWidth - TOOLTIP_W - 20;
  const left = flipped ? x - TOOLTIP_W - 12 : x + 14;
  const accent = scoreToColor(score);

  return (
    <div
      className="pointer-events-none absolute z-10"
      style={{
        left,
        top: y - 6,
        width: TOOLTIP_W,
        animation: "tooltip-fade-in 120ms ease-out",
        willChange: "transform",
      }}
    >
      <div
        className="rounded-lg overflow-hidden shadow-2xl"
        style={{
          background: "rgba(8,10,16,0.97)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Heat-color accent stripe */}
        <div style={{ height: 3, background: accent }} />

        <div className="px-3 pt-2.5 pb-3">
          {/* Country name — primary */}
          <p className="truncate text-sm font-semibold text-white leading-snug">
            {name}
          </p>

          {/* Score bar — communicates intensity visually, not numerically */}
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(4, score)}%`,
                  background: accent,
                  opacity: 0.9,
                }}
              />
            </div>
            <span className="text-[10px] tabular-nums text-gray-500 w-5 text-right">
              {score}
            </span>
          </div>

          {/* Category + article count */}
          {(topCategory || articleCount > 0) && (
            <div className="mt-2 flex items-center justify-between gap-2">
              {topCategory ? (
                <span
                  className="text-[11px] font-medium truncate"
                  style={{ color: CATEGORY_COLOR[topCategory] }}
                >
                  {topCategory}
                </span>
              ) : <span />}
              {articleCount > 0 && (
                <span className="text-[10px] text-gray-600 tabular-nums flex-shrink-0">
                  {articleCount.toLocaleString()} articles
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
