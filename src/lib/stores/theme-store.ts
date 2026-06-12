"use client";

import { create } from "zustand";

// ─── Theme store — Daylight / Midnight ────────────────────────────────────────
// The palette itself lives in globals.css as CSS variables; this store only
// flips the data-theme attribute on <html> and persists the choice.
// layout.tsx runs an inline script before hydration so there's no flash.

export type Theme = "daylight" | "midnight";

const STORAGE_KEY = "ll:theme";

function readInitial(): Theme {
  if (typeof window === "undefined") return "daylight";
  const t: Theme = localStorage.getItem(STORAGE_KEY) === "midnight" ? "midnight" : "daylight";
  // Re-apply on store init — covers client-side navigations and acts as a
  // fallback if the pre-hydration script in layout.tsx didn't run
  applyTheme(t);
  return t;
}

function applyTheme(t: Theme) {
  if (typeof document === "undefined") return;
  if (t === "midnight") {
    document.documentElement.setAttribute("data-theme", "midnight");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: readInitial(),
  toggleTheme: () => {
    const next: Theme = get().theme === "midnight" ? "daylight" : "midnight";
    applyTheme(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* private mode */ }
    set({ theme: next });
  },
}));
