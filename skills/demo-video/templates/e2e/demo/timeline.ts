import fs from 'node:fs';
import path from 'node:path';

import type { Locator, Page } from '@playwright/test';

/**
 * Trim marks and stills.
 *
 * Playwright starts recording when the browser context starts, so every raw clip opens
 * with the app booting: 5–20 seconds of splash nobody should watch. `cue()` marks where
 * the demo really begins and `cut()` where it ends; `scripts/render-demo.sh` keeps only
 * what's in between. Anything after `cut()` (undoing the demo's own edits, most
 * importantly) is recorded but never ships.
 */

const TRIM = path.join(process.cwd(), 'demo-out', 'trim');
/** Where finished assets go. Point it at your docs' public folder, e.g. public/docs-media. */
export const MEDIA_DIR = process.env.DEMO_MEDIA_DIR ?? path.join(process.cwd(), 'demo-out', 'media');

export function clock(): number {
  return Date.now();
}

/** The demo starts here. `name` must match the test title, kebab-cased. */
export async function cue(name: string, t0: number): Promise<void> {
  fs.mkdirSync(TRIM, { recursive: true });
  const seconds = Math.max(0, (Date.now() - t0) / 1000 - 0.4); // 0.4 s lead-in
  fs.writeFileSync(path.join(TRIM, `${name}.txt`), seconds.toFixed(2));
}

/** The demo ends here. Whatever follows is trimmed off. */
export async function cut(name: string, t0: number): Promise<void> {
  fs.mkdirSync(TRIM, { recursive: true });
  const seconds = (Date.now() - t0) / 1000 + 0.3; // 0.3 s tail
  fs.writeFileSync(path.join(TRIM, `${name}.end.txt`), seconds.toFixed(2));
}

/** A PNG straight into the media folder. Use it for state, and video for motion. */
export async function shot(target: Page | Locator, name: string): Promise<void> {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });
  await target.screenshot({ path: path.join(MEDIA_DIR, `${name}.png`), scale: 'device' });
}
