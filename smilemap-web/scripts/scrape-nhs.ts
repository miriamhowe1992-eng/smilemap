/* eslint-disable no-console */
import { promises as fs } from "node:fs";
import { extractPractice } from "../lib/nhsExtractor";
import { Practice } from "../lib/types";
import { fetch } from "undici";
import pLimit from "p-limit";

const URLS_FILE = "data/urls.txt";
const OUT_FILE  = "data/practices.json";

const CONCURRENCY = Number(process.env.SCRAPER_CONCURRENCY || 4);
const TIMEOUT_MS  = Number(process.env.SCRAPER_TIMEOUT_MS || 20000);
const GAP_MS      = Number(process.env.SCRAPER_GAP_MS || 400);
const RETRIES     = Number(process.env.SCRAPER_RETRIES || 2);

const USER_AGENT  =
  process.env.SCRAPER_USER_AGENT ||
  "SmileMapBot/1.0 (+https://www.smilemap.co.uk) polite; contact: hello@smilemap.co.uk";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchHtml(url: string, attempt = 0): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "text/html, */*" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } catch (e) {
    if (attempt < RETRIES) {
      await sleep(1000 * (attempt + 1));
      return fetchHtml(url, attempt + 1);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function main() {
  await fs.mkdir("data", { recursive: true });
  const list = (await fs.readFile(URLS_FILE, "utf8"))
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Scraping ${list.length} NHS pages… (concurrency=${CONCURRENCY})`);

  const limit = pLimit(CONCURRENCY);
  const out: Practice[] = [];
  let done = 0;

  for (const url of list) {
    await sleep(GAP_MS); // polite queueing
    void limit(async () => {
      try {
        const html = await fetchHtml(url);
        const p = extractPractice(html, url);
        out.push(p);
      } catch (e: any) {
        console.warn(`fail: ${url} → ${e?.message || e}`);
      } finally {
        done++;
        if (done % 25 === 0) {
          console.log(`[progress] ${done}/${list.length} | saved=${out.length}`);
        }
      }
    });
  }

  await limit.clearQueue();
  await limit(() => Promise.resolve());

  out.sort((a, b) => a.name.localeCompare(b.name));
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2));
  console.log(`Saved ${out.length} practices → ${OUT_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
