/* daylight-home.jsx
   ──────────────────────────────────────────────────────────────────────────
   The Daylight home / "Today" screen. The map is the hero.
   Pass `view="globe"` (default) for the orthographic, Google-Earth-like
   render, or `view="flat"` for the natural-earth projection. The toggle in
   the top-right of the map shows the current state. */

function DaylightHome({ view = "globe" }) {
  const ARTICLES = [
    { headline: "Tehran launches retaliatory drone strike on Israeli targets",   source: "Reuters",         category: "Conflict",  time: "2h",  tier: "high"   },
    { headline: "Iran uranium enrichment reaches 84% purity, IAEA warns",        source: "BBC News",        category: "Politics",  time: "5h",  tier: "high"   },
    { headline: "EU sanctions Iranian officials over arms transfers",            source: "Financial Times", category: "Politics",  time: "16h", tier: "high"   },
    { headline: "Protests erupt in Tehran over economic conditions",             source: "Al Jazeera",      category: "Politics",  time: "1d",  tier: "medium" },
    { headline: "Oil markets jolted as Strait of Hormuz tensions mount",         source: "AP News",         category: "Economics", time: "1d",  tier: "high"   },
  ];

  const isGlobe = view === "globe";
  const MAP_W = 820;
  const MAP_H = 480;

  // Rotated to put Middle East / Africa / Europe on the lit face — matches
  // what's "hot" in the seed data and reads as an editorial choice, not the
  // default geo-mid.
  const ROTATION = [-30, -15, 0];

  return (
    <div style={{
      width: 1280, height: 800, background: DL.PAPER, color: DL.INK,
      fontFamily: DL.SANS, position: "relative", overflow: "hidden",
    }}>
      <DLHeader active="Today" />

      <div style={{ display: "flex", height: 800 - 80 }}>
        {/* ─── Map column ───────────────────────────────────────── */}
        <div style={{ flex: 1, padding: "8px 44px 0", position: "relative" }}>
          <div style={{
            display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            paddingTop: 8,
          }}>
            <div style={{ maxWidth: 540 }}>
              <div style={{
                fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18,
                textTransform: "uppercase", color: DL.CORAL, marginBottom: 8,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL }} />
                Today, in 84 outlets · 1,612 stories
              </div>
              <div style={{
                fontFamily: DL.DISPLAY, fontSize: 52, fontWeight: 400, letterSpacing: -1.5,
                lineHeight: 0.95, color: DL.INK,
              }}>
                The shape of <span style={{ fontStyle: "italic" }}>the day's</span> news.
              </div>
              <div style={{ fontSize: 14.5, color: DL.DIM, marginTop: 12, lineHeight: 1.4, maxWidth: 460 }}>
                Every country, weighted by how loudly the world is reporting from it. Hover anywhere to read what's running.
              </div>
            </div>

            {/* View toggle — top right of map area */}
            <DLViewToggle value={view} />
          </div>

          {/* Map */}
          <div style={{
            position: "relative", marginTop: 18,
            display: "flex", justifyContent: "center",
          }}>
            <WorldMap
              width={MAP_W}
              height={MAP_H}
              projection={isGlobe ? "orthographic" : "natural"}
              rotate={isGlobe ? ROTATION : undefined}
              oceanColor={isGlobe ? "transparent" : "rgba(216,209,189,0.4)"}
              stroke={isGlobe ? "rgba(24,22,19,0.08)" : "rgba(24,22,19,0.06)"}
              strokeWidth={0.4}
              graticule={isGlobe}
              graticuleStroke="rgba(24,22,19,0.06)"
              graticuleStep={[20, 20]}
              globeShading={isGlobe ? { highlight: DL.GLOBE_HIGHLIGHT, shadow: DL.GLOBE_SHADOW } : undefined}
              atmosphereColor={isGlobe ? DL.GLOBE_ATM : undefined}
              atmosphereWidth={26}
              fillForScore={DL.fillForScore}
              labelForFeature={DL.labelFor}
              overlay={({ list }) => {
                const top = list.filter((p) => p.score >= 70);
                return (
                  <g>
                    {top.map((p) => (
                      <g key={"d-" + p.id}>
                        <circle cx={p.centroid[0]} cy={p.centroid[1]} r={5} fill="rgba(224,87,60,0.18)" />
                        <circle cx={p.centroid[0]} cy={p.centroid[1]} r={3} fill="#fff8ee" stroke={DL.CORAL} strokeWidth={1.2} />
                      </g>
                    ))}
                  </g>
                );
              }}
            />

            {/* Hover tooltip — anchored over Iran */}
            <div style={{
              position: "absolute",
              left: isGlobe ? "58%" : 545,
              top: isGlobe ? 200 : 180,
              width: 220,
              background: "rgba(255,255,255,0.94)",
              backdropFilter: "blur(12px)",
              borderRadius: 14, padding: 14,
              boxShadow: "0 20px 40px rgba(24,22,19,0.15)",
              border: "1px solid " + DL.RULE,
            }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                <span style={{ fontFamily: DL.DISPLAY, fontSize: 22, fontWeight: 500, letterSpacing: -0.4 }}>Iran</span>
                <span style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM }}>IRN</span>
              </div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: "#f0e8d8", borderRadius: 999 }}>
                  <div style={{ width: "85%", height: "100%", borderRadius: 999, background: `linear-gradient(90deg, #f6bc8a, ${DL.CORAL})` }} />
                </div>
                <span style={{ fontWeight: 700, fontSize: 13 }}>85</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 11, color: DL.DIM }}>
                <span style={{ color: DL.CORAL, fontWeight: 600 }}>Conflict · Politics</span>
                <span>142 articles</span>
              </div>
              {/* leader line */}
              <svg style={{ position: "absolute", left: -28, top: 26, width: 28, height: 2, overflow: "visible" }}>
                <line x1="0" y1="1" x2="28" y2="1" stroke={DL.CORAL} strokeWidth="1" strokeDasharray="2 2" />
              </svg>
            </div>
          </div>

          {/* Bottom strip — filter pill + legend */}
          <div style={{
            position: "absolute", left: 44, right: 44, bottom: 22,
            display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16,
          }}>
            <DLFilterPill window="24h" live />
            <DLHeatLegend />
          </div>
        </div>

        {/* ─── Story panel ──────────────────────────────────────── */}
        <div style={{
          width: 380, padding: "16px 36px 22px 28px",
          borderLeft: "1px solid " + DL.RULE,
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18, textTransform: "uppercase", color: DL.DIM }}>
              In focus
            </span>
            <span style={{ color: DL.DIM, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, cursor: "default" }}>
              <DLIcon name="bookmark" /> Save
            </span>
          </div>

          <div style={{ fontFamily: DL.DISPLAY, fontSize: 72, fontWeight: 400, letterSpacing: -2, lineHeight: 0.9, marginTop: 18, color: DL.INK }}>
            Iran
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <span style={{
              padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 600,
              background: DL.CORAL_50, color: DL.CORAL, border: "1px solid " + DL.CORAL_BD,
            }}>85 intensity</span>
            <span style={{ fontSize: 11, color: DL.DIM }}>#5 globally · 142 stories</span>
            <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, color: DL.LIVE, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.LIVE }} /> LIVE
            </span>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 0, marginTop: 24, borderTop: "1px solid " + DL.RULE, borderBottom: "1px solid " + DL.RULE }}>
            {[["Velocity", "+38%", DL.CORAL], ["Articles", "142", DL.INK], ["Sources", "11", DL.INK]].map(([k, v, c], i) => (
              <div key={k} style={{
                flex: 1, padding: "14px 0",
                borderLeft: i > 0 ? "1px solid " + DL.RULE : "none",
                paddingLeft: i > 0 ? 14 : 0,
              }}>
                <div style={{ fontSize: 10.5, color: DL.DIM, fontWeight: 500, letterSpacing: 0.04 }}>{k}</div>
                <div style={{ fontFamily: DL.DISPLAY, fontSize: 24, fontWeight: 500, marginTop: 4, color: c, letterSpacing: -0.4 }}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 22, fontSize: 11, color: DL.DIM, fontWeight: 600, letterSpacing: 0.04, textTransform: "uppercase" }}>
            Top headlines
          </div>

          <div style={{ flex: 1, overflow: "hidden", marginTop: 8 }}>
            {ARTICLES.map((a, i) => (
              <div key={i} style={{
                padding: "12px 0",
                borderBottom: i < ARTICLES.length - 1 ? "1px solid " + DL.RULE_2 : "none",
                display: "flex", gap: 12, alignItems: "flex-start",
              }}>
                <span style={{
                  width: 24, fontFamily: DL.MONO, fontSize: 11, color: DL.DIM,
                  fontVariantNumeric: "tabular-nums", paddingTop: 2,
                }}>{String(i + 1).padStart(2, "0")}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: DL.SANS, fontSize: 14, lineHeight: 1.32, color: DL.INK, fontWeight: 500 }}>
                    {a.headline}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, fontSize: 11, color: DL.DIM }}>
                    <span style={{ fontWeight: 600, color: DL.INK_2 }}>{a.source}</span>
                    <span>·</span>
                    <span style={{ color: DL.CORAL, fontWeight: 600 }}>{a.category}</span>
                    <span style={{ marginLeft: "auto" }}>{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.DaylightHome = DaylightHome;
