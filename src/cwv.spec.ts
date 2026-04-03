import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { loadSiteConfig } from "./config";

const siteConfig = loadSiteConfig();

// web-vitals IIFE版のソースをインラインで注入するために読み込む
const webVitalsScript = fs.readFileSync(
  path.resolve(__dirname, "../node_modules/web-vitals/dist/web-vitals.iife.js"),
  "utf-8"
);

const resultsPath = path.resolve(process.cwd(), "reports", ".results.jsonl");

for (const targetPage of siteConfig.pages) {
  test(`CWV: ${targetPage.name} (${targetPage.path})`, async ({ page }) => {
    // web-vitals をインラインで注入
    await page.addInitScript({
      content: `
        ${webVitalsScript}

        const metrics = {};
        window.__CWV__ = metrics;
        webVitals.onCLS((m) => { metrics.CLS = m.value; }, { reportAllChanges: true });
        webVitals.onLCP((m) => { metrics.LCP = m.value; });
      `,
    });

    await page.goto(targetPage.path, { waitUntil: "networkidle" });

    // スクロールでviewport外のCLSも検出
    await page.evaluate(async () => {
      const scrollHeight = document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      for (let y = 0; y < scrollHeight; y += viewportHeight) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 300));
      }
      window.scrollTo(0, scrollHeight);
      await new Promise((r) => setTimeout(r, 500));
    });

    // web-vitals の計測完了を待つ
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => (window as any).__CWV__);

    // 結果をJSONLファイルに追記（ワーカー再起動でもデータが失われない）
    const result = {
      page: targetPage.name,
      path: targetPage.path,
      CLS: metrics?.CLS,
      LCP: metrics?.LCP,
      timestamp: new Date().toISOString(),
    };
    fs.appendFileSync(resultsPath, JSON.stringify(result) + "\n");

    // 閾値チェック（soft assertionで全ページ計測を続行）
    if (metrics?.CLS !== undefined) {
      expect.soft(
        metrics.CLS,
        `CLS が閾値超過: ${metrics.CLS} (閾値: ${siteConfig.thresholds.CLS})`
      ).toBeLessThan(siteConfig.thresholds.CLS);
    }

    if (metrics?.LCP !== undefined) {
      expect.soft(
        metrics.LCP,
        `LCP が閾値超過: ${metrics.LCP}ms (閾値: ${siteConfig.thresholds.LCP}ms)`
      ).toBeLessThan(siteConfig.thresholds.LCP);
    }
  });
}
