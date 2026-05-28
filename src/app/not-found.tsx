import Link from "next/link";
import { DL } from "@/lib/design-tokens";

export default function NotFound() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: DL.PAPER,
        fontFamily: DL.SANS,
        gap: 14,
        padding: 32,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: DL.MONO,
          fontSize: 10,
          letterSpacing: 0.18,
          textTransform: "uppercase",
          color: DL.CORAL,
        }}
      >
        404 · Not found
      </div>
      <div
        style={{
          fontFamily: DL.DISPLAY,
          fontSize: 64,
          fontWeight: 400,
          letterSpacing: -2,
          lineHeight: 0.9,
          color: DL.INK,
        }}
      >
        Off the map.
      </div>
      <p
        style={{
          fontSize: 14,
          color: DL.DIM,
          maxWidth: 360,
          lineHeight: 1.55,
          margin: 0,
        }}
      >
        This page doesn&apos;t exist. It may have been moved, or you may have
        followed a broken link.
      </p>
      <Link
        href="/"
        style={{
          marginTop: 8,
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "10px 22px",
          borderRadius: 999,
          background: DL.INK,
          color: DL.PAPER,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Back to the map
        <svg
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
        >
          <line x1="2" y1="7" x2="12" y2="7" />
          <polyline points="9,4 12,7 9,10" />
        </svg>
      </Link>
    </div>
  );
}
