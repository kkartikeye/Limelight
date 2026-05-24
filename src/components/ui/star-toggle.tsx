"use client";

import { useMapStore } from "@/lib/stores/map-store";

interface StarToggleProps {
  onToggle: () => void;
}

export default function StarToggle({ onToggle }: StarToggleProps) {
  const { showStars } = useMapStore();

  return (
    <button
      onClick={onToggle}
      aria-label={showStars ? "Hide stars" : "Show stars"}
      title={showStars ? "Hide stars" : "Show stars"}
      className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
        showStars
          ? "border-white/30 bg-white/20 text-white"
          : "border-white/10 bg-gray-950/80 text-gray-400 hover:border-white/20 hover:bg-gray-800/80 hover:text-white"
      } backdrop-blur-md`}
    >
      {/* Five-point star */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.5l2.09 6.26H20.5l-5.24 3.84 1.99 6.26L12 14.9l-5.25 3.96 1.99-6.26L3.5 8.76h6.41z" />
      </svg>
    </button>
  );
}
