import fs from 'node:fs';
import path from 'node:path';

import { defineConfig } from '@playwright/test';

// No dotenv dependency: read .env.local ourselves.
for (const line of fs.existsSync('.env.local') ? fs.readFileSync('.env.local', 'utf8').split('\n') : []) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

/**
 * The demo recorder: separate from your test config, so `npx playwright test` never records.
 * Playwright captures the viewport only: no tabs, no address bar, no window chrome.
 *
 *   *.demo.ts    need a login (run after auth.setup.ts)
 *   *.public.ts  don't (landing pages, docs, public apps)
 */

const BASE_URL = process.env.DEMO_BASE_URL ?? 'http://localhost:3000';
const SIZE = { width: Number(process.env.DEMO_WIDTH ?? 1280), height: Number(process.env.DEMO_HEIGHT ?? 800) };
const STATE_PATH = path.join(__dirname, 'e2e/demo/.auth/state.json');

const shared = { baseURL: BASE_URL, viewport: SIZE, deviceScaleFactor: 2 };
const video = { mode: 'on' as const, size: SIZE };

export default defineConfig({
  testDir: './e2e/demo',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  timeout: 120_000,
  outputDir: './demo-out/raw',
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: shared },
    { name: 'demos', testMatch: '**/*.demo.ts', dependencies: ['setup'], use: { ...shared, storageState: STATE_PATH, video } },
    { name: 'public', testMatch: '**/*.public.ts', use: { ...shared, video } },
  ],
  // Starts your dev server if it isn't running. Set DEMO_DEV_COMMAND, or DEMO_BASE_URL to a live URL.
  webServer: process.env.DEMO_DEV_COMMAND
    ? { command: process.env.DEMO_DEV_COMMAND, url: BASE_URL, reuseExistingServer: true, timeout: 120_000 }
    : undefined,
});
