interface DLLogoProps {
  size?: number;
}

/** Concentric-rings Limelight mark — coral outer ring, paper fill, coral dot. */
export default function DLLogo({ size = 22 }: DLLogoProps) {
  const inner = size - 8;
  const dot   = size - 14;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* Outer ring */}
      <div style={{
        position: "absolute", inset: 0,
        borderRadius: 999, background: "#e0573c",
      }} />
      {/* Paper fill */}
      <div style={{
        position: "absolute", left: 4, top: 4,
        width: inner, height: inner,
        borderRadius: 999, background: "#f6f3ec",
      }} />
      {/* Inner coral dot */}
      <div style={{
        position: "absolute", left: 7, top: 7,
        width: dot, height: dot,
        borderRadius: 999, background: "#e0573c",
      }} />
    </div>
  );
}
