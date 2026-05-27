import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface WatchedEntry {
  iso: string;
  name: string;
}

interface WatchlistState {
  watched: WatchedEntry[];
  toggleWatch: (iso: string, name: string) => void;
  isWatched: (iso: string) => boolean;
  /** Replace the watched list — used when syncing from the server after sign-in. */
  setWatched: (entries: WatchedEntry[]) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watched: [],

      toggleWatch: (iso: string, name: string) =>
        set((state) => ({
          watched: state.watched.some((w) => w.iso === iso)
            ? state.watched.filter((w) => w.iso !== iso)
            : [...state.watched, { iso, name }],
        })),

      isWatched: (iso: string) => get().watched.some((w) => w.iso === iso),

      setWatched: (entries: WatchedEntry[]) =>
        set(() => ({
          watched: entries,
        })),
    }),
    {
      name: "limelight-watchlist",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // v1 stored `watched: string[]`; v2 stores `watched: WatchedEntry[]`.
      migrate: (persistedState: unknown, version: number) => {
        if (version < 2 && persistedState && typeof persistedState === "object") {
          const old = persistedState as { watched?: unknown };
          const oldList = Array.isArray(old.watched) ? old.watched : [];
          const watched: WatchedEntry[] = oldList
            .filter((x): x is string => typeof x === "string")
            .map((iso) => ({ iso, name: iso }));
          return { watched } as Partial<WatchlistState>;
        }
        return persistedState as Partial<WatchlistState>;
      },
    }
  )
);
