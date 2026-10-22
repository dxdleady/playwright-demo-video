---
name: demo-video
description: "Record polished product demo videos of your own web app with Playwright: scripted clicks, a smooth drawn cursor, DOM zoom that keeps text sharp, onboarding-style captions, spotlight, auto-trim, optional royalty-free music, exported as MP4 or GIF for docs, landing pages, READMEs and social. Demos are code, so when the UI changes you re-run one command instead of re-recording. Use when the user wants a product demo, a feature walkthrough, a screen recording, a GIF for a README, a clip for docs/landing/LinkedIn/X/TikTok, or says 'record a demo', 'make a GIF of X', 'show this feature in a video', 'снять ролик', 'сделай гифку'. Also use when a UI change means existing demos must be re-recorded. Not for editing user-supplied footage: this records the app itself."
license: MIT
metadata:
  version: 1.0.0
  author: Mariia Kren (github.com/dxdleady)
  repository: https://github.com/dxdleady/playwright-demo-video
---

# Demo video recorder

**Demos are Playwright specs.** When the UI changes you re-run a command instead of re-recording by hand, so the demos in your docs can't quietly go stale.

What it adds on top of Playwright's built-in video, which shows clicks happening by themselves in an unzoomed full window:
- a **drawn cursor** that glides and ripples on click (Playwright never moves the real pointer);
- **DOM zoom** toward the element that matters, so text stays sharp unlike a crop in post;
- **coach-mark captions** ("Step 2 of 3 · Delete it") and a **spotlight** that dims everything else;
- **auto-trim** of the page loading before the demo and of the cleanup after it;
- **MP4 + GIF** export with the ffmpeg flags people forget, plus an optional **music bed** mixed to sit behind the picture.

## Install into the user's project (first time)

Needs `@playwright/test` and `ffmpeg`. From the project root, with `SKILL` = this skill's folder:

```bash
mkdir -p e2e && cp -r "$SKILL/templates/e2e/demo" e2e/demo
cp "$SKILL/templates/playwright.demo.config.ts" .
mkdir -p scripts && cp "$SKILL/scripts/"*.sh scripts/ && chmod +x scripts/*.sh
printf 'demo-out/\ne2e/demo/.auth/\n' >> .gitignore
```

Add to `package.json` scripts:

```json
"demo": "playwright test --config playwright.demo.config.ts",
"demo:render": "./scripts/render-demo.sh"
```

Then set `DEMO_BASE_URL` (default `http://localhost:3000`) and optionally `DEMO_DEV_COMMAND` (e.g. `npm run dev`) and `DEMO_MEDIA_DIR` (e.g. `public/docs-media`). Details: `references/setup.md`.

**Smoke test first.** `e2e/demo/todomvc.public.ts` runs against Playwright's public TodoMVC, with no login and none of the user's code. Run it before writing anything for their app:

```bash
DEMO_BASE_URL=https://demo.playwright.dev npx playwright test --config playwright.demo.config.ts --project=public
./scripts/render-demo.sh --gif      # → demo-out/media/todo-basics.mp4 + .gif
```

Delete it once the user's own demo works.

## The pipeline

```bash
npm run demo                              # record  → demo-out/raw/**/*.webm
npm run demo:render                       # encode  → $DEMO_MEDIA_DIR/<name>.mp4   (--gif for a GIF too)
./scripts/add-music.sh <name> track.mp3   # optional: your own track…
./scripts/add-music.sh <name> --mubert    # …or a generated royalty-free bed (Mubert API)
```

Iterate on one demo: `npx playwright test --config playwright.demo.config.ts --grep "todo basics"`.

## Writing a demo

One file per demo: `e2e/demo/<name>.demo.ts` (needs login, so it runs after `auth.setup.ts`) or `<name>.public.ts` (no login). The test title, kebab-cased, becomes the file name, and `cue()`/`cut()` must use that same name.

```ts
import { test } from '@playwright/test';
import { beat, glideAndClick, mountCursor, say, spotlight, zoomOut, zoomTo } from './camera';
import { clock, cue, cut } from './timeline';

test('invite a teammate', async ({ page }) => {
  const t0 = clock();
  await page.goto('/settings/team');
  await page.getByRole('button', { name: 'Invite' }).waitFor();

  await cue('invite-a-teammate', t0);          // everything before this is trimmed
  await mountCursor(page, { accent: '#0EA5E9' });

  await say(page, { step: 'Step 1 of 2', title: 'Invite by email' }, 1200);
  await glideAndClick(page, 'button:has-text("Invite")');
  // …
  await zoomTo(page, '.seat-count', 1.8);
  await say(page, { step: 'Step 2 of 2', title: 'Seats update instantly', note: 'Billing follows *automatically*.' }, 2000);
  await zoomOut(page);

  await cut('invite-a-teammate', t0);          // everything after this is trimmed
});
```

Full helper reference, the traps and how to restore data: `references/writing-demos.md`. Read it before writing the first spec for an app.

## Rules that make it look produced

1. **Show the proof, not the click.** Ask what a sceptic would need to see, and point the camera at it. For "delete the text and the audio goes with it", the proof is the duration readout dropping (33:25 → 33:14), not the deleted words. Find the number that moves.
2. **Hold after every action** (`beat`, the `hold` argument of `say`). The instinct is to keep moving. Resist it.
3. **Zoom on intent, not on movement.** Zoom when the point is one specific control, then hold. Zooming on every click is what makes cheap tools look cheap.
4. **One idea per clip.** 6–12 s for a docs page, under 40 s for social.
5. **Real data, then put it back.** Record against a real seeded account, because an empty app proves nothing. If the demo edits data, snapshot it first and assert it was restored afterwards (`restore.ts`).
6. **Captions match the product.** Pass the product's accent colour and font to `mountCursor`. Don't invent a second visual language.
7. **MP4, not GIF**, wherever `<video>` is allowed: about 7× smaller and sharp. Use GIF for GitHub READMEs, email and Slack.

## Verify before you ship

Watch it; don't assume. Pull frames and look at them:

```bash
ffmpeg -y -i demo-out/media/<name>.mp4 -ss 8 -vframes 1 /tmp/frame.png   # then open the PNG
ffprobe -v error -show_entries format=duration -of csv=p=0 demo-out/media/<name>.mp4
```

Check that the first frame is the app and not a loader, that the zoom actually happened, that every caption says something true, and that the thing promised is visible on screen. A demo that shows the wrong state is worse than no demo.

## Going further

- **Social reels (9:16, voiceover, music, titles):** use the recordings as footage in [HyperFrames](https://github.com/heygen-com/hyperframes). See `references/reels.md`.
- **Music:** `references/music.md`.
- **Placing in docs:** write `alt` text as prose that carries the whole point. It's what screen readers and AI agents read instead of the pixels.
