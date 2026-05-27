/* daylight-shared.jsx
   ──────────────────────────────────────────────────────────────────────────
   Shared tokens, fonts and small components for the Daylight design system.
   The whole product surface (home, country focus, article reader, mobile)
   pulls from this file so the visual system stays consistent.

   Design DNA:
   - Off-white paper background, ink-black headlines
   - Newsreader serif for display, Manrope for sans body, Plex Mono for chrome
   - Soft pastel choropleth — cream → peach → coral (never crimson)
   - Single accent: coral red. Used sparingly, for state changes and "live" cues
   - Hairline rules, generous whitespace, no heavy shadows
   - The map is the hero: globe by default, flat by toggle
   ────────────────────────────────────────────────────────────────────────── */

const DL = {
  // Fonts
  DISPLAY: '"Newsreader", "Source Serif 4", Georgia, serif',
  SANS:    '"Manrope", "IBM Plex Sans", system-ui, sans-serif',
  MONO:    '"IBM Plex Mono", ui-monospace, monospace',

  // Surfaces
  PAPER:    "#f6f3ec",
  PAPER_2:  "#efeadf",   // a tone darker, used for inset surfaces
  CARD:     "#ffffff",   // pure white floats above paper
  INK:      "#181613",
  INK_2:    "#3a3025",   // softer ink for secondary headings
  DIM:      "#7a7568",
  DIM_2:    "#aaa492",
  RULE:     "rgba(24,22,19,0.10)",
  RULE_2:   "rgba(24,22,19,0.05)",

  // Accent
  CORAL:    "#e0573c",
  CORAL_50: "#fff0ea",
  CORAL_BD: "#fac7b8",
  LIVE:     "#2a8a5e",

  // Heat ladder — sun-warmed peach, no black, no-data is a soft warm gray.
  // Keyed off score 0..100. Returns hex.
  fillForScore(s) {
    if (s >= 80) return "#c93e2a";
    if (s >= 60) return "#e26a4f";
    if (s >= 40) return "#f0936b";
    if (s >= 20) return "#f6bc8a";
    if (s >=  5) return "#fad9b3";
    if (s >   0) return "#fbe6cd";
    return "#e8e2d0";
  },

  // Globe shading — warm highlight, slightly cooler shadow. Matches paper-globe feel.
  GLOBE_HIGHLIGHT: "#fbf6e9",
  GLOBE_SHADOW:    "#dccfb1",
  GLOBE_ATM:       "#f0936b",  // very faint coral atmosphere

  // Label config used by WorldMap. Keep one rule across all daylight screens.
  labelFor(p, s) {
    if (s >= 60) return { text: p.name, color: "#fffaef", halo: "#1a0e08", haloWidth: 2, weight: 600, size: 10, font: '"Manrope", sans-serif', tracking: 0.1 };
    if (s >= 25) return { text: p.name, color: "#3a2a1a", weight: 600, size: 9, font: '"Manrope", sans-serif', opacity: 0.85 };
    if (s >= 10) return { text: p.name, color: "#3a2a1a", weight: 500, size: 8, font: '"Manrope", sans-serif', opacity: 0.55 };
    return null;
  },
};

/* ─── Logo ────────────────────────────────────────────────────────────── */
function DLLogo({ size = 22 }) {
  const inner = size - 8;
  const dot = size - 14;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 999, background: DL.CORAL }} />
      <div style={{ position: "absolute", left: 4, top: 4, width: inner, height: inner, borderRadius: 999, background: DL.PAPER }} />
      <div style={{ position: "absolute", left: 7, top: 7, width: dot, height: dot, borderRadius: 999, background: DL.CORAL }} />
    </div>
  );
}

