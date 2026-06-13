"use client";

import { useEffect, useState } from "react";

interface LiveDateTimeProps {
  /** "full" → "Friday, 13 June · 15:42 GMT"; "compact" → "Fri · 15:42 GMT" */
  variant?: "full" | "compact";
  className?: string;
  style?: React.CSSProperties;
}

function format(now: Date, variant: "full" | "compact"): string {
  const time = now.toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC", hour12: false,
  });
  if (variant === "compact") {
    const day = now.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" });
    return `${day} · ${time} GMT`;
  }
  const date = now.toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
  });
  return `${date} · ${time} GMT`;
}

/**
 * Live-ticking UTC date + time. Renders nothing until mounted so the server
 * HTML and first client render match (no hydration warning), then updates
 * every 30s.
 */
export default function LiveDateTime({ variant = "full", className, style }: LiveDateTimeProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  // Reserve space before mount so layout doesn't shift
  return (
    <span className={className} style={style}>
      {now ? format(now, variant) : " "}
    </span>
  );
}
