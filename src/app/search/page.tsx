"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import Header from "@/components/ui/header";
import { Skeleton } from "@/components/ui/skeleton";
import { DL } from "@/lib/design-tokens";
import { relativeTime } from "@/lib/utils/time";
import { countryName } from "@/lib/utils/countries";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  headline: string;
  url: string;
  publishedAt: string;
  category: string;
  source: string;
  domain: string;
  credibilityTier: string;
  countryCode: string | null;
}

interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

interface TrendingResponse {
  trending: { query: string; count: number }[];
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ─── Sub-components ───────────────────────────────────────────────────────────

function SearchResultRow({ result }: { result: SearchResult }) {
  const params = new URLSearchParams({
    h: result.headline,
    s: result.source,
    u: result.url,
    c: result.category,
    t: result.publishedAt,
    ...(result.countryCode ? { cc: result.countryCode } : {}),
  });

  return (
    <div style={{
      padding: "11px 0",
      borderBottom: `1px solid ${DL.RULE_2}`,
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/article/${result.id}?${params}`}
          style={{
            display: "block",
            fontFamily: DL.SANS,
            fontSize: 13.5,
            lineHeight: 1.32,
            color: DL.INK,
            fontWeight: 500,
            textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
          onMouseLeave={(e) => (e.currentTarget.style.color = DL.INK)}
        >
          {result.headline}
        </Link>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
          marginTop: 5, fontSize: 11, color: DL.DIM, fontFamily: DL.SANS,
        }}>
          <span style={{ fontWeight: 600, color: DL.INK_2 }}>{result.source}</span>
          <span>·</span>
          <span style={{ color: DL.CORAL, fontWeight: 600 }}>{result.category}</span>
          <span style={{ marginLeft: "auto", fontFamily: DL.MONO, fontSize: 10 }}>
            {relativeTime(result.publishedAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

function CountryGroup({ countryCode, results }: { countryCode: string; results: SearchResult[] }) {
  const name = countryCode === "__unknown__" ? "Unknown origin" : countryName(countryCode);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
        <Link
          href={countryCode !== "__unknown__"
            ? `/country/${countryCode}?name=${encodeURIComponent(name)}`
            : "#"}
          style={{
            fontFamily: DL.DISPLAY, fontSize: 20, fontWeight: 500,
            letterSpacing: -0.4, color: DL.INK, textDecoration: "none",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
          onMouseLeave={(e) => (e.currentTarget.style.color = DL.INK)}
        >
          {name}
        </Link>
        <span style={{ flex: 1, height: 1, background: DL.RULE_2 }} />
        <span style={{
          fontFamily: DL.MONO, fontSize: 10, color: DL.DIM,
          background: DL.PAPER_2, padding: "2px 8px", borderRadius: 999,
        }}>
          {results.length} {results.length === 1 ? "article" : "articles"}
        </span>
      </div>
      {results.map((r) => <SearchResultRow key={r.id} result={r} />)}
    </div>
  );
}

// ─── Inner content — uses useSearchParams, must be inside <Suspense> ──────────

function SearchContent() {
  const searchParamsHook = useSearchParams();
  const router = useRouter();
  const q = searchParamsHook.get("q") ?? "";

  const [input, setInput] = useState(q);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setInput(q); }, [q]);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = input.trim();
      if (trimmed.length >= 2) {
        router.push(`/search?q=${encodeURIComponent(trimmed)}`);
      }
    },
    [input, router]
  );

  const { data: searchData, isLoading } = useSWR<SearchResponse>(
    q.length >= 2 ? `/api/search?q=${encodeURIComponent(q)}&limit=30` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 10_000 }
  );

  const { data: trendingData } = useSWR<TrendingResponse>(
    "/api/search/trending",
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );

  const grouped = useMemo(() => {
    if (!searchData?.results) return [];
    const map = new Map<string, SearchResult[]>();
    for (const r of searchData.results) {
      const key = r.countryCode ?? "__unknown__";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries())
      .map(([code, results]) => ({ countryCode: code, results }))
      .sort((a, b) => b.results.length - a.results.length);
  }, [searchData]);

  const hasQuery = q.length >= 2;
  const noResults = hasQuery && !isLoading && (searchData?.total ?? 0) === 0;

  return (
    <>
      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: "20px 44px 0",
        borderBottom: `1px solid ${DL.RULE}`,
        background: DL.PAPER,
        flexShrink: 0,
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, alignItems: "center", maxWidth: 700 }}>
          <div
            style={{
              flex: 1, display: "flex", alignItems: "center", gap: 10,
              background: DL.CARD, border: `1.5px solid ${DL.RULE}`,
              borderRadius: 12, padding: "10px 16px", transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = DL.CORAL)}
            onBlur={(e) => (e.currentTarget.style.borderColor = DL.RULE)}
          >
            <svg width="15" height="15" viewBox="0 0 22 22" fill="none" stroke={DL.DIM} strokeWidth="1.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="9.5" cy="9.5" r="6" /><line x1="14.5" y1="14.5" x2="20" y2="20" />
            </svg>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Search topics, countries, events…"
              style={{
                flex: 1, border: "none", outline: "none",
                background: "transparent",
                fontFamily: DL.SANS, fontSize: 14, color: DL.INK,
              }}
            />
            {input && (
              <button
                type="button"
                onClick={() => { setInput(""); inputRef.current?.focus(); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: DL.DIM, padding: 0, lineHeight: 1 }}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={input.trim().length < 2}
            style={{
              padding: "10px 20px", borderRadius: 10,
              background: input.trim().length >= 2 ? DL.INK : DL.RULE,
              color: input.trim().length >= 2 ? DL.PAPER : DL.DIM,
              border: "none", cursor: input.trim().length >= 2 ? "pointer" : "default",
              fontFamily: DL.SANS, fontSize: 13, fontWeight: 600,
              transition: "all 0.15s", flexShrink: 0,
            }}
          >
            Search
          </button>
        </form>

        <div style={{
          paddingTop: 10, paddingBottom: 12,
          fontFamily: DL.MONO, fontSize: 10, color: DL.DIM, letterSpacing: 0.08,
        }}>
          {hasQuery && !isLoading && searchData
            ? `${searchData.total} result${searchData.total !== 1 ? "s" : ""} for "${searchData.query}"`
            : hasQuery && isLoading
            ? "Searching…"
            : "Type to search across all articles"}
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 44px 48px" }}>

          {/* Loading */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} style={{ padding: "11px 0", borderBottom: `1px solid ${DL.RULE_2}` }}>
                  <Skeleton width={`${72 + (i % 3) * 8}%`} height={14} style={{ marginBottom: 7 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Skeleton width={60} height={10} />
                    <Skeleton width={40} height={10} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results grouped by country */}
          {!isLoading && grouped.length > 0 && (
            <div>
              {grouped.map(({ countryCode, results }) => (
                <CountryGroup key={countryCode} countryCode={countryCode} results={results} />
              ))}
            </div>
          )}

          {/* No results */}
          {noResults && (
            <div style={{ paddingTop: 60, textAlign: "center" }}>
              <div style={{
                fontFamily: DL.DISPLAY, fontSize: 42, fontWeight: 400,
                letterSpacing: -1, color: DL.INK, lineHeight: 1,
              }}>
                No results
              </div>
              <p style={{ fontSize: 13, color: DL.DIM, marginTop: 12, lineHeight: 1.5 }}>
                No articles matched <strong>&ldquo;{q}&rdquo;</strong> in the selected time window.<br />
                Try a broader term or a different time range.
              </p>
            </div>
          )}

          {/* Empty state */}
          {!hasQuery && (
            <div>
              <div style={{ paddingTop: 48, paddingBottom: 32 }}>
                <div style={{
                  fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.18,
                  textTransform: "uppercase", color: DL.CORAL,
                  display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
                  Global news search
                </div>
                <div style={{
                  fontFamily: DL.DISPLAY, fontSize: 52, fontWeight: 400,
                  letterSpacing: -1.5, lineHeight: 0.93, color: DL.INK, maxWidth: 480,
                }}>
                  Find any story, anywhere.
                </div>
                <p style={{ fontSize: 13, color: DL.DIM, marginTop: 14, lineHeight: 1.55, maxWidth: 420 }}>
                  Search across all article titles. Results are grouped by country so you can see where a story is being covered most.
                </p>
              </div>

              {(trendingData?.trending?.length ?? 0) > 0 && (
                <div>
                  <div style={{
                    fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.14,
                    textTransform: "uppercase", color: DL.DIM, marginBottom: 12,
                  }}>
                    Trending this week
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {trendingData!.trending.map(({ query }) => (
                      <Link
                        key={query}
                        href={`/search?q=${encodeURIComponent(query)}`}
                        style={{
                          padding: "7px 14px", borderRadius: 999,
                          background: DL.CARD, color: DL.INK_2,
                          border: `1px solid ${DL.RULE_2}`,
                          textDecoration: "none", fontSize: 13, fontWeight: 500,
                          transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = DL.CORAL_BD;
                          e.currentTarget.style.color = DL.CORAL;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = DL.RULE_2;
                          e.currentTarget.style.color = DL.INK_2;
                        }}
                      >
                        {query}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 36 }}>
                <div style={{
                  fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.14,
                  textTransform: "uppercase", color: DL.DIM, marginBottom: 12,
                }}>
                  Try searching for
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["conflict", "climate", "elections", "diplomacy", "economy", "sanctions", "ceasefire", "trade"].map((term) => (
                    <button
                      key={term}
                      onClick={() => router.push(`/search?q=${encodeURIComponent(term)}`)}
                      style={{
                        padding: "7px 14px", borderRadius: 999,
                        background: "transparent", color: DL.DIM,
                        border: `1px solid ${DL.RULE}`,
                        cursor: "pointer", fontSize: 13, fontWeight: 500,
                        fontFamily: DL.SANS, transition: "all 0.12s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = DL.PAPER_2;
                        e.currentTarget.style.color = DL.INK;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = DL.DIM;
                      }}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Page shell — wraps SearchContent in Suspense (required for useSearchParams) ─

export default function SearchPage() {
  return (
    <div
      className="route-fade"
      style={{
        display: "flex", flexDirection: "column", height: "100vh",
        background: DL.PAPER, overflow: "hidden", fontFamily: DL.SANS,
      }}
    >
      <Header active="Today" />
      <Suspense fallback={
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={DL.DIM} strokeWidth="2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}
