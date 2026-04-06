import * as fs from "fs";
import * as path from "path";
import dotenv from "dotenv";

dotenv.config();

export interface PageConfig {
  name: string;
  path: string;
}

export interface SiteConfig {
  name: string;
  baseUrl: string;
  pages: PageConfig[];
  thresholds: {
    CLS: number;
    LCP: number;
    INP?: number;
  };
  httpCredentials?: {
    username: string;
    password: string;
  };
}

export function loadSiteConfig(): SiteConfig {
  const configPath = process.env.SITE_CONFIG || "sites/default.json";
  const absolutePath = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  const raw = fs.readFileSync(absolutePath, "utf-8");
  return JSON.parse(raw) as SiteConfig;
}