/* ─── Top nav / masthead ─────────────────────────────────────────────── */
function DLHeader({ active = "Today", clock = "Mon · 09:14 GMT", showSignIn = true, onPaper = true }) {
  const bg = onPaper ? DL.PAPER : "transparent";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "22px 44px 18px", background: bg,
      borderBottom: onPaper ? "1px solid " + DL.RULE_2 : "none",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <DLLogo />
        <span style={{ fontFamily: DL.DISPLAY, fontSize: 22, fontWeight: 500, letterSpacing: -0.4, color: DL.INK }}>Limelight</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 32, fontSize: 13, color: DL.DIM, fontFamily: DL.SANS }}>
        {["Today", "Regions", "Topics", "Saved"].map((t) => (
          <span key={t} style={{
            color: t === active ? DL.INK : DL.DIM,
            fontWeight: t === active ? 600 : 500,
            position: "relative",
          }}>
            {t}
            {t === active && (
              <span style={{ position: "absolute", left: 0, right: 0, bottom: -22, height: 2, background: DL.CORAL, borderRadius: 2 }} />
            )}
          </span>
        ))}
        <span style={{ width: 1, height: 16, background: DL.RULE }} />
        <span style={{ fontFamily: DL.MONO, fontSize: 11, letterSpacing: 0.1 }}>{clock}</span>
        {showSignIn && (
          <button style={{
            background: DL.INK, color: DL.PAPER, border: "none", borderRadius: 999,
            padding: "8px 14px", fontFamily: DL.SANS, fontSize: 12, fontWeight: 600, letterSpacing: 0.04,
            cursor: "default",
          }}>Sign in</button>
        )}
      </div>
    </div>
  );
}

/* ─── View toggle (Globe ⇄ Flat) ─────────────────────────────────────── */
function DLViewToggle({ value = "globe" }) {
  const Item = ({ id, label, icon }) => {
    const on = value === id;
    return (
      <div style={{
        display: "flex", alignItems: "center", gap: 6,
        padding: "6px 10px 6px 8px", borderRadius: 999,
        background: on ? DL.INK : "transparent",
        color: on ? DL.PAPER : DL.DIM,
        fontFamily: DL.SANS, fontSize: 12, fontWeight: on ? 600 : 500,
        transition: "all .15s ease",
      }}>
        <span style={{ display: "inline-flex", width: 14, height: 14, alignItems: "center", justifyContent: "center" }}>{icon}</span>
        {label}
      </div>
    );
  };
  const globeIcon = (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="7" cy="7" r="5.5" />
      <ellipse cx="7" cy="7" rx="2.5" ry="5.5" />
      <line x1="1.5" y1="7" x2="12.5" y2="7" />
    </svg>
  );
  const flatIcon = (
    <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1.5" y="3" width="11" height="8" rx="1" />
      <line x1="1.5" y1="7" x2="12.5" y2="7" />
      <line x1="7" y1="3" x2="7" y2="11" />
    </svg>
  );
  return (
    <div style={{
      display: "inline-flex", gap: 2, padding: 3, borderRadius: 999,
      background: DL.CARD, border: "1px solid " + DL.RULE,
      boxShadow: "0 4px 16px rgba(24,22,19,0.05)",
    }}>
      <Item id="globe" label="Globe" icon={globeIcon} />
      <Item id="flat"  label="Flat"  icon={flatIcon} />
    </div>
  );
}

