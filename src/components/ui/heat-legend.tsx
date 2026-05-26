"use client";

import { HEAT_RAMP, DL } from "@/lib/design-tokens";

function buildGradient(): string {
  // Map ramp stops to gradient percentages
  const stops = HEAT_RAMP.map(([score, color], i) => {
    const pct = i === 0 ? 0 : i === HEAT_RAMP.length - 1 ? 100 : Math.round(score);
    return `${color} ${pct}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

export default function HeatLegend() {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      {/* Label */}
      <div style={{
        fontFamily: DL.MONO, fontSize: 10, color: DL.DIM,
        letterSpacing: 0.12, textTransform: "uppercase",
      }}>
        Intensity
      </div>

      {/* Gradient bar + labels */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM }}>quiet</span>
        <div style={{
          width: 180, height: 8, borderRadius: 999,
          background: buildGradient(),
          border: `1px solid ${DL.RULE_2}`,
          flexShrink: 0,
        }} />
        <span style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.CORAL, fontWeight: 600 }}>loud</span>
      </div>
    </div>
  );
}
