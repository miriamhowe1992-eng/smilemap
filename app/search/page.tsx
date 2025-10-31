"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import {
  deriveName,
  deriveAddress,
  niceStatus,
  extractFacilityTags,
  cleanAddress,
  PracticeLike,
} from "@/lib/format";
import {
  normalizePostcode,
  isFullPostcode,
  isOutcode,
} from "@/app/utils/postcode";

const MapView = dynamic(() => import("@/components/Map"), { ssr: false });

type Practice = PracticeLike & {
  lat?: number | null;
  lon?: number | null;
  distance_km?: number | null;
};

const AVAIL_OPTIONS = ["All", "Yes", "Limited", "No", "Unknown"] as const;

function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip ${active ? "chip-active" : ""}`}
    >
      {children}
    </button>
  );
}

export default function SearchPage() {
  const [radius, setRadius] = useState<number>(25);
  const params = useSearchParams();
  const router = useRouter();
  const initialPostcode = (params.get("postcode") || "").trim();

  const [data, setData] = useState<Practice[]>([]);
  const [loading, setLoading] = useState(true);

  const [availability, setAvailability] =
    useState<(typeof AVAIL_OPTIONS)[number]>("All");
  const [wheelchair, setWheelchair] = useState(false);
  const [toilet, setToilet] = useState(false);
  const [parking, setParking] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const pc = normalizePostcode(initialPostcode);

    // Validate postcode before fetching
    if (pc && !isFullPostcode(pc) && !isOutcode(pc)) {
      console.warn("Invalid postcode:", pc);
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const search = new URLSearchParams();
    if (pc) search.set("postcode", pc);
    if (availability !== "All") search.set("availability", availability);
    if (wheelchair) search.set("wheelchair", "1");
    if (toilet) search.set("toilet", "1");
    if (parking) search.set("parking", "1");
    if (radius > 0) search.set("radius", String(radius));
    search.set("sort", "distance");
    search.set("limit", "500");

    fetch("/api/practices?" + search.toString())
      .then((r) => r.json())
      .then((res) => setData(res.items || []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [initialPostcode, availability, wheelchair, toilet, parking, radius]);

  const filtered = useMemo(() => {
    return (data || []).filter((p) => {
      if (q.trim() && !(p.address || "").toLowerCase().includes(q.toLowerCase()))
        return false;
      if (wheelchair && !(p.facilities || "").toLowerCase().includes("wheelchair"))
        return false;
      if (toilet && !(p.facilities || "").toLowerCase().includes("toilet"))
        return false;
      if (parking && !(p.facilities || "").toLowerCase().includes("parking"))
        return false;
      return true;
    });
  }, [data, q, wheelchair, toilet, parking]);

  const mapPoints = filtered
    .filter((p) => typeof p.lat === "number" && typeof p.lon === "number")
    .slice(0, 50)
    .map((p) => ({
      lat: p.lat as number,
      lon: p.lon as number,
      name: deriveName(p), // show the practice name on map popups
      url: p.url,
      address: cleanAddress(p.address || ""),
    }));

  function PostcodeBox() {
    const [pc, setPc] = useState(initialPostcode);
    return (
      <div>
        <label className="text-sm text-slate-600">Change postcode</label>
        <div className="mt-1 flex gap-2">
          <input
            value={pc}
            onChange={(e) => setPc(e.target.value)}
            placeholder="e.g. IP8 or SW1A 1AA"
            className="w-full rounded-xl border bg-white px-3 py-2"
          />
        </div>
        <button
          className="mt-2 rounded-xl px-4 py-2 bg-[#11b5d8] text-white hover:bg-[#0fa2c2]"
          onClick={() => {
            const q = encodeURIComponent(pc.trim());
            if (q) router.push(`/search?postcode=${q}`);
          }}
        >
          Go
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f6fbfc,#ffffff)]">
      {/* Top bar */}
      <div className="bg-white/80 backdrop-blur-md border-b">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
          <div /> {/* left side intentionally blank so no text under the logo */}
          <div className="text-sm text-slate-600">
            Postcode: <strong className="text-slate-800">{initialPostcode}</strong>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="rounded-2xl border bg-white/90 backdrop-blur p-4">
          <div className="grid lg:grid-cols-5 gap-3 items-end">
            {/* Availability */}
            <div>
              <label className="text-sm text-slate-600">NHS availability</label>
              <select
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2"
                value={availability}
                onChange={(e) => setAvailability(e.target.value as any)}
              >
                <option value="All">All availability statuses</option>
                <option value="Yes">🟢 Accepting all patients</option>
                <option value="Limited">🟠 Limited availability</option>
                <option value="No">🔴 Not accepting NHS</option>
                <option value="Unknown">⚪ Unknown</option>
              </select>
            </div>

            {/* Radius */}
            <div>
              <label className="text-sm text-slate-600">Radius</label>
              <select
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              >
                {[5, 10, 15, 25, 50].map((m) => (
                  <option key={m} value={m}>
                    {m} miles
                  </option>
                ))}
              </select>
            </div>

            {/* Facilities */}
            <div className="lg:col-span-2">
              <label className="text-sm text-slate-600 block mb-1">Facilities</label>
              <div className="flex flex-wrap gap-3">
                <Chip active={wheelchair} onClick={() => setWheelchair(!wheelchair)}>
                  ♿ Wheelchair
                </Chip>
                <Chip active={toilet} onClick={() => setToilet(!toilet)}>
                  🚻 Accessible Toilet
                </Chip>
                <Chip active={parking} onClick={() => setParking(!parking)}>
                  🅿️ Parking
                </Chip>
              </div>
            </div>

            {/* Refine results */}
            <div>
              <label className="text-sm text-slate-600">Refine results</label>
              <input
                className="mt-1 w-full rounded-xl border bg-white px-3 py-2"
                placeholder="Search by practice, street"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <PostcodeBox />
          </div>
        </div>
      </div>

      {/* Map */}
      {mapPoints.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pb-6">
          <MapView points={mapPoints} />
        </div>
      )}

      {/* Results */}
      <div className="mx-auto max-w-6xl px-4 pb-14">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm text-slate-600">
            {loading ? "Loading…" : `${filtered.length} result(s)`}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {filtered.map((p) => {
            const name = deriveName(p);
            const st = niceStatus(p.nhs_accepting);
            const tags = extractFacilityTags(p.facilities);
            const addressLine = cleanAddress(p.address || deriveAddress(p));

            return (
              <article
                key={p.url}
                className="rounded-2xl border bg-white/90 backdrop-blur p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold truncate">{name}</h3>
                    <p className="text-sm text-slate-600">{addressLine}</p>

                    {typeof p.distance_km === "number" && (
                      <p className="mt-1 text-sm text-slate-600">
                        📍 {p.distance_km.toFixed(1)} km away
                      </p>
                    )}
                    {p.phone && <p className="mt-1 text-sm">📞 {p.phone}</p>}
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-xl px-2 py-1 text-sm bg-white border">
                    <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                    {st.label}
                  </div>
                </div>

                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <span key={t} className="chip">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/practice?url=${encodeURIComponent(p.url)}`}
                    className="rounded-xl px-4 py-2 border hover:bg-slate-50"
                  >
                    View practice
                  </Link>
                  {p.phone && (
                    <a
                      href={`tel:${p.phone.replace(/\s+/g, "")}`}
                      className="rounded-xl px-4 py-2 bg-[#11b5d8] text-white hover:bg-[#0fa2c2]"
                    >
                      Call
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
