import * as cheerio from "cheerio";
import { Practice, NHSStatus, PracticeServices } from "./types";

const clean = (s?: string | null) => (s ?? "").replace(/\s+/g, " ").trim();

function mapStatus(text: string): NHSStatus {
  const t = text.toLowerCase();
  if (t.includes("accepting new nhs patients")) return "GREEN";
  if (t.includes("limited nhs availability")) return "AMBER";
  if (t.includes("not accepting") || t.includes("private or referral")) return "RED";
  return "UNKNOWN";
}

function detectServices(pageText: string): PracticeServices {
  const t = pageText.toLowerCase();
  return {
    invisalign: /invisalign|clear aligner/.test(t),
    implants: /implant/.test(t),
    sedation: /sedation/.test(t),
    emergency: /emergency|urgent dental/.test(t),
    orthodontics: /orthodontic|braces/.test(t),
    cosmetic: /cosmetic|whitening|veneers/.test(t),
    hygiene: /hygienist|hygiene/.test(t),
    wheelchair: /wheelchair|disabled access|accessible/.test(t),
  };
}

export function extractPractice(html: string, url: string): Practice {
  const $ = cheerio.load(html);

  // Tweak these selectors as needed after sampling a few pages.
  const name =
    clean($("h1").first().text()) ||
    clean($('[data-test="organisation-name"]').text());

  const address =
    clean($('[data-test="address"]').text()) ||
    clean($("address").text());

  const phone =
    clean($('[data-test="telephone"]').text()) ||
    clean($("a[href^='tel:']").first().text());

  const email =
    clean($("a[href^='mailto:']").first().attr("href")?.replace(/^mailto:/, ""));

  const website =
    clean($("a[href^='http']").filter((_, el) => $(el).text().toLowerCase().includes("website")).attr("href")) ||
    undefined;

  const statusText =
    clean($('[data-test="nhs-availability"]').text()) ||
    clean($(":contains('NHS availability')").next().text()) ||
    clean($(":contains('NHS patients')").parent().text());

  const status = mapStatus(statusText);

  const postcodeMatch = address.match(/[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}/i);
  const postcode = postcodeMatch ? postcodeMatch[0].toUpperCase().replace(/\s+/, " ") : undefined;

  const accessibility: string[] = [];
  $('[data-test="accessibility"] li, .accessibility li').each((_, el) => {
    const t = clean($(el).text());
    if (t) accessibility.push(t);
  });

  const pageText = $("body").text();
  const services = detectServices(pageText);

  const slug = (name || url)
    .toLowerCase()
    .replace(/https?:\/\/|www\./g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return {
    id: slug || `practice-${Math.random().toString(36).slice(2, 8)}`,
    name: name || "Unnamed practice",
    url,
    address,
    postcode,
    phone,
    email,
    website,
    status,
    statusNote: statusText,
    accessibility,
    services,
    lastFetched: new Date().toISOString(),
  };
}
