// lib/format.ts
// Utilities to make scraped NHS text presentable.

export type PracticeLike = {
  url: string;
  name?: string;
  address?: string;
  postcode?: string;
  nhs_accepting?: string;
  opening_times?: string;
  facilities?: string;
};

export type OpeningRow = { day: string; times: string };

// UK postcode pattern (keeps full postcode like "IP12 2GA")
const UK_PC_RE = /\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s?(\d[A-Z]{2})\b/i;

/** Normalise the NHS status into UI-friendly labels & classes */
export function niceStatus(status = "Unknown") {
  const t = (status || "").toLowerCase();
  if (t === "yes")
    return { label: "Accepting all patients", color: "bg-green-500", bg: "bg-green-100", text: "text-green-700" };
  if (t === "limited")
    return { label: "Limited availability", color: "bg-amber-500", bg: "bg-amber-100", text: "text-amber-800" };
  if (t === "no")
    return { label: "No NHS availability", color: "bg-red-500", bg: "bg-red-100", text: "text-red-700" };
  return { label: "Status unknown", color: "bg-slate-400", bg: "bg-slate-100", text: "text-slate-700" };
}

/** Title-case & tidy helper */
function cleanTitle(s: string) {
  return s
    .replace(/\b(xv\d+|vk?\d+)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Try to derive a tidy practice name when it's missing */
export function deriveName(p: PracticeLike): string {
  const raw = (p.name || "").trim();
  if (raw) return raw;

  // Try "Facilities - {Name} - NHS"
  const m = /Facilities\s*-\s*(.*?)\s*-\s*NHS/i.exec(p.facilities || "");
  if (m?.[1]) return cleanTitle(m[1]);

  // Try URL slug last
  try {
    const u = new URL(p.url);
    const parts = u.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 2] || parts[parts.length - 1] || "";
    if (slug) return cleanTitle(slug.replace(/[-_]+/g, " "));
  } catch { /* ignore */ }

  return "NHS dental practice";
}

/**
 * Remove NHS boilerplate (Home / NHS services / Find a dentist / Go back),
 * redundant fragments, and repeated practice names. Keep up to the postcode.
 */
export function cleanAddress(raw: string = ""): string {
  if (!raw) return "";

  let s = raw.replace(/\s+/g, " ").trim();

  // Strip broken prefixes & service junk
  s = s
    .replace(/^(more|me|re|es)?\s*home\b.*?(nhs\s*services\b)?/i, "")
    .replace(/^(nhs\s*)?(services?|website)?\b.*?\bgo back\b/i, "")
    .replace(/\bfind a dentist\b/gi, "")
    .replace(/\bnhs services?\b/gi, "")
    .replace(/\breturn to\b/gi, "")
    .replace(/\bback to\b/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Collapse duplicated name fragments
  s = s.replace(/^(\b[\w’'-]+\b(?:\s+\b[\w’'-]+\b){1,4})\s+\1\b/i, "$1");

  // Trim after postcode if present
  const m = s.match(UK_PC_RE);
  if (m && typeof m.index === "number") {
    s = s.slice(0, m.index + m[0].length);
  }

  // Tidy end
  s = s.replace(/[,\.;:\-]\s*$/g, "").trim();
  return s;
}

/** Fallback address derivation if the given address is empty */
export function deriveAddress(p: PracticeLike): string {
  const a = (p.address || "").trim();
  if (a) return cleanAddress(a);

  // Try to pull an address fragment ending at the postcode from the facilities blob
  const f = p.facilities || "";
  const m = UK_PC_RE.exec(f);
  if (m) {
    const idx = m.index!;
    const start = Math.max(0, idx - 120);
    const fragment = f.slice(start, idx + m[0].length);
    const bits = fragment.split(",").map((x) => x.trim()).filter(Boolean);
    const last = bits.slice(-4).join(", ");
    return cleanAddress(last || m[0].toUpperCase());
  }

  if (p.postcode) return p.postcode.toUpperCase();
  return "Address unavailable";
}

/** Parse “Opening times … Monday … Tuesday …” blob into rows */
export function parseOpeningTimes(text = ""): OpeningRow[] {
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
  const rows: OpeningRow[] = [];
  const src = (text || "").replace(/\s+/g, " ");

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const next = days[i + 1];
    const re = new RegExp(`${d}\\s+([^]*?)${next ? next : "$"}`, "i");
    const m = re.exec(src);
    if (m) {
      const t = m[1].replace(/Day\s*Times/i, "").replace(/\s+/g, " ").trim();
      rows.push({ day: d, times: t || "Closed" });
    }
  }
  return rows.filter((r) => !!r.times);
}

/** Pull a small set of recognisable facility tags from the big blob */
export function extractFacilityTags(text = ""): string[] {
  const t = (text || "").toLowerCase();
  const tags: string[] = [];
  const add = (label: string, ...needles: string[]) => {
    if (needles.some((n) => t.includes(n))) tags.push(label);
  };

  add("Wheelchair access", "wheelchair", "step-free", "step free");
  add("Accessible toilet", "disabled toilet", "accessible toilet");
  add("Disabled parking", "disabled car parking", "disabled parking");
  add("Parking", "car park", "parking");
  add("Hearing loop", "hearing loop", "induction loop");
  add("Baby-changing", "baby-changing", "baby changing");
  add("Free Wi-Fi", "free public wifi", "free wifi");
  add("Bus stop nearby", "bus stop");
  add("Train station nearby", "train station");
  add("Cycle parking", "cycle parking");

  return Array.from(new Set(tags));
}
