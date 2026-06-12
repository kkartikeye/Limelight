"use client";

import Link from "next/link";
import { DL } from "@/lib/design-tokens";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="9" />
      <ellipse cx="11" cy="11" rx="4" ry="9" />
      <line x1="2" y1="11" x2="20" y2="11" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1,6 8,3 14,6 21,3 21,18 14,21 8,18 1,21" />
      <line x1="8" y1="3" x2="8" y2="18" />
      <line x1="14" y1="6" x2="14" y2="21" />
    </svg>
  );
}

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3h7l10 10-7 7L3 10z" />
      <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function StarIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 22 22"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor" strokeWidth={filled ? "0" : "1.4"}>
      <path d="M11 2l2.7 5.5L20 8.5l-4.5 4.4 1.1 6.3L11 16.3l-5.6 2.9 1.1-6.3L2 8.5l6.3-.9L11 2z" />
    </svg>
  );
}

interface BottomTabBarProps {
  active: "Today" | "Regions" | "Topics" | "Saved";
}

export default function BottomTabBar({ active }: BottomTabBarProps) {
  const { watched } = useWatchlistStore();
  const hasSaved = watched.length > 0;

  const tabs: Array<{ label: string; href: string; icon: React.ReactNode }> = [
    { label: "Today",   href: "/",         icon: <GlobeIcon /> },
    { label: "Regions", href: "/regions",  icon: <MapIcon /> },
    { label: "Topics",  href: "/topics",   icon: <TagIcon /> },
    { label: "Saved",   href: "/saved",    icon: <StarIcon filled={hasSaved} /> },
  ];

  return (
    <nav style={{
      display: "flex",
      alignItems: "stretch",
      borderTop: `1px solid ${DL.RULE}`,
      background: DL.GLASS,
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {tabs.map(({ label, href, icon }) => {
        const isActive = label === active;
        return (
          <Link
            key={label}
            href={href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              padding: "10px 0 8px",
              textDecoration: "none",
              color: isActive ? DL.CORAL : DL.DIM,
              fontFamily: DL.SANS,
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              letterSpacing: 0.04,
              transition: "color 0.15s",
            }}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
