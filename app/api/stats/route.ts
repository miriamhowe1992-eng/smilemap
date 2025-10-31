import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";

export async function GET() {
  const BASE = path.resolve(process.cwd(), "..");
  const OUTPUTS = path.join(BASE, "outputs");

  // Pick whichever file exists
  const files = ["nhs_clean_geo.csv", "nhs_clean.csv", "nhs_fast_scrape.csv"];
  let csvPath = "";
  for (const f of files) {
    const p = path.join(OUTPUTS, f);
    try {
      await fs.access(p);
      csvPath = p;
      break;
    } catch {}
  }
  if (!csvPath) {
    return NextResponse.json({ ok: false, error: "No CSV found" }, { status: 404 });
  }

  const [csvText, stat] = await Promise.all([
    fs.readFile(csvPath, "utf8"),
    fs.stat(csvPath),
  ]);

  const rows = parse(csvText, { columns: true, skip_empty_lines: true });

  let counts = { Yes: 0, Limited: 0, No: 0, Unknown: 0 };
  for (const r of rows) {
    const v = (r.nhs_accepting || "Unknown").trim().toLowerCase();
    if (v === "yes") counts.Yes++;
    else if (v === "limited") counts.Limited++;
    else if (v === "no") counts.No++;
    else counts.Unknown++;
  }

return NextResponse.json({
  total: Number(total || 0),
  yes: Number(yes || 0),
  limited: Number(limited || 0),
  no: Number(no || 0),
  unknown: Number(unknown || 0),
  last_updated: new Date().toISOString(),
});
}
