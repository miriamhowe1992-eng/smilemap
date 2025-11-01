// scripts/scrape-core.mjs
import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const OUT = resolve(process.cwd(), "outputs");

function normaliseStatus(html = "") {
  const t = html.toLowerCase();
  if (t.includes("accepting new nhs patients")) return "Yes";
  if (t.includes("limited nhs availability")) return "Limited";
  if (t.includes("not accepting nhs patients")) return "No";
  return "Unknown";
}

// Pass in a list of practice objects with at least { url, name?, address?, postcode? }
export async function runScrape(practicesIndex = []) {
  await mkdir(OUT, { recursive: true });

  const items = [];
  for (const p of practicesIndex) {
    const baseUrl = (p.url || "").replace(/\/$/, "");
    const appointmentsUrl = `${baseUrl}/appointments`;

    let status = "Unknown";
    try {
      const res = await fetch(appointmentsUrl, { redirect: "follow" });
      const html = await res.text();
      status = normaliseStatus(html);
    } catch {
      // ignore network errors; keep "Unknown"
    }

    items.push({
      url: baseUrl,
      name: p.name || "",
      address: p.address || "",
      postcode: p.postcode || "",
      nhs_accepting: status,
      appointments_url: appointmentsUrl,
      last_checked: new Date().toISOString(),
    });
  }

  const snapshot = {
    generated_at: new Date().toISOString(),
    total: items.length,
    items,
  };

  await writeFile(resolve(OUT, "snapshot-latest.json"), JSON.stringify(snapshot, null, 2));
  return snapshot;
}
