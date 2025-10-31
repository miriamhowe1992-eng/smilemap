import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

/* ---------------- helpers ---------------- */

function hasFlag(text: string, needles: string[]) {
  const t = (text || "").toLowerCase();
  return needles.some((n) => t.includes(n));
}

type Coords = { lat: number; lon: number };
type Cache = Record<string, Coords>;

type PracticeRow = {
  source: "nhs" | "private";
  url: string;
  name: string;
  practice_type: string; // NHS | Private | Mixed
  nhs_accepting: string;
  address: string;
  phone: string;
  opening_times: string;
  facilities: string;
  last_checked: string;
  postcode: string;
  lat: number | null;
  lon: number | null;
  distance_km?: number | null;
};

/** Paths */
const BASE = path.resolve(process.cwd(), "..");
const OUTPUTS = path.join(BASE, "outputs");
const CACHE_DIR = path.join(BASE, ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "geocode-cache.json");
const FEATURED_FILE = path.join(OUTPUTS, "featured_practices.json");

/** cache helpers */
async function loadCache(): Promise<Cache> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    const txt = await fs.readFile(CACHE_FILE, "utf8");
    return JSON.parse(txt || "{}");
  } catch {
    return {};
  }
}
async function saveCache(c: Cache) {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  await fs.writeFile(CACHE_FILE, JSON.stringify(c), "utf8");
}

/** Geocoding helpers */
async function geocodeFromInput(input: string, cache: Cache): Promise<Coords | null> {
  const raw = (input || "").toUpperCase().replace(/\s+/g, "");
  if (!raw) return null;

  if (cache[raw]) return cache[raw];

  // Try full postcode
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${raw}`);
    if (res.ok) {
      const j = await res.json();
      if (j?.result?.latitude && j?.result?.longitude) {
        const val = { lat: j.result.latitude, lon: j.result.longitude };
        cache[raw] = val;
        return val;
      }
    }
  } catch {}

  // Try OUTCODE (like "IP1" or "EH2")
  const outcodeMatch = /^[A-Z]{1,2}\d[A-Z0-9]?/i.exec(raw);
  const outcode = outcodeMatch ? outcodeMatch[0].toUpperCase() : null;
  if (outcode) {
    if (cache[outcode]) return cache[outcode];
    try {
      const res = await fetch(`https://api.postcodes.io/outcodes/${outcode}`);
      if (res.ok) {
        const j = await res.json();
        if (j?.result?.latitude && j?.result?.longitude) {
          const val = { lat: j.result.latitude, lon: j.result.longitude };
          cache[outcode] = val;
          return val;
        }
      }
    } catch {}
  }

  return null;
}

/** bulk postcode geocode */
async function geocodeBulk(postcodes: string[], cache: Cache): Promise<Map<string, Coords>> {
  const out = new Map<string, Coords>();
  const toQuery = postcodes.map((p) => (p || "").toUpperCase()).filter((p) => p && !cache[p]);

  // fill from cache first
  for (const p of postcodes.map((x) => (x || "").toUpperCase())) {
    if (cache[p]) out.set(p, cache[p]);
  }
  if (toQuery.length === 0) return out;

  for (let i = 0; i < toQuery.length; i += 100) {
    const chunk = toQuery.slice(i, i + 100);
    try {
      const res = await fetch("https://api.postcodes.io/postcodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postcodes: chunk }),
      });
      if (!res.ok) continue;
      const j = await res.json();
      for (const r of j?.result || []) {
        const q = (r?.query || "").toUpperCase();
        const rr = r?.result;
        if (q && rr?.latitude && rr?.longitude) {
          const val = { lat: rr.latitude, lon: rr.longitude };
          cache[q] = val;
          out.set(q, val);
        }
      }
    } catch {}
  }
  return out;
}

