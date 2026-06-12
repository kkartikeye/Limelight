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

export interface ViewState {
  longitude: number;
  latitude: number;
  zoom: number;
}

const DEFAULT_VIEW_STATE: ViewState = { longitude: 10, latitude: 20, zoom: 1.5 };

interface MapState {
  // Selection
  selectedCountry: string | null;
  selectedCountryName: string;
  selectedCountryScore: number;
  isPanelOpen: boolean;

  // Filters
  filters: Filters;

  // Globe camera position — persisted in memory so returning to "/" restores the last view
  viewState: ViewState;

  // Actions
  selectCountry: (code: string, name: string, score: number) => void;
  clearSelection: () => void;
  setTimeWindow: (tw: TimeWindow) => void;
  toggleCategory: (cat: Category) => void;
  resetCategories: () => void;
  setCategories: (cats: Category[]) => void;
  setViewState: (vs: ViewState) => void;
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


  viewState: DEFAULT_VIEW_STATE,

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

  resetCategories: () =>
    set((s) => ({ filters: { ...s.filters, categories: [...ALL_CATEGORIES] } })),

  setCategories: (cats) =>
    set((s) => ({ filters: { ...s.filters, categories: cats } })),

  setViewState: (vs) => set({ viewState: vs }),
}));
