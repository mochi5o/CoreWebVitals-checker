import * as fs from "fs";
import * as path from "path";
import { loadSiteConfig } from "./config";

export default function globalTeardown() {
  const siteConfig = loadSiteConfig();
  const reportsDir = path.resolve(process.cwd(), "reports");
  const resultsPath = path.join(reportsDir, ".results.jsonl");

  if (!fs.existsSync(resultsPath)) return;

  const lines = fs
    .readFileSync(resultsPath, "utf-8")
    .trim()
    .split("\n")
    .filter(Boolean);

  if (lines.length === 0) return;

  const results = lines.map((line) => JSON.parse(line));

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = path.join(
    reportsDir,
    `${siteConfig.name}_${timestamp}.json`
  );

  const report = {
    site: siteConfig.name,
    baseUrl: siteConfig.baseUrl,
    thresholds: siteConfig.thresholds,
    timestamp: new Date().toISOString(),
    results,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  fs.unlinkSync(resultsPath);

  console.log(`\nReport saved: ${reportPath}`);
}
