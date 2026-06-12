"use client";

import { useState } from "react";
import Image from "next/image";
import { DL } from "@/lib/design-tokens";

interface SourceFaviconProps {
  /** Outlet domain, e.g. "reuters.com". Empty → initials fallback. */
  domain: string;
  /** Outlet name, used for alt text and the initials fallback. */
  name: string;
  size?: number;
}

/**
 * Outlet favicon with graceful fallback to a two-letter initials disc.
 * Uses DuckDuckGo's favicon service (no API key, privacy-friendly).
 */
export default function SourceFavicon({ domain, name, size = 32 }: SourceFaviconProps) {
  const [failed, setFailed] = useState(false);
  const showImage = domain && !failed;

  return (
    <div
      style={{
        width: size, height: size, borderRadius: 999,
        background: DL.PAPER_2,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: DL.DISPLAY, fontSize: size * 0.375, fontWeight: 500, color: DL.INK_2,
        border: `1px solid ${DL.RULE_2}`, flexShrink: 0, overflow: "hidden",
      }}
    >
      {showImage ? (
        <Image
          src={`https://icons.duckduckgo.com/ip3/${domain}.ico`}
          alt={name}
          width={size - 8}
          height={size - 8}
          unoptimized
          onError={() => setFailed(true)}
          style={{ borderRadius: 4 }}
        />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  );
}
