/**
 * design-tokens.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for every visual constant used across the map and UI.
 * To restyle the application, edit the values here — nowhere else.
 *
 * Consumers:
 *   - heat-layer.tsx  (Mapbox expressions built from these tokens)
 *   - pin-layer.tsx   (popup HTML inline styles)
 *   - globals.css     (Mapbox popup CSS overrides reference the same palette)
 */

// ─── Heat-fill colour ramp (YlOrRd ColorBrewer) ──────────────────────────────
// Swap this array to change the heatmap palette globally.
// Format: [score_0–100, hex_color]
export const HEAT_RAMP: ReadonlyArray<readonly [number, string]> = [
  [0,   "#ffffcc"],
  [12,  "#ffeda0"],
  [25,  "#fed976"],
  [37,  "#feb24c"],
  [50,  "#fd8d3c"],
  [62,  "#fc4e2a"],
  [75,  "#e31a1c"],
  [87,  "#bd0026"],
  [100, "#800026"],
] as const;

// ─── Map layer tokens ─────────────────────────────────────────────────────────
export const MapTokens = {

  // ── Country fill ────────────────────────────────────────────────────────────
  fill: {
    noData:         "rgba(255,255,255,0.04)",  // no-data → nearly transparent
    opacityGlobe:   0.85,                      // zoom 0 opacity
    opacityClose:   0.72,                      // zoom 5+ opacity
    opacityLoading: 0.30,                      // while re-fetching
  },

  // ── Permanent country borders ────────────────────────────────────────────────
  // Adaptive: white on no-data (sits on dark basemap), dark on scored (sits on
  // YlOrRd fill — dark ink recedes rather than competing).
  border: {
    noData: "rgba(255,255,255,0.18)",
    scored: "rgba(0,0,0,0.28)",
    widths: { z1: 0.4, z3: 0.7, z5: 1.1, z8: 1.6 },
  },

  // ── Hover outline (transient) ────────────────────────────────────────────────
  hover: {
    color:  "rgba(255,255,255,0.65)",
    widths: { z1: 1.2, z3: 1.8, z5: 2.4, z8: 3.0 },
    blur:   0.3,
  },

  // ── Watchlist outline (amber glow) ───────────────────────────────────────────
  watched: {
    color:  "rgba(251,191,36,0.85)",
    widths: { z1: 1.4, z3: 2.0, z5: 2.6, z8: 3.2 },
    blur:   0.4,
  },

  // ── Selected-country: soft halo + crisp edge ─────────────────────────────────
  // Two stacked layers give a "glow" effect without needing WebGL shaders.
  selectedGlow: {
    color:  "rgba(255,255,255,0.13)",
    widths: { z1: 6, z3: 9, z5: 12, z8: 16 },
    blur:   4,
  },
  selected: {
    color:  "rgba(255,255,255,0.97)",
    widths: { z1: 2.0, z3: 2.8, z5: 3.6, z8: 4.4 },
    blur:   0.2,
  },

  // ── Article pin popups ────────────────────────────────────────────────────────
  popup: {
    background: "rgba(8,10,16,0.97)",
    border:     "rgba(255,255,255,0.07)",
    text:       "#f3f4f6",
    textMuted:  "#9ca3af",
    link:       "#60a5fa",
  },

} as const;

// ─── Helper: build a zoom-interpolated width Mapbox expression ────────────────
// Used in heat-layer.tsx so every outline shares the same interpolation pattern.
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

// ─── Category accent colours (shared between tooltip, pin layer, watchlist) ───
export const CATEGORY_COLORS: Record<string, string> = {
  Conflict:      "#f87171",
  Humanitarian:  "#fb923c",
  Politics:      "#60a5fa",
  Economics:     "#34d399",
  Technology:    "#a78bfa",
  Environment:   "#2dd4bf",
  Sports:        "#fbbf24",
  Entertainment: "#f472b6",
};
