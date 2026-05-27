"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import { useUser } from "@/lib/hooks/use-user";

const fetcher = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json() as Promise<{ ids: string[] }>;
  });

/** Matches Supabase UUID format — used to skip logging for mock article IDs. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function useReads(): {
  readIds: Set<string>;
  logRead: (articleId: string) => void;
} {
  const { user } = useUser();

  // Only fetch when the user is signed in
  const key = user ? `/api/reads` : null;

  const { data, mutate } = useSWR(key, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  const readIds = useMemo(
    () => new Set<string>(Array.from(data?.ids ?? [])),
    [data]
  );

  const logRead = useCallback(
    (articleId: string) => {
      // Only log real Supabase UUIDs for signed-in users
      if (!user || !UUID_RE.test(articleId)) return;

      // Optimistic update — deduplicate with Array.from instead of spread into Set
      void mutate(
        (prev) => {
          const merged = Array.from(new Set([...(prev?.ids ?? []), articleId]));
          return { ids: merged };
        },
        { revalidate: false }
      );

      // Fire-and-forget to the server
      void fetch("/api/reads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
    },
    [user, mutate]
  );

  return { readIds, logRead };
}
