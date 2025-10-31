/* scripts/enrich-from-nhs.ts
 * Crawl each NHS page (/appointments), extract the “Routine dental care” section,
 * classify NHS patient availability (GREEN / AMBER / RED / UNKNOWN),
 * and save to data/practices.enriched.json.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import pLimit from "p-limit";
import { setTimeout as delay } from "node:timers/promises";
import * as cheerio from "cheerio";

type NHSStatus = "GREEN" | "AMBER" | "RED" | "UNKNOWN";

type CleanPractice = {
  id: string;
  name: string;
  addressLine?: string | null;
  postcode?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  nhsUrl?: string | null;
  services?: string[];
  accessibility?: string[];
  lastUpdated?: string;
};

type EnrichedPractice = CleanPractice & {
  status: NHSStatus;
  statusNote: string;
};

/* --------------------- URL & FETCH --------------------- */

function ensureAppointmentsUrl(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.endsWith("nhs.uk") && !u.pathname.endsWith("/appointments")) {
      u.pathname = u.pathname.replace(/\/$/, "") + "/appointments";
      return u.toString();
    }
  } catch {}
  return url;
}

async function fetchHtml(url: string): Promise<string | null> {
  const { fetch } = await import("undici");
  const UA = "Mozilla/5.0 (compatible; SmileMapBot/1.0; +https://www.smilemap.co.uk)";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": UA, accept: "text/html" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch {
      if (attempt === 3) return null;
      await delay(400 * attempt);
    }
  }
  return null;
}

/* --------------------- EXTRACTION --------------------- */

