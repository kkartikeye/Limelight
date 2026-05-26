import Link from "next/link";
import Header from "@/components/ui/header";
import { DL } from "@/lib/design-tokens";
import { ALL_CATEGORIES } from "@/lib/stores/map-store";

export default function TopicsPage() {
  return (
    <div
      className="route-fade"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        background: DL.PAPER,
        overflow: "hidden",
        fontFamily: DL.SANS,
      }}
    >
      <Header active="Topics" />

      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16, padding: "0 44px",
      }}>
        <div style={{
          fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.16,
          textTransform: "uppercase", color: DL.CORAL,
          display: "inline-flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
          Coming soon
        </div>
        <h1 style={{
          fontFamily: DL.DISPLAY, fontSize: 72, fontWeight: 400,
          letterSpacing: -2.5, lineHeight: 0.88, color: DL.INK,
          margin: 0, textAlign: "center",
        }}>
          Topics
        </h1>
        <p style={{
          fontSize: 14, color: DL.DIM, maxWidth: 420, textAlign: "center",
          lineHeight: 1.55, margin: 0,
        }}>
          Explore coverage by topic across all countries. This view is under construction.
        </p>

        {/* Preview: category chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 480, marginTop: 8 }}>
          {ALL_CATEGORIES.map((cat) => (
            <span
              key={cat}
              style={{
                padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 500,
                background: DL.CARD, color: DL.INK_2,
                border: `1px solid ${DL.RULE_2}`,
              }}
            >
              {cat}
            </span>
          ))}
        </div>

        <Link
          href="/"
          style={{
            marginTop: 8,
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "9px 18px", borderRadius: 999,
            background: DL.INK, color: DL.PAPER,
            textDecoration: "none", fontSize: 13, fontWeight: 600,
          }}
        >
          Back to map
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
            <line x1="2" y1="7" x2="12" y2="7" /><polyline points="9,4 12,7 9,10" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
