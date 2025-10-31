import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());
const OUT = resolve(ROOT, "outputs");

mkdirSync(OUT, { recursive: true });

console.log("🦷 Running SmileMap nightly NHS sync...");

try {
  // 🧠 Run your Python scraper
  execSync("python3 smilemap_nhs_sync.py", { stdio: "inherit" });
  console.log("✅ NHS data scrape completed successfully!");
} catch (err) {
  console.error("❌ Scrape failed:", err.message);
  process.exit(1);
}

console.log("📦 Done.");
