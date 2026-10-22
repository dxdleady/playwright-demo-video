# Writing demos

## Helpers

From `e2e/demo/camera.ts` and `e2e/demo/timeline.ts`:

| Helper | Does | Note |
|---|---|---|
| `mountCursor(page, opts?)` | Draws the cursor, caption and spotlight layers | Call first; nothing is visible without it. `opts`: `accent`, `font`, `root`, `captionPosition` |
| `glideTo(page, sel)` | Eases the cursor to an element | |
| `glideAndClick(page, sel)` | Glides, ripples, really clicks | |
| `glideAndType(page, sel, text)` | Glides, clicks, types at a human pace | |
| `zoomTo(page, sel, scale = 1.5)` | Zooms toward an element (in the DOM, so it stays sharp) | The cursor steps aside while zoomed |
| `zoomOut(page)` | Back to 1× | |
| `say(page, coach, hold)` | Coach-mark caption `{ step?, title, note? }` | `*term*` → accent-coloured key term; `null` hides it |
| `spotlight(page, sel)` | Rings the element and dims the rest | `null` clears it |
| `beat(page, ms)` | A held pause | |
| `cue(name, t0)` / `cut(name, t0)` | Mark where the demo starts and ends | The render keeps only what's between them |
| `shot(target, name)` | PNG straight into the media folder | For state, not motion |
| `selectRange(page, sel, from, to)` (`select.ts`) | Selects a run of elements as text | For `role="button"` spans that don't drag-select |
| `snapshot(read)` / `assertRestored(read, before)` (`restore.ts`) | Prove the demo left the data as it found it | |

## The traps

These cost hours the first time.

1. **Playwright has no cursor.** It dispatches synthetic events and never moves the OS pointer, so a raw recording shows clicks happening by themselves. That's also why Screen Studio-style auto-zoom can't work on a Playwright run: it keys off real clicks it never sees. `mountCursor` draws one.
2. **Zoom `body`, not your app shell.** If the shell already carries a transform (responsive scaling, some layout libraries), the framework overwrites yours on the next render and the zoom silently does nothing. The overlays live on `<html>`, above the scaled element, so they don't ride the zoom.
3. **Some things don't drag-select.** Elements rendered as `role="button"` spans ignore a mouse drag. `selectRange` builds a DOM Range and dispatches `mouseup`; an app that reads `window.getSelection()` sees a real selection.
4. **Recording starts when the browser does.** Every raw clip opens with the page loading. Call `cue()` the moment the demo really begins; the render cuts everything before it.
5. **A typo shouldn't cost two minutes.** Helpers resolve selectors with an 8 s timeout, so a wrong selector fails fast instead of eating the 120 s test timeout.

## A demo that edits real data must put it back

```ts
import { assertRestored, snapshot } from './restore';

const read = () => page.evaluate(() => fetch('/api/projects/42').then(r => r.json()))
  .then(p => ({ items: p.items, title: p.title }));   // only what an edit can change

const before = await snapshot(read);   // BEFORE the first edit
await cue('rename-project', t0);
// …the demo…
await cut('rename-project', t0);       // the demo ends here; the rest is trimmed off
await page.keyboard.press('Meta+z');   // undo your own edit
await assertRestored(read, before);    // fails the run if the data didn't come back
```

Without this, every recording quietly erodes the project you record against.

## One account, one project

Record every demo against the same seeded account and project, so your docs read as one product rather than ten screenshots from ten sessions. Put its id in `.env.local` and read it in your specs.
