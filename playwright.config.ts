import { defineConfig, devices } from "@playwright/test";
import { loadSiteConfig } from "./src/config";

const siteConfig = loadSiteConfig();

export default defineConfig({
  globalSetup: "./src/global-setup.ts",
  globalTeardown: "./src/global-teardown.ts",
  testDir: "./src",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: siteConfig.baseUrl,
    headless: true,
    httpCredentials: siteConfig.httpCredentials,
  },
  projects: [
    {
      name: "Mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "Tablet",
      use: {
        browserName: "chromium",
        viewport: { width: 768, height: 1024 },
        userAgent:
          "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "Desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
  ],
});
