#!/usr/bin/env bash
# Turn Playwright's raw .webm captures into shippable assets.
#   MP4  → docs, landing pages, LinkedIn/X (<video autoplay muted loop playsinline>)
#   GIF  → GitHub READMEs, email, Slack, wherever <video> isn't allowed  (--gif)
#
# Usage: render-demo.sh [--gif] [--only <name>]
# Env:   DEMO_MEDIA_DIR (default demo-out/media), GIF_WIDTH (960), GIF_FPS (15)
set -euo pipefail

RAW_DIR="demo-out/raw"
OUT_DIR="${DEMO_MEDIA_DIR:-demo-out/media}"
WANT_GIF=false
ONLY=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --gif) WANT_GIF=true ;;
    --only) ONLY="$2"; shift ;;
    *) echo "unknown flag: $1"; exit 1 ;;
  esac
  shift
done

command -v ffmpeg >/dev/null || { echo "ffmpeg not found (macOS: brew install ffmpeg)"; exit 1; }
[[ -d "$RAW_DIR" ]] || { echo "No captures in $RAW_DIR. Record first: npx playwright test --config playwright.demo.config.ts"; exit 1; }
mkdir -p "$OUT_DIR"
found=0

while IFS= read -r -d '' webm; do
  # Playwright names the folder "<file>.(demo|public).ts-<test-title>-<hash>[-<project>]". Keep the title.
  name=$(basename "$(dirname "$webm")" \
    | sed -E 's/^.*\.(demo|public)\.ts-//; s/-(demos|public)$//; s/-[a-f0-9]{5,}$//; s/-(demos|public)$//' \
    | tr '[:upper:] ' '[:lower:]-')
  [[ -z "$name" ]] && name="demo"
  [[ -n "$ONLY" && "$name" != "$ONLY" ]] && continue
  found=1

  # Cut the app booting, and cut the cleanup after the demo: see cue()/cut() in timeline.ts.
  args=()
  start=0
  if [[ -f "demo-out/trim/$name.txt" ]]; then
    start=$(cat "demo-out/trim/$name.txt"); args=(-ss "$start")
    echo "→ $name  (trimming ${start}s of loading)"
  else
    echo "→ $name  (no cue() mark, so the clip starts with the page loading)"
  fi
  if [[ -f "demo-out/trim/$name.end.txt" ]]; then
    len=$(echo "$(cat "demo-out/trim/$name.end.txt") - $start" | bc)
    args+=(-t "$len")
  fi

  # yuv420p + faststart: the two flags people forget, and then "it won't play in Safari".
  ffmpeg -y -loglevel error "${args[@]}" -i "$webm" \
    -vf "fps=30,scale=1280:-2" \
    -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 23 -preset slow \
    -movflags +faststart -an "$OUT_DIR/$name.mp4"
  echo "   $OUT_DIR/$name.mp4  ($(du -h "$OUT_DIR/$name.mp4" | cut -f1))"

  if $WANT_GIF; then
    # Two-pass palette. stats_mode=diff weights colours toward what moves (a screencast is
    # mostly static UI); diff_mode=rectangle stops the static background shimmering.
    f="fps=${GIF_FPS:-15},scale=${GIF_WIDTH:-960}:-1:flags=lanczos"
    ffmpeg -y -loglevel error -i "$OUT_DIR/$name.mp4" -vf "$f,palettegen=stats_mode=diff" "$OUT_DIR/.palette.png"
    ffmpeg -y -loglevel error -i "$OUT_DIR/$name.mp4" -i "$OUT_DIR/.palette.png" \
      -lavfi "$f [x]; [x][1:v] paletteuse=dither=sierra2_4a:diff_mode=rectangle" "$OUT_DIR/$name.gif"
    rm -f "$OUT_DIR/.palette.png"
    echo "   $OUT_DIR/$name.gif  ($(du -h "$OUT_DIR/$name.gif" | cut -f1))"
  fi
done < <(find "$RAW_DIR" -name '*.webm' -print0)

[[ $found -eq 1 ]] || { echo "No matching .webm under $RAW_DIR"; exit 1; }
echo "Done."
