"use client";

interface TooltipProps {
  name: string;
  score: number;
  articleCount: number;
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

export default function Tooltip({
  name,
  score,
  articleCount,
  x,
  y,
  containerWidth,
}: TooltipProps) {
  const TOOLTIP_WIDTH = 180;
  const flipped = x > containerWidth - TOOLTIP_WIDTH - 16;
  const left = flipped ? x - TOOLTIP_WIDTH - 12 : x + 12;

  return (
    <div
      className="pointer-events-none absolute z-10 w-44 rounded-md bg-gray-900/90 px-3 py-2 text-white shadow-lg backdrop-blur-sm"
      style={{
        left,
        top: y - 8,
        willChange: "transform",
        animation: "tooltip-fade-in 150ms ease",
      }}
    >
      <p className="truncate text-sm font-semibold">{name}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <div
          className="h-2.5 rounded-sm"
          style={{
            width: `${Math.max(4, (score / 100) * 88)}px`,
            backgroundColor: scoreToColor(score),
          }}
        />
        <span className="text-xs tabular-nums text-gray-300">{score}</span>
      </div>
      <p className="mt-1 text-xs text-gray-400">
        {articleCount.toLocaleString()} articles
      </p>
    </div>
  );
}
