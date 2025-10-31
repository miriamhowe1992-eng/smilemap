"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Stats = {
  total: number;
  yes: number;
  limited: number;
  no: number;
  unknown: number;
  last_updated?: string;
};

export default function HomePage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [postcode, setPostcode] = useState("");

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = encodeURIComponent(postcode.trim());
    if (q) window.location.href = `/search?postcode=${q}`;
  }

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .catch(() => setStats(null));
  }, []);

const safeStats: Stats = {
  total: Number(stats?.total ?? 0),
  yes: Number(stats?.yes ?? 0),
  limited: Number(stats?.limited ?? 0),
  no: Number(stats?.no ?? 0),
  unknown: Number(stats?.unknown ?? 0),
  last_updated: stats?.last_updated ?? undefined,
};

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eaf9fd,white)]">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-12 pb-10">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Left column */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border px-3 py-1 text-sm text-slate-600">
              Dentist finder • UK-wide
            </div>

            <h1 className="mt-4 text-4xl md:text-5xl font-semibold">
              Find a{" "}
              <span className="text-[--smile-turquoise]">dentist</span> near
              you.
            </h1>

            <p className="mt-4 text-lg text-slate-600">
              Real-time availability, contact details, opening times and
              accessibility — all in one place.
            </p>

            {/* Search box */}
            <form onSubmit={handleSearch} className="mt-6 flex gap-3">
              <input
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Enter postcode (e.g. SW1A 1AA)"
                className="w-full rounded-xl border px-4 py-3"
              />
              <button
                type="submit"
                className="rounded-xl px-5 py-3 bg-[#11b5d8] text-white font-semibold"
              >
                Find a dentist
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span>UK-wide coverage</span>
              <span>Updated daily</span>
              <span>Free to use</span>
            </div>
          </div>

          {/* Right column: Today’s snapshot */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="rounded-2xl bg-[#f0fbfe] p-4">
              <div className="text-sm text-slate-600">Today’s snapshot</div>
              <ul className="mt-3 space-y-2 text-sm">
                <li>• Practices: {safeStats.total.toLocaleString()}</li>
                <li>
                  • Status:{" "}
                  {`${safeStats.yes} accepting / ${safeStats.limited} limited / ${safeStats.no} not accepting`}
                </li>
                <li>
                  • Last updated:{" "}
                  {stats?.last_updated
                    ? new Date(stats.last_updated).toLocaleDateString()
                    : "—"}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-semibold">How SmileMap works</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            {
              t: "Search",
              d: "Enter a postcode to see nearby dental practices.",
            },
            {
              t: "Compare",
              d: "Check availability, contact details and facilities.",
            },
            { t: "Contact", d: "Contact the practice directly." },
          ].map((x) => (
            <div key={x.t} className="card card-hover">
              <div className="text-lg font-medium">{x.t}</div>
              <p className="mt-2 text-slate-600">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section id="benefits" className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="text-2xl font-semibold">Why SmileMap?</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            { t: "Live data", d: "Refreshed daily from NHS sources." },
            {
              t: "Accessibility info",
              d: "Wheelchair access, disabled toilet, parking and more.",
            },
            { t: "Nationwide", d: "England, Scotland and Wales coverage." },
          ].map((x) => (
            <div key={x.t} className="card card-hover">
              <div className="text-lg font-medium">{x.t}</div>
              <p className="mt-2 text-slate-600">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dentist CTA */}
      <section id="dentists" className="mx-auto max-w-6xl px-4 pb-16">
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-xl font-semibold">
                Are you a dental practice?
              </h3>
              <p className="mt-2 text-slate-600">
                Get discovered by patients in your area. Keep your NHS
                availability up to date or list your private practice.
              </p>
            </div>
            <div className="flex md:justify-end">
              <Link
                href="/form"
                className="rounded-2xl bg-[#11b5d8] text-white px-6 py-3 font-semibold"
              >
                List your practice
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
