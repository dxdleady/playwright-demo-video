import { expect } from '@playwright/test';

/**
 * A demo that edits real data must put it back.
 *
 * Demos are worth recording against a real, seeded account, because an empty app proves
 * nothing. But then every edit made on camera is an edit made for real, and without this
 * each recording quietly erodes the project a little more.
 *
 * You supply `read`, which returns the parts of your state an edit can change (not
 * timestamps, which always differ). `snapshot` takes it before the first edit, and
 * `assertRestored` fails the run if, after the demo undoes itself, the state didn't come
 * back. A red run is a cheap price for not mangling a real project.
 *
 *   const read = () => page.evaluate(() => fetch('/api/projects/42').then(r => r.json()))
 *                          .then(p => ({ items: p.items, title: p.title }));
 *   const before = await snapshot(read);
 *   … demo … await cut(name, t0); … undo …
 *   await assertRestored(read, before);
 */

export type Read = () => Promise<unknown>;

export async function snapshot(read: Read): Promise<string> {
  return JSON.stringify(await read());
}

export async function assertRestored(read: Read, before: string, settleMs = 2500): Promise<void> {
  // Let the undo reach the backend before comparing what it actually stored.
  await new Promise(r => setTimeout(r, settleMs));
  expect(JSON.stringify(await read()), 'the demo did not restore the data it edited').toBe(before);
}
