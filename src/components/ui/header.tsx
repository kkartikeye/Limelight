"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DLLogo from "./dl-logo";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";
import { DL } from "@/lib/design-tokens";
import { useUser } from "@/lib/hooks/use-user";
import { useWatchlistSync } from "@/lib/hooks/use-watchlist-sync";
import { ThemeToggleIcon } from "@/components/ui/theme-toggle";
import AuthModal from "./auth-modal";

const NAV_ITEMS = ["Today", "Regions", "Topics", "Saved"] as const;
type NavItem = (typeof NAV_ITEMS)[number];

interface HeaderProps {
  active?: NavItem;
}

function LiveClock() {
  const now = new Date();
  const day  = now.toLocaleDateString("en-GB", { weekday: "short" });
  const time = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  return (
    <span className="font-plex text-[11px] tracking-[0.10em] text-dim">
      {day} · {time} GMT
    </span>
  );
}

export default function Header({ active = "Today" }: HeaderProps) {
  const router  = useRouter();
  const { watched } = useWatchlistStore();
  const { user, signOut } = useUser();
  const [authOpen, setAuthOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Sync server watchlist into the Zustand store on sign-in
  useWatchlistSync();

  // Desktop inline search popover state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
    // Defer focus so the input is visible first
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setSearchInput("");
  }, []);

  const submitSearch = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = searchInput.trim();
      if (q.length >= 2) {
        router.push(`/search?q=${encodeURIComponent(q)}`);
        closeSearch();
      }
    },
    [searchInput, router, closeSearch]
  );

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") closeSearch();
    if (e.key === "Enter") submitSearch();
  };

  return (
    <header
      className="flex items-center justify-between shrink-0 header-root"
      style={{
        padding: "20px 44px 16px",
        borderBottom: `1px solid ${DL.RULE_2}`,
        background: DL.PAPER,
        height: 76,
        position: "relative",
        zIndex: 30,
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

      {/* Desktop: nav + search + clock + sign-in */}
      <div className="header-nav flex items-center gap-8">

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
                  color: isActive ? DL.INK : DL.DIM,
                  paddingBottom: 2,
                }}
              >
                {item}
                {badge && (
                  <span className="ml-1 font-plex text-coral" style={{ fontSize: 10, fontWeight: 600 }}>
                    {badge}
                  </span>
                )}
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
        <div style={{ width: 1, height: 16, background: DL.RULE }} />

        {/* Desktop search — inline popover */}
        <div style={{ position: "relative" }}>
          {searchOpen ? (
            <form
              onSubmit={submitSearch}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: DL.CARD,
                border: `1.5px solid ${DL.CORAL}`,
                borderRadius: 10,
                padding: "5px 10px",
                animation: "tooltip-fade-in 0.15s ease-out both",
              }}
            >
              <svg width="13" height="13" viewBox="0 0 22 22" fill="none" stroke={DL.DIM} strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
                <circle cx="9.5" cy="9.5" r="6" /><line x1="14.5" y1="14.5" x2="20" y2="20" />
              </svg>
              <input
                ref={inputRef}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search articles…"
                style={{
                  border: "none", outline: "none",
                  background: "transparent",
                  fontFamily: DL.SANS, fontSize: 13, color: DL.INK,
                  width: 180,
                }}
              />
              <button
                type="button"
                onClick={closeSearch}
                style={{ background: "none", border: "none", cursor: "pointer", color: DL.DIM, padding: 0, lineHeight: 1 }}
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            </form>
          ) : (
            <button
              onClick={openSearch}
              title="Search articles"
              style={{
                display: "flex", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer",
                color: DL.DIM, padding: "4px 6px",
                fontFamily: DL.SANS, fontSize: 12, fontWeight: 500,
                borderRadius: 8, transition: "color 0.12s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = DL.INK)}
              onMouseLeave={(e) => (e.currentTarget.style.color = DL.DIM)}
            >
              <svg width="14" height="14" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <circle cx="9.5" cy="9.5" r="6" /><line x1="14.5" y1="14.5" x2="20" y2="20" />
              </svg>
              Search
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 16, background: DL.RULE }} />

        {/* Clock */}
        <span className="header-clock"><LiveClock /></span>

        {/* Theme toggle */}
        <ThemeToggleIcon />

        {/* Auth button */}
        {user ? (
          /* Avatar / user menu */
          <div style={{ position: "relative" }}>
            <button
              className="header-signin font-body"
              onClick={() => setUserMenuOpen((v) => !v)}
              title={user.email ?? "Account"}
              style={{
                width: 32, height: 32,
                background: DL.CORAL, color: "#fff",
                border: "none", borderRadius: 999,
                fontSize: 12, fontWeight: 700,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                letterSpacing: 0.02, flexShrink: 0,
              }}
            >
              {(user.email ?? "U").slice(0, 2).toUpperCase()}
            </button>
            {userMenuOpen && (
              <div
                style={{
                  position: "absolute", top: "calc(100% + 10px)", right: 0,
                  background: DL.CARD, borderRadius: 14,
                  boxShadow: "0 8px 32px rgba(24,22,19,0.14)",
                  border: `1px solid ${DL.RULE_2}`,
                  padding: "6px 0", minWidth: 180,
                  fontFamily: DL.SANS, zIndex: 50,
                  animation: "tooltip-fade-in 0.15s ease-out both",
                }}
              >
                <div style={{ padding: "8px 16px 10px", borderBottom: `1px solid ${DL.RULE_2}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: DL.INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={async () => { await signOut(); setUserMenuOpen(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "9px 16px", background: "none", border: "none",
                    fontSize: 13, color: DL.DIM, cursor: "pointer", fontFamily: DL.SANS,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = DL.PAPER; e.currentTarget.style.color = DL.INK; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = DL.DIM; }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            className="header-signin font-body"
            onClick={() => setAuthOpen(true)}
            style={{
              background: DL.INK, color: DL.PAPER,
              border: "none", borderRadius: 999,
              padding: "8px 16px", fontSize: 12, fontWeight: 600,
              letterSpacing: 0.02, cursor: "pointer",
            }}
          >
            Sign in
          </button>
        )}
      </div>
      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} />}

      {/* Mobile: theme + search + auth */}
      <div className="mobile-only" style={{ alignItems: "center", gap: 8 }}>
        <ThemeToggleIcon size={17} />
        <button
          aria-label="Search"
          onClick={() => router.push("/search")}
          style={{ background: "none", border: "none", cursor: "pointer", color: DL.DIM, padding: 4, display: "flex" }}
        >
          <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <circle cx="9.5" cy="9.5" r="6" /><line x1="14.5" y1="14.5" x2="20" y2="20" />
          </svg>
        </button>

        {user ? (
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              title={user.email ?? "Account"}
              style={{
                width: 30, height: 30, borderRadius: 999,
                background: DL.CORAL, color: "#fff",
                border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 700, fontFamily: DL.SANS,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {(user.email ?? "U").slice(0, 2).toUpperCase()}
            </button>
            {userMenuOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                background: DL.CARD, borderRadius: 14,
                boxShadow: "0 8px 32px rgba(24,22,19,0.14)",
                border: `1px solid ${DL.RULE_2}`,
                padding: "6px 0", minWidth: 180,
                fontFamily: DL.SANS, zIndex: 50,
                animation: "tooltip-fade-in 0.15s ease-out both",
              }}>
                <div style={{ padding: "8px 16px 10px", borderBottom: `1px solid ${DL.RULE_2}` }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: DL.INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={async () => { await signOut(); setUserMenuOpen(false); }}
                  style={{
                    display: "block", width: "100%", textAlign: "left",
                    padding: "9px 16px", background: "none", border: "none",
                    fontSize: 13, color: DL.DIM, cursor: "pointer", fontFamily: DL.SANS,
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            style={{
              background: DL.INK, color: DL.PAPER,
              border: "none", borderRadius: 999,
              padding: "6px 12px", fontSize: 11, fontWeight: 600,
              letterSpacing: 0.02, cursor: "pointer", fontFamily: DL.SANS,
            }}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}
