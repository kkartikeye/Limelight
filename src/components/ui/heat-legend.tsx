"use client";

import { HEAT_RAMP, DL } from "@/lib/design-tokens";

export default function HeatLegend() {
  // Gradient runs top → bottom: loud (coral) at top, quiet (cream) at bottom
  const gradient = `linear-gradient(to bottom, ${[...HEAT_RAMP].reverse().map(([, c]) => c).join(", ")})`;

  return (
    <div style={{
      display: "inline-flex",
      flexDirection: "row",
      alignItems: "stretch",
      gap: 6,
      background: DL.GLASS,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      borderRadius: 10,
      padding: "10px 10px",
      border: `1px solid ${DL.RULE}`,
    }}>
      {/* Gradient bar */}
      <div style={{
        width: 8,
        height: 110,
        borderRadius: 999,
        background: gradient,
        border: `1px solid ${DL.RULE_2}`,
        flexShrink: 0,
      }} />

      {/* Labels: loud / INTENSITY / quiet */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        paddingTop: 1,
        paddingBottom: 1,
        height: 110,
      }}>
        <span style={{
          fontFamily: DL.MONO, fontSize: 9,
          color: DL.CORAL, fontWeight: 600, letterSpacing: 0.04,
        }}>
          loud
        </span>
        <span style={{
          fontFamily: DL.MONO, fontSize: 8,
          color: DL.DIM_2, letterSpacing: 0.14,
          textTransform: "uppercase",
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
          alignSelf: "center",
        }}>
          intensity
        </span>
        <span style={{
          fontFamily: DL.MONO, fontSize: 9,
          color: DL.DIM, letterSpacing: 0.04,
        }}>
          quiet
        </span>
      </div>
    </div>
  );
}
