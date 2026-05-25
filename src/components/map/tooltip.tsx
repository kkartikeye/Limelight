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

// YlOrRd stops mirroring the fill expression
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

const CATEGORY_DOT: Record<TopCategory, string> = {
  Conflict:      "bg-red-500",
  Humanitarian:  "bg-orange-400",
  Politics:      "bg-blue-400",
  Economics:     "bg-emerald-400",
  Technology:    "bg-violet-400",
  Environment:   "bg-teal-400",
  Sports:        "bg-yellow-400",
  Entertainment: "bg-pink-400",
};

export default function Tooltip({
  name,
  score,
  articleCount,
  topCategory,
  x,
  y,
  containerWidth,
}: TooltipProps) {
  const TOOLTIP_WIDTH = 192;
  const flipped = x > containerWidth - TOOLTIP_WIDTH - 16;
  const left = flipped ? x - TOOLTIP_WIDTH - 12 : x + 12;

  return (
    <div
      className="pointer-events-none absolute z-10 rounded-md bg-gray-900/92 px-3 py-2.5 text-white shadow-lg backdrop-blur-sm"
      style={{
        left,
        top: y - 8,
        width: TOOLTIP_WIDTH,
        willChange: "transform",
        animation: "tooltip-fade-in 150ms ease",
      }}
    >
      <p className="truncate text-sm font-semibold">{name}</p>

      {/* Score bar */}
      <div className="mt-1.5 flex items-center gap-2">
        <div
          className="h-2 rounded-sm"
          style={{
            width: `${Math.max(4, (score / 100) * 100)}px`,
            maxWidth: "108px",
            backgroundColor: scoreToColor(score),
          }}
        />
        <span className="text-xs tabular-nums text-gray-300">{score}</span>
      </div>

      {/* Article count + top category */}
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-xs text-gray-400">
          {articleCount.toLocaleString()} article{articleCount !== 1 ? "s" : ""}
        </span>
        {topCategory && (
          <span className="flex items-center gap-1 text-[10px] text-gray-400">
            <span className={`h-1.5 w-1.5 rounded-full ${CATEGORY_DOT[topCategory]}`} />
            {topCategory}
          </span>
        )}
      </div>
    </div>
  );
}
