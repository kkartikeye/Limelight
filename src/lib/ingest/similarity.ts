// ─── Fuzzy title similarity for reprint detection ─────────────────────────────
// Ten outlets running the same AP wire story produce titles that differ only in
// punctuation, attribution suffixes, or a word or two. Exact-hash dedup misses
// those; token-set Jaccard catches them without any external service.

const STOPWORDS = new Set([
  "a", "an", "the", "in", "on", "at", "to", "of", "and", "or", "for", "with",
  "as", "by", "is", "are", "was", "were", "be", "been", "after", "over", "amid",
  "says", "say", "said", "report", "reports", "news", "live", "update", "updates",
]);

/** Normalised content tokens of a headline (lowercased, stopwords stripped). */
export function titleTokens(title: string): Set<string> {
  const tokens = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
  return new Set(tokens);
}

/** Jaccard similarity of two token sets: |A∩B| / |A∪B|, in [0, 1]. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const t of Array.from(a)) if (b.has(t)) intersection++;
  return intersection / (a.size + b.size - intersection);
}

/** Reprint threshold: titles this similar are treated as the same story. */
export const REPRINT_THRESHOLD = 0.7;

/**
 * Filter `candidates` down to titles that are NOT near-duplicates of any title
 * in `existing` or of an earlier candidate in the same batch.
 * Returns indices of the kept candidates.
 */
export function dedupeByTitle(candidates: string[], existing: string[]): number[] {
  const existingTokens = existing.map(titleTokens);
  const keptTokens: Set<string>[] = [];
  const keptIdx: number[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const tokens = titleTokens(candidates[i]);
    const isReprint =
      existingTokens.some((e) => jaccard(tokens, e) >= REPRINT_THRESHOLD) ||
      keptTokens.some((k) => jaccard(tokens, k) >= REPRINT_THRESHOLD);
    if (!isReprint) {
      keptTokens.push(tokens);
      keptIdx.push(i);
    }
  }
  return keptIdx;
}
