import { expect, test } from '@playwright/test';

import { beat, glideAndClick, glideAndType, mountCursor, say, spotlight, zoomOut, zoomTo } from './camera';
import { clock, cue, cut } from './timeline';

/**
 * A complete demo against Playwright's public TodoMVC app: no login, no setup, runs anywhere.
 *
 *   DEMO_BASE_URL=https://demo.playwright.dev npx playwright test --config playwright.demo.config.ts --project=public
 *
 * Note where the camera goes. The claim is "ticking a todo updates the count", so the proof
 * is the counter changing (3 items left → 2 items left), not the checkbox. Find the number
 * that moves and point the camera at it.
 */
test('todo basics', async ({ page }) => {
  const t0 = clock();
  await page.goto('/todomvc/');
  await page.locator('.new-todo').waitFor();

  await cue('todo-basics', t0); // everything before this (the page loading) is trimmed
  await mountCursor(page, { accent: '#B83F45' });

  await say(page, { step: 'Step 1 of 3', title: 'Add what you need to do', note: 'Type and press *Enter*.' }, 1200);
  for (const item of ['Record the demo', 'Ship the docs', 'Post on LinkedIn']) {
    await glideAndType(page, '.new-todo', item);
    await page.keyboard.press('Enter');
    await beat(page, 250);
  }
  await expect(page.locator('.todo-count')).toHaveText('3 items left');

  await zoomTo(page, '.todo-count', 1.8);
  await say(page, { step: 'Step 2 of 3', title: 'Three things left', note: 'Watch this *counter*.' }, 1600);
  await zoomOut(page);

  await spotlight(page, '.todo-list li:nth-child(1)');
  await say(page, { step: 'Step 2 of 3', title: 'Tick one off' }, 900);
  await glideAndClick(page, '.todo-list li:nth-child(1) .toggle');
  await spotlight(page, null);

  await zoomTo(page, '.todo-count', 1.8);
  await say(page, { step: 'Step 3 of 3', title: 'The count updates instantly', note: '*2 items left*. Done means done.' }, 2000);
  await zoomOut(page);
  await say(page, null, 600);

  await cut('todo-basics', t0); // nothing below this ships
});
