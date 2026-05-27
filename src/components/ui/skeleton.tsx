"use client";

import { DL } from "@/lib/design-tokens";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  style?: React.CSSProperties;
}

/**
 * Single-line shimmer placeholder. Compose multiples for a skeleton screen.
 */
export function Skeleton({ width = "100%", height = 14, borderRadius = 4, style }: SkeletonProps) {
  return (
    <div
      className="skeleton-shimmer"
      style={{
        width,
        height,
        borderRadius,
        background: `linear-gradient(90deg, ${DL.RULE} 25%, #ede9e0 50%, ${DL.RULE} 75%)`,
        backgroundSize: "200% 100%",
        ...style,
      }}
    />
  );
}

/**
 * A skeleton row mimicking a single headline in StoryPanel.
 */
export function HeadlineSkeleton({ index }: { index: number }) {
  // Vary widths so the placeholder looks natural
  const widths = ["90%", "75%", "83%", "68%", "78%"];
  const w = widths[index % widths.length];

  return (
    <div
      style={{
        padding: "12px 0",
        borderBottom: `1px solid ${DL.RULE_2}`,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
      }}
    >
      {/* Index number placeholder */}
      <Skeleton width={24} height={11} borderRadius={2} style={{ flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
        {/* Headline line 1 */}
        <Skeleton width={w} height={14} />
        {/* Headline line 2 (shorter) */}
        <Skeleton width="55%" height={14} />
        {/* Meta row */}
        <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
          <Skeleton width={60} height={10} borderRadius={2} />
          <Skeleton width={40} height={10} borderRadius={2} />
          <Skeleton width={30} height={10} borderRadius={2} style={{ marginLeft: "auto" }} />
        </div>
      </div>
    </div>
  );
}
