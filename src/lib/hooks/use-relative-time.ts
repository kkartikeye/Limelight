"use client";
import { useEffect, useRef, useState } from "react";
import { relativeTime } from "@/lib/utils/time";

/**
 * Returns a live-updating relative time string for `iso`.
 * Re-evaluates every 60 seconds so "3m ago" stays accurate on long sessions.
 *
 * Example: useRelativeTime(article.publishedAt) → "12m ago"
 */
export function useRelativeTime(iso: string): string {
  // Keep a ref so the interval always reads the latest iso even if it changes.
  const isoRef = useRef(iso);
  isoRef.current = iso;

  const [text, setText] = useState(() => relativeTime(iso));

  useEffect(() => {
    // Sync immediately when iso changes (e.g. new article loaded).
    setText(relativeTime(isoRef.current));
    const id = setInterval(
      () => setText(relativeTime(isoRef.current)),
      60_000
    );
    return () => clearInterval(id);
  }, [iso]);

  return text;
}
