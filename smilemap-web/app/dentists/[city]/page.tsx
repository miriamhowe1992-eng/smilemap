// /app/dentists/[city]/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCity, cities } from "@/lib/cities";
import { practices } from "@/lib/practices";
import { PracticeCard } from "@/components/PracticeCard";
import { Filters } from "@/components/Filters";
import { NHSKey } from "@/components/NHSKey";
import type { NHSStatus } from "@/components/StatusBadge";

const theme = {
  brandBlue: "#133b5c",
  brandTurquoise: "#2bbecb",
  border: "#e5e9f2",
  surfaceAlt: "#f7f9fc",
};

export async function generateStaticParams() {
  return cities.map((c) => ({ city: c.slug }));
}

export default function CityDentistsPage({ params }: { params: { city: string } }) {
  const city = getCity(params.city);
  if (!city) return notFound();

  // Basic filtering: check if practice address includes city name
  const cityList = practices.filter((p) =>
    (p.address || "").toLowerCase().includes(city.name.toLowerCase())
  );

  const [filters, setFilters] = React.useState<{ q: string; status: NHSStatus }>({
    q: "",
    status: "ANY",
  });

  const filtered = cityList.filter((p) => {
    const statusOK = filters.status === "ANY" || p.status === filters.status;
    const text = `${p.name} ${p.address}`.toLowerCase();
    const queryOK = !filters.q.trim() || text.includes(filters.q.toLowerCase());
    return statusOK && queryOK;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Dentists in ${city.name}`,
    itemListElement: filtered.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Dentist",
        name: p.name,
        address: p.address,
        telephone: p.phone,
        url: `https://www.smilemap.co.uk/dentist/${p.id}`,
        areaServed: city.name,
      },
    })),
  };

  return (
    <div className="min-h-screen" style={{ background: theme.surfaceAlt }}>
      {/* NAV */}
      <header className="sticky top-0 z-30 w-full border-b bg-white/90 backdrop-blur">
        <div
          className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"
          style={{ borderColor: theme.border }}
        >
          <a className="flex items-center gap-2" href="/">
            <Image
              src="/logo-smilemap.png"
              alt="SmileMap"
              className="h-9 w-auto md:h-10"
              width={160}
              height={40}
              priority
            />
          </a>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="/" className="text-sm text-slate-700 hover:text-slate-900">
              Home
            </a>
            <a href="/pro" className="text-sm text-slate-700 hover:text-slate-900">
              For Dentists
            </a>
            <a href="/blog" className="text-sm text-slate-700 hover:text-slate-900">
              Blog
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section
        className="border-b"
        style={{
          borderColor: theme.border,
          background: "linear-gradient(135deg,#fff,rgba(43,190,203,.08))",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-10">
          <h1
            className="text-3xl font-extrabold md:text-5xl"
            style={{ color: theme.brandBlue }}
          >
            Dentists in{" "}
            <span style={{ color: theme.brandTurquoise }}>{city.name}</span>
          </h1>
          <p className="mt-3 max-w-[65ch] text-slate-600">{city.intro}</p>
        </div>
      </section>

      {/* FINDER */}
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div
          className="rounded-2xl bg-white p-4 ring-1"
          style={{ ringColor: theme.border }}
        >
          <Filters value={filters} onChange={setFilters} />
          <div className="mt-3 text-sm font-semibold text-slate-700">
            NHS Availability Key
          </div>
          <NHSKey />
        </div>

        <div className="mt-6 grid gap-4">
          {filtered.map((p) => (
            <PracticeCard key={p.id} p={p} />
          ))}
          {filtered.length === 0 && (
            <div
              className="rounded-2xl bg-white p-8 text-center text-slate-600 ring-1"
              style={{ ringColor: theme.border }}
            >
              No practices match your filters yet. Try adjusting NHS status or
              your search text.
            </div>
          )}
        </div>
      </section>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
