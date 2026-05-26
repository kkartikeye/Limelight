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
        paper:      "#f6f3ec",
        "paper-2":  "#efeadf",
        card:       "#ffffff",
        ink:        "#181613",
        "ink-2":    "#3a3025",
        dim:        "#7a7568",
        "dim-2":    "#aaa492",
        coral:      "#e0573c",
        "coral-50": "#fff0ea",
        "coral-bd": "#fac7b8",
        live:       "#2a8a5e",
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
