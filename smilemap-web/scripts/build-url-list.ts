/* eslint-disable no-console */
import { promises as fs } from "node:fs";
import * as path from "node:path";

const IN = "found_urls.csv";                 // adjust if your CSV lives elsewhere
const OUT_DIR = "data";
const OUT_FILE = path.join(OUT_DIR, "urls.txt");

// We only want NHS dentist pages like:
// https://www.nhs.uk/services/dentist/<slug>/...
const NHS_HOST = "www.nhs.uk";
const DENTIST_PATH_SEG = "/services/dentist/";

async function main() {
  const csv = await fs.readFile(IN, "utf8");

  // Extract every http(s) URL from the CSV text
  const urls = Array.from(csv.matchAll(/https?:\/\/[^\s",]+/g)).map((m) => m[0].trim());

  // Keep only NHS dentist pages
  const filtered = urls.filter((u) => {
    try {
      const url = new URL(u);
      return url.hostname === NHS_HOST && url.pathname.includes(DENTIST_PATH_SEG);
    } catch {
      return false;
    }
  });

  // Deduplicate
  const unique = Array.from(new Set(filtered));

  // Write to data/urls.txt
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(OUT_FILE, unique.join("\n") + "\n");

  console.log(`Extracted ${unique.length} NHS dentist URLs → ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
