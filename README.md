# playwright-demo-video

**Product demo videos as code.** Record polished demos of your web app with Playwright: a smooth cursor, sharp zoom, onboarding-style captions and a spotlight, exported as MP4 or GIF for your docs, landing page, README and social posts.

When the UI changes, you re-run one command instead of re-recording. Your demos can't go stale.

Ships as an **Agent Skill** for Claude Code, Codex and other agents that read `SKILL.md`, so you can just ask *"record a demo of the invite flow"*. It also works without any agent.

![A demo recorded with playwright-demo-video: adding todos, a spotlight on one item, a zoom on the counter changing from 3 to 2 items left](assets/demo.gif)

<sub>This GIF was recorded by the tool itself in 23 seconds: [`todomvc.public.ts`](skills/demo-video/templates/e2e/demo/todomvc.public.ts). Same clip as MP4: [656 KB](assets/demo.mp4) (the GIF is 2.2 MB).</sub>

---

## Why

Small teams skip product video because it's a chore. Someone records a Loom, the UI changes a week later, and the docs show a button that no longer exists.

Playwright already drives your app. It just records like a security camera: no cursor, no zoom, no context, 10 seconds of loading at the start. This repo adds the missing camera work and treats every demo as a test you can re-run:

| | Screen recorder (Loom, Screen Studio, OBS) | Playwright's built-in video | **playwright-demo-video** |
|---|---|---|---|
| Re-record after a UI change | By hand, every clip | One command, but raw | **One command, polished** |
| Visible cursor | ✓ | ✗ clicks happen by themselves | **✓ drawn, eased, click ripple** |
| Zoom | Crop in post (blurry) | ✗ | **DOM zoom, sharp at any scale** |
| Captions and spotlight | Manual editing | ✗ | **✓ coach marks + dimmed spotlight** |
| Loading screen at the start | Trim by hand | ✗ always there | **Auto-trimmed (`cue`/`cut`)** |
| Runs in CI | ✗ | ✓ | **✓** |
| Agent can make one for you | ✗ | ✗ | **✓ Agent Skill** |

## Quick start (2 minutes, no app needed)

```bash
npm i -D @playwright/test && npx playwright install chromium   # and: brew install ffmpeg
npx degit dxdleady/playwright-demo-video/skills/demo-video .demo-kit
mkdir -p e2e && cp -r .demo-kit/templates/e2e/demo e2e/demo && cp .demo-kit/templates/playwright.demo.config.ts .
mkdir -p scripts && cp .demo-kit/scripts/*.sh scripts/ && chmod +x scripts/*.sh && rm -rf .demo-kit

DEMO_BASE_URL=https://demo.playwright.dev npx playwright test --config playwright.demo.config.ts --project=public
./scripts/render-demo.sh --gif
# → demo-out/media/todo-basics.mp4 and .gif: the clip above
```

Then point `DEMO_BASE_URL` at your app and write your first demo.

## Install as an Agent Skill

**Claude Code: plugin**

```
/plugin marketplace add dxdleady/playwright-demo-video
/plugin install demo-video@playwright-demo-video
```

**Claude Code / Codex: copy the skill**

```bash
npx degit dxdleady/playwright-demo-video/skills/demo-video ~/.claude/skills/demo-video   # Claude Code
npx degit dxdleady/playwright-demo-video/skills/demo-video ~/.codex/skills/demo-video    # Codex
```

Then ask: *"record a demo of signing up and creating a first project"*, *"make a GIF of the export flow for the README"*, *"the settings page changed, re-record its demos"*. The skill installs the recorder into your project, writes the spec, records, renders, and checks the frames before it hands the clip over.

## A demo is a test

```ts
import { test } from '@playwright/test';
import { glideAndClick, mountCursor, say, zoomOut, zoomTo } from './camera';
import { clock, cue, cut } from './timeline';

test('invite a teammate', async ({ page }) => {
  const t0 = clock();
  await page.goto('/settings/team');

  await cue('invite-a-teammate', t0);              // trim everything before this
  await mountCursor(page, { accent: '#0EA5E9' });  // your brand colour

  await say(page, { step: 'Step 1 of 2', title: 'Invite by email' }, 1200);
  await glideAndClick(page, 'button:has-text("Invite")');

  await zoomTo(page, '.seat-count', 1.8);           // point the camera at the proof
  await say(page, { step: 'Step 2 of 2', title: 'Seats update instantly' }, 2000);
  await zoomOut(page);

  await cut('invite-a-teammate', t0);               // trim everything after this
});
```

```bash
npx playwright test --config playwright.demo.config.ts   # record
./scripts/render-demo.sh --gif                           # MP4 + GIF
./scripts/add-music.sh invite-a-teammate --mubert        # optional royalty-free music bed
```

## What's inside

- **Drawn cursor** with eased movement and a click ripple. Playwright never moves the real pointer.
- **DOM zoom** toward any element. The page is scaled, not the video, so text stays crisp. The cursor steps aside while zoomed so it never points at the wrong thing.
- **Coach-mark captions** (`Step 2 of 3 · Delete it`) with accent-coloured key terms, in your brand colour and font.
- **Spotlight** that rings an element and dims the rest.
- **Auto-trim** of page loading before `cue()` and of cleanup after `cut()`.
- **Restore guard.** Record against real data; `snapshot()` + `assertRestored()` fail the run if a demo didn't undo its own edits.
- **Render script.** MP4 with the flags people forget (`yuv420p`, `faststart`, so it plays in Safari) and a two-pass-palette GIF that doesn't shimmer.
- **Music.** Lay your own track or a generated royalty-free [Mubert](https://mubert.com/api) bed under the clip, mixed to sit behind the picture (−23 LUFS, high-pass, fades).
- **Reels.** Record 9:16 takes and compose social videos with [HyperFrames](https://github.com/heygen-com/hyperframes): [guide](skills/demo-video/references/reels.md).

## The rules that make a demo convincing

1. **Show the proof, not the click.** For "delete text, the audio is cut", the proof is the duration dropping 33:25 → 33:14, not the deleted words. Find the number that moves.
2. **Hold after every action.** The instinct is to keep moving. Resist it.
3. **Zoom on intent, not on movement.** Zooming on every click is what makes cheap tools look cheap.
4. **One idea per clip:** 6–12 s for docs, under 40 s for social.
5. **Real data, then put it back.** An empty app proves nothing.

More in [`writing-demos.md`](skills/demo-video/references/writing-demos.md).

## Docs

- [`SKILL.md`](skills/demo-video/SKILL.md): what an agent reads
- [`setup.md`](skills/demo-video/references/setup.md): install, env vars, CI
- [`writing-demos.md`](skills/demo-video/references/writing-demos.md): helpers, traps, restoring data
- [`music.md`](skills/demo-video/references/music.md) · [`reels.md`](skills/demo-video/references/reels.md)

## License

MIT. Made by [Mariia Kren](https://www.linkedin.com/in/mariia-kren/), a founder-engineer building AI products 0→1. If it saves you a Loom, a ⭐ helps others find it.
