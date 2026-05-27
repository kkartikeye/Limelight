"use client";

import { useEffect } from "react";
import Link from "next/link";
import { DL } from "@/lib/design-tokens";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Limelight] Page error:", error);
  }, [error]);

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
        gap: 16,
        padding: 32,
        textAlign: "center",
      }}
    >
      <div style={{ fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18, textTransform: "uppercase", color: DL.CORAL }}>
        Something went wrong
      </div>
      <div style={{ fontFamily: DL.DISPLAY, fontSize: 42, fontWeight: 400, letterSpacing: -1, color: DL.INK, lineHeight: 1 }}>
        This page failed to load.
      </div>
      <div style={{ fontSize: 13, color: DL.DIM, maxWidth: 360, lineHeight: 1.5 }}>
        {error.message || "An unexpected error occurred. Try refreshing, or head back to the map."}
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
        <button
          onClick={reset}
          style={{
            padding: "8px 20px", borderRadius: 999, background: DL.INK, color: DL.PAPER,
            border: "none", cursor: "pointer", fontFamily: DL.SANS, fontSize: 13, fontWeight: 600,
          }}
        >
          Try again
        </button>
        <Link
          href="/"
          style={{
            padding: "8px 20px", borderRadius: 999, background: "transparent", color: DL.INK,
            border: `1px solid ${DL.RULE}`, textDecoration: "none",
            fontFamily: DL.SANS, fontSize: 13, fontWeight: 500,
          }}
        >
          Back to map
        </Link>
      </div>
      {error.digest && (
        <div style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM_2, marginTop: 4 }}>
          Error ID: {error.digest}
        </div>
      )}
    </div>
  );
}
