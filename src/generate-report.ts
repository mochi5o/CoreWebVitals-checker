import * as fs from "fs";
import * as path from "path";

interface CwvResult {
  page: string;
  path: string;
  device?: string;
  CLS?: number;
  LCP?: number;
  timestamp: string;
}

interface Report {
  site: string;
  baseUrl: string;
  thresholds: { CLS: number; LCP: number; INP?: number };
  timestamp: string;
  results: CwvResult[];
}

function getStatus(
  value: number | undefined,
  threshold: number
): "good" | "needs-improvement" | "poor" | "n/a" {
  if (value === undefined) return "n/a";
  if (value < threshold) return "good";
  if (value < threshold * 2.5) return "needs-improvement";
  return "poor";
}

function formatValue(value: number | undefined, unit: string): string {
  if (value === undefined) return "-";
  if (unit === "ms") return `${Math.round(value)}ms`;
  return value.toFixed(4);
}

function statusEmoji(status: string): string {
  switch (status) {
    case "good":
      return "\u2705";
    case "needs-improvement":
      return "\u26a0\ufe0f";
    case "poor":
      return "\u274c";
    default:
      return "\u2796";
  }
}

function getWorstStatus(
  r: CwvResult,
  thresholds: Report["thresholds"]
): string {
  const clsStatus = getStatus(r.CLS, thresholds.CLS);
  const lcpStatus = getStatus(r.LCP, thresholds.LCP);
  if (clsStatus === "poor" || lcpStatus === "poor") return "poor";
  if (clsStatus === "needs-improvement" || lcpStatus === "needs-improvement")
    return "needs-improvement";
  if (clsStatus === "n/a" && lcpStatus === "n/a") return "n/a";
  return "good";
}

function groupByDevice(results: CwvResult[]): Map<string, CwvResult[]> {
  const groups = new Map<string, CwvResult[]>();
  for (const r of results) {
    const device = r.device || "Default";
    if (!groups.has(device)) groups.set(device, []);
    groups.get(device)!.push(r);
  }
  return groups;
}

export function printTerminalSummary(report: Report): void {
  const { thresholds, results } = report;

  console.log("");
  console.log(
    `\u2501\u2501\u2501 CWV Monitor: ${report.site} \u2501\u2501\u2501`
  );
  console.log(`URL: ${report.baseUrl}`);
  console.log(`Date: ${new Date(report.timestamp).toLocaleString("ja-JP")}`);
  console.log(
    `Thresholds: CLS < ${thresholds.CLS} | LCP < ${thresholds.LCP}ms`
  );

  const deviceGroups = groupByDevice(results);

  for (const [device, deviceResults] of deviceGroups) {
    console.log("");
    console.log(`\u25b6 ${device}`);

    const cols = { page: 20, cls: 12, lcp: 12 };
    const header = [
      "Page".padEnd(cols.page),
      "CLS".padEnd(cols.cls),
      "LCP".padEnd(cols.lcp),
      "Status",
    ].join(" | ");

    console.log(header);
    console.log("\u2500".repeat(header.length));

    for (const r of deviceResults) {
      const line = [
        r.page.padEnd(cols.page),
        formatValue(r.CLS, "").padEnd(cols.cls),
        formatValue(r.LCP, "ms").padEnd(cols.lcp),
        statusEmoji(getWorstStatus(r, thresholds)),
      ].join(" | ");
      console.log(line);
    }
  }

  console.log("");

  const passed = results.filter((r) => {
    const clsOk = r.CLS === undefined || r.CLS < thresholds.CLS;
    const lcpOk = r.LCP === undefined || r.LCP < thresholds.LCP;
    return clsOk && lcpOk;
  });

  console.log(
    `Result: ${passed.length}/${results.length} pages passed all thresholds`
  );
  console.log("");
}

