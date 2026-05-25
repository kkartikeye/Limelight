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

// Full YlOrRd scale — mirrors the heat fill exactly
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

const TOOLTIP_W = 178;

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
      {/* Card */}
      <div
        className="rounded-lg overflow-hidden shadow-2xl"
        style={{
          background: "rgba(8,10,16,0.97)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Accent stripe — mirrors the country's heat color */}
        <div style={{ height: 3, background: accent }} />

        <div className="px-3 pt-2.5 pb-3">
          {/* Country name */}
          <p className="truncate text-[13px] font-semibold text-white leading-none mb-2">
            {name}
          </p>

          {/* Score — the hero number */}
          <div className="flex items-baseline gap-1.5 mb-2">
            <span
              className="text-2xl font-bold tabular-nums leading-none"
              style={{ color: accent }}
            >
              {score}
            </span>
            <span className="text-[9px] font-medium tracking-widest text-gray-500 uppercase">
              intensity
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.06] mb-2" />

          {/* Meta row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-gray-500 tabular-nums">
              {articleCount > 0
                ? `${articleCount.toLocaleString()} article${articleCount !== 1 ? "s" : ""}`
                : "no data"}
            </span>
            {topCategory && (
              <span
                className="text-[10px] font-medium"
                style={{ color: CATEGORY_COLOR[topCategory] }}
              >
                {topCategory}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
