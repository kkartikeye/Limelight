export type TopCategory =
  | "Conflict"
  | "Politics"
  | "Economics"
  | "Technology"
  | "Humanitarian"
  | "Environment"
  | "Sports"
  | "Entertainment";

export interface CountryScore {
  code: string;
  name: string;
  score: number;
  articleCount: number;
  topCategory: TopCategory;
}
