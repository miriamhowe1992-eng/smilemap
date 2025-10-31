# --- Geo export utilities (postcode extraction, caching, bulk geocode) ---

import os
import csv
import json
import re
import urllib.request
import urllib.error
from typing import Dict, List, Tuple

# UK postcode (outward + inward). Case-insensitive; we normalize to upper later.
UK_POSTCODE_RE = re.compile(r"\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s*(\d[A-Z]{2})\b", re.IGNORECASE)

def extract_postcode(addr: str) -> str:
    """
    Pull a UK postcode from a free-form address blob.
    Returns normalized 'AA1 1AA' (uppercased with a single space) or ''.
    """
    if not addr:
        return ""
    m = UK_POSTCODE_RE.search(addr)
    if not m:
        return ""
    return (m.group(1) + " " + m.group(2)).upper().strip()

def _load_json(path: str) -> dict:
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f) or {}
    except Exception:
        return {}

def _save_json(path: str, data: dict):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False)

def _postcodes_io_bulk(postcodes: List[str]) -> Dict[str, Dict[str, float]]:
    """
    Bulk geocode using postcodes.io.
    Returns { 'POSTCODE': {'lat': float, 'lon': float}, ... }
    """
    if not postcodes:
        return {}
    req = urllib.request.Request(
        "https://api.postcodes.io/postcodes",
        data=json.dumps({"postcodes": postcodes}).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"[geo] bulk request failed ({len(postcodes)} pcs): {e}")
        return {}

    out: Dict[str, Dict[str, float]] = {}
    for item in (payload or {}).get("result", []) or []:
        q = ((item or {}).get("query") or "").upper()
        rr = (item or {}).get("result") or {}
        lat = rr.get("latitude")
        lon = rr.get("longitude")
        if q and isinstance(lat, (int, float)) and isinstance(lon, (int, float)):
            out[q] = {"lat": float(lat), "lon": float(lon)}
    return out

def write_geo_export():
    """
    Reads outputs/nhs_clean.csv, extracts/normalizes postcodes,
    bulk geocodes missing ones with caching, and writes
    outputs/nhs_clean_geo.csv with extra columns: postcode, lat, lon.
    """
    # Expect OUTPUTS_DIR to be defined elsewhere in this module.
    src = os.path.join(OUTPUTS_DIR, "nhs_clean.csv")
    if not os.path.exists(src):
        print("ℹ️  outputs/nhs_clean.csv not found; run write_clean_export() first or ensure the file exists.")
        return

    dst = os.path.join(OUTPUTS_DIR, "nhs_clean_geo.csv")
    cache_path = os.path.join(os.path.dirname(OUTPUTS_DIR), ".cache", "geocode-cache.json")

    cache: Dict[str, Dict[str, float]] = _load_json(cache_path)

    # Read source rows
    with open(src, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    # Collect postcodes to look up
    to_lookup: List[str] = []
    for r in rows:
        pc = (r.get("postcode") or "").strip() or extract_postcode(r.get("address", ""))
        pc = pc.upper()
        r["postcode"] = pc
        if pc and pc not in cache:
            to_lookup.append(pc)

    # Bulk geocode missing postcodes in chunks of 100
    unique_missing = sorted(set(to_lookup))
    looked_up_ok = 0
    for i in range(0, len(unique_missing), 100):
        chunk = unique_missing[i:i+100]
        results = _postcodes_io_bulk(chunk)
        for k, v in results.items():
            cache[k] = {"lat": v["lat"], "lon": v["lon"]}
            looked_up_ok += 1

    # Save cache if we added anything
    if looked_up_ok:
        _save_json(cache_path, cache)
        print(f"📦 Geocode cache updated — looked up {looked_up_ok}, cache size {len(cache)}")

    # Prepare output header (append extra cols if not present)
    base_fields = rows[0].keys() if rows else []
    extras = ["postcode", "lat", "lon"]
    fieldnames = list(dict.fromkeys([*base_fields, *extras]))  # preserve order, avoid dups

    # Write enriched CSV
    latlon_filled = 0
    with open(dst, "w", newline="", encoding="utf-8") as out:
        writer = csv.DictWriter(out, fieldnames=fieldnames)
        writer.writeheader()
        for r in rows:
            pc = (r.get("postcode") or "").upper()
            lat = lon = ""
            if pc and pc in cache:
                lat = cache[pc]["lat"]
                lon = cache[pc]["lon"]
                latlon_filled += 1
            r_out = dict(r)
            r_out.update({"postcode": pc, "lat": lat, "lon": lon})
            writer.writerow(r_out)

    missing = len(rows) - latlon_filled
    print(f"🗺️  Wrote geo-enriched CSV → {dst}  (rows: {len(rows)}, lat/lon filled: {latlon_filled}, missing: {missing})")
