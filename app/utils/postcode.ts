// app/utils/postcode.ts

export function normalizePostcode(raw: string) {
  const pc = (raw || "").toUpperCase().replace(/\s+/g, "");
  return pc;
}

export function isFullPostcode(pc: string) {
  // UK full postcode regex (e.g. "IP12 1AB")
  return /^([A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2})$/.test(pc);
}

export function isOutcode(pc: string) {
  // Outcodes like "IP12", "SW1", "B1"
  return /^([A-Z]{1,2}\d[A-Z\d]?)$/.test(pc);
}
