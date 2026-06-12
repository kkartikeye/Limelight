// ─── Category iconography ─────────────────────────────────────────────────────
// One minimal line glyph per news category. Strokes inherit currentColor so
// icons follow the surrounding text color (active/inactive pill states, theme).

interface CategoryIconProps {
  category: string;
  size?: number;
  strokeWidth?: number;
}

const PATHS: Record<string, React.ReactNode> = {
  // Crossed sabres
  Conflict: (
    <>
      <path d="M3 3l8.2 8.2M13 3L4.8 11.2" />
      <path d="M2.5 13.5l2-.6-1.4-1.4-.6 2ZM13.5 13.5l-2-.6 1.4-1.4.6 2Z" />
    </>
  ),
  // Heart
  Humanitarian: (
    <path d="M8 13.4S2.5 9.8 2.5 6.1C2.5 4.2 4 3 5.6 3 6.7 3 7.6 3.6 8 4.5 8.4 3.6 9.3 3 10.4 3 12 3 13.5 4.2 13.5 6.1c0 3.7-5.5 7.3-5.5 7.3Z" />
  ),
  // Government building
  Politics: (
    <>
      <path d="M2.5 6.5L8 3l5.5 3.5" />
      <path d="M3.5 7v4.5M6.5 7v4.5M9.5 7v4.5M12.5 7v4.5" />
      <path d="M2.5 12.5h11" />
    </>
  ),
  // Rising chart
  Economics: (
    <>
      <path d="M2.5 12.5h11" />
      <path d="M3 10l3-3 2.5 2L13 4.5" />
      <path d="M10.5 4.5H13V7" />
    </>
  ),
  // Chip
  Technology: (
    <>
      <rect x="4.5" y="4.5" width="7" height="7" rx="1" />
      <path d="M6.5 4.5v-2M9.5 4.5v-2M6.5 13.5v-2M9.5 13.5v-2M4.5 6.5h-2M4.5 9.5h-2M13.5 6.5h-2M13.5 9.5h-2" />
    </>
  ),
  // Leaf
  Environment: (
    <>
      <path d="M12.8 3.2C7 3.5 3.8 6.2 3.5 12.5c6.3-.3 9-3.5 9.3-9.3Z" />
      <path d="M3.5 12.5C6 9.5 8.5 7.5 11 6" />
    </>
  ),
  // Ball
  Sports: (
    <>
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 2.5v11M2.5 8h11" />
      <path d="M4.2 4.2c2.3 2.3 5.3 2.3 7.6 0M4.2 11.8c2.3-2.3 5.3-2.3 7.6 0" />
    </>
  ),
  // Clapperboard
  Entertainment: (
    <>
      <rect x="2.5" y="5.5" width="11" height="7.5" rx="1" />
      <path d="M2.5 5.5l11-2M5 5.2l1.8-2M8.2 4.6l1.8-2M11.4 4l1.8-2" />
    </>
  ),
};

export default function CategoryIcon({ category, size = 13, strokeWidth = 1.3 }: CategoryIconProps) {
  const glyph = PATHS[category];
  if (!glyph) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      style={{ flexShrink: 0 }}
    >
      {glyph}
    </svg>
  );
}
