"use client";

import { useState } from "react";
import { HEAT_RAMP, DL } from "@/lib/design-tokens";

/** Shared methodology copy — rendered by both legend variants. */
function MethodologyCard({ style }: { style?: React.CSSProperties }) {
  return (
    <div style={{
      width: 270,
      maxWidth: "calc(100vw - 24px)",
      background: DL.CARD,
      border: `1px solid ${DL.RULE}`,
      borderRadius: 14,
      boxShadow: "0 18px 50px rgba(24,22,19,0.16)",
      padding: "16px 18px",
      animation: "tooltip-fade-in 0.15s ease-out both",
      fontFamily: DL.SANS,
      ...style,
    }}>
      <div style={{
        fontFamily: DL.MONO, fontSize: 9.5, letterSpacing: 0.16,
        textTransform: "uppercase", color: DL.CORAL, marginBottom: 8,
      }}>
        How intensity is measured
      </div>
      <p style={{ fontSize: 12, color: DL.INK_2, lineHeight: 1.55, margin: "0 0 10px" }}>
        Coverage Intensity tracks how loudly the world&rsquo;s media is reporting
        from each country — <strong style={{ fontWeight: 600 }}>media attention,
        not how important events are</strong>.
      </p>
      <p style={{ fontSize: 12, color: DL.DIM, lineHeight: 1.55, margin: 0 }}>
        Every story is weighted by its source&rsquo;s credibility, how recent it
        is (older stories fade), and its topic — conflict and humanitarian news
        count for more, sports and entertainment for less. Country totals are
        then scaled 0–100, so the loudest country is always 100.
      </p>
    </div>
  );
}

/** Compact horizontal legend for mobile — tap to toggle the methodology card. */
export function HeatLegendCompact() {
  const [open, setOpen] = useState(false);
  const gradient = `linear-gradient(to right, ${HEAT_RAMP.map(([, c]) => c).join(", ")})`;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="How intensity is measured"
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: DL.GLASS,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          border: `1px solid ${DL.RULE}`,
          borderRadius: 999,
          padding: "6px 10px",
          cursor: "pointer",
        }}
      >
        <span style={{ fontFamily: DL.MONO, fontSize: 8.5, color: DL.DIM, letterSpacing: 0.04 }}>
          quiet
        </span>
        <span style={{
          width: 64, height: 7, borderRadius: 999,
          background: gradient, border: `1px solid ${DL.RULE_2}`,
        }} />
        <span style={{ fontFamily: DL.MONO, fontSize: 8.5, color: DL.CORAL, fontWeight: 600, letterSpacing: 0.04 }}>
          loud
        </span>
      </button>
      {open && (
        <MethodologyCard style={{ position: "absolute", right: 0, top: "calc(100% + 8px)" }} />
      )}
    </div>
  );
}

export default function HeatLegend() {
  const [showInfo, setShowInfo] = useState(false);

  // Gradient runs top → bottom: loud (coral) at top, quiet (cream) at bottom
  const gradient = `linear-gradient(to bottom, ${[...HEAT_RAMP].reverse().map(([, c]) => c).join(", ")})`;

  return (
    <div
      style={{ position: "relative" }}
      onMouseEnter={() => setShowInfo(true)}
      onMouseLeave={() => setShowInfo(false)}
    >
      <div style={{
        display: "inline-flex",
        flexDirection: "row",
        alignItems: "stretch",
        gap: 7,
        background: DL.GLASS,
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderRadius: 12,
        padding: "12px 11px",
        border: `1px solid ${DL.RULE}`,
        cursor: "default",
      }}>
        {/* Gradient bar */}
        <div style={{
          width: 9,
          height: 190,
          borderRadius: 999,
          background: gradient,
          border: `1px solid ${DL.RULE_2}`,
          flexShrink: 0,
        }} />

        {/* Labels: loud / INTENSITY / quiet, with an info hint at the bottom */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          paddingTop: 1,
          paddingBottom: 1,
          height: 190,
        }}>
          <span style={{
            fontFamily: DL.MONO, fontSize: 9.5,
            color: DL.CORAL, fontWeight: 600, letterSpacing: 0.04,
          }}>
            loud
          </span>
          <span style={{
            fontFamily: DL.MONO, fontSize: 8.5,
            color: DL.DIM_2, letterSpacing: 0.14,
            textTransform: "uppercase",
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            alignSelf: "center",
          }}>
            intensity
          </span>
          <span style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{
              fontFamily: DL.MONO, fontSize: 9.5,
              color: DL.DIM, letterSpacing: 0.04,
            }}>
              quiet
            </span>
            {/* Info hint — the whole legend is the hover target */}
            <span aria-hidden style={{
              width: 13, height: 13, borderRadius: 999,
              border: `1px solid ${showInfo ? DL.CORAL_BD : DL.RULE}`,
              color: showInfo ? DL.CORAL : DL.DIM_2,
              fontFamily: DL.MONO, fontSize: 8.5, fontWeight: 600,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}>
              ?
            </span>
          </span>
        </div>
      </div>

      {/* ── Methodology card — opens left of the legend on hover ───────────── */}
      {showInfo && (
        <MethodologyCard style={{
          position: "absolute",
          right: "calc(100% + 12px)",
          top: "50%",
          transform: "translateY(-50%)",
        }} />
      )}
    </div>
  );
}
