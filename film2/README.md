# Owed — the 2:00 launch film

`owed-launch-2min.mp4` — 1920×1080, 30fps, 120.0s, scored with "Dark Current" (128 BPM). Cuts are placed to the beats of the
story, not snapped to the bar grid. A lighter share cut sits beside it.

**Everything on screen is real.** The 17 product screens are captured from the live
app by `shots.mjs`; the photographs are the project's own licensed Pexels stills
(`assets/img/photo/`). Nothing is mocked up and no footage is AI-generated.

## Reference
The grammar follows the five SaaS launch ads the owner supplied (LangEase ×2,
Lovio ×2, Numtera), read frame by frame: a typed problem statement on black, a
full-bleed brand wash carrying one word, kinetic type that arrives word by word
with the key word in the brand colour, real UI floating with a soft shadow and
crop-ins on the parts you must read, one dark band for contrast, and a logo →
CTA → URL close. Owed's palette replaces theirs: white, black, Apple blue #0071E3.

## Shape
| Time | Beat |
|---|---|
| 0:00 | "Something broke. Again." typed on black |
| 0:04 | the thing itself, then three more you replaced |
| 0:11 | blue wash — "Stop." |
| 0:15 | "Somebody already owes you a free repair." |
| 0:20 | the site, then the mark |
| 0:28 | the four questions, and what a photo actually does |
| 0:44 | what it found, ranked honestly |
| 0:54 | the rule, in the company's own words |
| 0:59 | the words to say — copy, send, mark it won |
| 1:14 | fixed, for free |
| 1:19 | five places · your province's law · ask anything · privacy · environment |
| 1:44 | the numbers, the mark, the address |

## Rebuild
```
node film2/shots.mjs      # recapture the app (needs the dev server on :3510)
node film2/capture.mjs    # 3600 frames → film2/frames/
ffmpeg -framerate 30 -i film2/frames/f%05d.png -i "<score>" -t 120 \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 224k -af "afade=t=in:st=0:d=1.2,afade=t=out:st=116.5:d=3.5" \
  -shortest film2/owed-launch-2min.mp4
```
`film2/index.html` plays and scrubs it in the browser; `?capture=1` hides the
controls, `window.owedFilm.seek(t)` renders any instant. Frames, shots and the
masters are git-ignored — all three are regenerable.
