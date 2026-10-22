# Setup

## Requirements

- Node 18+ and `@playwright/test` (`npm i -D @playwright/test && npx playwright install chromium`)
- `ffmpeg` (macOS `brew install ffmpeg`, Ubuntu `sudo apt install ffmpeg`)
- `bc` (preinstalled on macOS and most Linux)

## Files

| File | Edit? | What |
|---|---|---|
| `e2e/demo/camera.ts` | No | Cursor, zoom, captions, spotlight. Pass colours and fonts via `mountCursor(page, { accent, font })` |
| `e2e/demo/timeline.ts` | No | `cue`, `cut`, `shot` |
| `e2e/demo/restore.ts` | No | `snapshot` and `assertRestored`; you supply the `read` function |
| `e2e/demo/select.ts` | No | `selectRange` |
| `e2e/demo/auth.setup.ts` | **Yes** | Your login form's selectors. The one file you almost always change |
| `e2e/demo/todomvc.public.ts` | Delete later | The smoke-test demo |
| `playwright.demo.config.ts` | Maybe | Viewport and projects. The rest is driven by env |
| `scripts/render-demo.sh` | No | webm → MP4 (+ GIF) |
| `scripts/add-music.sh` | No | A music bed, from a file or the Mubert API |

## Environment

Put these in `.env.local` (read by the config, so no dotenv needed):

| Var | Default | |
|---|---|---|
| `DEMO_BASE_URL` | `http://localhost:3000` | Your app, local or staging |
| `DEMO_DEV_COMMAND` | none | e.g. `npm run dev`; started if not running |
| `DEMO_EMAIL` / `DEMO_PASSWORD` | none | A real demo account. Never commit these |
| `DEMO_LOGIN_PATH` | `/login` | |
| `DEMO_MEDIA_DIR` | `demo-out/media` | e.g. `public/docs-media`, so assets land where your site serves them |
| `DEMO_WIDTH` / `DEMO_HEIGHT` | `1280` / `800` | Use `1080`/`1920` for vertical (9:16) social clips |

## .gitignore

```
demo-out/
e2e/demo/.auth/
```

The saved session in `.auth/` is a credential, and raw captures are large.

## CI

Demos are regular Playwright tests, so they run in CI. A scheduled job that re-records and opens a PR when a clip changes keeps your docs honest automatically.
