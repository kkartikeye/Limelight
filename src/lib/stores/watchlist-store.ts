import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface WatchlistState {
  watched: string[]; // ISO_A3 codes
  toggleWatch: (iso: string) => void;
  isWatched: (iso: string) => boolean;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      watched: [],

      toggleWatch: (iso: string) =>
        set((state) => ({
          watched: state.watched.includes(iso)
            ? state.watched.filter((c) => c !== iso)
            : [...state.watched, iso],
        })),

      isWatched: (iso: string) => get().watched.includes(iso),
    }),
    {
      name: "limelight-watchlist",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
