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

        {/* Concentric-rings mark */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 96, height: 96, borderRadius: 9999, background: CORAL,
          marginBottom: 36,
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 62, height: 62, borderRadius: 9999, background: PAPER,
          }}>
            <div style={{ width: 30, height: 30, borderRadius: 9999, background: CORAL }} />
          </div>
        </div>

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
