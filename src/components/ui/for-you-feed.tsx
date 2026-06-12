"use client";

// ─── For You feed ─────────────────────────────────────────────────────────────
// Personalised article list driven by /api/feed: watchlist countries weighted
// by credibility × recency. Signed-in users also get read-history exclusion
// (the API resolves both server-side); anonymous users send their local
// watchlist via ?isos=.

import { useMemo } from "react";
import Link from "next/link";
import useSWR from "swr";
import { DL } from "@/lib/design-tokens";
import { countryName } from "@/lib/utils/countries";
import { useRelativeTime } from "@/lib/hooks/use-relative-time";
import SourceFavicon from "@/components/ui/source-favicon";

interface FeedArticle {
  id: string;
  headline: string;
  url: string;
  publishedAt: string;
  category: string;
  source: string;
  domain: string;
  summary: string | null;
  countryCode: string;
}

interface FeedResponse {
  articles: FeedArticle[];
  personalised?: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function FeedRow({ article }: { article: FeedArticle }) {
  const timeAgo = useRelativeTime(article.publishedAt);
  const params = new URLSearchParams({
    h: article.headline,
    s: article.source,
    u: article.url,
    c: article.category,
    t: article.publishedAt,
    cc: article.countryCode,
  });

  return (
    <div style={{
      padding: "14px 0",
      borderBottom: `1px solid ${DL.RULE_2}`,
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <SourceFavicon domain={article.domain} name={article.source} size={18} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <Link
          href={`/article/${article.id}?${params}`}
          style={{
            display: "block", fontFamily: DL.SANS, fontSize: 14.5,
            lineHeight: 1.32, color: DL.INK, fontWeight: 500,
            textDecoration: "none", transition: "color 0.1s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = DL.CORAL)}
          onMouseLeave={(e) => (e.currentTarget.style.color = DL.INK)}
        >
          {article.headline}
        </Link>
        {article.summary && (
          <p style={{
            margin: "5px 0 0", fontSize: 12, color: DL.DIM, lineHeight: 1.45,
            fontFamily: DL.SANS,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {article.summary}
          </p>
        )}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginTop: 6,
          fontSize: 11, color: DL.DIM, fontFamily: DL.SANS,
        }}>
          <span style={{ fontWeight: 600, color: DL.INK_2 }}>{article.source}</span>
          <span>·</span>
          <Link
            href={`/country/${article.countryCode}`}
            style={{ color: DL.CORAL, fontWeight: 600, textDecoration: "none" }}
          >
            {countryName(article.countryCode) || article.countryCode}
          </Link>
          <span>·</span>
          <span>{article.category}</span>
          <span style={{ marginLeft: "auto", fontFamily: DL.MONO, fontSize: 10 }}>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

export default function ForYouFeed({ watchedIsos }: { watchedIsos: string[] }) {
  const key = useMemo(() => {
    if (watchedIsos.length === 0) return null;
    return `/api/feed?isos=${watchedIsos.join(",")}&limit=20`;
  }, [watchedIsos]);

  const { data, isLoading } = useSWR<FeedResponse>(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  if (!key) return null;
  const articles = data?.articles ?? [];

  return (
    <div style={{ maxWidth: 760, marginTop: 48 }}>
      <div style={{
        fontFamily: DL.MONO, fontSize: 10, letterSpacing: 0.16,
        textTransform: "uppercase", color: DL.CORAL, marginBottom: 6,
        display: "inline-flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: DL.CORAL, display: "inline-block" }} />
        For you
      </div>
      <h2 style={{
        fontFamily: DL.DISPLAY, fontSize: 30, fontWeight: 400,
        letterSpacing: -0.8, color: DL.INK, margin: "0 0 4px",
      }}>
        Latest from your countries
      </h2>
      <p style={{ fontSize: 12, color: DL.DIM, fontFamily: DL.SANS, margin: "0 0 8px" }}>
        Ranked by source credibility and recency
        {data?.personalised ? " — stories you’ve read are hidden." : "."}
      </p>

      {isLoading ? (
        <div style={{ padding: "20px 0", fontSize: 12, color: DL.DIM, fontFamily: DL.SANS }}>
          Loading your feed…
        </div>
      ) : articles.length === 0 ? (
        <div style={{ padding: "20px 0", fontSize: 12, color: DL.DIM, fontFamily: DL.SANS }}>
          No fresh coverage from your watchlist in the last 3 days.
        </div>
      ) : (
        articles.map((a) => <FeedRow key={a.id} article={a} />)
      )}
    </div>
  );
}
