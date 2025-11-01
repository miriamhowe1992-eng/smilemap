// scripts/scrape.mjs
import { resolve } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { runScrape } from "./scrape-core.mjs";

const OUT = resolve(process.cwd(), "outputs");
await mkdir(OUT, { recursive: true });

/** ---------- helpers ---------- **/

function keyByUrl(items = []) {
  const m = new Map();
  for (const it of items) m.set(it.url, it);
  return m;
}

function diffSnapshots(prev, next) {
  const before = keyByUrl(prev.items || []);
  const after = keyByUrl(next.items || []);

  const added = [];
  const removed = [];
  const statusChanged = [];

  // Added
  for (const [url, it] of after) {
    if (!before.has(url)) added.push(it);
  }
  // Removed
  for (const [url, it] of before) {
    if (!after.has(url)) removed.push(it);
  }
  // Status changes
  for (const [url, now] of after) {
    const was = before.get(url);
    if (!was) continue;
    const from = (was.nhs_accepting || "Unknown");
    const to = (now.nhs_accepting || "Unknown");
    if (from !== to) {
      statusChanged.push({
        url,
        name: now.name || was.name || "",
        postcode: now.postcode || was.postcode || "",
        from,
        to,
      });
    }
  }

  return { added, removed, statusChanged };
}

async function loadPracticeIndex() {
  // Preferred: outputs/practice-index.json (lightweight list: url,name,address,postcode)
  try {
    const txt = await readFile(resolve(OUT, "practice-index.json"), "utf8");
    return JSON.parse(txt);
  } catch {}

  // Fallback: derive from last snapshot if present
  try {
    const prev = JSON.parse(
      await readFile(resolve(OUT, "snapshot-latest.json"), "utf8")
    );
    return (prev.items || []).map(({ url, name, address, postcode }) => ({
      url,
      name,
      address,
      postcode,
    }));
  } catch {}

  // Last resort: empty list
  return [];
}

/** ---------- main ---------- **/

(async () => {
  console.log("🦷 Running SmileMap nightly NHS sync...");

  // 1) Scrape fresh data
  const practicesIndex = await loadPracticeIndex();
  const snap = await runScrape(practicesIndex);

  // Keep a persistent "latest" snapshot as well as a dated one
  const dateStamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  await writeFile(
    resolve(OUT, `snapshot-${dateStamp}.json`),
    JSON.stringify(snap, null, 2),
    "utf8"
  );
  await writeFile(
    resolve(OUT, "snapshot-latest.json"),
    JSON.stringify(snap, null, 2),
    "utf8"
  );

  // 2) Diff with previous snapshot (used next run)
  let prev = { items: [] };
  try {
    prev = JSON.parse(
      await readFile(resolve(OUT, "snapshot-latest-prev.json"), "utf8")
    );
  } catch {
    // first run: no previous snapshot
  }

  const changes = diffSnapshots(prev, snap);

  // Write machine-readable changes (dated)
  await writeFile(
    resolve(OUT, `changes-${dateStamp}.json`),
    JSON.stringify(changes, null, 2),
    "utf8"
  );

  // 3) Human-readable markdown summary (always write timestamped + latest)
  const runAt = new Date();
  const iso = runAt.toISOString();
  const localTime = runAt.toLocaleString("en-GB", { timeZone: "Europe/London" });
  const fileStamp = iso.replace(/[:.]/g, "-"); // safe for filenames

  const md = [
    `# Nightly NHS changes (${iso})`,
    `Last run (UK time): ${localTime}`,
    ``,
    `**New practices:** ${changes.added.length}`,
    `**Removed practices:** ${changes.removed.length}`,
    `**Status changes:** ${changes.statusChanged.length}`,
    ``,
    `## Status changes`,
    ...(changes.statusChanged.length
      ? changes.statusChanged.map(
          (c) =>
            `- ${c.name || "Practice"} (${c.postcode || "—"}): *${c.from} → ${c.to}*`
        )
      : ["(none)"]),
    ``,
    `## New practices`,
    ...(changes.added.length
      ? changes.added.map(
          (p) => `- ${p.name || "Practice"} (${p.postcode || "—"}) — ${p.url}`
        )
      : ["(none)"]),
    ``,
    `## Removed practices`,
    ...(changes.removed.length
      ? changes.removed.map(
          (p) => `- ${p.name || "Practice"} (${p.postcode || "—"}) — ${p.url}`
        )
      : ["(none)"]),
  ].join("\n");

  await writeFile(resolve(OUT, `changes-${fileStamp}.md`), md, "utf8");
  await writeFile(resolve(OUT, "changes-latest.md"), md, "utf8");

  // 4) Save current snapshot as "prev" for next run
  await writeFile(
    resolve(OUT, "snapshot-latest-prev.json"),
    JSON.stringify(snap, null, 2),
    "utf8"
  );

  console.log("✅ NHS data scrape completed successfully!");
  console.log("📦 Done.");
})();
