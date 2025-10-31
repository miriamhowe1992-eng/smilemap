"use client";

import * as React from "react";
import Image from "next/image";

export function MonetizePanel() {
  // Safer, useful offers (no whitening promos)
  const items = [
    {
      title: "0% Dental Finance (Subject to status)",
      body:
        "Spread the cost of treatment with representative 0% APR plans from vetted partners.",
      cta: "Check eligibility",
      href: "#",
      icon: "/globe.svg",
    },
    {
      title: "Electric Toothbrush Deals",
      body:
        "Top-rated brushes (Oral-B / Philips) — replacement heads and bundles with big savings.",
      cta: "View offers",
      href: "#",
      icon: "/file.svg",
    },
    {
      title: "Dental Insurance / Plans",
      body:
        "Compare routine care plans (check-ups, hygiene) and accident cover from UK providers.",
      cta: "Compare plans",
      href: "#",
      icon: "/window.svg",
    },
  ];

  return (
    <aside
      className="rounded-2xl border p-4 md:p-5 bg-white"
      style={{ borderColor: "#e5e9f2" }}
    >
      <div className="mb-3 text-sm font-semibold text-slate-700">Sponsored</div>
      <ul className="space-y-3">
        {items.map((it) => (
          <li
            key={it.title}
            className="rounded-xl border p-3 hover:shadow-sm transition bg-white"
            style={{ borderColor: "#eef2f6" }}
          >
            <div className="flex items-start gap-3">
              <Image
                src={it.icon}
                alt=""
                width={28}
                height={28}
                className="opacity-70"
              />
              <div className="min-w-0">
                <div className="font-semibold text-slate-900">{it.title}</div>
                <p className="text-sm text-slate-600 mt-1">{it.body}</p>
                <a
                  href={it.href}
                  className="inline-block mt-2 text-sm font-semibold text-blue-700 hover:underline"
                >
                  {it.cta}
                </a>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[12px] text-slate-500">
        We may earn a commission when you click partner links. This helps keep
        SmileMap free for patients.
      </p>
    </aside>
  );
}
