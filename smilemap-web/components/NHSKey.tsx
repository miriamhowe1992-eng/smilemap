// /components/NHSKey.tsx
"use client";
import * as React from "react";

const rows = [
  {
    key: "GREEN",
    title: "Green — Accepting",
    desc: "Accepting new NHS patients (adults & children).",
    bar: "#11a36a",
    sub: "Best chance",
  },
  {
    key: "AMBER",
    title: "Amber — Limited",
    desc: "Limited NHS availability (e.g. children only or waiting list).",
    bar: "#f59e0b",
    sub: "Try calling",
  },
  {
    key: "RED",
    title: "Red — Not accepting",
    desc: "Not accepting new NHS patients (private or referral only).",
    bar: "#ef4444",
    sub: "Private only",
  },
] as const;

export function NHSKey() {
  return (
    <div className="mt-2 rounded-2xl ring-1 bg-white/90" style={{ ringColor: "#e5e9f2" }}>
      <div className="grid gap-2 p-3 sm:grid-cols-3">
        {rows.map((r) => (
          <div
            key={r.key}
            className="rounded-xl border p-3"
            style={{ borderColor: "#e5e9f2", background: "linear-gradient(0deg,#fff,rgba(0,0,0,0.02))" }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.bar }} />
              <span className="font-semibold text-slate-900">{r.title}</span>
              <span className="ml-auto rounded-md px-2 py-0.5 text-xs" style={{ background: `${r.bar}22`, color: r.bar }}>
                {r.sub}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full" style={{ background: `${r.bar}55` }} />
            <p className="mt-2 text-sm text-slate-600">{r.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
