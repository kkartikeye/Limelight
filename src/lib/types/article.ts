export type CredibilityTier = "high" | "medium" | "low";
export type ArticleCategory =
  | "Conflict"
  | "Politics"
  | "Economics"
  | "Technology"
  | "Humanitarian"
  | "Environment"
  | "Sports"
  | "Entertainment";

export interface Article {
  id: string;
  headline: string;
  source: string;
  credibilityTier: CredibilityTier;
  category: ArticleCategory;
  publishedAt: string; // ISO string
  url: string;
}
