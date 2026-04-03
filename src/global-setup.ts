import * as fs from "fs";
import * as path from "path";

export default function globalSetup() {
  const reportsDir = path.resolve(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 一時ファイルをクリア（前回の結果を消す）
  const resultsPath = path.join(reportsDir, ".results.jsonl");
  fs.writeFileSync(resultsPath, "");
}
