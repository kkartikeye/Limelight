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

export type Projection = "globe" | "naturalEarth";

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

  // Filters
  filters: Filters;

  // Projection (persisted to localStorage via mapEffect in MapView)
  projection: Projection;

  // Actions
  selectCountry: (code: string, name: string, score: number) => void;
  clearSelection: () => void;
  setTimeWindow: (tw: TimeWindow) => void;
  toggleCategory: (cat: Category) => void;
  setProjection: (p: Projection) => void;
}

export const useMapStore = create<MapState>()((set) => ({
  selectedCountry: null,
  selectedCountryName: "",
  selectedCountryScore: 0,
  isPanelOpen: false,

  filters: {
    timeWindow: "24h",
    categories: [...ALL_CATEGORIES],
  },

  projection: "globe",

  selectCountry: (code, name, score) =>
    set({ selectedCountry: code, selectedCountryName: name, selectedCountryScore: score, isPanelOpen: true }),

  clearSelection: () =>
    set({ selectedCountry: null, selectedCountryName: "", selectedCountryScore: 0, isPanelOpen: false }),

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

  setProjection: (p) => set({ projection: p }),
}));
