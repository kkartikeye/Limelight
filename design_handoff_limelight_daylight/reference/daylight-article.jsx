/* daylight-article.jsx
   ──────────────────────────────────────────────────────────────────────────
   The reading view — single article rendered as a long-form column with
   a narrow sidebar carrying the story's geo context, mentioned countries,
   and "see also" recommendations. */

function DaylightArticle() {
  return (
    <div style={{
      width: 1280, height: 800, background: DL.PAPER, color: DL.INK,
      fontFamily: DL.SANS, position: "relative", overflow: "hidden",
    }}>
      <DLHeader active="Today" />

      {/* Breadcrumb */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 44px 0", color: DL.DIM, fontSize: 12,
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: DL.INK_2, fontWeight: 500 }}>
          <DLIcon name="back" size={12} /> Iran
        </span>
        <span>·</span>
        <span style={{ color: DL.CORAL, fontWeight: 600 }}>Conflict</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", gap: 14, alignItems: "center" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: DL.INK_2 }}>
            <DLIcon name="bookmark" size={12} /> Save
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: DL.INK_2 }}>
            <DLIcon name="share" size={12} /> Share
          </span>
        </span>
      </div>

      <div style={{ display: "flex", height: 800 - 80 - 36 }}>
        {/* ─── Reading column ───────────────────────────────────── */}
        <div style={{ flex: 1, padding: "28px 44px 0", overflow: "hidden" }}>
          <div style={{ maxWidth: 660 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.16,
              textTransform: "uppercase", color: DL.CORAL,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL }} />
              Live · Conflict · Iran
            </div>

            <h1 style={{
              fontFamily: DL.DISPLAY, fontSize: 54, fontWeight: 400,
              letterSpacing: -1.3, lineHeight: 1.02, margin: "14px 0 16px",
              color: DL.INK, textWrap: "balance",
            }}>
              Tehran launches retaliatory drone strike on Israeli targets
            </h1>

            <p style={{
              fontFamily: DL.DISPLAY, fontSize: 20, fontStyle: "italic",
              color: DL.INK_2, lineHeight: 1.45, margin: "0 0 24px",
              maxWidth: 600, fontWeight: 400,
            }}>
              The strike, the largest of its kind in three weeks, raises fresh fears that the Strait of Hormuz could be closed within days.
            </p>

            {/* Byline / meta */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "12px 0", borderTop: "1px solid " + DL.RULE, borderBottom: "1px solid " + DL.RULE,
              marginBottom: 24,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 999, background: DL.PAPER_2,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: DL.DISPLAY, fontSize: 13, fontWeight: 500, color: DL.INK_2,
                border: "1px solid " + DL.RULE_2,
              }}>RT</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Reuters · Foreign desk</span>
                <span style={{ fontSize: 11, color: DL.DIM, fontFamily: DL.MONO, letterSpacing: 0.06 }}>
                  Published 2 h ago · 6 min read
                </span>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                  padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
                  background: DL.CORAL_50, color: DL.CORAL, border: "1px solid " + DL.CORAL_BD,
                }}>85 intensity</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11,
                  color: DL.LIVE, fontWeight: 600,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.LIVE }} /> LIVE
                </span>
              </div>
            </div>

            {/* Body */}
            <div style={{
              fontFamily: DL.DISPLAY, fontSize: 17.5, lineHeight: 1.55,
              color: DL.INK_2, maxWidth: 600,
            }}>
              <p style={{ margin: "0 0 16px" }}>
                <span style={{
                  float: "left", fontFamily: DL.DISPLAY, fontSize: 62, fontWeight: 500,
                  lineHeight: 0.85, marginRight: 8, marginTop: 4, color: DL.INK,
                }}>T</span>
                ehran has launched what it calls a "measured response" to last week's air strike on the Natanz enrichment facility, sending a wave of more than forty drones toward targets in northern Israel late Sunday night.
              </p>
              <p style={{ margin: "0 0 16px" }}>
                Israeli air defences intercepted the majority of the inbound craft, but officials confirmed at least three impacts near military installations south of Haifa. Casualty figures were not immediately available.
              </p>
              <p style={{ margin: "0 0 16px" }}>
                The escalation comes after weeks of brinkmanship that had alarmed Gulf states and rattled energy markets. Brent crude was up 4.2 per cent in early Asian trading.
              </p>
            </div>
          </div>
        </div>

        {/* ─── Sidebar ──────────────────────────────────────────── */}
        <div style={{
          width: 360, padding: "28px 36px 22px 28px",
          borderLeft: "1px solid " + DL.RULE,
          display: "flex", flexDirection: "column", gap: 22,
        }}>
          {/* Story locator — globe */}
          <div>
            <div style={{
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.12,
              textTransform: "uppercase", color: DL.DIM, marginBottom: 8,
            }}>
              Story location
            </div>
            <div style={{
              position: "relative", height: 180, borderRadius: 12, overflow: "hidden",
              border: "1px solid " + DL.RULE_2, background: DL.PAPER_2,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <WorldMap
                width={300} height={180}
                projection="orthographic"
                rotate={[-45, -32, 0]}
                stroke="rgba(24,22,19,0.1)" strokeWidth={0.4}
                globeShading={{ highlight: DL.GLOBE_HIGHLIGHT, shadow: DL.GLOBE_SHADOW }}
                atmosphereColor={DL.GLOBE_ATM} atmosphereWidth={14}
                fillForScore={DL.fillForScore}
                overlay={({ list }) => {
                  const iran = list.find((p) => p.name === "Iran");
                  const isr = list.find((p) => p.name === "Israel");
                  if (!iran) return null;
                  return (
                    <g>
                      {isr && (
                        <line
                          x1={iran.centroid[0]} y1={iran.centroid[1]}
                          x2={isr.centroid[0]}  y2={isr.centroid[1]}
                          stroke={DL.CORAL} strokeWidth="1.4" strokeDasharray="3 3"
                        />
                      )}
                      <circle cx={iran.centroid[0]} cy={iran.centroid[1]} r={4} fill={DL.CORAL} stroke="#fff" strokeWidth={1.5} />
                      {isr && <circle cx={isr.centroid[0]} cy={isr.centroid[1]} r={4} fill={DL.CORAL} stroke="#fff" strokeWidth={1.5} />}
                    </g>
                  );
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10, fontSize: 11.5, color: DL.DIM }}>
              <span style={{ color: DL.INK_2, fontWeight: 600 }}>Iran</span>
              <span style={{ color: DL.DIM_2 }}>→</span>
              <span style={{ color: DL.INK_2, fontWeight: 600 }}>Israel</span>
              <span style={{ marginLeft: "auto", fontFamily: DL.MONO, letterSpacing: 0.06 }}>1,558 km</span>
            </div>
          </div>

          {/* Mentioned places */}
          <div>
            <div style={{
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.12,
              textTransform: "uppercase", color: DL.DIM, marginBottom: 10,
            }}>
              Mentioned
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[["Iran", "high"], ["Israel", "high"], ["Natanz", "med"], ["Haifa", "med"], ["Strait of Hormuz", "high"], ["Gulf states", "low"]].map(([t, tier]) => (
                <span key={t} style={{
                  padding: "5px 10px", borderRadius: 999, fontSize: 11, fontWeight: 500,
                  background: tier === "high" ? DL.CORAL_50 : DL.CARD,
                  color:      tier === "high" ? DL.CORAL    : DL.INK_2,
                  border: "1px solid " + (tier === "high" ? DL.CORAL_BD : DL.RULE_2),
                }}>{t}</span>
              ))}
            </div>
          </div>

          {/* See also */}
          <div>
            <div style={{
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.12,
              textTransform: "uppercase", color: DL.DIM, marginBottom: 10,
            }}>
              See also
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[
                { h: "Oil markets jolted as Strait of Hormuz tensions mount", s: "AP News", t: "1d" },
                { h: "IAEA: Iran enrichment at 84%", s: "BBC News", t: "5h" },
                { h: "EU sanctions Iranian officials", s: "Financial Times", t: "16h" },
              ].map((a, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 4, background: DL.PAPER_2,
                    flexShrink: 0, border: "1px solid " + DL.RULE_2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: DL.MONO, fontSize: 9, color: DL.DIM,
                  }}>{String(i + 1).padStart(2, "0")}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: DL.INK, lineHeight: 1.3 }}>
                      {a.h}
                    </div>
                    <div style={{ fontSize: 11, color: DL.DIM, marginTop: 3 }}>
                      <span style={{ color: DL.INK_2, fontWeight: 600 }}>{a.s}</span> · {a.t}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.DaylightArticle = DaylightArticle;
