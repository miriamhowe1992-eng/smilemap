// /components/StatusBadge.tsx
"use client";
import * as React from "react";

export type NHSStatus = "ANY" | "GREEN" | "AMBER" | "RED";

const colours = {
  GREEN: { dot: "#11a36a", bg: "rgba(17,163,106,.12)", text: "#0b6242", label: "Accepting new NHS patients" },
  AMBER: { dot: "#f59e0b", bg: "rgba(245,158,11,.14)", text: "#8a5b00", label: "Limited NHS availability" },
  RED: { dot: "#ef4444", bg: "rgba(239,68,68,.14)", text: "#7a1010", label: "Not accepting new NHS patients" },
  ANY: { dot: "#64748b", bg: "rgba(100,116,139,.12)", text: "#334155", label: "All availability" },
} as const;

export function StatusBadge({
  status,
  size = "md",
  withLabel = true,
  title,
}: {
  status: NHSStatus;
  size?: "sm" | "md" | "lg";
  withLabel?: boolean;
  title?: string;
}) {
  const c = colours[status];
  const px = size === "lg" ? "px-3.5 py-2" : size === "sm" ? "px-2 py-1" : "px-3 py-1.5";
  const dot = size === "lg" ? "h-2.5 w-2.5" : size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2";
  const text = size === "lg" ? "text-sm" : size === "sm" ? "text-xs" : "text-sm";
  const label =
    status === "GREEN" ? "Green" : status === "AMBER" ? "Amber" : status === "RED" ? "Red" : "Any";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full ${px} ${text}`}
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.dot}20` }}
      aria-label={`NHS availability: ${label} — ${c.label}`}
      title={title ?? `NHS availability: ${label} — ${c.label}`}
    >
      <span className={`rounded-full ${dot}`} style={{ background: c.dot }} />
      <span className="font-semibold">NHS: {label}</span>
      {withLabel && <span className="hidden sm:inline text-[0.8em] opacity-80">· {c.label}</span>}
    </span>
  );
}
