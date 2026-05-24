"use client";

import { useState } from "react";
import { useMapStore, ALL_CATEGORIES } from "@/lib/stores/map-store";
import type { TimeWindow, Category } from "@/lib/stores/map-store";

const TIME_WINDOWS: TimeWindow[] = ["1h", "6h", "24h", "7d", "30d"];

const CATEGORY_COLORS: Record<Category, string> = {
  Conflict:      "bg-red-600/80 text-red-100 border-red-500",
  Politics:      "bg-blue-600/80 text-blue-100 border-blue-500",
  Economics:     "bg-emerald-600/80 text-emerald-100 border-emerald-500",
  Technology:    "bg-violet-600/80 text-violet-100 border-violet-500",
  Humanitarian:  "bg-orange-600/80 text-orange-100 border-orange-500",
  Environment:   "bg-teal-600/80 text-teal-100 border-teal-500",
  Sports:        "bg-yellow-600/80 text-yellow-100 border-yellow-500",
  Entertainment: "bg-pink-600/80 text-pink-100 border-pink-500",
};

const CATEGORY_INACTIVE =
  "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-gray-200";

export default function FilterBar() {
  const { filters, setTimeWindow, toggleCategory } = useMapStore();
  const [showCategories, setShowCategories] = useState(false);

  return (
    <div className="absolute bottom-6 left-4 z-10 flex flex-col gap-2">
      {/* Category popover — shown on narrow viewports or when toggled */}
      {showCategories && (
        <div className="flex flex-wrap gap-1.5 rounded-xl bg-gray-950/90 p-3 shadow-xl backdrop-blur-md sm:hidden">
          {ALL_CATEGORIES.map((cat) => {
            const active = filters.categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  active ? CATEGORY_COLORS[cat] : CATEGORY_INACTIVE
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* Main filter card */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-gray-950/90 px-4 py-3 shadow-xl backdrop-blur-md">
        {/* Time window pills */}
        <div className="flex gap-1">
          {TIME_WINDOWS.map((tw) => (
            <button
              key={tw}
              onClick={() => setTimeWindow(tw)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                filters.timeWindow === tw
                  ? "bg-white text-gray-900"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tw}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-white/10" />

        {/* Category pills — hidden on narrow viewports */}
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {ALL_CATEGORIES.map((cat) => {
            const active = filters.categories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                  active ? CATEGORY_COLORS[cat] : CATEGORY_INACTIVE
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Narrow viewport: "Filters" toggle button */}
        <button
          onClick={() => setShowCategories((v) => !v)}
          className="flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-xs text-gray-400 transition-all hover:bg-white/10 hover:text-white sm:hidden"
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 3.5A.5.5 0 0 1 1.5 3h13a.5.5 0 0 1 0 1h-13a.5.5 0 0 1-.5-.5ZM3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8Zm2 4.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5Z" />
          </svg>
          Filters
        </button>
      </div>
    </div>
  );
}
