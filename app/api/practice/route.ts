// app/api/practice/route.ts
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

const BASE = path.resolve(process.cwd(), "..");
const OUTPUTS = path.join(BASE, "outputs");

// Normalise a URL for matching (drop query, lower-case host+path, trim trailing slash)
function norm(u: string): string {
  const s = (u || "").trim();
  try {
    const t = new URL(s);
    return (t.origin + t.pathname).toLowerCase().replace(/\/+$/g, "");
  } catch {
    return s.toLowerCase().replace(/\/+$/g, "");
  }
}

async function pickCsvPath(): Promise<string> {
  const geo = path.join(OUTPUTS, "nhs_clean_geo.csv");
  const clean = path.join(OUTPUTS, "nhs_clean.csv");
  const fast = path.join(OUTPUTS, "nhs_fast_scrape.csv");
  try { await fs.access(geo);   return geo;   } catch {}
  try { await fs.access(clean); return clean; } catch {}
  return fast;
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const raw = decodeURIComponent(sp.get("url") || "");
  if (!raw) return NextResponse.json({ items: [] });

  const want = norm(raw);

  // Load NHS rows
  let rows: any[] = [];
  try {
    const csvPath = await pickCsvPath();
    const txt = await fs.readFile(csvPath, "utf8");
    rows = parse(txt, { columns: true, skip_empty_lines: true }) as any[];
  } catch {}

  // Merge private rows if present
  try {
    const privPath = path.join(OUTPUTS, "private_practices.csv");
    const txt = await fs.readFile(privPath, "utf8");
    const priv = parse(txt, { columns: true, skip_empty_lines: true }) as any[];
    rows = rows.concat(priv);
  } catch {
    // ignore if file not there yet
  }

  // Find by normalised URL
  const hit = rows.find(r => norm(r.url || "") === want) || null;

  const item = hit
    ? {
        source: ((hit.source || "nhs") + "").toLowerCase().includes("private")
          ? "private"
          : "nhs",
        url: (hit.url || "").trim(),
        name: (hit.name || "").trim(),
        practice_type: (hit.practice_type || "").trim(),
        nhs_accepting: (hit.nhs_accepting || "Unknown").trim(),
        address: (hit.address || "").trim(),
        phone: (hit.phone || "").trim(),
        opening_times: (hit.opening_times || "").trim(),
        facilities: (hit.facilities || "").trim(),
        last_checked: (hit.last_checked || "").trim(),
        postcode: (hit.postcode || "").trim(),
        lat: hit.lat ? Number(hit.lat) : null,
        lon: hit.lon ? Number(hit.lon) : null,
      }
    : null;

  return NextResponse.json({ items: item ? [item] : [] });
}
