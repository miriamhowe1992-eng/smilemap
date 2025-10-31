// app/api/add-practice/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const BASE = path.resolve(process.cwd(), "..");
const OUTPUTS = path.join(BASE, "outputs");
const FILE = path.join(OUTPUTS, "private_practices.csv");

// Normalise UK postcode to "AB1 2CD"
const PC_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})\b/i;
function normalisePostcode(s: string): string {
  const m = PC_RE.exec(s || "");
  if (!m) return "";
  return `${m[1].toUpperCase()} ${m[2].toUpperCase()}`;
}

// Geocode full postcode; returns empty strings on failure
async function geocodePostcode(postcode: string): Promise<{ lat: string; lon: string }> {
  if (!postcode) return { lat: "", lon: "" };
  try {
    const res = await fetch(
      `https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.replace(/\s+/g, ""))}`
    );
    if (!res.ok) return { lat: "", lon: "" };
    const j = await res.json();
    const r = j?.result;
    if (r?.latitude && r?.longitude) {
      return { lat: String(r.latitude), lon: String(r.longitude) };
    }
  } catch {
    // ignore
  }
  return { lat: "", lon: "" };
}

export async function POST(req: Request) {
  try {
    await fs.mkdir(OUTPUTS, { recursive: true });
    const body = await req.json();

    // Honeypot (anti-bot). If present, silently succeed.
    if (body.company) return NextResponse.json({ ok: true });

    // Required fields
    const name = String(body.name || "").trim();
    const address = String(body.address || "").trim();
    const postcode = normalisePostcode(String(body.postcode || "").trim());
    const phone = String(body.phone || "").trim();

    if (!name || !address || !postcode || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Optional fields
    const url = String(body.url || "").trim();
    const facilities = String(body.facilities || "").trim();
    const practice_type = String(body.practice_type || "Private").trim() || "Private";
    const nhs_accepting = String(body.nhs_accepting || "Unknown").trim() || "Unknown";

    // 🔍 Live geocode now so the practice appears on the map immediately
    const { lat, lon } = await geocodePostcode(postcode);

    // Load current rows (if file exists)
    let rows: any[] = [];
    try {
      const txt = await fs.readFile(FILE, "utf8");
      rows = parse(txt, { columns: true, skip_empty_lines: true });
    } catch {
      // file will be created below
    }

    // Ensure header/columns consistent with your unified API
    const newRow = {
      source: "private",
      url,
      name,
      practice_type,         // Private | Mixed | NHS (if they choose)
      nhs_accepting,         // "Unknown" by default
      address,
      phone,
      opening_times: "",     // optional for now
      facilities,
      last_checked: new Date().toISOString(),
      postcode,
      lat,                   // ✅ filled now
      lon,                   // ✅ filled now
    };

    rows.push(newRow);

    const csv = stringify(rows, {
      header: true,
      columns: [
        "source",
        "url",
        "name",
        "practice_type",
        "nhs_accepting",
        "address",
        "phone",
        "opening_times",
        "facilities",
        "last_checked",
        "postcode",
        "lat",
        "lon",
      ],
    });

    await fs.writeFile(FILE, csv, "utf8");

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
