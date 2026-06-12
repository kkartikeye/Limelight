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
  /** Outlet domain (e.g. "reuters.com") for favicon display; absent on mock data */
  domain?: string;
  /** 1–2 sentence standfirst/snippet, when the source provides one */
  summary?: string;
  credibilityTier: CredibilityTier;
  category: ArticleCategory;
  publishedAt: string; // ISO string
  url: string;
}
