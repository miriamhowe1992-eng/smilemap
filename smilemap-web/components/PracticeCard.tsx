"use client";

import * as React from "react";
import { Practice } from "@/lib/types";

type StatusInfo = {
  label: string;
  color: string;
  note: string;
};

export function StatusPill({ status }: { status: Practice["status"] }) {
  const map: Record<NonNullable<Practice["status"]>, StatusInfo> = {
    GREEN: {
      label: "NHS: Green",
      color: "#11a36a",
      note: "Accepting new NHS patients",
    },
    AMBER: {
      label: "NHS: Amber",
      color: "#f59e0b",
      note: "Limited NHS availability / waiting list",
    },
    RED: {
      label: "NHS: Red",
      color: "#ef4444",
      note: "Private only / no new NHS patients",
    },
    UNKNOWN: {
      label: "NHS: Unknown",
      color: "#64748b",
      note: "Check with practice",
    },
  };

  const s = map[status ?? "UNKNOWN"];

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm"
      style={{ borderColor: "#e5e9f2", color: "#133b5c" }}
      title={s.note}
      aria-label={s.label}
    >
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: s.color }}
      />
      {s.label}
    </span>
  );
}

function ServicesChips({ services }: { services?: unknown }) {
  if (!services) return null;

  // Support either an array of strings OR a boolean map (e.g. { invisalign: true })
  let list: string[] = [];

  if (Array.isArray(services)) {
    list = (services as unknown[])
      .map((v) => (typeof v === "string" ? v.trim() : ""))
      .filter(Boolean);
  } else if (typeof services === "object" && services !== null) {
    list = Object.entries(services as Record<string, unknown>)
      .filter(([, v]) => Boolean(v))
      .map(([k]) => k);
  }

  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 text-slate-700">
      {list.map((k) => (
        <span
          key={k}
          className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs ring-1"
          style={{ ringColor: "#e5e9f2" }}
        >
          {k.charAt(0).toUpperCase() + k.slice(1)}
        </span>
      ))}
    </div>
  );
}

export function PracticeCard({ p }: { p: Practice }) {
  const isRed = p.status === "RED";
  const nhsHref = p.nhsUrlResolved || p.nhsUrl || "#";

  return (
    <article
      className="rounded-2xl bg-white p-5 ring-1 transition-shadow hover:shadow-sm"
      style={{
        ringColor: "#e5e9f2",
        background: isRed
          ? "linear-gradient(0deg, rgba(239,68,68,0.03), rgba(239,68,68,0.03))"
          : "white",
      }}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        {/* LEFT: Name + meta */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-900">{p.name}</h3>
            {isRed && (
              <span
                className="inline-flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs font-semibold ring-1"
                style={{ ringColor: "#e5e9f2", color: "#ef4444" }}
                title="Not accepting new NHS patients"
              >
                Private only
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            {p.address && <span>{p.address}</span>}
            {p.postcode && <span>• {p.postcode}</span>}

            {p.phone && (
              <>
                <span>•</span>
                <a className="hover:underline" href={`tel:${p.phone}`}>
                  {p.phone}
                </a>
              </>
            )}

            {p.email && (
              <>
                <span>•</span>
                <a className="hover:underline" href={`mailto:${p.email}`}>
                  {p.email}
                </a>
              </>
            )}

            {p.website && (
              <>
                <span>•</span>
                <a
                  className="hover:underline"
                  href={p.website}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Website
                </a>
              </>
            )}
          </div>

          <div className="mt-3 grid gap-2 text-sm">
            {p.statusNote && (
              <div className="flex items-start gap-2">
                <span className="min-w-[88px] font-medium text-slate-700">
                  Status
                </span>
                <p className="text-slate-700">{p.statusNote}</p>
              </div>
            )}

            {p.accessibility && p.accessibility.length > 0 && (
              <div className="flex items-start gap-2">
                <span className="min-w-[88px] font-medium text-slate-700">
                  Access
                </span>
                <p className="text-slate-700">{p.accessibility.join(" — ")}</p>
              </div>
            )}

            <div className="flex items-start gap-2">
              <span className="min-w-[88px] font-medium text-slate-700">
                Services
              </span>
              <ServicesChips services={p.services} />
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {nhsHref !== "#" && (
              <a
                href={nhsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-700 hover:underline"
                title="Open on the official NHS website"
              >
                View on NHS →
              </a>
            )}

            {p.phone && (
              <a
                href={`tel:${p.phone}`}
                className="rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: "#e5e9f2", color: "#133b5c" }}
                title="Call the practice"
              >
                Call
              </a>
            )}

            {p.website && (
              <a
                href={p.website}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border px-3 py-1.5 text-sm"
                style={{ borderColor: "#e5e9f2", color: "#133b5c" }}
                title="Open practice website"
              >
                Visit site
              </a>
            )}
          </div>
        </div>

        {/* RIGHT: Status */}
        <div className="pt-1 shrink-0">
          <StatusPill status={p.status} />
        </div>
      </div>
    </article>
  );
}
