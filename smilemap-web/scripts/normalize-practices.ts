/* eslint-disable no-console */
import { promises as fs } from "node:fs";
import path from "node:path";
import type { CleanPractice, NHSStatus } from "../lib/types";

// --- helpers ---------------------------------------------------
const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const stripTags = (html: string) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const toStatus = (text: string): NHSStatus => {
  const t = text.toLowerCase();
  if (/accepting new nhs patients/.test(t)) return "GREEN";
  if (/(limited nhs|children only|waiting list)/.test(t)) return "AMBER";
  if (/(not accepting new nhs|private only|private or referral only)/.test(t)) return "RED";
  return "UNKNOWN";
};

const statusNote = (s: NHSStatus): string => {
  switch (s) {
    case "GREEN": return "Accepting new NHS patients";
    case "AMBER": return "Limited NHS availability";
    case "RED":   return "Not accepting new NHS patients";
    default:      return "NHS availability not stated";
  }
};

const inferServices = (wholeText: string): string[] => {
  const t = wholeText.toLowerCase();
  const svc: string[] = [];
  if (/invisalign|clear aligner/.test(t)) svc.push("Invisalign");
  if (/implant/.test(t)) svc.push("Dental Implants");
  if (/hygien(e|ist)/.test(t)) svc.push("Hygiene");
  if (/orthodontic/.test(t)) svc.push("Orthodontics");
  if (/cosmetic/.test(t)) svc.push("Cosmetic Dentistry");
  if (/emergency/.test(t)) svc.push("Emergency");
  return Array.from(new Set(svc));
};

const inferAccess = (wholeText: string): string[] => {
  const t = wholeText.toLowerCase();
  const out: string[] = [];
  if (/wheelchair/.test(t)) out.push("Wheelchair access");
  if (/disabled toilet|accessible toilet/.test(t)) out.push("Accessible toilet");
  return out.length ? out : ["Not specified"];
};

const toOneLine = (s: string) => s.replace(/\s*,\s*/g, ", ").replace(/\s+/g, " ").trim();

// --- main ------------------------------------------------------
async function main() {
  const IN = path.join(process.cwd(), "data", "practices.json");      // your raw scrape
  const OUT = path.join(process.cwd(), "data", "practices.clean.json");

  const raw = JSON.parse(await fs.readFile(IN, "utf8")) as any[];

  // Your scraper likely stored different field names. We defensively map:
  const cleaned: CleanPractice[] = raw.map((r) => {
    // try multiple fields safely
    const name = (r.name || r.title || "").toString().trim();
    const addressText = toOneLine(
      stripTags(
        (r.address_text || r.address || r.addressLine || "").toString()
      )
    );

    // postcode heuristic
    const mPost = addressText.match(/[A-Z]{1,2}\d[A-Z0-9]?\s*\d[A-Z]{2}\b/i);
    const postcode = mPost ? mPost[0].toUpperCase() : (r.postcode || null);

    const phone =
      (r.phone || r.telephone || r.tel || "").toString().replace(/[^+\d]/g, "") || null;

    const nhsUrl = (r.nhs_url || r.url || r.pageUrl || null) as string | null;
    const idBase = name ? slugify(name) : (postcode ? slugify(postcode) : "unknown");
    const id = nhsUrl ? `${idBase}-${slugify(nhsUrl)}` : idBase;

    // the whole text we scraped (page content) to infer status/services
    const whole = stripTags(
      (r.status_text || r.page_text || r.html || r.text || "").toString()
    );

    const status = toStatus(whole);
    const services = inferServices(whole);
    const accessibility = inferAccess(whole);

    // website: prefer explicit, else NHS URL
    const website = (r.website || r.site || null) as string | null;

    return {
      id,
      name: name || "Unnamed Practice",
      addressLine: addressText || (postcode ?? ""),
      postcode: postcode || null,
      phone,
      website,
      nhsUrl,
      status,
      statusNote: statusNote(status),
      services,
      accessibility,
      lastUpdated: new Date().toISOString(),
    };
  });

  // dedupe by id (keep first)
  const seen = new Set<string>();
  const deduped = cleaned.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  await fs.writeFile(OUT, JSON.stringify(deduped, null, 2), "utf8");
  console.log(`Normalized ${deduped.length} practices → data/practices.clean.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
