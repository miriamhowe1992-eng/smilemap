import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const OUTPUTS = path.resolve(process.cwd(), "..", "outputs");
const FILE = path.join(OUTPUTS, "private_practices.csv");

// very light postcode cleanup (server side)
const PC_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})\b/i;
function normPostcode(s: string) {
  const m = PC_RE.exec(s || "");
  if (!m) return "";
  return `${m[1].toUpperCase()} ${m[2].toUpperCase()}`;
}

async function geocode(postcode: string) {
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
    if (!res.ok) return { lat: "", lon: "" };
    const j = await res.json();
    const r = j?.result;
    return r ? { lat: String(r.latitude), lon: String(r.longitude) } : { lat: "", lon: "" };
  } catch {
    return { lat: "", lon: "" };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // honeypot
    if (body.company) return NextResponse.json({ ok: true });

    // required
    const name = (body.name || "").toString().trim();
    const address = (body.address || "").toString().trim();
    const postcode = normPostcode((body.postcode || "").toString());
    const phone = (body.phone || "").toString().trim();

    if (!name || !address || !postcode || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const practice_type = (body.practice_type || "Private").toString();
    const nhs_accepting = (body.nhs_accepting || "Unknown").toString();
    const website = (body.website || "").toString().trim();

    const wheelchair = body.wheelchair ? "1" : "";
    const toilet = body.toilet ? "1" : "";
    const parking = body.parking ? "1" : "";

    const { lat, lon } = await geocode(postcode);

    // ensure outputs dir exists
    await fs.mkdir(OUTPUTS, { recursive: true });

    // create file with header if missing
    try { await fs.access(FILE); }
    catch {
      const header = [
        "url","name","practice_type","nhs_accepting","address","postcode","phone",
        "opening_times","facilities","last_checked","lat","lon","source"
      ].join(",") + "\n";
      await fs.writeFile(FILE, header, "utf8");
    }

    // normalize row
    const now = new Date().toISOString();
    const facilitiesBits: string[] = [];
    if (wheelchair) facilitiesBits.push("wheelchair access");
    if (toilet) facilitiesBits.push("disabled toilet");
    if (parking) facilitiesBits.push("parking");

    const url = website || ""; // optional
    const fields = [
      url.replace(/,/g," "),
      name.replace(/,/g," "),
      practice_type,
      nhs_accepting,
      address.replace(/,/g," "),
      postcode,
      phone.replace(/,/g," "),
      "", // opening_times (optional for now)
      facilitiesBits.join("; ").replace(/,/g," "),
      now,
      lat, lon,
      "private_form"
    ];

    await fs.appendFile(FILE, fields.join(",") + "\n", "utf8");
    return NextResponse.json({ ok: true });
  } catch (e:any) {
    return NextResponse.json({ error: e.message || "Server error" }, { status: 500 });
  }
}
