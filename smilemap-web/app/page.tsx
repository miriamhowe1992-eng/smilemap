// app/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import type { Practice, EnrichedPractice, NHSStatus } from "@/lib/types";
import enriched from "@/data/practices.enriched.json";

import { PracticeCard } from "@/components/PracticeCard";
import { AffiliateStrip } from "@/components/AffiliateStrip";
import { MonetizePanel } from "@/components/MonetizePanel";
import { NHSKey } from "@/components/NHSKey";

/* ---------------- Helpers ---------------- */

function firstStr(...vals: Array<unknown>): string | undefined {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

/**
 * Smarter status normalization with friendlier wording.
 */
function normalizeStatus(
  code?: string | null,
  note?: string | null
): { code: NHSStatus; note: string } {
  // Prefer explicit codes when present
  const explicit = (code || "").toUpperCase();
  if (explicit === "GREEN" || explicit === "AMBER" || explicit === "RED") {
    return {
      code: explicit as NHSStatus,
      note:
        explicit === "GREEN"
          ? "Accepting NHS patients"
          : explicit === "AMBER"
          ? "Limited NHS (waiting list / children only)"
          : "Private only (no new NHS patients)",
    };
  }

  // Heuristics from text
  const t = (note || "").toLowerCase().replace(/\s+/g, " ");

  const GREEN_PATTERNS = [
    /\baccept(ing|s)\b.*\bnhs\b/,
    /\bnew nhs\b.*\b(patient|patients)\b/,
    /\bcurrently taking\b.*\bnhs\b/,
    /\bopen\b.*\bnhs\b.*\bpatient/,
  ];

  const AMBER_PATTERNS = [
    /\blimited\b.*\bnhs\b/,
    /\bwaiting list\b/,
    /\bchildren only\b/,
    /\bemergency only\b/,
  ];

  const RED_PATTERNS = [
    /\bnot accepting\b.*\bnhs\b/,
    /\bno (new )?nhs\b/,
    /\bprivate only\b/,
    /\bclosed to nhs\b/,
    /\bno longer (accepting|taking)\b.*\bnhs\b/,
  ];

  if (GREEN_PATTERNS.some((re) => re.test(t))) {
    return { code: "GREEN", note: "Accepting NHS patients" };
  }
  if (AMBER_PATTERNS.some((re) => re.test(t))) {
    return { code: "AMBER", note: "Limited NHS (waiting list / children only)" };
  }
  if (RED_PATTERNS.some((re) => re.test(t))) {
    return { code: "RED", note: "Private only (no new NHS patients)" };
  }

  return { code: "UNKNOWN", note: "NHS availability not stated" };
}

/**
 * Map an EnrichedPractice row into the UI Practice shape.
 */
function toPracticeFromEnriched(src: EnrichedPractice): Practice {
  const address =
    firstStr(src.addressLine, src.address) ||
    [src.addressLine, src.postcode].filter(Boolean).join(", ") ||
    undefined;

  const { code, note } = normalizeStatus(src.status ?? null, src.statusNote ?? null);

  return {
    id: src.id,
    name: src.name,
    address,
    postcode: src.postcode || undefined,
    phone: src.phone ?? null,
    email: (src as any).email ?? null, // (email may be absent in some rows)
    website: src.website ?? null,
    nhsUrl: src.nhsUrl ?? null,
    status: code,
    statusNote: note,
    services: Array.isArray(src.services) ? src.services.filter(Boolean) : [],
    accessibility: Array.isArray(src.accessibility)
      ? src.accessibility.filter(Boolean)
      : [],
  };
}

/* ---------------- Page ---------------- */

type FilterStatus = NHSStatus | "ANY";

export default function HomePage() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<FilterStatus>("ANY");
  const [items, setItems] = React.useState<Practice[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Load enriched dataset once
  React.useEffect(() => {
    const list = (enriched as EnrichedPractice[])
      .filter(Boolean)
      .map(toPracticeFromEnriched);
    setItems(list);
    setLoading(false);
  }, []);

  // Counts per status (for filter pills)
  const counts = React.useMemo(() => {
    const base = { GREEN: 0, AMBER: 0, RED: 0, UNKNOWN: 0 };
    for (const p of items) {
      if (p.status in base) (base as any)[p.status] += 1;
      else base.UNKNOWN += 1;
    }
    return base;
  }, [items]);

  // Apply search + status filters
  const filtered = React.useMemo(() => {
    const qnorm = q.trim().toLowerCase();
    return items.filter((p) => {
      const statusOK = status === "ANY" || p.status === status;
      const hay = `${p.name ?? ""} ${p.address ?? ""} ${p.postcode ?? ""}`.toLowerCase();
      const qOK = !qnorm || hay.includes(qnorm);
      return statusOK && qOK;
    });
  }, [items, q, status]);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      {/* NAVBAR */}
      <header
        className="sticky top-0 z-30 w-full border-b bg-white/90 backdrop-blur"
        style={{ borderColor: "#e5e9f2" }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-smilemap.png" alt="SmileMap" width={190} height={50} priority />
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
            <Link href="/">Home</Link>
            <Link href="/find">Find a Dentist</Link>
            <Link href="/plans">Plans &amp; Pricing</Link>
            <Link href="/contact">Contact</Link>
          </nav>
          <Link
            href="/prohub"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700"
          >
            SmileMap ProHub
          </Link>
        </div>
      </header>

      {/* SEARCH + FILTERS */}
      <section id="finder" className="mx-auto max-w-6xl px-4 py-8">
        <div className="rounded-2xl bg-white p-4 ring-1" style={{ ringColor: "#e5e9f2" }}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by town, practice name, or postcode (e.g. SW1A 1AA)"
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
              style={{ borderColor: "#e5e9f2" }}
              aria-label="Search"
            />
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { k: "ANY", label: "All", count: items.length },
                  { k: "GREEN", label: "Accepting NHS", count: counts.GREEN },
                  { k: "AMBER", label: "Limited NHS", count: counts.AMBER },
                  { k: "RED", label: "Private only", count: counts.RED },
                  { k: "UNKNOWN", label: "NHS unknown", count: counts.UNKNOWN },
                ] as Array<{ k: FilterStatus; label: string; count: number }>
              ).map((btn) => (
                <button
                  key={btn.k}
                  onClick={() => setStatus(btn.k)}
                  className={`rounded-full border px-4 py-2 text-sm ${
                    status === btn.k ? "bg-slate-50 font-semibold" : ""
                  }`}
                  style={{
                    borderColor: status === btn.k ? "#2bbecb" : "#e5e9f2",
                    color: status === btn.k ? "#133b5c" : "#334155",
                  }}
                  aria-pressed={status === btn.k}
                >
                  {btn.label} ({btn.count})
                </button>
              ))}
            </div>
          </div>

          {/* NHS key (visual legend) */}
          <div className="mt-4">
            <NHSKey />
          </div>
        </div>

        {/* Monetization/Ad slot (above list) */}
        <div className="mt-6">
          <MonetizePanel />
        </div>

        {/* RESULTS */}
        <div className="mt-6 grid gap-4">
          {loading && (
            <div
              className="rounded-2xl bg-white p-6 text-center text-slate-600 ring-1"
              style={{ ringColor: "#e5e9f2" }}
            >
              Loading latest results…
            </div>
          )}

          {!loading &&
            filtered.map((p, i) => (
              // index suffix avoids duplicate-key warnings where IDs collide
              <PracticeCard key={`${p.id}-${i}`} p={p} />
            ))}

          {!loading && filtered.length === 0 && (
            <div
              className="rounded-2xl bg-white p-8 text-center text-slate-600 ring-1"
              style={{ ringColor: "#e5e9f2" }}
            >
              No practices match your filters yet. Try a nearby postcode or choose a different NHS status.
            </div>
          )}
        </div>

        {/* Monetization/Ad slot (below list) */}
        <div className="mt-8">
          <AffiliateStrip />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-16 border-t bg-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 md:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Image src="/smilemap-pin.png" alt="" width={20} height={20} />
            <span>© {new Date().getFullYear()} SmileMap</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a href="/privacy" className="hover:text-slate-900">
              Privacy
            </a>
            <a href="/terms" className="hover:text-slate-900">
              Terms
            </a>
            <a href="/contact" className="hover:text-slate-900">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
