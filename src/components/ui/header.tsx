"use client";

import Link from "next/link";
import DLLogo from "./dl-logo";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

const NAV_ITEMS = ["Today", "Regions", "Topics", "Saved"] as const;
type NavItem = (typeof NAV_ITEMS)[number];

interface HeaderProps {
  active?: NavItem;
}

function LiveClock() {
  // Static for SSR safety; hydrates on client
  const now = new Date();
  const day = now.toLocaleDateString("en-GB", { weekday: "short" });
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <span className="font-plex text-[11px] tracking-[0.10em] text-dim">
      {day} · {time} GMT
    </span>
  );
}

export default function Header({ active = "Today" }: HeaderProps) {
  const { watched } = useWatchlistStore();

  return (
    <header
      className="flex items-center justify-between shrink-0"
      style={{
        padding: "20px 44px 16px",
        borderBottom: "1px solid rgba(24,22,19,0.05)",
        background: "#f6f3ec",
        height: 76,
      }}
    >
      {/* Logo + wordmark */}
      <Link href="/" className="flex items-center gap-3 no-underline">
        <DLLogo size={22} />
        <span
          className="font-display text-ink"
          style={{ fontSize: 22, fontWeight: 500, letterSpacing: -0.4 }}
        >
          Limelight
        </span>
      </Link>

      {/* Nav + clock + sign-in */}
      <div className="flex items-center gap-8">
        {/* Nav items */}
        <nav className="flex items-center gap-8">
          {NAV_ITEMS.map((item) => {
            const isActive = item === active;
            const badge = item === "Saved" && watched.length > 0 ? watched.length : null;
            return (
              <Link
                key={item}
                href={item === "Today" ? "/" : `/${item.toLowerCase()}`}
                className="relative no-underline font-body"
                style={{
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "#181613" : "#7a7568",
                  paddingBottom: 2,
                }}
              >
                {item}
                {badge && (
                  <span
                    className="ml-1 font-plex text-coral"
                    style={{ fontSize: 10, fontWeight: 600 }}
                  >
                    {badge}
                  </span>
                )}
                {/* Active underline */}
                {isActive && (
                  <span
                    className="absolute left-0 right-0 bg-coral rounded-full"
                    style={{ bottom: -20, height: 2 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: "rgba(24,22,19,0.10)" }} />

        {/* Clock */}
        <LiveClock />

        {/* Sign in */}
        <button
          className="font-body"
          style={{
            background: "#181613",
            color: "#f6f3ec",
            border: "none",
            borderRadius: 999,
            padding: "8px 16px",
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.02,
            cursor: "pointer",
          }}
        >
          Sign in
        </button>
      </div>
    </header>
  );
}
