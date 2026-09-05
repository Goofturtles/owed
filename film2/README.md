# Owed — launch film

150 seconds, 1920×1080, 30fps, cut to GRID-FM "End of Neon".

## Why it is built this way

The first attempt crossfaded whole screenshots and held them still. That reads
as glitchy, because near-identical full-screen images swapping over each other
looks like a stutter rather than a cut. This version never shows a whole page.
It captures the app as **44 separate components** and brings each one in on its
own beat, so the interface assembles itself in front of you.

## The grid

The track was measured, not guessed: spectral flux → autocorrelation for tempo,
then a phase search for the downbeat.

| | |
|---|---|
| length | 150.00 s |
| tempo | 123.05 BPM |
| beat | 0.48760 s |
| bar | 1.95040 s |
| first downbeat | 0.050 s |

`film.js` exposes `bar(n)` and `beat(n)`. Every entrance lands on a beat and
every scene change on a bar line, so the cut and the music cannot drift apart.

## The one rule

`seek(t)` is a pure function of `t`. It rebuilds every layer from scratch on
every call — no wall-clock, no `Math.random`, no CSS animations or transitions.
That is what lets Playwright render 4500 frames in any order and get an
identical result each time.

Two consequences worth knowing:

- Nothing may hold still, because a still frame is a dead frame. Scenes get
  continuous `setDrift`; type layers get `flo()`, a float built from three sines
  on mutually irrational periods so no two are stationary at once; the ground
  keeps a slow pool of light behind everything. Verified: **zero** identical
  neighbouring frames across the whole film.
- Layout is checked by sweep, not by eye. `geom.mjs` steps through the film at
  4 Hz and fails if any visible part leaves the frame or collides with the
  caption line.

## Files

| | |
|---|---|
| `parts.mjs` | drives the real app and screenshots 44 components at 2× |
| `index.html` | the stage: grounds, photos, `#parts`, type, numbers, lockup |
| `film.js` | the timeline — `seek(t)` and nothing else |
| `film.css` | how the parts, type and captions look |
| `capture.mjs` | 4500 frames at 30fps, with font and image-decode gates |
| `geom.mjs` | off-frame and caption-collision sweep |
| `probe.mjs` | render named seconds, e.g. `node film2/probe.mjs 84.5 88.5` |

`frames/`, `probe/`, `sheet/`, `shots/` and the `.mp4`s are gitignored.

## Building it

The dev server must be running on :3510 first.

```bash
node film2/parts.mjs      # only when the app's UI changes
node film2/geom.mjs       # must print CLEAN
node film2/capture.mjs    # 4500 png frames
ffmpeg -y -framerate 30 -i film2/frames/f%05d.png -i track.mp3 \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 224k -shortest film2/owed-launch.mp4
```

## What is on screen

Everything shown is the real product, driven for real. The photo beat uploads
an actual file through the actual input. The results, the rule text and the
claim script are whatever the app genuinely produced for those answers. The
closing numbers come from `data/coverage.json`. No stock footage, and no
generated video of people.
