// ─── The Guardian Content API ─────────────────────────────────────────────────
// Free secondary source alongside GDELT. Provides trailText (a 1–2 sentence
// standfirst) which we store as the article snippet — GDELT gives titles only.
// The public "test" key works for development; set GUARDIAN_API_KEY in prod.

export interface NormalisedArticle {
  url: string;
  title: string;
  /** ISO timestamp or GDELT seendate — both accepted downstream */
  seendate: string;
  domain: string;
  /** Optional 1–2 sentence standfirst (Guardian only) */
  snippet?: string;
}

interface GuardianItem {
  webUrl: string;
  webTitle: string;
  webPublicationDate: string;
  fields?: { trailText?: string };
}

interface GuardianResponse {
  response?: { status: string; results?: GuardianItem[] };
}

const GUARDIAN_BASE = "https://content.guardianapis.com/search";

/** Strip the HTML tags Guardian embeds in trailText. */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export async function fetchGuardian(timeoutMs: number, pageSize = 30): Promise<NormalisedArticle[]> {
  const params = new URLSearchParams({
    "order-by": "newest",
    "page-size": String(pageSize),
    "show-fields": "trailText",
    "api-key": process.env.GUARDIAN_API_KEY ?? "test",
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${GUARDIAN_BASE}?${params}`, { signal: controller.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as GuardianResponse;
    if (data.response?.status !== "ok") return [];
    return (data.response.results ?? []).map((r) => ({
      url: r.webUrl,
      title: r.webTitle,
      seendate: r.webPublicationDate,
      domain: "theguardian.com",
      ...(r.fields?.trailText && { snippet: stripHtml(r.fields.trailText).slice(0, 500) }),
    }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
