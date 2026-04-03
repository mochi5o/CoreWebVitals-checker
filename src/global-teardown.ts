import * as fs from "fs";
import * as path from "path";
import { loadSiteConfig } from "./config";
import { printTerminalSummary, generateHtmlReport } from "./generate-report";

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
  const baseName = `${siteConfig.name}_${timestamp}`;

  const report = {
    site: siteConfig.name,
    baseUrl: siteConfig.baseUrl,
    thresholds: siteConfig.thresholds,
    timestamp: new Date().toISOString(),
    results,
  };

  // JSON出力
  const jsonPath = path.join(reportsDir, `${baseName}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  // HTML出力
  const htmlPath = path.join(reportsDir, `${baseName}.html`);
  fs.writeFileSync(htmlPath, generateHtmlReport(report));

  // 一時ファイル削除
  fs.unlinkSync(resultsPath);

  // ターミナルサマリー
  printTerminalSummary(report);

  console.log(`JSON report: ${jsonPath}`);
  console.log(`HTML report: ${htmlPath}`);
}