function pick(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Extract the “Routine dental care” block:
 * - Find a heading whose text matches "Routine dental care" (case-insensitive)
 * - Concatenate text of the next few block siblings until the next heading
 * Fallbacks:
 * - If not found, search any paragraph/list that mentions NHS/patients/accepting
 * - Last resort: whole page text
 */
function extractStatusText(html: string): string {
  const $ = cheerio.load(html);
  const isHeading = (tag?: string) => !!tag && /^(h1|h2|h3|h4)$/i.test(tag);

  // 1) Exact section: “Routine dental care”
  let routineBits: string[] = [];
  $("h1,h2,h3,h4").each((_, el) => {
    const htxt = pick($(el).text()).toLowerCase();
    if (/\broutine\s+dental\s+care\b/.test(htxt)) {
      let n = $(el).next();
      while (n.length) {
        const tag = n[0]?.tagName?.toLowerCase();
        if (isHeading(tag)) break; // stop at next heading
        if (["p", "li", "ul", "ol", "div", "section"].includes(tag || "")) {
          const t = pick(n.text() || "");
          if (t) routineBits.push(t);
        }
        n = n.next();
      }
    }
  });
  if (routineBits.length) return routineBits.join(" ");

  // 2) Fallback: nearby NHS/accepting paragraphs/lists
  const candidates: string[] = [];
  $("p,li").each((_, el) => {
    const t = pick($(el).text() || "");
    const tl = t.toLowerCase();
    if (
      /\bnhs\b/.test(tl) ||
      /\bpatients?\b/.test(tl) ||
      /\baccept(i?ng|s)\b/.test(tl) ||
      /\bwaiting\s*list\b/.test(tl) ||
      /\bchildren\s+only\b/.test(tl) ||
      /\bspecialist\b/.test(tl) ||
      /\breferral\b/.test(tl) ||
      /\broutine\s+dental\s+care\b/.test(tl)
    ) {
      candidates.push(t);
    }
  });
  if (candidates.length) {
    const score = (s: string) => {
      const tl = s.toLowerCase();
      let sc = 0;
      if (/\broutine\s+dental\s+care\b/.test(tl)) sc += 5;
      if (/\bnhs\b/.test(tl)) sc += 3;
      if (/\baccept/.test(tl) || /\btaking on\b/.test(tl)) sc += 2;
      if (/\bnot\b|\bno longer\b|\bprivate only\b|\breferral only\b/.test(tl)) sc += 2;
      if (/find out if this dentist accepts new nhs patients/i.test(tl)) sc -= 5;
      return sc;
    };
    return candidates.sort((a, b) => score(b) - score(a))[0];
  }

  // 3) Last resort: whole page
  return pick($("body").text() || "");
}

/* --------------------- CLASSIFICATION --------------------- */

/**
 * Map the exact lines you posted into statuses.
 * We evaluate RED first (strict denial), then AMBER (limited/conditional),
 * then GREEN (explicit acceptance), else UNKNOWN.
 */
function classifyStatusFromText(text: string): { code: NHSStatus; note: string } {
  let t = text.toLowerCase().replace(/\s+/g, " ");

  const has = (re: RegExp) => re.test(t);

  // --- RED (deny routine NHS, or specialist/referral-only) ---
  if (
    // Your exact line:
    has(/\bthis dentist does not currently accept new nhs patients for routine dental care\b/) ||
    // Variants:
    has(/\bnot\s+accept(?:ing|s)\s+new\s+nhs\s+patients\b/) ||
    has(/\bno\s+longer\s+accept(?:ing|s)\b.*\bnhs\b/) ||
    has(/\bclosed\s+to\s+nhs\b/) ||
    has(/\bprivate\s+only\b/) ||
    has(/\bonly\s+taking\s+new\s+nhs\s+patients\s+for\s+specialist\s+dental\s+care\b.*\breferral\b/) ||
    has(/\bonly\s+accepts?.*\bspecialist\b.*\breferral\b/)
  ) {
    return {
      code: "RED",
      note:
        "Not accepting new NHS patients for routine care / specialist by referral only",
    };
  }

  // --- AMBER (limited/conditional) ---
  if (
    // “When availability allows…” pattern you posted
    has(/\bwhen\s+availability\s+allows\b.*\baccepts?\s+new\s+nhs\s+patients\b/) ||
    // “Children only”
    has(/\bchildren\s+only\b/) ||
    has(/\baccepting\s+children\b/) ||
    // “Adults entitled to free dental care”
    has(/\badults\s+entitled\s+to\s+free\s+dental\s+care\b/) ||
    // Common limited signals
    has(/\blimited\s+nhs\s+availability\b/) ||
    has(/\bwaiting\s*list\b/)
  ) {
    return {
      code: "AMBER",
      note: "Limited NHS availability / children-only / conditional acceptance",
    };
  }

  // --- GREEN (explicit acceptance) ---
  if (
    has(/\baccept(ing|s)\s+(new\s+)?nhs\s+(patients|adults|children)\b/) ||
    has(/\btaking\s+on\s+(new\s+)?nhs\b/) ||
    has(/\bnew\s+nhs\s+patients\s+welcome\b/) ||
    has(/\bcurrently\s+taking\s+on\s+nhs\s+patients\b/)
  ) {
    return { code: "GREEN", note: "Accepting new NHS patients" };
  }

  // --- UNKNOWN (mentions NHS but unclear or “has not confirmed…”) ---
  if (/\bnhs\b/.test(t)) {
    if (has(/\bhas\s+not\s+confirmed\b.*\baccept\b.*\bnew\s+nhs\s+patients\b/)) {
      return {
        code: "UNKNOWN",
        note: "Has not confirmed if accepting new NHS patients",
      };
    }
    return { code: "UNKNOWN", note: "Provides NHS care but availability unclear" };
  }

  return { code: "UNKNOWN", note: "NHS availability not stated" };
}

/* --------------------- MAIN --------------------- */

function enrichOne(p: CleanPractice, html: string | null): EnrichedPractice {
  if (!p.nhsUrl || !html) {
    return { ...p, status: "UNKNOWN", statusNote: "NHS availability not stated" };
  }
  const snippet = extractStatusText(html);
  const { code, note } = classifyStatusFromText(snippet);
  return { ...p, status: code, statusNote: note };
}

async function main() {
  const IN = path.join("data", "practices.clean.json");
  const OUT = path.join("data", "practices.enriched.json");
  const DEBUG = path.join("data", "debug_unknown_samples.txt");

  const raw = await fs.readFile(IN, "utf8");
  const list = JSON.parse(raw) as CleanPractice[];

  const limit = pLimit(6);
  let done = 0;

  const enriched: EnrichedPractice[] = await Promise.all(
    list.map((p) =>
      limit(async () => {
        const url = p.nhsUrl ? ensureAppointmentsUrl(p.nhsUrl) : null;
        const html = url ? await fetchHtml(url) : null;
        const e = enrichOne(p, html);
        done++;
        if (done % 100 === 0) process.stdout.write(`\rProcessed ${done}/${list.length}   `);
        return e;
      })
    )
  );

  await fs.writeFile(OUT, JSON.stringify(enriched, null, 2), "utf8");

  const unknowns = enriched.filter((p) => p.status === "UNKNOWN").slice(0, 50);
  const debugLines = unknowns.map(
    (u) =>
      `=== ${u.name}\nURL: ${u.nhsUrl ?? ""}\nNote: ${u.statusNote}\n`
  );
  if (debugLines.length) {
    await fs.writeFile(DEBUG, debugLines.join("\n"), "utf8");
    console.log(`Wrote ${unknowns.length} UNKNOWN samples → ${DEBUG}`);
  }

  const stats = enriched.reduce(
    (acc, p) => ((acc[p.status]++, acc)),
    { GREEN: 0, AMBER: 0, RED: 0, UNKNOWN: 0 } as Record<NHSStatus, number>
  );
  console.log(
    `Status counts → GREEN: ${stats.GREEN} | AMBER: ${stats.AMBER} | RED: ${stats.RED} | UNKNOWN: ${stats.UNKNOWN}`
  );
  console.log(`Saved enriched dataset → ${OUT} (${enriched.length} practices)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
