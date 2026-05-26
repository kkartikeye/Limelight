/**
 * design-tokens.ts — Daylight edition
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every visual constant. Swapping the Daylight
 * palette means editing this file only.
 *
 * Consumers:
 *   - heat-layer.tsx   (Mapbox expressions)
 *   - tooltip.tsx      (hover card)
 *   - pin-layer.tsx    (popup)
 *   - heat-legend.tsx  (gradient strip)
 *   - All UI components via Tailwind classes (bg-paper, text-coral, etc.)
 */

// ─── Daylight color tokens ─────────────────────────────────────────────────────
export const DL = {
  // Surfaces
  PAPER:    "#f6f3ec",
  PAPER_2:  "#efeadf",
  CARD:     "#ffffff",

  // Text
  INK:      "#181613",
  INK_2:    "#3a3025",
  DIM:      "#7a7568",
  DIM_2:    "#aaa492",

  // Hairlines
  RULE:     "rgba(24,22,19,0.10)",
  RULE_2:   "rgba(24,22,19,0.05)",

  // Accent — coral only. Used sparingly for state, live cues, and intensity.
  CORAL:    "#e0573c",
  CORAL_50: "#fff0ea",  // pill background
  CORAL_BD: "#fac7b8",  // pill border

  // Live indicator
  LIVE:     "#2a8a5e",

  // Globe shading
  GLOBE_HIGHLIGHT: "#fbf6e9",
  GLOBE_SHADOW:    "#dccfb1",
  GLOBE_ATM:       "#f0936b",

  // Typography stacks (CSS font-family strings)
  DISPLAY: '"Newsreader", "Source Serif 4", Georgia, serif',
  SANS:    '"Manrope", "IBM Plex Sans", system-ui, sans-serif',
  MONO:    '"IBM Plex Mono", ui-monospace, monospace',
} as const;

// ─── Heat ramp — cream → peach → coral (7 stops, no crimson) ──────────────────
// Format: [score_0–100, hex]. Used in FILL_COLOR_EXPR and HeatLegend gradient.
export const HEAT_RAMP: ReadonlyArray<readonly [number, string]> = [
  [0,   "#e8e2d0"],   // warm gray  (no-data)
  [5,   "#fbe6cd"],   // palest cream
  [20,  "#fad9b3"],   // sand
  [40,  "#f6bc8a"],   // warm peach
  [60,  "#f0936b"],   // apricot
  [80,  "#e26a4f"],   // terracotta
  [100, "#c93e2a"],   // deep coral
] as const;

// ─── Map layer tokens ──────────────────────────────────────────────────────────
export const MapTokens = {

  // ── Country fill ─────────────────────────────────────────────────────────────
  fill: {
    noData:         "#e8e2d0",  // soft warm gray on cream basemap
    opacityGlobe:   1.0,        // Daylight uses full opacity
    opacityClose:   1.0,
    opacityLoading: 0.55,
  },

  // ── Permanent borders — subtle ink on paper ────────────────────────────────
  border: {
    noData:  "rgba(24,22,19,0.10)",
    scored:  "rgba(24,22,19,0.18)",
    widths:  { z1: 0.3, z3: 0.5, z5: 0.8, z8: 1.2 },
  },

  // ── Hover outline — coral glow ────────────────────────────────────────────
  hover: {
    color:  "rgba(224,87,60,0.75)",
    widths: { z1: 1.4, z3: 2.0, z5: 2.6, z8: 3.2 },
    blur:   0.4,
  },

  // ── Watchlist outline — coral (matches accent) ────────────────────────────
  watched: {
    color:  "rgba(224,87,60,0.80)",
    widths: { z1: 1.6, z3: 2.2, z5: 2.8, z8: 3.4 },
    blur:   0.5,
  },

  // ── Selected glow + crisp edge ─────────────────────────────────────────────
  selectedGlow: {
    color:  "rgba(224,87,60,0.14)",
    widths: { z1: 8, z3: 11, z5: 14, z8: 18 },
    blur:   5,
  },
  selected: {
    color:  "rgba(224,87,60,0.95)",
    widths: { z1: 2.0, z3: 2.8, z5: 3.6, z8: 4.4 },
    blur:   0.2,
  },

  // ── Popup (pin-layer article popups) ─────────────────────────────────────
  popup: {
    background: "#ffffff",
    border:     "rgba(24,22,19,0.10)",
    text:       "#181613",
    textMuted:  "#7a7568",
    link:       "#e0573c",
  },

} as const;

// ─── Helper: build a zoom-interpolated width Mapbox expression ─────────────────
import type mapboxgl from "mapbox-gl";

export function zoomWidth(
  w: { z1: number; z3: number; z5: number; z8: number }
): mapboxgl.Expression {
  return [
    "interpolate", ["linear"], ["zoom"],
    1, w.z1,
    3, w.z3,
    5, w.z5,
    8, w.z8,
  ];
}

// ─── Category accent colour ────────────────────────────────────────────────────
// Daylight is a single-accent system — all categories use coral.
export const CATEGORY_COLORS: Record<string, string> = {
  Conflict:      DL.CORAL,
  Humanitarian:  DL.CORAL,
  Politics:      DL.CORAL,
  Economics:     DL.CORAL,
  Technology:    DL.CORAL,
  Environment:   DL.CORAL,
  Sports:        DL.CORAL,
  Entertainment: DL.CORAL,
};
