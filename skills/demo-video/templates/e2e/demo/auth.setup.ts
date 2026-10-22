import path from 'node:path';

import { expect, test as setup } from '@playwright/test';

/**
 * Log in once and save the session, so every `*.demo.ts` starts authenticated.
 *
 * Credentials come from `.env.local` (DEMO_EMAIL / DEMO_PASSWORD), never from the repo.
 * The saved session is a credential too: keep `e2e/demo/.auth/` in .gitignore.
 *
 * The selectors below fit a typical email + password form. Adjust them to yours;
 * this is the one file you almost certainly have to edit.
 */

export const STATE_PATH = path.join(__dirname, '.auth', 'state.json');

setup('authenticate', async ({ page }) => {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) {
    throw new Error('Set DEMO_EMAIL and DEMO_PASSWORD in .env.local: demos need a real session with real data.');
  }

  await page.goto(process.env.DEMO_LOGIN_PATH ?? '/login');
  await page.locator('input[type="email"], input[name="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();

  // Anywhere past the login page means the session took.
  await expect(page).not.toHaveURL(new RegExp(process.env.DEMO_LOGIN_PATH ?? '/login'), { timeout: 20_000 });
  await page.context().storageState({ path: STATE_PATH });
});
