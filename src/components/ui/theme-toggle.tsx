"use client";

// ─── Theme controls ───────────────────────────────────────────────────────────
// ThemePill — prominent Day/Night switcher overlaid on the map (replaces the
//             old Globe/Flat projection toggle position).
// ThemeToggleIcon — compact sun/moon button for the header on non-map pages.
// Both render the Daylight state until mounted: the server can't read
// localStorage, so the first client render must match its HTML.

import { useEffect, useState } from "react";
import { useThemeStore } from "@/lib/stores/theme-store";
import { DL } from "@/lib/design-tokens";

const SunIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
    <circle cx="12" cy="12" r="4.2" />
    <line x1="12" y1="2.5" x2="12" y2="5" /><line x1="12" y1="19" x2="12" y2="21.5" />
    <line x1="2.5" y1="12" x2="5" y2="12" /><line x1="19" y1="12" x2="21.5" y2="12" />
    <line x1="5.3" y1="5.3" x2="7" y2="7" /><line x1="17" y1="17" x2="18.7" y2="18.7" />
    <line x1="5.3" y1="18.7" x2="7" y2="17" /><line x1="17" y1="7" x2="18.7" y2="5.3" />
  </svg>
);

const MoonIcon = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" />
  </svg>
);

function useMountedTheme() {
  const { theme, toggleTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return { midnight: mounted && theme === "midnight", toggleTheme };
}

/** Two-segment Day/Night pill — overlaid top-right of the map. The whole pill
 *  is one button: clicking anywhere flips the theme. */
export function ThemePill() {
  const { midnight, toggleTheme } = useMountedTheme();

  const segment = (active: boolean, label: string, icon: React.ReactNode) => (
    <span
      className="flex items-center gap-1.5 font-body"
      style={{
        padding: "5px 10px 5px 8px",
        borderRadius: 999,
        background: active ? DL.INK : "transparent",
        color: active ? DL.PAPER : DL.DIM,
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        transition: "all 0.15s ease",
      }}
    >
      {icon}
      {label}
    </span>
  );

  return (
    <button
      onClick={toggleTheme}
      aria-label={midnight ? "Switch to Daylight theme" : "Switch to Midnight theme"}
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        borderRadius: 999,
        border: `1px solid ${DL.RULE}`,
        background: DL.CARD,
        boxShadow: "0 4px 16px rgba(24,22,19,0.05)",
        cursor: "pointer",
      }}
    >
      {segment(!midnight, "Day", <SunIcon />)}
      {segment(midnight, "Night", <MoonIcon />)}
    </button>
  );
}

/** Compact sun/moon icon button for the header. */
export function ThemeToggleIcon({ size = 14 }: { size?: number }) {
  const { midnight, toggleTheme } = useMountedTheme();
  return (
    <button
      onClick={toggleTheme}
      aria-label={midnight ? "Switch to Daylight theme" : "Switch to Midnight theme"}
      title={midnight ? "Daylight" : "Midnight"}
      style={{
        background: "none", border: "none", cursor: "pointer",
        color: DL.DIM, padding: 4, display: "flex", borderRadius: 8,
        transition: "color 0.12s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = DL.INK)}
      onMouseLeave={(e) => (e.currentTarget.style.color = DL.DIM)}
    >
      {midnight ? <SunIcon size={size} /> : <MoonIcon size={size} />}
    </button>
  );
}
