"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  deriveName,
  cleanAddress,
  niceStatus,
  parseOpeningTimes,
  extractFacilityTags,
  PracticeLike,
} from "@/lib/format";

type Practice = PracticeLike & {
  phone?: string;
  practice_type?: string;
  last_checked?: string;
  lat?: number | null;
  lon?: number | null;
};

export default function PracticePage() {
  const sp = useSearchParams();
  const raw = sp.get("url") || "";
  const url = decodeURIComponent(raw);

  const [item, setItem] = useState<Practice | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      setError("Missing practice URL.");
      return;
    }

    setLoading(true);
    setError(null);

    fetch(`/api/practice?url=${encodeURIComponent(url)}`)
      .then((r) => r.json())
      .then((j) => {
        const one = j?.items?.[0] || null;
        setItem(one);
        if (!one) setError("Practice not found.");
      })
      .catch(() => setError("Failed to load practice."))
      .finally(() => setLoading(false));
  }, [url]);

  const openingRows = useMemo(
    () => parseOpeningTimes(item?.opening_times || ""),
    [item?.opening_times]
  );

  const title = deriveName(item || { url });
  const addrLine =
    (item?.address ? cleanAddress(item.address) : "") +
    (item?.postcode ? (item?.address ? ", " : "") + item.postcode.toUpperCase() : "");

  const statusUI = niceStatus(item?.nhs_accepting || "Unknown");
  const tags = extractFacilityTags(item?.facilities || "");
  const backToSearchHref =
    item?.postcode ? `/search?postcode=${encodeURIComponent(item.postcode)}` : "/search";

  if (!url) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-slate-700">Missing practice URL.</p>
        <div className="mt-3 flex gap-4">
          <Link href="/" className="text-sky-600 underline">
            ← Back to home
          </Link>
          <Link href="/search" className="text-sky-600 underline">
            ← Back to search
          </Link>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-slate-700">Loading…</p>
      </main>
    );
  }

  if (error || !item) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-slate-700">{error || "Practice not found."}</p>
        <div className="mt-3 flex gap-4">
          <Link href="/" className="text-sky-600 underline">
            ← Back to home
          </Link>
          <Link href="/search" className="text-sky-600 underline">
            ← Back to search
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fcff,transparent)]">
      {/* Top bar — logo removed; only a right-aligned back link */}
      <div className="bg-white/80 backdrop-blur-md border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-end">
          <Link href={backToSearchHref} className="text-sky-600 underline">
            ← Back to search
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-semibold">{title}</h1>

        {/* Address directly under title */}
        {addrLine && <p className="mt-1 text-slate-700">{addrLine}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-3">
          {/* NHS availability label + pill */}
          <div className="inline-flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">NHS availability</span>
            <span
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusUI.bg} ${statusUI.text}`}
            >
              <span className={`h-2 w-2 rounded-full ${statusUI.dot}`} />
              {statusUI.label}
            </span>
          </div>

          {/* Practice type and phone */}
          {item.practice_type && (
            <span className="text-sm rounded-xl px-2 py-1 bg-slate-100 text-slate-700">
              {item.practice_type}
            </span>
          )}
          {item.phone && <span className="text-sm">📞 {item.phone}</span>}
        </div>

        <div className="mt-8 grid md:grid-cols-2 gap-8">
          {/* Opening times */}
          <section>
            <h2 className="text-lg font-semibold">Opening times</h2>
            <div className="mt-3 rounded-xl border bg-white">
              <table className="w-full text-sm">
                <tbody>
                  {openingRows.length > 0 ? (
                    openingRows.map((r) => (
                      <tr key={r.day} className="border-b last:border-b-0">
                        <td className="px-4 py-2 font-medium w-32">{r.day}</td>
                        <td className="px-4 py-2">{r.times || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="px-4 py-2">No opening times listed.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Facilities */}
          <section>
            <h2 className="text-lg font-semibold">Facilities & accessibility</h2>
            {tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="chip">
                    {t}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-600">No facilities listed.</p>
            )}
          </section>
        </div>

        {/* Call button */}
        <div className="mt-8">
          {item.phone && (
            <a
              href={`tel:${item.phone.replace(/\s+/g, "")}`}
              className="rounded-xl px-4 py-2 bg-[#11b5d8] text-white hover:bg-[#0fa2c2]"
            >
              Call
            </a>
          )}
        </div>
      </main>
    </div>
  );
}

