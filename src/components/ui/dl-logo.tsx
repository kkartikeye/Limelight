interface DLLogoProps {
  size?: number;
}

/**
 * Limelight broadcast mark — a coral dot radiating two arcs, a signal
 * getting louder. Tracks the theme via --dl-coral.
 */
export default function DLLogo({ size = 22 }: DLLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ flexShrink: 0, color: "var(--dl-coral, #e0573c)" }}
      aria-hidden
    >
      {/* Source dot */}
      <circle cx="7.2" cy="16.8" r="3.4" fill="currentColor" />
      {/* Inner wave */}
      <path
        d="M 7.9 8.83 A 8 8 0 0 1 15.17 16.1"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      {/* Outer wave */}
      <path
        d="M 8.3 4.25 A 12.6 12.6 0 0 1 19.75 15.7"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
