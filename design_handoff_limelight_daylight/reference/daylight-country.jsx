/* daylight-country.jsx
   ──────────────────────────────────────────────────────────────────────────
   "In Focus / Country" view — user clicked Iran (or any country) on the map
   and got an expanded reading shelf. Map shrinks to a "context strip" up top,
   the lower half becomes a curated article feed grouped by theme. */

function DaylightCountry() {
  const HERO = {
    headline: "Tehran launches retaliatory drone strike on Israeli targets",
    deck:     "The strike, the largest of its kind in three weeks, raises fresh fears that the Strait of Hormuz could be closed within days.",
    source:   "Reuters · Foreign desk",
    time:     "2h ago",
    category: "Conflict",
  };

  const FEED = [
    { group: "Diplomacy", items: [
      { h: "Iran uranium enrichment reaches 84% purity, IAEA warns", s: "BBC News",        t: "5h", b: "International inspectors say the latest figures are the closest yet to weapons-grade material." },
      { h: "EU sanctions Iranian officials over arms transfers",     s: "Financial Times", t: "16h", b: "The new package targets 26 individuals and 13 entities, including senior IRGC commanders." },
    ]},
    { group: "On the ground", items: [
      { h: "Protests erupt in Tehran over economic conditions",      s: "Al Jazeera",     t: "1d", b: "Demonstrators gathered in the Grand Bazaar district as inflation pushes essentials out of reach." },
      { h: "Aid corridors strained as fuel shortages bite",          s: "The Guardian",   t: "1d", b: "Drivers report waits of more than 30 hours at the Bazargan border crossing." },
    ]},
    { group: "Markets", items: [
      { h: "Oil markets jolted as Strait of Hormuz tensions mount",  s: "AP News",        t: "1d", b: "Brent climbed 4.2% on the open and held above $94 a barrel through the morning session." },
      { h: "Tehran Stock Exchange suspended after 6% slide",         s: "Bloomberg",      t: "2d", b: "Authorities cited 'extraordinary conditions' in a one-line statement on state TV." },
    ]},
  ];

  return (
    <div style={{
      width: 1280, height: 800, background: DL.PAPER, color: DL.INK,
      fontFamily: DL.SANS, position: "relative", overflow: "hidden",
    }}>
      <DLHeader active="Today" />

      {/* ─── Breadcrumb / back ─────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "16px 44px 0", color: DL.DIM, fontSize: 12,
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: DL.INK_2, fontWeight: 500 }}>
          <DLIcon name="back" size={12} /> Today
        </span>
        <span>·</span>
        <span>Middle East</span>
        <span>·</span>
        <span style={{ color: DL.INK, fontWeight: 600 }}>Iran</span>
        <span style={{ marginLeft: "auto", fontFamily: DL.MONO, letterSpacing: 0.08, fontSize: 11 }}>
          Updated 4 min ago
        </span>
      </div>

      <div style={{ display: "flex", gap: 0, padding: "20px 44px 0", height: 800 - 80 - 36 - 20 }}>
        {/* ─── Left: country header + hero story ────────────────── */}
        <div style={{ flex: 1, paddingRight: 36 }}>
          {/* Header row: huge name + stats */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 24 }}>
            <div style={{ fontFamily: DL.DISPLAY, fontSize: 128, fontWeight: 400, letterSpacing: -4, lineHeight: 0.85 }}>
              Iran
            </div>
            <div style={{ paddingBottom: 14, display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: DL.MONO, fontSize: 11, color: DL.DIM, letterSpacing: 0.08 }}>
                IRN · 32.4°N 53.7°E
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: DL.LIVE, fontWeight: 600 }}>
                <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.LIVE }} /> LIVE COVERAGE
              </span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: "flex", gap: 0, marginTop: 22,
            borderTop: "1px solid " + DL.RULE,
            borderBottom: "1px solid " + DL.RULE,
          }}>
            {[
              ["Intensity",  "85",     DL.CORAL, "+12 vs yesterday"],
              ["Articles",   "142",    DL.INK,   "across 11 outlets"],
              ["Velocity",   "+38%",   DL.CORAL, "vs 7-day avg"],
              ["Sentiment",  "−0.41",  DL.INK_2, "leaning negative"],
              ["Rank",       "#5",     DL.INK,   "globally today"],
            ].map(([k, v, c, sub], i) => (
              <div key={k} style={{
                flex: 1, padding: "16px 0",
                borderLeft: i > 0 ? "1px solid " + DL.RULE_2 : "none",
                paddingLeft: i > 0 ? 18 : 0,
              }}>
                <div style={{ fontSize: 10.5, color: DL.DIM, fontWeight: 500, letterSpacing: 0.04, textTransform: "uppercase" }}>{k}</div>
                <div style={{ fontFamily: DL.DISPLAY, fontSize: 30, fontWeight: 500, marginTop: 4, color: c, letterSpacing: -0.6 }}>{v}</div>
                <div style={{ fontSize: 11, color: DL.DIM, marginTop: 2 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Hero story */}
          <div style={{ marginTop: 28 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.16,
              textTransform: "uppercase", color: DL.CORAL, marginBottom: 10,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL }} />
              Top story · {HERO.time}
            </div>
            <div style={{ fontFamily: DL.DISPLAY, fontSize: 38, fontWeight: 400, letterSpacing: -1, lineHeight: 1.05 }}>
              {HERO.headline}
            </div>
            <div style={{ fontSize: 16, color: DL.INK_2, marginTop: 12, lineHeight: 1.5, maxWidth: 620 }}>
              {HERO.deck}
            </div>
            <div style={{
              marginTop: 16, display: "flex", alignItems: "center", gap: 10,
              fontSize: 12, color: DL.DIM,
            }}>
              <span style={{ color: DL.INK_2, fontWeight: 600 }}>{HERO.source}</span>
              <span>·</span>
              <span style={{ color: DL.CORAL, fontWeight: 600 }}>{HERO.category}</span>
              <span style={{ marginLeft: 8, display: "inline-flex", alignItems: "center", gap: 6, color: DL.INK_2 }}>
                <DLIcon name="arrow" size={12} /> Read
              </span>
            </div>
          </div>
        </div>

        {/* ─── Right: location card + grouped feed ─────────────── */}
        <div style={{
          width: 460, borderLeft: "1px solid " + DL.RULE, paddingLeft: 28,
          display: "flex", flexDirection: "column",
        }}>
          {/* Context map — small orthographic */}
          <div style={{
            position: "relative", height: 200, borderRadius: 12, overflow: "hidden",
            border: "1px solid " + DL.RULE_2,
            background: "linear-gradient(180deg, " + DL.PAPER + " 0%, " + DL.PAPER_2 + " 100%)",
          }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
              <WorldMap
                width={400} height={200}
                projection="orthographic"
                rotate={[-53, -32, 0]}
                stroke="rgba(24,22,19,0.1)"
                strokeWidth={0.4}
                globeShading={{ highlight: DL.GLOBE_HIGHLIGHT, shadow: DL.GLOBE_SHADOW }}
                atmosphereColor={DL.GLOBE_ATM}
                atmosphereWidth={18}
                fillForScore={DL.fillForScore}
                overlay={({ list }) => {
                  const iran = list.find((p) => p.name === "Iran");
                  if (!iran) return null;
                  return (
                    <g>
                      <circle cx={iran.centroid[0]} cy={iran.centroid[1]} r={10} fill="rgba(224,87,60,0.18)" />
                      <circle cx={iran.centroid[0]} cy={iran.centroid[1]} r={4} fill={DL.CORAL} stroke="#fff" strokeWidth={1.5} />
                    </g>
                  );
                }}
              />
            </div>
            <div style={{
              position: "absolute", left: 14, top: 12,
              fontFamily: DL.MONO, fontSize: 10, color: DL.DIM, letterSpacing: 0.1, textTransform: "uppercase",
            }}>
              Location
            </div>
          </div>

          <div style={{
            marginTop: 24, fontSize: 11, color: DL.DIM, fontWeight: 600,
            letterSpacing: 0.04, textTransform: "uppercase",
          }}>
            All coverage · grouped by theme
          </div>

          <div style={{ flex: 1, overflow: "hidden", marginTop: 10 }}>
            {FEED.map((g, gi) => (
              <div key={g.group} style={{ marginTop: gi === 0 ? 0 : 18 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: 6,
                }}>
                  <span style={{ fontFamily: DL.DISPLAY, fontSize: 16, fontWeight: 500, color: DL.INK }}>{g.group}</span>
                  <span style={{ flex: 1, height: 1, background: DL.RULE_2 }} />
                  <span style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM }}>{g.items.length}</span>
                </div>
                {g.items.map((a, i) => (
                  <div key={i} style={{
                    padding: "10px 0",
                    borderTop: i === 0 ? "none" : "1px solid " + DL.RULE_2,
                  }}>
                    <div style={{ fontSize: 13.5, lineHeight: 1.35, fontWeight: 600, color: DL.INK }}>
                      {a.h}
                    </div>
                    <div style={{ fontSize: 12, color: DL.DIM, marginTop: 3, lineHeight: 1.4 }}>
                      {a.b}
                    </div>
                    <div style={{
                      marginTop: 6, fontSize: 11, color: DL.DIM,
                      display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <span style={{ color: DL.INK_2, fontWeight: 600 }}>{a.s}</span>
                      <span>·</span>
                      <span>{a.t}</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.DaylightCountry = DaylightCountry;
