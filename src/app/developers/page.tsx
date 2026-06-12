"use client";

// ─── Developers page ──────────────────────────────────────────────────────────
// Public-facing docs for the two distribution surfaces shipped in Phase 8:
//   1. GET /api/v1/scores  — keyed JSON API for coverage-intensity scores
//   2. /embed              — dependency-light iframe choropleth widget
// Everything here serves derived data only (scores, never article bodies),
// so it carries no upstream licensing constraints.

import { useEffect, useState } from "react";
import Header from "@/components/ui/header";
import BottomTabBar from "@/components/ui/bottom-tab-bar";
import { DL } from "@/lib/design-tokens";

const WINDOWS = ["1h", "6h", "24h", "7d", "30d"] as const;

function CodeBlock({ children, copyText }: { children: React.ReactNode; copyText?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* clipboard unavailable — ignore */ }
  };

  return (
    <div style={{ position: "relative" }}>
      <pre style={{
        background: DL.CHIP,
        border: `1px solid ${DL.RULE_2}`,
        borderRadius: 10,
        padding: "14px 16px",
        margin: 0,
        overflowX: "auto",
        fontFamily: DL.MONO,
        fontSize: 11.5,
        lineHeight: 1.65,
        color: DL.INK_2,
      }}>
        {children}
      </pre>
      {copyText && (
        <button
          onClick={copy}
          style={{
            position: "absolute", top: 8, right: 8,
            background: DL.CARD, color: copied ? DL.LIVE : DL.DIM,
            border: `1px solid ${DL.RULE}`,
            borderRadius: 6, padding: "3px 9px",
            fontFamily: DL.MONO, fontSize: 9.5, fontWeight: 600,
            letterSpacing: 0.08, textTransform: "uppercase",
            cursor: "pointer", transition: "color 0.12s",
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.16,
      textTransform: "uppercase", color: DL.CORAL, marginBottom: 10,
    }}>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: DL.CARD,
      border: `1px solid ${DL.RULE_2}`,
      borderRadius: 16,
      padding: "26px 28px",
      marginBottom: 22,
    }}>
      {children}
    </div>
  );
}

