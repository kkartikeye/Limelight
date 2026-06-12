"use client";

import { useEffect } from "react";

// Registers the service worker (offline shell + web-push receiver).
// Production only — a SW caching dev-server responses makes HMR misbehave.
export default function SwRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration failure is non-fatal — app works without it */
    });
  }, []);

  return null;
}