/** Distance calculator */
function haversineKm(a: Coords, b: Coords): number {
  const R = 6371;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ---------------- API ---------------- */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postcode = (searchParams.get("postcode") || "").trim();
  const availability = (searchParams.get("availability") || "All").trim();
  const wheelchair = searchParams.get("wheelchair") === "1";
  const toilet = searchParams.get("toilet") === "1";
  const parking = searchParams.get("parking") === "1";
  const limit = Math.min(Number(searchParams.get("limit") || 500), 1000);
  const sort = (searchParams.get("sort") || "distance").trim();
  const radiusMiles = Number(searchParams.get("radius") || "0");
  const radiusKm = radiusMiles > 0 ? radiusMiles * 1.609344 : 0;
  const practiceType = (searchParams.get("practice_type") || "All").trim();

  // Prefer the geo-enriched file
  const geo = path.join(OUTPUTS, "nhs_clean_geo.csv");
  const clean = path.join(OUTPUTS, "nhs_clean.csv");
  const fast = path.join(OUTPUTS, "nhs_fast_scrape.csv");

  let csvPath = geo;
  try { await fs.access(csvPath); } catch { csvPath = clean; }
  try { await fs.access(csvPath); } catch { csvPath = fast; }

  // Read NHS data
  let csvText = "";
  try {
    csvText = await fs.readFile(csvPath, "utf8");
  } catch {
    return NextResponse.json({ total: 0, items: [] });
  }
  const records: any[] = parse(csvText, { columns: true, skip_empty_lines: true });

  // Read Private data (if any)
  let privateRowsRaw: any[] = [];
  try {
    const privPath = path.join(OUTPUTS, "private_practices.csv");
    const txt = await fs.readFile(privPath, "utf8");
    privateRowsRaw = parse(txt, { columns: true, skip_empty_lines: true });
  } catch {}

  // Normalise NHS rows
  const nhsRows: PracticeRow[] = records.map((r) => ({
    source: "nhs",
    url: (r.url || "").trim(),
    name: (r.name || "").trim(),
    practice_type: (r.practice_type || "NHS").trim(),
    nhs_accepting: (r.nhs_accepting || "Unknown").trim(),
    address: (r.address || "").trim(),
    phone: (r.phone || "").trim(),
    opening_times: (r.opening_times || "").trim(),
    facilities: (r.facilities || "").trim(),
    last_checked: (r.last_checked || "").trim(),
    postcode: (r.postcode || "").trim(),
    lat: r.lat ? Number(r.lat) : null,
    lon: r.lon ? Number(r.lon) : null,
  }));

  // Normalise Private rows
  const privRows: PracticeRow[] = privateRowsRaw.map((r) => ({
    source: "private",
    url: (r.url || "").trim(),
    name: (r.name || "").trim(),
    practice_type: "Private",
    nhs_accepting: (r.nhs_accepting || "Unknown").trim(),
    address: (r.address || "").trim(),
    phone: (r.phone || "").trim(),
    opening_times: (r.opening_times || "").trim(),
    facilities: (r.facilities || "").trim(),
    last_checked: (r.last_checked || "").trim(),
    postcode: (r.postcode || "").trim(),
    lat: r.lat ? Number(r.lat) : null,
    lon: r.lon ? Number(r.lon) : null,
  }));

  let rows: PracticeRow[] = [...nhsRows, ...privRows];

  // Apply filters
  if (availability !== "All") {
    const want = availability.toLowerCase();
    rows = rows.filter((p) => (p.nhs_accepting || "").toLowerCase() === want);
  }
  if (practiceType !== "All") {
    const want = practiceType.toLowerCase();
    rows = rows.filter((p) => (p.practice_type || "").toLowerCase() === want);
  }
  if (wheelchair) rows = rows.filter((p) => hasFlag(p.facilities, ["wheelchair", "accessible"]));
  if (toilet) rows = rows.filter((p) => hasFlag(p.facilities, ["toilet", "disabled toilet"]));
  if (parking) rows = rows.filter((p) => hasFlag(p.facilities, ["car park", "car parking", "parking"]));

  // FEATURED BOOST
  let featured: Record<string, { featured_until: string }> = {};
  try {
    const txt = await fs.readFile(FEATURED_FILE, "utf8");
    featured = JSON.parse(txt || "{}");
  } catch {}
  const now = Date.now();
  rows = rows.map((r) => {
    const f = featured[r.url];
    const active = f ? new Date(f.featured_until).getTime() > now : false;
    return { ...r, __featured: active ? 1 : 0 };
  });

  // Geocode + distance
  const cache = await loadCache();
  let origin: Coords | null = null;
  if (postcode) origin = await geocodeFromInput(postcode, cache);

  if (origin) {
    const missingPCs = rows.filter((r) => (!r.lat || !r.lon) && r.postcode).map((r) => r.postcode);
    const pcToCoords = await geocodeBulk(Array.from(new Set(missingPCs)), cache);

    rows = rows.map((r) => {
      let lat = r.lat, lon = r.lon;
      if ((!lat || !lon) && r.postcode) {
        const c = pcToCoords.get(r.postcode.toUpperCase());
        if (c) { lat = c.lat; lon = c.lon; }
      }
      const distance_km = lat && lon ? haversineKm(origin!, { lat, lon }) : null;
      return { ...r, lat, lon, distance_km };
    });

    if (radiusKm > 0)
      rows = rows.filter((r) => r.distance_km != null && r.distance_km <= radiusKm);

    rows.sort((a, b) => {
      if (b.__featured !== a.__featured) return b.__featured - a.__featured;
      if (sort === "distance") {
        const da = a.distance_km ?? Number.POSITIVE_INFINITY;
        const db = b.distance_km ?? Number.POSITIVE_INFINITY;
        return da - db;
      }
      return 0;
    });
  }

  await saveCache(cache);

  const items = rows.slice(0, limit);
  return NextResponse.json({ total: rows.length, items });
}
