import type { Article, CredibilityTier } from "@/lib/types/article";

const TIER_COLOR: Record<CredibilityTier, string> = {
  high:   "bg-emerald-400",
  medium: "bg-yellow-400",
  low:    "bg-red-400",
};

const TIER_LABEL: Record<CredibilityTier, string> = {
  high:   "High credibility",
  medium: "Medium credibility",
  low:    "Low credibility",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <div className="flex flex-col gap-1.5 border-b border-white/10 py-3 last:border-0">
      <a
        href={article.url}
        target="_blank"
        rel="noopener noreferrer"
        className="line-clamp-2 text-sm font-medium leading-snug text-white hover:text-blue-300 transition-colors"
      >
        {article.headline}
      </a>
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span
          className={`h-2 w-2 flex-shrink-0 rounded-full ${TIER_COLOR[article.credibilityTier]}`}
          title={TIER_LABEL[article.credibilityTier]}
        />
        <span className="font-medium text-gray-300">{article.source}</span>
        <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
          {article.category}
        </span>
        <span className="ml-auto flex-shrink-0">{relativeTime(article.publishedAt)}</span>
      </div>
    </div>
  );
}
