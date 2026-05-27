"use client";

import { useEffect } from "react";

// global-error must include its own <html> and <body> tags because it replaces
// the root layout when a top-level error is thrown.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Limelight] Global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6f3ec",
          fontFamily: "'Manrope', sans-serif",
          gap: 16,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#e0573c" }}>
          Critical error
        </div>
        <div style={{ fontSize: 40, fontWeight: 400, letterSpacing: -1, color: "#181613", lineHeight: 1 }}>
          Limelight couldn&apos;t start.
        </div>
        <div style={{ fontSize: 13, color: "#6b6560", maxWidth: 360, lineHeight: 1.5 }}>
          {error.message || "Something went wrong at the application level."}
        </div>
        <button
          onClick={reset}
          style={{
            marginTop: 8, padding: "10px 24px", borderRadius: 999,
            background: "#181613", color: "#f6f3ec",
            border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
          }}
        >
          Reload app
        </button>
        {error.digest && (
          <div style={{ fontSize: 10, color: "#a09890", marginTop: 4 }}>
            Error ID: {error.digest}
          </div>
        )}
      </body>
    </html>
  );
}
