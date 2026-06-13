"use client";

// ─── About page ───────────────────────────────────────────────────────────────
// What Limelight is, and exactly how the Coverage Intensity score is computed.
// Linked from the header ("About"). Copy mirrors the methodology card on the map
// legend so the explanation is consistent everywhere.

import Link from "next/link";
import Header from "@/components/ui/header";
import BottomTabBar from "@/components/ui/bottom-tab-bar";
import { DL } from "@/lib/design-tokens";

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

function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontFamily: DL.DISPLAY, fontSize: 26, fontWeight: 400,
      letterSpacing: -0.5, color: DL.INK, margin: "0 0 10px",
    }}>
      {children}
    </h2>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13.5, color: DL.DIM, lineHeight: 1.65, margin: "0 0 12px" }}>
      {children}
    </p>
  );
}

const FACTORS: { name: string; detail: string }[] = [
  { name: "Source credibility", detail: "An established wire or national outlet counts for more than an unknown blog." },
  { name: "Recency", detail: "Stories decay over time — a report from an hour ago weighs more than one from yesterday." },
  { name: "Topic", detail: "Conflict and humanitarian coverage carry the most weight; sports and entertainment the least." },
];

export default function AboutPage() {
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
        <div className="topics-body" style={{ maxWidth: 720, margin: "0 auto", padding: "36px 44px 80px" }}>

          {/* ── Page header ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 36 }}>
            <div style={{
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18,
              textTransform: "uppercase", color: DL.CORAL,
              display: "flex", alignItems: "center", gap: 8, marginBottom: 10,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
              What is Limelight
            </div>
            <h1 className="topics-h1" style={{
              fontFamily: DL.DISPLAY, fontSize: 64, fontWeight: 400,
              letterSpacing: -2.2, lineHeight: 0.90, color: DL.INK,
              margin: "0 0 14px",
            }}>
              A live map of<br />the world&rsquo;s attention.
            </h1>
            <p style={{ fontSize: 15, color: DL.DIM, maxWidth: 520, lineHeight: 1.6, margin: 0 }}>
              Limelight heat-colours every country by how loudly the world&rsquo;s media
              is reporting from it right now — so you can see where attention is
              concentrated before you read a single headline.
            </p>
          </div>

          {/* ── The metric ─────────────────────────────────────────────── */}
          <Card>
            <SectionLabel>The metric</SectionLabel>
            <H2>Coverage Intensity, not importance</H2>
            <P>
              The colour you see is <strong style={{ color: DL.INK_2, fontWeight: 600 }}>Coverage
              Intensity</strong> — a 0–100 measure of media attention. It reflects how
              much the press is covering a place, which is not the same as how important
              events there objectively are. A quiet country isn&rsquo;t unimportant; it&rsquo;s
              just under-reported in this moment.
            </P>
            <P>
              Scores are normalised across all countries, so the most-covered country is
              always 100 and everything else is relative to it.
            </P>
          </Card>

          {/* ── How it's scored ─────────────────────────────────────────── */}
          <Card>
            <SectionLabel>How it&rsquo;s scored</SectionLabel>
            <H2>Every story, weighted three ways</H2>
            <P>
              As each article is ingested it&rsquo;s tagged to a country and given a weight.
              A country&rsquo;s score is the sum of its stories&rsquo; weights, where each weight
              depends on:
            </P>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 6 }}>
              {FACTORS.map((f) => (
                <div key={f.name} style={{ display: "flex", gap: 14, padding: "12px 0", borderTop: `1px solid ${DL.RULE_2}` }}>
                  <span style={{
                    fontFamily: DL.SANS, fontSize: 13.5, fontWeight: 600, color: DL.INK,
                    flexShrink: 0, width: 150,
                  }}>
                    {f.name}
                  </span>
                  <span style={{ fontSize: 13, color: DL.DIM, lineHeight: 1.55 }}>{f.detail}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* ── Where the data comes from ──────────────────────────────── */}
          <Card>
            <SectionLabel>The data</SectionLabel>
            <H2>Live, real reporting only</H2>
            <P>
              Coverage is drawn from public news feeds — currently GDELT&rsquo;s global news
              index and The Guardian — refreshed continuously. Limelight never shows
              placeholder or sample stories: if a country looks quiet, no qualifying
              coverage was captured for it in the selected time window.
            </P>
            <P>
              You can narrow the map by time window and by topic using the controls at
              the bottom of the map. Want the raw numbers? The{" "}
              <Link href="/developers" style={{ color: DL.CORAL, fontWeight: 600, textDecoration: "none" }}>
                public API
              </Link>{" "}
              serves the same scores as JSON.
            </P>
          </Card>

          {/* ── CTA ─────────────────────────────────────────────────────── */}
          <Link
            href="/"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: DL.INK, color: DL.PAPER,
              borderRadius: 999, padding: "12px 22px",
              fontSize: 14, fontWeight: 600, textDecoration: "none",
              fontFamily: DL.SANS, marginTop: 4,
            }}
          >
            Explore the map
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <line x1="2" y1="7" x2="12" y2="7" /><polyline points="9,4 12,7 9,10" />
            </svg>
          </Link>

        </div>
      </div>

      <div className="bottom-tab-wrapper">
        <BottomTabBar active="Today" />
      </div>
    </div>
  );
}
