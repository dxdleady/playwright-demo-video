# From docs demo to social reel

A docs demo is 16:10, silent and captioned. A reel for TikTok, Reels, Shorts or LinkedIn is 9:16, with a hook, a voice and music. Keep the recorder for what it's good at, capturing the real app, and compose the reel separately.

## Record vertical footage

```bash
DEMO_WIDTH=1080 DEMO_HEIGHT=1920 npx playwright test --config playwright.demo.config.ts --grep "my reel take"
```

Or keep the desktop take and place it in a card inside a vertical frame, which often reads better for desktop apps.

## Compose with HyperFrames

[HyperFrames](https://github.com/heygen-com/hyperframes) (HeyGen, open source) renders video from HTML. That makes it a natural fit for agents: titles, captions, a phone or browser frame, cuts timed to the voiceover, all written as code next to your demo specs.

A workflow that works:
1. Record the take with this recorder (`cue`/`cut` give you clean in and out points).
2. Generate a voiceover (any TTS) and a music bed (`add-music.sh --mubert` or your own).
3. In a HyperFrames composition, lay out: the hook title (first 1–2 s, before any branding) → the real before/after from the recording → one line of proof → the CTA.
4. Mix the soundtrack to about −14 LUFS for social (louder than docs), with the bed ducked under the voice.
5. Render one 1080×1920 file. It works for TikTok, Reels and Shorts.

Rules that carry over from docs demos: one idea, show the number that moves, and the real app on screen rather than a mock-up.
