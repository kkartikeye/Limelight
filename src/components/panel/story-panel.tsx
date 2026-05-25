"use client";

import { useEffect } from "react";
import ArticleCard from "./article-card";
import { useArticles } from "@/lib/hooks/use-articles";
import { useMapStore } from "@/lib/stores/map-store";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

interface StoryPanelProps {
  countryCode: string;
  countryName: string;
  score: number;
  onClose: () => void;
}

function scoreChipColor(score: number): string {
  if (score >= 75) return "bg-red-600";
  if (score >= 50) return "bg-orange-500";
  if (score >= 25) return "bg-yellow-500";
  return "bg-gray-600";
}

export default function StoryPanel({
  countryCode,
  countryName,
  score,
  onClose,
}: StoryPanelProps) {
  const { filters } = useMapStore();
  const { toggleWatch, isWatched } = useWatchlistStore();
  const watched = isWatched(countryCode);
  const { articles, loading, isLive } = useArticles(
    countryCode,
    filters.timeWindow,
    filters.categories
  );

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-labelledby="panel-title"
      className="absolute right-0 top-0 z-20 flex h-full w-[380px] flex-col bg-gray-950/95 shadow-2xl backdrop-blur-md"
      style={{
        animation: "panel-slide-in 250ms ease-out",
        willChange: "transform",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between border-b border-white/10 px-5 py-4">
        <div className="flex flex-col gap-1">
          <h2
            id="panel-title"
            className="text-base font-bold leading-tight text-white"
          >
            {countryName}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-mono text-gray-400">
              {countryCode}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-xs font-semibold text-white ${scoreChipColor(score)}`}
            >
              {score} intensity
            </span>
            {isLive && (
              <span className="flex items-center gap-1 rounded border border-emerald-700/50 bg-emerald-900/60 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                LIVE
              </span>
            )}
          </div>
        </div>
        <div className="ml-4 flex flex-shrink-0 items-center gap-1">
          {/* Watch toggle */}
          <button
            onClick={() => toggleWatch(countryCode)}
            aria-label={watched ? "Remove from watchlist" : "Add to watchlist"}
            title={watched ? "Remove from watchlist" : "Watch this country"}
            className={`rounded p-1 transition-colors ${
              watched
                ? "text-amber-400 hover:bg-amber-400/10"
                : "text-gray-500 hover:bg-white/10 hover:text-amber-400"
            }`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 16 16"
              fill={watched ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth={watched ? "0" : "1.5"}
            >
              <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
            </svg>
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            aria-label="Close panel"
            className="rounded p-1 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Article list */}
      <div className="flex-1 overflow-y-auto px-5">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-500">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </div>
        ) : articles.length > 0 ? (
          articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="mb-3"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35M11 8v3M11 14h.01" />
            </svg>
            <p className="text-sm">No recent coverage</p>
            <p className="mt-1 text-xs">
              This region has low media activity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
