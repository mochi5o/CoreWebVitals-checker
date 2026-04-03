import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";
import { loadSiteConfig } from "./config";

const siteConfig = loadSiteConfig();

interface CwvResult {
  page: string;
  path: string;
  CLS?: number;
  LCP?: number;
  timestamp: string;
}

const results: CwvResult[] = [];

for (const targetPage of siteConfig.pages) {
  test(`CWV: ${targetPage.name} (${targetPage.path})`, async ({ page }) => {
    // web-vitals の CLS / LCP を収集するスクリプトを注入
    await page.addInitScript({
      content: `
        const metrics = {};
        window.__CWV__ = metrics;

        // web-vitals CDN版を使用（addInitScript内ではnpmモジュールをimportできないため）
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/web-vitals@4/dist/web-vitals.iife.js';
        script.onload = () => {
          webVitals.onCLS((m) => { metrics.CLS = m.value; }, { reportAllChanges: true });
          webVitals.onLCP((m) => { metrics.LCP = m.value; });
        };
        document.head.appendChild(script);
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
      // 最後まで到達後、少し待つ
      window.scrollTo(0, scrollHeight);
      await new Promise((r) => setTimeout(r, 500));
    });

    // web-vitals の読み込みと計測完了を待つ
    await page.waitForTimeout(1000);

    const metrics = await page.evaluate(() => (window as any).__CWV__);

    const result: CwvResult = {
      page: targetPage.name,
      path: targetPage.path,
      CLS: metrics?.CLS,
      LCP: metrics?.LCP,
      timestamp: new Date().toISOString(),
    };
    results.push(result);

    // 閾値チェック
    if (metrics?.CLS !== undefined) {
      expect(
        metrics.CLS,
        `CLS が閾値超過: ${metrics.CLS} (閾値: ${siteConfig.thresholds.CLS})`
      ).toBeLessThan(siteConfig.thresholds.CLS);
    }

    if (metrics?.LCP !== undefined) {
      expect(
        metrics.LCP,
        `LCP が閾値超過: ${metrics.LCP}ms (閾値: ${siteConfig.thresholds.LCP}ms)`
      ).toBeLessThan(siteConfig.thresholds.LCP);
    }
  });
}

// 全テスト完了後にJSONレポートを出力
test.afterAll(async () => {
  const reportsDir = path.resolve(process.cwd(), "reports");
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${siteConfig.name}_${timestamp}.json`;
  const filePath = path.join(reportsDir, fileName);

  const report = {
    site: siteConfig.name,
    baseUrl: siteConfig.baseUrl,
    thresholds: siteConfig.thresholds,
    timestamp: new Date().toISOString(),
    results,
  };

  fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  console.log(`\nReport saved: ${filePath}`);
});
