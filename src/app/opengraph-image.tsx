import { ImageResponse } from "next/og";

// ─── Social share card — served at /opengraph-image ──────────────────────────
// Rendered by Satori at the edge. Inline styles only (no CSS vars — Satori has
// no DOM), so the Daylight palette is hardcoded here on purpose.
export const runtime = "edge";
export const alt = "Limelight — see the world's news before you read it";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PAPER = "#f6f3ec";
const INK   = "#181613";
const DIM   = "#7a7568";
const CORAL = "#e0573c";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: PAPER,
          position: "relative",
        }}
      >
        {/* Faint heat blobs — evoke the choropleth without rendering geography */}
        <div style={{
          position: "absolute", top: -120, right: -80,
          width: 480, height: 480, borderRadius: 9999,
          background: "radial-gradient(circle, rgba(224,87,60,0.18) 0%, rgba(224,87,60,0) 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: -160, left: -60,
          width: 520, height: 520, borderRadius: 9999,
          background: "radial-gradient(circle, rgba(240,147,107,0.20) 0%, rgba(240,147,107,0) 70%)",
        }} />

        {/* Broadcast mark — coral dot radiating two arcs */}
        <svg
          width="104" height="104" viewBox="0 0 24 24" fill="none"
          style={{ marginBottom: 36 }}
        >
          <circle cx="7.2" cy="16.8" r="3.4" fill={CORAL} />
          <path d="M 7.9 8.83 A 8 8 0 0 1 15.17 16.1" stroke={CORAL} strokeWidth="2.8" strokeLinecap="round" />
          <path d="M 8.3 4.25 A 12.6 12.6 0 0 1 19.75 15.7" stroke={CORAL} strokeWidth="2.8" strokeLinecap="round" />
        </svg>

        <div style={{ fontSize: 92, color: INK, letterSpacing: -3, fontWeight: 500 }}>
          Limelight
        </div>
        <div style={{ fontSize: 30, color: DIM, marginTop: 18, letterSpacing: -0.5 }}>
          See the world&apos;s news before you read it.
        </div>

        {/* Live dot footer */}
        <div style={{
          position: "absolute", bottom: 44,
          display: "flex", alignItems: "center", gap: 10,
          fontSize: 19, color: CORAL, letterSpacing: 4, textTransform: "uppercase",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 9999, background: CORAL }} />
          Live global news intensity
        </div>
      </div>
    ),
    { ...size }
  );
}
