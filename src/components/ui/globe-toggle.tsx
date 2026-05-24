"use client";

import { useMapStore } from "@/lib/stores/map-store";

interface GlobeToggleProps {
  onToggle: () => void;
}

export default function GlobeToggle({ onToggle }: GlobeToggleProps) {
  const { isGlobe } = useMapStore();

  return (
    <button
      onClick={onToggle}
      aria-label={isGlobe ? "Switch to flat map" : "Switch to globe view"}
      title={isGlobe ? "Flat map" : "Globe view"}
      className={`absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-lg border transition-all ${
        isGlobe
          ? "border-white/30 bg-white/20 text-white"
          : "border-white/10 bg-gray-950/80 text-gray-400 hover:border-white/20 hover:bg-gray-800/80 hover:text-white"
      } backdrop-blur-md`}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
      </svg>
    </button>
  );
}
