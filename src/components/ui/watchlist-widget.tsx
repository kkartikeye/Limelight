"use client";

import { useState } from "react";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import type { ScoresMap } from "@/lib/hooks/use-scores";

interface WatchlistWidgetProps {
  scores: ScoresMap | null;
  onSelectCountry: (iso: string, name: string, score: number) => void;
}

function scoreBarColor(score: number): string {
  if (score >= 75) return "#e31a1c";
  if (score >= 50) return "#fd8d3c";
  if (score >= 25) return "#fed976";
  return "#4b5563";
}

export default function WatchlistWidget({ scores, onSelectCountry }: WatchlistWidgetProps) {
  const [expanded, setExpanded] = useState(false);
  const { watched, toggleWatch } = useWatchlistStore();

  const entries = watched
    .map((w) => ({
      iso: w.iso,
      name: w.name,
      score: scores?.[w.iso]?.score ?? 0,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="absolute bottom-6 right-14 z-10 flex flex-col items-end gap-2">
      {/* Expanded list */}
      {expanded && (
        <div
          className="w-56 rounded-xl bg-gray-950/95 shadow-2xl backdrop-blur-md"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="border-b border-white/[0.06] px-3 py-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Watchlist
            </span>
          </div>

          {entries.length === 0 ? (
            <div className="px-3 py-4 text-center">
              <p className="text-[11px] text-gray-600">No countries watched</p>
              <p className="mt-0.5 text-[10px] text-gray-700">
                Click ★ in any country panel
              </p>
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto py-1">
              {entries.map(({ iso, name, score }) => (
                <li
                  key={iso}
                  className="group flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-white/[0.04]"
                  onClick={() => {
                    onSelectCountry(iso, name, score);
                    setExpanded(false);
                  }}
                >
                  {/* Score bar */}
                  <div className="h-1 w-10 flex-shrink-0 rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, score)}%`,
                        background: scoreBarColor(score),
                      }}
                    />
                  </div>

                  {/* Country name */}
                  <span className="min-w-0 flex-1 truncate text-[12px] text-gray-300">
                    {name}
                  </span>

                  {/* Remove button */}
                  <button
                    aria-label={`Remove ${name} from watchlist`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatch(iso, name);
                    }}
                    className="flex-shrink-0 rounded p-0.5 text-gray-700 opacity-0 transition-all hover:text-gray-400 group-hover:opacity-100"
                  >
                    <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Collapsed trigger button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-label="Toggle watchlist"
        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-md transition-all ${
          expanded
            ? "bg-gray-950 text-amber-400"
            : "bg-gray-950/90 text-gray-400 hover:text-amber-400"
        }`}
        style={{ border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill={expanded || watched.length > 0 ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth={expanded || watched.length > 0 ? "0" : "1.5"}
          className={watched.length > 0 ? "text-amber-400" : ""}
        >
          <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
        </svg>
        {watched.length > 0 && (
          <span className="font-semibold tabular-nums text-amber-400">
            {watched.length}
          </span>
        )}
      </button>
    </div>
  );
}
