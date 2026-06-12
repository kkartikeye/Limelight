"use client";

// ─── Push alert preferences ───────────────────────────────────────────────────
// Lives on /saved. Subscribes this browser to web-push alerts that fire when a
// watched country's coverage intensity crosses the chosen threshold (checked
// during each ingest run). Works signed-out — the watchlist snapshot travels
// with the subscription.

import { useCallback, useEffect, useState } from "react";
import { DL } from "@/lib/design-tokens";

const THRESHOLDS = [60, 70, 80, 90];

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  return Uint8Array.from(Array.from(raw, (c) => c.charCodeAt(0)));
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  // SwRegister only runs in production builds; register on demand otherwise
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) return existing;
  try { return await navigator.serviceWorker.register("/sw.js"); } catch { return null; }
}

export default function AlertSettings({ watchedIsos }: { watchedIsos: string[] }) {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(80);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reflect an existing subscription on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || !("PushManager" in window)) {
      setSupported(false);
      return;
    }
    void navigator.serviceWorker?.getRegistration().then((reg) =>
      reg?.pushManager.getSubscription().then((sub) => setEnabled(Boolean(sub)))
    );
  }, []);

  const subscribe = useCallback(async (nextThreshold: number) => {
    setBusy(true);
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications are blocked for this site.");
        return;
      }
      const reg = await getRegistration();
      if (!reg) {
        setError("Service worker unavailable in this browser.");
        return;
      }
      const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapid) {
        setError("Push not configured (missing VAPID key).");
        return;
      }
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
        }));

      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: sub.toJSON(),
          watchedIsos,
          threshold: nextThreshold,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? "Could not save the subscription.");
        return;
      }
      setEnabled(true);
    } finally {
      setBusy(false);
    }
  }, [watchedIsos]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setEnabled(false);
    } finally {
      setBusy(false);
    }
  }, []);

  // Keep the server in sync when the threshold (or watchlist) changes while enabled
  const handleThreshold = useCallback((t: number) => {
    setThreshold(t);
    if (enabled) void subscribe(t);
  }, [enabled, subscribe]);

  useEffect(() => {
    if (enabled && watchedIsos.length > 0) void subscribe(threshold);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedIsos.join(",")]);

  if (!supported) return null;

  return (
    <div style={{
      maxWidth: 760, marginTop: 40,
      background: DL.CARD, border: `1px solid ${DL.RULE_2}`,
      borderRadius: 14, padding: "18px 22px",
      display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      fontFamily: DL.SANS,
    }}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: DL.INK, display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2a4 4 0 0 0-4 4c0 3-1.5 4.5-1.5 4.5h11S12 9 12 6a4 4 0 0 0-4-4ZM6.5 13.5a1.5 1.5 0 0 0 3 0" />
          </svg>
          Intensity alerts
        </div>
        <div style={{ fontSize: 12, color: DL.DIM, marginTop: 4, lineHeight: 1.45 }}>
          Get a push notification when a watched country&rsquo;s coverage intensity crosses your threshold.
        </div>
        {error && (
          <div style={{ fontSize: 11, color: DL.CORAL, marginTop: 6 }}>{error}</div>
        )}
      </div>

      {/* Threshold pills */}
      <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
        <span style={{ fontSize: 10, color: DL.DIM, fontFamily: DL.MONO, marginRight: 4, textTransform: "uppercase", letterSpacing: 0.08 }}>
          Alert at
        </span>
        {THRESHOLDS.map((t) => (
          <button
            key={t}
            onClick={() => handleThreshold(t)}
            disabled={busy}
            style={{
              fontSize: 11, padding: "4px 9px", borderRadius: 999,
              border: `1px solid ${threshold === t ? DL.CORAL_BD : DL.RULE}`,
              background: threshold === t ? DL.CORAL_50 : "transparent",
              color: threshold === t ? DL.CORAL : DL.DIM,
              fontWeight: threshold === t ? 600 : 500,
              cursor: "pointer", fontFamily: DL.SANS,
            }}
          >
            {t}+
          </button>
        ))}
      </div>

      {/* Enable / disable */}
      <button
        onClick={() => (enabled ? void unsubscribe() : void subscribe(threshold))}
        disabled={busy}
        style={{
          padding: "8px 18px", borderRadius: 999, border: "none",
          background: enabled ? DL.CHIP : DL.INK,
          color: enabled ? DL.INK_2 : DL.PAPER,
          fontSize: 12, fontWeight: 600, cursor: busy ? "wait" : "pointer",
          fontFamily: DL.SANS, opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Saving…" : enabled ? "Disable alerts" : "Enable alerts"}
      </button>
    </div>
  );
}