export function generateHtmlReport(report: Report): string {
  const { thresholds, results } = report;
  const deviceGroups = groupByDevice(results);

  const deviceSections = Array.from(deviceGroups.entries())
    .map(([device, deviceResults]) => {
      const rows = deviceResults
        .map((r) => {
          const clsStatus = getStatus(r.CLS, thresholds.CLS);
          const lcpStatus = getStatus(r.LCP, thresholds.LCP);

          return `
          <tr>
            <td class="page-name">
              <a href="${report.baseUrl}${r.path}" target="_blank">${r.page}</a>
              <span class="page-path">${r.path}</span>
            </td>
            <td class="${clsStatus}">${formatValue(r.CLS, "")}</td>
            <td class="${lcpStatus}">${formatValue(r.LCP, "ms")}</td>
          </tr>`;
        })
        .join("\n");

      return `
      <div class="device-section">
        <h2>${device}</h2>
        <table>
          <thead>
            <tr>
              <th>Page</th>
              <th>CLS</th>
              <th>LCP</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CWV Report - ${report.site}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      color: #333;
      padding: 2rem;
    }
    .container { max-width: 900px; margin: 0 auto; }
    h1 {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .meta {
      color: #666;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }
    .meta span { margin-right: 1.5rem; }
    .thresholds {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .threshold-card {
      background: white;
      border-radius: 8px;
      padding: 1rem 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      flex: 1;
    }
    .threshold-card .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: #888;
      letter-spacing: 0.05em;
    }
    .threshold-card .value {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 0.25rem;
    }
    .device-section {
      margin-bottom: 2rem;
    }
    .device-section h2 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      padding-left: 0.25rem;
    }
    table {
      width: 100%;
      background: white;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-collapse: collapse;
      overflow: hidden;
    }
    th {
      text-align: left;
      padding: 0.75rem 1rem;
      background: #fafafa;
      border-bottom: 2px solid #eee;
      font-size: 0.8rem;
      text-transform: uppercase;
      color: #888;
      letter-spacing: 0.05em;
    }
    td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #f0f0f0;
      font-variant-numeric: tabular-nums;
    }
    tr:last-child td { border-bottom: none; }
    .page-name a {
      color: #333;
      text-decoration: none;
      font-weight: 500;
    }
    .page-name a:hover { color: #0066cc; text-decoration: underline; }
    .page-path {
      display: block;
      font-size: 0.75rem;
      color: #999;
      margin-top: 0.125rem;
    }
    td.good {
      color: #0cce6b;
      font-weight: 600;
    }
    td.needs-improvement {
      color: #ffa400;
      font-weight: 600;
    }
    td.poor {
      color: #ff4e42;
      font-weight: 600;
    }
    td.n-a { color: #ccc; }
    .legend {
      display: flex;
      gap: 1.5rem;
      margin-top: 1rem;
      font-size: 0.8rem;
      color: #888;
    }
    .legend-item::before {
      content: '';
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 0.375rem;
      vertical-align: middle;
    }
    .legend-good::before { background: #0cce6b; }
    .legend-ni::before { background: #ffa400; }
    .legend-poor::before { background: #ff4e42; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Core Web Vitals Report</h1>
    <div class="meta">
      <span>${report.site}</span>
      <span>${new Date(report.timestamp).toLocaleString("ja-JP")}</span>
    </div>

    <div class="thresholds">
      <div class="threshold-card">
        <div class="label">CLS Threshold</div>
        <div class="value">&lt; ${thresholds.CLS}</div>
      </div>
      <div class="threshold-card">
        <div class="label">LCP Threshold</div>
        <div class="value">&lt; ${thresholds.LCP}ms</div>
      </div>
    </div>

    ${deviceSections}

    <div class="legend">
      <span class="legend-item legend-good">Good</span>
      <span class="legend-item legend-ni">Needs Improvement</span>
      <span class="legend-item legend-poor">Poor</span>
    </div>
  </div>
</body>
</html>`;
}

// CLI実行時: 引数でJSONファイルを指定
if (require.main === module) {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    // 最新のレポートを自動検出
    const reportsDir = path.resolve(process.cwd(), "reports");
    const files = fs
      .readdirSync(reportsDir)
      .filter((f) => f.endsWith(".json"))
      .sort((a, b) => {
        const mtimeA = fs.statSync(path.join(reportsDir, a)).mtimeMs;
        const mtimeB = fs.statSync(path.join(reportsDir, b)).mtimeMs;
        return mtimeB - mtimeA;
      });

    if (files.length === 0) {
      console.error("No report files found in reports/");
      process.exit(1);
    }

    const latestPath = path.join(reportsDir, files[0]);
    const report: Report = JSON.parse(fs.readFileSync(latestPath, "utf-8"));

    printTerminalSummary(report);

    const htmlPath = latestPath.replace(/\.json$/, ".html");
    fs.writeFileSync(htmlPath, generateHtmlReport(report));
    console.log(`HTML report: ${htmlPath}`);
  } else {
    const absPath = path.isAbsolute(jsonPath)
      ? jsonPath
      : path.resolve(process.cwd(), jsonPath);
    const report: Report = JSON.parse(fs.readFileSync(absPath, "utf-8"));

    printTerminalSummary(report);

    const htmlPath = absPath.replace(/\.json$/, ".html");
    fs.writeFileSync(htmlPath, generateHtmlReport(report));
    console.log(`HTML report: ${htmlPath}`);
  }
}
