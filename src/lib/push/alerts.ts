import webpush from "web-push";
import { supabase } from "@/lib/supabase";
import { countryName } from "@/lib/utils/countries";

// ─── Intensity alert dispatch ─────────────────────────────────────────────────
// Called at the end of each scoring run. For every push subscription, checks
// whether any watched country's fresh score crosses the subscriber's threshold
// and fires one web-push notification (6h cooldown per subscription).
// Failures are non-fatal: ingestion must never break because a push endpoint
// went stale.

const COOLDOWN_MS = 6 * 3_600_000;
const MAX_SUBSCRIPTIONS = 200; // bounded for Vercel Hobby's 10s wall

interface SubscriptionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  watched_isos: string[];
  threshold: number;
  last_notified_at: string | null;
}

export async function dispatchIntensityAlerts(
  scores: Record<string, number>,
  errors: string[]
): Promise<number> {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return 0; // push not configured — silent no-op

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:alerts@limelight.news",
    publicKey,
    privateKey
  );

  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth, watched_isos, threshold, last_notified_at")
    .limit(MAX_SUBSCRIPTIONS);

  if (error) {
    // Table missing → migration not run yet; anything else is worth surfacing
    if (!/does not exist|could not find the table/i.test(error.message)) {
      errors.push(`Push fetch: ${error.message}`);
    }
    return 0;
  }

  const now = Date.now();
  let sent = 0;

  const jobs = ((data ?? []) as SubscriptionRow[]).map(async (sub) => {
    if (sub.last_notified_at && now - new Date(sub.last_notified_at).getTime() < COOLDOWN_MS) {
      return;
    }

    // Highest-scoring watched country at/above this subscriber's threshold
    const hits = sub.watched_isos
      .map((iso) => ({ iso, score: Math.round(scores[iso] ?? 0) }))
      .filter((h) => h.score >= sub.threshold)
      .sort((a, b) => b.score - a.score);

    if (hits.length === 0) return;
    const top = hits[0];
    const name = countryName(top.iso) || top.iso;
    const others = hits.length - 1;

    const payload = JSON.stringify({
      title: `${name} is in the limelight`,
      body:
        `Coverage intensity hit ${top.score}` +
        (others > 0 ? ` (+${others} more watched ${others === 1 ? "country" : "countries"})` : ""),
      url: `/country/${top.iso}`,
      tag: "limelight-intensity",
    });

    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 3600 }
      );
      sent++;
      await supabase
        .from("push_subscriptions")
        .update({ last_notified_at: new Date().toISOString() })
        .eq("id", sub.id);
    } catch (err) {
      // 404/410 = endpoint gone (browser unsubscribed) → prune the row
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase.from("push_subscriptions").delete().eq("id", sub.id);
      }
    }
  });

  await Promise.allSettled(jobs);
  return sent;
}