/* ─── Filter pill (date range + categories) ──────────────────────────── */
function DLFilterPill({ window = "24h", live = true }) {
  return (
    <div style={{
      background: DL.CARD, borderRadius: 18, padding: "10px 12px",
      display: "inline-flex", alignItems: "center", gap: 12,
      boxShadow: "0 10px 30px rgba(24,22,19,0.10), 0 2px 6px rgba(24,22,19,0.04)",
      border: "1px solid " + DL.RULE_2, fontFamily: DL.SANS,
    }}>
      <div style={{ display: "flex", gap: 2 }}>
        {["1h","6h","24h","7d","30d"].map((t) => (
          <span key={t} style={{
            fontSize: 12, padding: "6px 11px", borderRadius: 999,
            background: t === window ? DL.INK : "transparent",
            color: t === window ? DL.PAPER : DL.DIM,
            fontWeight: t === window ? 600 : 500,
          }}>{t}</span>
        ))}
      </div>
      <span style={{ width: 1, height: 18, background: DL.RULE }} />
      <div style={{ display: "flex", gap: 6, fontSize: 12 }}>
        {[["Conflict", true], ["Politics", true], ["Humanitarian", true], ["Economics", false], ["Tech", false]].map(([c, on]) => (
          <span key={c} style={{
            padding: "5px 11px", borderRadius: 999,
            background: on ? DL.CORAL_50 : "transparent",
            color: on ? DL.CORAL : DL.DIM,
            fontWeight: on ? 600 : 500,
            border: "1px solid " + (on ? DL.CORAL_BD : DL.RULE),
          }}>{c}</span>
        ))}
      </div>
      <span style={{ width: 1, height: 18, background: DL.RULE }} />
      <span style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM, letterSpacing: 0.08 }}>
        {live ? "↻ 4 min ago" : "paused"}
      </span>
    </div>
  );
}

/* ─── Heat legend ────────────────────────────────────────────────────── */
function DLHeatLegend() {
  const stops = [
    [0,   "#e8e2d0"],
    [5,   "#fbe6cd"],
    [20,  "#fad9b3"],
    [40,  "#f6bc8a"],
    [60,  "#f0936b"],
    [80,  "#e26a4f"],
    [100, "#c93e2a"],
  ];
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM, letterSpacing: 0.12, textTransform: "uppercase" }}>
        Intensity
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.DIM }}>quiet</span>
        <div style={{
          width: 180, height: 8, borderRadius: 999,
          background: `linear-gradient(90deg, ${stops.map(([_, c], i) => `${c} ${(i / (stops.length - 1)) * 100}%`).join(", ")})`,
          border: "1px solid " + DL.RULE_2,
        }} />
        <span style={{ fontFamily: DL.MONO, fontSize: 10, color: DL.CORAL, fontWeight: 600 }}>loud</span>
      </div>
    </div>
  );
}

/* ─── Tiny inline iconography ────────────────────────────────────────── */
function DLIcon({ name, size = 14, color = "currentColor" }) {
  const props = { width: size, height: size, viewBox: "0 0 14 14", fill: "none", stroke: color, strokeWidth: 1.3, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "search": return <svg {...props}><circle cx="6" cy="6" r="4" /><line x1="9" y1="9" x2="12" y2="12" /></svg>;
    case "bookmark": return <svg {...props}><path d="M3 1.5h8v11l-4-3-4 3z" /></svg>;
    case "share": return <svg {...props}><circle cx="3" cy="7" r="1.5" /><circle cx="11" cy="3" r="1.5" /><circle cx="11" cy="11" r="1.5" /><line x1="4.3" y1="6.3" x2="9.7" y2="3.7" /><line x1="4.3" y1="7.7" x2="9.7" y2="10.3" /></svg>;
    case "x": return <svg {...props}><line x1="3" y1="3" x2="11" y2="11" /><line x1="11" y1="3" x2="3" y2="11" /></svg>;
    case "back": return <svg {...props}><polyline points="8,3 4,7 8,11" /><line x1="4" y1="7" x2="12" y2="7" /></svg>;
    case "arrow": return <svg {...props}><line x1="2" y1="7" x2="12" y2="7" /><polyline points="9,4 12,7 9,10" /></svg>;
    case "play": return <svg {...props}><polygon points="4,3 11,7 4,11" fill={color} /></svg>;
    case "pause": return <svg {...props}><rect x="4" y="3" width="2" height="8" fill={color} stroke="none" /><rect x="8" y="3" width="2" height="8" fill={color} stroke="none" /></svg>;
    default: return null;
  }
}

window.DL = DL;
window.DLLogo = DLLogo;
window.DLHeader = DLHeader;
window.DLViewToggle = DLViewToggle;
window.DLFilterPill = DLFilterPill;
window.DLHeatLegend = DLHeatLegend;
window.DLIcon = DLIcon;
