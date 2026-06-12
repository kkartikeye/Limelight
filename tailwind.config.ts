import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Daylight font stacks ───────────────────────────────────────────────
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body:    ["var(--font-body)", "system-ui", "sans-serif"],
        plex:    ["var(--font-plex)", "ui-monospace", "monospace"],
      },

      // ── Daylight color palette ─────────────────────────────────────────────
      colors: {
        paper:      "var(--dl-paper)",
        "paper-2":  "var(--dl-paper-2)",
        card:       "var(--dl-card)",
        ink:        "var(--dl-ink)",
        "ink-2":    "var(--dl-ink-2)",
        dim:        "var(--dl-dim)",
        "dim-2":    "var(--dl-dim-2)",
        coral:      "var(--dl-coral)",
        "coral-50": "var(--dl-coral-50)",
        "coral-bd": "var(--dl-coral-bd)",
        live:       "var(--dl-live)",
      },

      // ── Box shadows ────────────────────────────────────────────────────────
      boxShadow: {
        card: "0 10px 30px rgba(24,22,19,0.10), 0 2px 6px rgba(24,22,19,0.04)",
        tooltip: "0 20px 40px rgba(24,22,19,0.15)",
        panel: "0 30px 60px rgba(24,22,19,0.08)",
      },

      // ── Border radii ───────────────────────────────────────────────────────
      borderRadius: {
        pill: "999px",
      },
    },
  },
  plugins: [],
};

export default config;
