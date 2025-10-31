"use client";

import * as React from "react";
import { NHSStatus } from "./StatusBadge";

export type ProviderFilters = {
  q: string;
  status: NHSStatus;
  invisalign: boolean;
  implants: boolean;
  emergency: boolean;
  sedation: boolean;
  hygienist: boolean;
};

export function Filters({
  value,
  onChange,
}: {
  value: ProviderFilters;
  onChange: (v: ProviderFilters) => void;
}) {
  function set<K extends keyof ProviderFilters>(key: K, val: ProviderFilters[K]) {
    onChange({ ...value, [key]: val });
  }

  const statusPill = (label: string, code: NHSStatus) => (
    <button
      onClick={() => set("status", code)}
      className={`rounded-full border px-4 py-2 text-sm ${
        value.status === code ? "bg-slate-50 font-semibold" : ""
      }`}
      style={{ borderColor: "#e5e9f2" }}
    >
      {label}
    </button>
  );

  const toggle = (key: keyof ProviderFilters, label: string) => (
    <label
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm ${
        (value[key] as boolean) ? "bg-slate-50 font-semibold" : ""
      }`}
      style={{ borderColor: "#e5e9f2" }}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={Boolean(value[key])}
        onChange={(e) => set(key, e.target.checked as any)}
      />
      {label}
    </label>
  );

  return (
    <div className="space-y-3">
      {/* Search + NHS status */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <input
          value={value.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Search by town or postcode (e.g. SW1A 1AA)"
          className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
          style={{ borderColor: "#e5e9f2" }}
          aria-label="Search by town or postcode"
        />

        <div className="flex flex-wrap gap-2" role="group" aria-label="NHS filters">
          {statusPill("Any", "ANY")}
          {statusPill("Green", "GREEN")}
          {statusPill("Amber", "AMBER")}
          {statusPill("Red", "RED")}
        </div>
      </div>

      {/* Provider / capability filters */}
      <div className="flex flex-wrap gap-2 pt-1" aria-label="Provider and services">
        {toggle("invisalign", "Invisalign Provider")}
        {toggle("implants", "Implants")}
        {toggle("emergency", "Emergency")}
        {toggle("sedation", "Sedation")}
        {toggle("hygienist", "Hygienist")}
      </div>
    </div>
  );
}
