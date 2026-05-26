"use client";

import type { Projection } from "@/lib/stores/map-store";

interface ViewToggleProps {
  value: Projection;
  onChange: (p: Projection) => void;
}

const GlobeIcon = () => (
  <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="5.5" />
    <ellipse cx="7" cy="7" rx="2.5" ry="5.5" />
    <line x1="1.5" y1="7" x2="12.5" y2="7" />
  </svg>
);

const FlatIcon = () => (
  <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="3" width="11" height="8" rx="1" />
    <line x1="1.5" y1="7" x2="12.5" y2="7" />
    <line x1="7" y1="3" x2="7" y2="11" />
  </svg>
);

interface ItemProps {
  id: Projection;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

function Item({ id, label, icon, active, onClick }: ItemProps) {
  void id;
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 font-body transition-all"
      style={{
        padding: "5px 10px 5px 8px",
        borderRadius: 999,
        border: "none",
        background: active ? "#181613" : "transparent",
        color: active ? "#f6f3ec" : "#7a7568",
        fontSize: 12,
        fontWeight: active ? 600 : 500,
        cursor: "pointer",
        transition: "all 0.15s ease",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 14, height: 14 }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

export default function ViewToggle({ value, onChange }: ViewToggleProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        borderRadius: 999,
        background: "#ffffff",
        border: "1px solid rgba(24,22,19,0.10)",
        boxShadow: "0 4px 16px rgba(24,22,19,0.05)",
      }}
    >
      <Item
        id="globe"
        label="Globe"
        icon={<GlobeIcon />}
        active={value === "globe"}
        onClick={() => onChange("globe")}
      />
      <Item
        id="naturalEarth"
        label="Flat"
        icon={<FlatIcon />}
        active={value === "naturalEarth"}
        onClick={() => onChange("naturalEarth")}
      />
    </div>
  );
}
