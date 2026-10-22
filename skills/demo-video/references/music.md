# Music

```bash
./scripts/add-music.sh <name> path/to/track.mp3        # your own track
./scripts/add-music.sh <name> --mubert [genre]         # a generated royalty-free bed
```

The track is mixed to sit **behind** the picture: high-pass at 90 Hz, loudness-normalised to −23 LUFS (a finished track arrives near −14 LUFS, which sounds loud and amateur under a demo), a 1.6 s fade in and a 2.2 s fade out. The MP4 is rewritten in place, so re-run the script after re-rendering.

Browsers only autoplay **muted** video. The music therefore has to live inside the asset, and your player should offer a "sound on" button.

## Mubert (generated, royalty-free)

[Mubert API](https://mubert.com/api) generates a fresh track sized to the clip, so there's no stock-library hunting and no two demos sound the same. Set `MUBERT_COMPANY_ID` and `MUBERT_LICENSE_TOKEN`.

| Genre | Use for |
|---|---|
| `educational` (default) | Explainers, docs, tutorials. Written to sit under a voice |
| `focus` | Minimal, least distracting |
| `inspirational` | Landing pages, launches |
| `lofi` | Informal, social |
| `ambient` | Background |
| `cinematic` | Premium, restrained |

The endpoint is a continuous stream, not a file, so the script measures the clip with `ffprobe` and captures exactly that many seconds.

**Voiceover on top?** Drop the bed further (`loudnorm=I=-28`) or duck it under the voice, or it will fight the narration.
