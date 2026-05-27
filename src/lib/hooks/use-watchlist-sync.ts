"use client";

import { useEffect } from "react";
import type { AuthChangeEvent } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useWatchlistStore } from "@/lib/stores/watchlist-store";

/**
 * Mount this hook once (in a top-level client component like the Header).
 * On sign-in, it fetches the server-side watchlist and merges it into the
 * Zustand store — so entries saved on another device appear immediately.
 */
export function useWatchlistSync() {
  const setWatched = useWatchlistStore((s) => s.setWatched);

  useEffect(() => {
    const sb = getSupabaseBrowser();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (event: AuthChangeEvent) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        try {
          const res = await fetch("/api/watchlist");
          if (!res.ok) return;
          const body = (await res.json()) as { watchlist: { iso: string; name: string }[] };
          if (body.watchlist.length > 0) {
            setWatched(body.watchlist);
          }
        } catch {
          // Network failure — silently ignore; localStorage copy is still intact
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [setWatched]);
}
