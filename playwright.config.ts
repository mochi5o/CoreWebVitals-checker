import { defineConfig } from "@playwright/test";
import { loadSiteConfig } from "./src/config";

const siteConfig = loadSiteConfig();

export default defineConfig({
  testDir: "./src",
  testMatch: "**/*.spec.ts",
  fullyParallel: false,
  retries: 0,
  timeout: 30_000,
  use: {
    baseURL: siteConfig.baseUrl,
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
  ],
});