export default function DevelopersPage() {
  // Swap to the real origin after mount — SSR HTML must not depend on window
  const [host, setHost] = useState("https://limelight.news");
  useEffect(() => setHost(window.location.origin), []);

  const curlExample = `curl "${host}/api/v1/scores?window=24h" \\
  -H "x-api-key: ll_your_key_here"`;

  const responseExample = `{
  "window": "24h",
  "lastUpdated": "2026-06-12T14:30:00.000Z",
  "scores": {
    "GBR": { "score": 100, "articleCount": 30, "topCategory": "Politics" },
    "USA": { "score": 69,  "articleCount": 24, "topCategory": "Politics" },
    "IRN": { "score": 38,  "articleCount": 12, "topCategory": "Conflict" }
  },
  "meta": {
    "metric": "Coverage Intensity (0–100, normalised across countries)",
    "attribution": "Limelight — https://limelight.news",
    "docs": "Scores reflect media attention, not objective significance."
  }
}`;

  const iframeExample = `<iframe
  src="${host}/embed?window=24h"
  width="720" height="480"
  style="border:0" loading="lazy"
  title="Limelight news intensity">
</iframe>`;

  return (
    <div
      className="route-fade"
      style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: DL.PAPER, overflow: "hidden", fontFamily: DL.SANS,
      }}
    >
      <Header />

      <div style={{ flex: 1, overflowY: "auto" }}>
        <div className="topics-body" style={{ maxWidth: 760, margin: "0 auto", padding: "36px 44px 80px" }}>

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18,
              textTransform: "uppercase", color: DL.CORAL,
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
              Build with Limelight
            </div>
            <h1 className="topics-h1" style={{
              fontFamily: DL.DISPLAY, fontSize: 64, fontWeight: 400,
              letterSpacing: -2.2, lineHeight: 0.90, color: DL.INK,
              margin: "0 0 12px",
            }}>
              Developers
            </h1>
            <p style={{ fontSize: 14, color: DL.DIM, maxWidth: 520, lineHeight: 1.55, margin: 0 }}>
              Two ways to put live coverage-intensity data in your own product: a JSON
              API and an embeddable map widget. Both serve derived scores only —
              never article content — and are free to use with attribution.
            </p>
          </div>

          {/* ── Scores API ──────────────────────────────────────────────── */}
          <Card>
            <SectionLabel>JSON API</SectionLabel>
            <h2 style={{
              fontFamily: DL.DISPLAY, fontSize: 26, fontWeight: 400,
              letterSpacing: -0.5, color: DL.INK, margin: "0 0 8px",
            }}>
              Coverage-intensity scores
            </h2>
            <p style={{ fontSize: 13, color: DL.DIM, lineHeight: 1.6, margin: "0 0 18px" }}>
              One endpoint returns every country&rsquo;s current Coverage Intensity — a 0–100
              score of how loudly the world&rsquo;s media is reporting from each country,
              normalised so the most-covered country is always 100. It measures media
              attention, not objective significance.
            </p>

            <div style={{ marginBottom: 14 }}>
              <CodeBlock copyText={curlExample}>{curlExample}</CodeBlock>
            </div>

            {/* Parameters */}
            <div style={{
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.14,
              textTransform: "uppercase", color: DL.DIM, margin: "20px 0 10px",
            }}>
              Parameters
            </div>
            <div style={{ fontSize: 13, color: DL.INK_2, lineHeight: 1.7 }}>
              <div style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: `1px solid ${DL.RULE_2}` }}>
                <code style={{ fontFamily: DL.MONO, fontSize: 12, color: DL.CORAL, flexShrink: 0, width: 80 }}>key</code>
                <span style={{ color: DL.DIM, fontSize: 12.5 }}>
                  API key — pass as <code style={{ fontFamily: DL.MONO, fontSize: 11.5 }}>?key=</code> or
                  an <code style={{ fontFamily: DL.MONO, fontSize: 11.5 }}>x-api-key</code> header. Required.
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, padding: "8px 0", borderTop: `1px solid ${DL.RULE_2}` }}>
                <code style={{ fontFamily: DL.MONO, fontSize: 12, color: DL.CORAL, flexShrink: 0, width: 80 }}>window</code>
                <span style={{ color: DL.DIM, fontSize: 12.5 }}>
                  Look-back window: {WINDOWS.map((w, i) => (
                    <span key={w}>
                      <code style={{ fontFamily: DL.MONO, fontSize: 11.5 }}>{w}</code>
                      {i < WINDOWS.length - 1 ? " · " : ""}
                    </span>
                  ))}. Defaults to <code style={{ fontFamily: DL.MONO, fontSize: 11.5 }}>24h</code>.
                </span>
              </div>
            </div>

            {/* Response */}
            <div style={{
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.14,
              textTransform: "uppercase", color: DL.DIM, margin: "20px 0 10px",
            }}>
              Response
            </div>
            <CodeBlock>{responseExample}</CodeBlock>

            <p style={{ fontSize: 12, color: DL.DIM, lineHeight: 1.6, margin: "16px 0 0" }}>
              Responses are CORS-open and edge-cached for 5 minutes. Each key gets
              1,000 requests/day by default; the remaining quota is returned in the{" "}
              <code style={{ fontFamily: DL.MONO, fontSize: 11 }}>X-RateLimit-Remaining</code> header.
            </p>
          </Card>

          {/* ── Embed widget ────────────────────────────────────────────── */}
          <Card>
            <SectionLabel>Embed</SectionLabel>
            <h2 style={{
              fontFamily: DL.DISPLAY, fontSize: 26, fontWeight: 400,
              letterSpacing: -0.5, color: DL.INK, margin: "0 0 8px",
            }}>
              Map widget
            </h2>
            <p style={{ fontSize: 13, color: DL.DIM, lineHeight: 1.6, margin: "0 0 18px" }}>
              A self-contained choropleth of the live intensity map, rendered as plain
              SVG — no API key needed, no JavaScript dependencies pulled into your page.
              Drop the iframe anywhere; the optional{" "}
              <code style={{ fontFamily: DL.MONO, fontSize: 11.5 }}>window</code> parameter
              takes the same values as the API.
            </p>
            <CodeBlock copyText={iframeExample}>{iframeExample}</CodeBlock>
            <p style={{ fontSize: 12, color: DL.DIM, lineHeight: 1.6, margin: "16px 0 0" }}>
              Preview it at{" "}
              <a href="/embed?window=24h" target="_blank" style={{ color: DL.CORAL, fontWeight: 600, textDecoration: "none" }}>
                /embed?window=24h ↗
              </a>
            </p>
          </Card>

          {/* ── Keys ────────────────────────────────────────────────────── */}
          <Card>
            <SectionLabel>Access</SectionLabel>
            <h2 style={{
              fontFamily: DL.DISPLAY, fontSize: 26, fontWeight: 400,
              letterSpacing: -0.5, color: DL.INK, margin: "0 0 8px",
            }}>
              Getting a key
            </h2>
            <p style={{ fontSize: 13, color: DL.DIM, lineHeight: 1.6, margin: 0 }}>
              API keys are provisioned by hand while Limelight is in early access — no
              self-serve signup yet. The embed widget needs no key at all. If you want
              API access, reach out with a sentence about what you&rsquo;re building and
              you&rsquo;ll get a key with a 1,000 request/day quota.
            </p>
          </Card>

          {/* ── Attribution footnote ────────────────────────────────────── */}
          <p style={{ fontSize: 11.5, color: DL.DIM_2, lineHeight: 1.6, margin: "4px 4px 0", fontFamily: DL.MONO }}>
            Scores are computed from public reporting (GDELT, The Guardian) using
            source credibility × recency decay, summed per country. Please attribute
            &ldquo;Limelight&rdquo; when you publish derived work.
          </p>

        </div>
      </div>

      <div className="bottom-tab-wrapper">
        <BottomTabBar active="Today" />
      </div>
    </div>
  );
}
