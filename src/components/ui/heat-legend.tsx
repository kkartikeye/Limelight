"use client";

import { HEAT_RAMP } from "@/lib/design-tokens";

// Build a CSS linear-gradient from the ramp stops
function buildGradient(): string {
  const stops = HEAT_RAMP.map(([score, color]) => `${color} ${score}%`).join(", ");
  return `linear-gradient(to right, ${stops})`;
}

export default function HeatLegend() {
  return (
    <div
      className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
      style={{ pointerEvents: "none" }}
    >
      <div
        className="rounded-xl px-4 py-2.5 shadow-2xl backdrop-blur-md"
        style={{
          background: "rgba(7,9,14,0.88)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Label row */}
        <div className="mb-1.5 flex items-center justify-between gap-8">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
            Coverage Intensity
          </span>
          <span className="text-[9px] text-gray-600">media attention, not importance</span>
        </div>

        {/* Gradient bar */}
        <div
          className="h-2 w-48 rounded-full"
          style={{ background: buildGradient() }}
        />

        {/* Tick labels */}
        <div className="mt-1 flex justify-between">
          {["0", "25", "50", "75", "100"].map((label) => (
            <span key={label} className="text-[9px] tabular-nums text-gray-600">
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
