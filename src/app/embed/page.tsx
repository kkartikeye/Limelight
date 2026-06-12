"use client";

// ─── Embeddable coverage-intensity widget ────────────────────────────────────
// Dependency-light by design: renders the choropleth as plain SVG from a
// vendored Natural Earth GeoJSON + /api/heatmap scores. No Mapbox, no tiles —
// third-party embed traffic can never touch the map-load quota.
//
//   <iframe src="https://<host>/embed?window=24h" width="720" height="480"
//           style="border:0" loading="lazy" title="Limelight news intensity"></iframe>

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { FeatureCollection, Geometry } from "geojson";
import { DL, HEAT_RAMP } from "@/lib/design-tokens";
import { countryName } from "@/lib/utils/countries";

interface ScoreEntry { score: number; articleCount: number; topCategory: string | null }
interface HeatmapResponse { scores: Record<string, ScoreEntry>; lastUpdated: string | null }

const VALID_WINDOWS = new Set(["1h", "6h", "24h", "7d", "30d"]);

/** Highest ramp stop ≤ score (stepped fill reads cleanly at widget size). */
function heatColor(score: number): string {
  let color = HEAT_RAMP[0][1];
  for (const [stop, hex] of HEAT_RAMP) {
    if (score >= stop) color = hex;
  }
  return color;
}

function EmbedWidget() {
  const params = useSearchParams();
  const windowParam = params.get("window") ?? "24h";
  const window = VALID_WINDOWS.has(windowParam) ? windowParam : "24h";

  const [world, setWorld] = useState<FeatureCollection<Geometry, { name?: string }> | null>(null);
  const [scores, setScores] = useState<Record<string, ScoreEntry> | null>(null);

  useEffect(() => {
    fetch("/data/countries-110m.geo.json")
      .then((r) => r.json())
      .then(setWorld)
      .catch(() => setWorld(null));
  }, []);

  useEffect(() => {
    fetch(`/api/heatmap?window=${window}`)
      .then((r) => r.json())
      .then((d: HeatmapResponse) => setScores(d.scores ?? {}))
      .catch(() => setScores({}));
  }, [window]);

  const W = 760, H = 400;
  const paths = useMemo(() => {
    if (!world) return [];
    const projection = geoNaturalEarth1().fitSize([W, H], world);
    const path = geoPath(projection);
    return world.features.map((f) => ({
      iso: (f.id as string) ?? "",
      name: f.properties?.name ?? (f.id as string) ?? "",
      d: path(f) ?? "",
    }));
  }, [world]);

  const top5 = useMemo(() => {
    if (!scores) return [];
    return Object.entries(scores)
      .sort((a, b) => b[1].score - a[1].score)
      .slice(0, 5);
  }, [scores]);

  const siteUrl = typeof location !== "undefined" ? location.origin : "";

  return (
    <div style={{
      fontFamily: DL.SANS, background: DL.PAPER, color: DL.INK,
      minHeight: "100vh", display: "flex", flexDirection: "column",
      padding: "14px 18px 10px", boxSizing: "border-box",
    }}>
      {/* Header strip */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontFamily: DL.DISPLAY, fontSize: 18, letterSpacing: -0.4 }}>
          Limelight
        </span>
        <span style={{
          fontFamily: DL.MONO, fontSize: 9, letterSpacing: 0.14,
          textTransform: "uppercase", color: DL.CORAL,
        }}>
          Global news intensity · {window}
        </span>
      </div>

      {/* Choropleth */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", display: "block" }}
          role="img" aria-label="World map shaded by news coverage intensity">
          {paths.map((p) => {
            const entry = scores?.[p.iso];
            return (
              <path
                key={p.iso || p.name}
                d={p.d}
                fill={heatColor(entry?.score ?? 0)}
                stroke="rgba(24,22,19,0.14)"
                strokeWidth={0.4}
              >
                <title>
                  {countryName(p.iso) || p.name}
                  {entry ? ` — intensity ${entry.score}, ${entry.articleCount} articles` : " — no live coverage"}
                </title>
              </path>
            );
          })}
        </svg>
      </div>

      {/* Top-5 strip + attribution */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        borderTop: `1px solid ${DL.RULE}`, paddingTop: 8, fontSize: 11,
      }}>
        {top5.map(([iso, e], i) => (
          <span key={iso} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontFamily: DL.MONO, fontSize: 9, color: DL.DIM }}>{i + 1}</span>
            <span style={{ fontWeight: 600 }}>{countryName(iso)}</span>
            <span style={{ fontFamily: DL.MONO, color: DL.CORAL, fontWeight: 600 }}>{e.score}</span>
          </span>
        ))}
        <a
          href={siteUrl || "/"}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: "auto", color: DL.DIM, textDecoration: "none",
            fontFamily: DL.MONO, fontSize: 9, letterSpacing: 0.1, textTransform: "uppercase",
          }}
        >
          Powered by Limelight ↗
        </a>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedWidget />
    </Suspense>
  );
}
