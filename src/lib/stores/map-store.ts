import { create } from "zustand";

export type TimeWindow = "1h" | "6h" | "24h" | "7d" | "30d";

export type Category =
  | "Conflict"
  | "Politics"
  | "Economics"
  | "Technology"
  | "Humanitarian"
  | "Environment"
  | "Sports"
  | "Entertainment";

export const ALL_CATEGORIES: Category[] = [
  "Conflict",
  "Politics",
  "Economics",
  "Technology",
  "Humanitarian",
  "Environment",
  "Sports",
  "Entertainment",
];

interface Filters {
  timeWindow: TimeWindow;
  categories: Category[];
}

interface MapState {
  // Selection
  selectedCountry: string | null;
  selectedCountryName: string;
  selectedCountryScore: number;
  isPanelOpen: boolean;

  // Hover
  hoverCountry: string | null;

  // Filters
  filters: Filters;

  // Stars
  showStars: boolean;

  // Actions
  selectCountry: (code: string, name: string, score: number) => void;
  clearSelection: () => void;
  setHover: (code: string | null) => void;
  setTimeWindow: (tw: TimeWindow) => void;
  toggleCategory: (cat: Category) => void;
  toggleStars: () => void;
}

export const useMapStore = create<MapState>()((set) => ({
  selectedCountry: null,
  selectedCountryName: "",
  selectedCountryScore: 0,
  isPanelOpen: false,

  hoverCountry: null,

  filters: {
    timeWindow: "24h",
    categories: [...ALL_CATEGORIES],
  },

  showStars: true,

  selectCountry: (code, name, score) =>
    set({ selectedCountry: code, selectedCountryName: name, selectedCountryScore: score, isPanelOpen: true }),

  clearSelection: () =>
    set({ selectedCountry: null, selectedCountryName: "", selectedCountryScore: 0, isPanelOpen: false }),

  setHover: (code) => set({ hoverCountry: code }),

  setTimeWindow: (tw) =>
    set((s) => ({ filters: { ...s.filters, timeWindow: tw } })),

  toggleCategory: (cat) =>
    set((s) => {
      const active = s.filters.categories;
      const next = active.includes(cat)
        ? active.filter((c) => c !== cat)
        : [...active, cat];
      return { filters: { ...s.filters, categories: next } };
    }),

  toggleStars: () => set((s) => ({ showStars: !s.showStars })),
}));
