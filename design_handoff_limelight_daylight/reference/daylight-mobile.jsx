/* daylight-mobile.jsx
   ──────────────────────────────────────────────────────────────────────────
   Mobile home view — same calm editorial system, restructured for a single
   column. Globe sits inside an iPhone bezel from the iOS frame helper, but
   we just draw a simple bezel inline here to keep things lightweight. */

function DaylightMobile() {
  const W = 390, H = 844;

  const FEED = [
    { tag: "Conflict",  h: "Tehran launches retaliatory drone strike on Israeli targets", s: "Reuters",    t: "2h",  c: "Iran",   score: 85 },
    { tag: "Politics",  h: "Iran uranium enrichment reaches 84% purity",                 s: "BBC News",   t: "5h",  c: "Iran",   score: 85 },
    { tag: "Politics",  h: "EU sanctions Iranian officials over arms transfers",         s: "FT",         t: "16h", c: "EU",     score: 33 },
    { tag: "Economics", h: "Oil markets jolted as Strait of Hormuz tensions mount",      s: "AP News",    t: "1d",  c: "Global", score: 65 },
  ];

  return (
    <div style={{
      width: W + 28, height: H + 28, padding: 14,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "transparent",
    }}>
      {/* Phone bezel */}
      <div style={{
        width: W, height: H, borderRadius: 50, overflow: "hidden",
        background: DL.PAPER, position: "relative",
        boxShadow: "0 30px 60px rgba(24,22,19,0.18), 0 8px 20px rgba(24,22,19,0.08), inset 0 0 0 6px #1a1815, inset 0 0 0 7px #444",
        fontFamily: DL.SANS, color: DL.INK,
      }}>
        {/* Status bar */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 48,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 36px 0", fontSize: 13, fontWeight: 600,
        }}>
          <span style={{ fontFamily: DL.SANS, fontVariantNumeric: "tabular-nums" }}>9:41</span>
          <div style={{
            width: 110, height: 28, borderRadius: 999, background: "#0a0a0a",
            position: "absolute", left: "50%", top: 10, transform: "translateX(-50%)",
          }} />
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <rect x="0" y="6" width="3" height="4" rx="0.5" fill={DL.INK} />
              <rect x="4" y="4" width="3" height="6" rx="0.5" fill={DL.INK} />
              <rect x="8" y="2" width="3" height="8" rx="0.5" fill={DL.INK} />
              <rect x="12" y="0" width="3" height="10" rx="0.5" fill={DL.INK} />
            </svg>
            <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
              <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke={DL.INK} />
              <rect x="2" y="2" width="14" height="7" rx="1" fill={DL.INK} />
              <rect x="20" y="3.5" width="1.5" height="4" rx="0.5" fill={DL.INK} />
            </svg>
          </div>
        </div>

        {/* Top nav */}
        <div style={{
          paddingTop: 64, paddingLeft: 22, paddingRight: 22,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <DLLogo size={22} />
            <span style={{ fontFamily: DL.DISPLAY, fontSize: 20, fontWeight: 500, letterSpacing: -0.4 }}>Limelight</span>
          </div>
          <div style={{
            width: 32, height: 32, borderRadius: 999, background: DL.PAPER_2,
            border: "1px solid " + DL.RULE_2,
            display: "flex", alignItems: "center", justifyContent: "center", color: DL.INK_2,
          }}>
            <DLIcon name="search" size={14} />
          </div>
        </div>

        {/* Hero label */}
        <div style={{ padding: "20px 22px 0" }}>
          <div style={{
            fontFamily: DL.MONO, fontSize: 9.5, letterSpacing: 0.18,
            textTransform: "uppercase", color: DL.CORAL,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: 999, background: DL.CORAL }} />
            Today · 84 outlets
          </div>
          <div style={{
            fontFamily: DL.DISPLAY, fontSize: 36, fontWeight: 400, letterSpacing: -1,
            lineHeight: 1, marginTop: 8,
          }}>
            The shape of <span style={{ fontStyle: "italic" }}>today's</span> news.
          </div>
        </div>

        {/* Globe */}
        <div style={{ position: "relative", marginTop: 14, display: "flex", justifyContent: "center" }}>
          <WorldMap
            width={W - 44} height={240}
            projection="orthographic"
            rotate={[-30, -15, 0]}
            stroke="rgba(24,22,19,0.08)" strokeWidth={0.4}
            globeShading={{ highlight: DL.GLOBE_HIGHLIGHT, shadow: DL.GLOBE_SHADOW }}
            atmosphereColor={DL.GLOBE_ATM} atmosphereWidth={20}
            fillForScore={DL.fillForScore}
            overlay={({ list }) => {
              const top = list.filter((p) => p.score >= 70);
              return (
                <g>
                  {top.map((p) => (
                    <g key={"m-" + p.id}>
                      <circle cx={p.centroid[0]} cy={p.centroid[1]} r={4} fill="rgba(224,87,60,0.18)" />
                      <circle cx={p.centroid[0]} cy={p.centroid[1]} r={2.5} fill="#fff8ee" stroke={DL.CORAL} strokeWidth={1} />
                    </g>
                  ))}
                </g>
              );
            }}
          />
          {/* Floating toggle */}
          <div style={{ position: "absolute", right: 22, top: 12 }}>
            <DLViewToggle value="globe" />
          </div>
        </div>

        {/* Time-window chips */}
        <div style={{
          display: "flex", gap: 6, justifyContent: "center", marginTop: 12,
        }}>
          {["1h","6h","24h","7d","30d"].map((t) => (
            <span key={t} style={{
              fontSize: 11, padding: "5px 11px", borderRadius: 999,
              background: t === "24h" ? DL.INK : DL.CARD,
              color:      t === "24h" ? DL.PAPER : DL.DIM,
              fontWeight: t === "24h" ? 600 : 500,
              border: t === "24h" ? "none" : "1px solid " + DL.RULE_2,
            }}>{t}</span>
          ))}
        </div>

        {/* Feed */}
        <div style={{ padding: "20px 22px 0" }}>
          <div style={{
            fontSize: 10.5, color: DL.DIM, fontWeight: 600, letterSpacing: 0.06,
            textTransform: "uppercase", marginBottom: 10,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <span>Top headlines</span>
            <span style={{ color: DL.CORAL }}>See all</span>
          </div>
          {FEED.slice(0, 3).map((a, i) => (
            <div key={i} style={{
              padding: "12px 0",
              borderTop: i === 0 ? "none" : "1px solid " + DL.RULE_2,
              display: "flex", gap: 12, alignItems: "flex-start",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 10, fontWeight: 600, color: DL.CORAL,
                  textTransform: "uppercase", letterSpacing: 0.08,
                }}>{a.tag}</div>
                <div style={{
                  fontFamily: DL.SANS, fontSize: 14.5, fontWeight: 600,
                  lineHeight: 1.3, marginTop: 4, color: DL.INK,
                }}>
                  {a.h}
                </div>
                <div style={{
                  fontSize: 11, color: DL.DIM, marginTop: 5,
                  display: "flex", gap: 6, alignItems: "center",
                }}>
                  <span style={{ color: DL.INK_2, fontWeight: 600 }}>{a.s}</span>
                  <span>·</span>
                  <span>{a.t}</span>
                  <span style={{ marginLeft: "auto", color: DL.CORAL, fontWeight: 600 }}>{a.c}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          background: "rgba(246,243,236,0.92)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid " + DL.RULE_2,
          padding: "12px 40px 28px",
          display: "flex", justifyContent: "space-between",
        }}>
          {[
            { l: "Today",   icon: "globe",     on: true },
            { l: "Regions", icon: "regions",   on: false },
            { l: "Topics",  icon: "topics",    on: false },
            { l: "Saved",   icon: "bookmark",  on: false },
          ].map((t) => (
            <div key={t.l} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              color: t.on ? DL.CORAL : DL.DIM,
              fontSize: 10, fontWeight: t.on ? 600 : 500,
            }}>
              <div style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {t.icon === "globe" && (
                  <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <circle cx="11" cy="11" r="8.5" />
                    <ellipse cx="11" cy="11" rx="4" ry="8.5" />
                    <line x1="2.5" y1="11" x2="19.5" y2="11" />
                  </svg>
                )}
                {t.icon === "regions" && (
                  <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <path d="M11 2 L4 6 L4 16 L11 20 L18 16 L18 6 Z" />
                    <line x1="11" y1="2" x2="11" y2="20" />
                    <line x1="4" y1="11" x2="18" y2="11" />
                  </svg>
                )}
                {t.icon === "topics" && (
                  <svg viewBox="0 0 22 22" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6">
                    <line x1="6" y1="6" x2="18" y2="6" />
                    <line x1="6" y1="11" x2="18" y2="11" />
                    <line x1="6" y1="16" x2="13" y2="16" />
                    <circle cx="3.5" cy="6"  r="0.8" fill="currentColor" />
                    <circle cx="3.5" cy="11" r="0.8" fill="currentColor" />
                    <circle cx="3.5" cy="16" r="0.8" fill="currentColor" />
                  </svg>
                )}
                {t.icon === "bookmark" && <DLIcon name="bookmark" size={20} />}
              </div>
              <span>{t.l}</span>
            </div>
          ))}
        </div>

        {/* Home indicator */}
        <div style={{
          position: "absolute", left: "50%", bottom: 8,
          transform: "translateX(-50%)",
          width: 134, height: 5, borderRadius: 999, background: DL.INK,
        }} />
      </div>
    </div>
  );
}

window.DaylightMobile = DaylightMobile;
