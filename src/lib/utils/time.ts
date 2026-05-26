/**
 * Shared time-formatting utilities.
 * Import from here instead of copy-pasting inline.
 */

/**
 * Convert an ISO date string to a human-readable relative time.
 * Examples: "< 1h ago", "3h ago", "2d ago"
 */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/**
 * Convert a Date object to a human-readable relative time.
 * Examples: "just now", "1 min ago", "3 hrs ago"
 */
export function relativeTimeSince(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? "1 hr ago" : `${hrs} hrs ago`;
}
