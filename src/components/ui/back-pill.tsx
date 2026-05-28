"use client";
import Link from "next/link";
import { DL } from "@/lib/design-tokens";

interface BackPillProps {
  href: string;
  label: string;
}

/**
 * Floating back-navigation pill — visible only on mobile (≤ 767 px), fixed
 * above the bottom tab bar. Shared across country, article, and region pages.
 */
export default function BackPill({ href, label }: BackPillProps) {
  return (
    <div className="mobile-back-pill">
      <Link
        href={href}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "11px 18px",
          borderRadius: 999,
          background: DL.INK,
          color: DL.PAPER,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 600,
          boxShadow: "0 4px 20px rgba(24,22,19,0.22)",
          fontFamily: DL.SANS,
        }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="8,3 4,7 8,11" />
          <line x1="4" y1="7" x2="12" y2="7" />
        </svg>
        {label}
      </Link>
    </div>
  );
}
