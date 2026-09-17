# Owed — vector files

Real vector, not screenshots. Every box is a shape, every line of copy is live text,
every icon keeps its own paths. Only two things are raster, because they have to be:
the film frames on the landing page and the product photographs on the app's first
question.

**Nothing has a background.** The white page is gone from every file, so a piece drops
straight onto footage instead of punching a white card into your comp. What a button,
tile or card paints for itself — its own fill, its own border — is still there, because
that is the button, not the page behind it.

## Drag these into After Effects: `ai/`

`ai/` mirrors the whole tree in `.ai`, the format After Effects imports as vectors,
with every line of type already outlined so **Create Shapes from Vector Layer keeps
the words**. Those files are PDFs underneath (that is what an Illustrator file is),
so if you ever want one somewhere else, rename it to `.pdf` and any reader opens it.

The `.svg` files beside it are the same art for Figma, Illustrator, a browser, or the web.

## What is here

| folder | what it is |
|---|---|
| `landing/` | the 12 sections of the site, plus `00-landing-full-page.svg` — the ten scroll sections stacked in order (1430×5434). Film chapters 2 and 3 are later frames of the same scene, so only chapter 1 is in the stack |
| `app/` | the 16 parts of the tool, plus `00-four-questions-strip.svg` — the four questions side by side (2052×852) |
| `pieces/` | every button, tile, chip, card, row, icon and heading on its own, in a folder per section. They are disjoint — no part re-draws another — so stacking a section's parts rebuilds it exactly, and any one of them can move alone |
| `outlined/` | the same SVGs with the type turned into paths; what the `.ai` files are printed from |
| `logo/` | the mark on its own: black square, white check, nothing else |
| `landing/animated/` | the FAQ's moving parts: each answer opened, and each answer on its own to overlay |

### `landing/`
`01-nav` · `02`–`04-film-chapter*` (the three chapters of the opening film) ·
`05-sources-marquee` · `06-script-showcase` · `07-numbers` · `08-five-places` ·
`09-environment` · `10-questions` · `11-closing` · `12-footer`

### `app/`
`01-app-full-results` and `08-app-full-script` (the whole app, results open and script
open) · `02-sidebar` · `03-item-header` · `04-results-list` · `05-result-card` ·
`06-filter-chips` · `07-side-panel` · `09-script-document` · `10-script-buttons` ·
`11-ask-panel` · `12-help-dialog` · `13`–`16-question-*`

### `pieces/`
One folder per section, one file per part, named by what the part says:

```
pieces/app/13-question-1-what-broke/008-phone.ai
                                   /016-big-appliance.ai
                                   /022-cookware-orkitchen.ai
                                   /033-back.ai
                                   /034-next.ai
```

Numbers run in the order the parts appear on the page, so they stay in reading order in
the import dialog (three digits, because the full-app files run past a hundred parts).
Part `001` of a section is its ground — the black band under the closing block, the
sidebar's grey — so the parts of a section still add up to exactly that section. A part with no words of its own is named for what it is (`icon`,
`photo`) or for what the page calls it (`wizback`, `catchips`). No part contains another:
a card holds its own surface and border, and the rows inside it are their own files, so
every one of them can move on its own without the card re-drawing it.

## Animated, two ways

**`owed-animate.jsx` — the site built in After Effects, already moving.**
Keep it next to the `ai` folder, then in AE: File > Scripts > Run Script File…
It imports the parts, lays every one of them where the page puts it, and
keyframes the motion: one comp per section with its parts rising in, the marquee
running, the FAQ opening, plus a `Landing scroll` comp that reads the whole page
top to bottom. Every layer is continuously rasterised and every part is its own
layer, so retime or restage anything you like. Nothing is baked.

**The reels — `../reels/`.** The live site recorded frame by frame: ProRes and
H.264, 2860×1800. Drag a `.mov` in and it plays exactly like the real thing,
including the WebGL film in the hero, which no vector export can carry. Use it as
a reference track for timing, or as the shot itself. See `reels/README.md`.

## The FAQ's parts — `landing/animated/`

The FAQ is the one part of the landing page that moves on its own, so it ships
in states rather than as one still:

- `faq-open-01-…` … `faq-open-05-…` — the whole section with that one answer
  open. Rows below it sit where the page actually pushes them, so you can cut or
  cross-fade between states and the movement is the page's own.
- `faq-answer-01-…` — the answer by itself, on the section's own canvas at the
  position it opens into. Drop one over `10-questions` at 0,0 and it lands
  exactly where it belongs: fade or slide it in, and grow the row behind it.

The chevron is exported unrotated in every state, because the page turns it with
a CSS transform and these files carry no transforms — rotate it in AE, which is
where you would want that keyframe anyway.

## Using them in After Effects

1. Import the `.ai` file. It arrives as one layer: scalable, and transparent.
2. Turn on continuous rasterisation (the ☀ switch) so it stays sharp above 100%.
3. To animate inside a piece, right-click the layer → **Create Shapes from Vector Layer**.
4. Every line of type is already outlined into paths, which is what makes
   step 3 work: AE's converter only ever converts paths, so type left as type
   disappears the moment you run it. Outlined type needs no font installed
   anywhere and cannot substitute, but it is artwork rather than an editable
   text layer — to change wording, set fresh type in AE over the top.
5. Each piece file has its own origin at its own top-left, so it lands as its own object.
   The two `00-` boards keep every part in one shared coordinate space instead, for when
   you want them aligned to each other and then animated apart.

## Known limits

- Drop shadows are not carried over (SVG filters and AE do not agree on them). Add them in AE.
- `backdrop-filter` blur (the glass bar, the script button bar) is not carried over: the
  element's own colour is drawn at its real alpha, with nothing blurred behind it.
- CSS `transform` (rotate/scale) is ignored, and shapes are written in document order, so
  `z-index` overlaps could stack differently. Nothing on these two pages relies on either.
- Colours resolve through the browser, so `color-mix()`, `color(srgb …)` and `oklch()` all
  come out right; a colour the browser cannot parse is skipped silently.
- The film frames and the question-1 photographs are raster, so they do not scale past 100%.
- Type in the `.ai` files is outlined; the `.svg` files keep it as live, editable
  text. Both are drawn in the product's own face (SF Pro on the machine these were
  captured on). Every box, baseline and line break was measured in that face, so
  the art is only correct when rendered in it — remaking these files on a machine
  without SF Pro would need a fresh capture, and the scripts stop rather than
  silently substitute. Only the Regular cut is installed here, so Chrome fakes
  600+ by widening the outline without moving anything; `outline.js` reproduces
  that with a hairline stroke, since the advances must not shift.

## Remaking them

From the `owed` folder, in this order. They all drive a browser, so they need the vendored driver in
`film/node_modules` — on a fresh clone, run `cd film && npm i` first (that installs
playwright-core and opentype.js). They also need the face the pages were captured
in, SF Pro Display Regular, because every measurement in the art assumes it:
`explode.js`, `outline.js` and `svg2ai.js` each check for it and stop rather than
quietly working in a substitute, which shifts every centred label. `outline.js`
looks in the usual Windows and macOS font folders; set `OWED_FONT` to point it
somewhere else.

```
node vectors/capture.js     # live pages -> _src   (only to re-shoot a section)
python vectors/nobg.py      # _src -> background-free sections + the two boards
node vectors/explode.js     # sections -> pieces/  (disjoint: no part contains another)
node vectors/outline.js     # every .svg -> outlined/, type turned into paths
node vectors/svg2ai.js      # outlined/ -> ai/
node vectors/aescript.js    # ai/ + the part boxes -> owed-animate.jsx
```

Chain them with `&&`. Each one stops on a problem rather than passing a broken
tree along — a glyph the face cannot draw, a section that produced no parts, art
that does not fit its page — and the chain is what makes that stop mean something.

`capture.js` needs the site served (the `owed` entry in `.claude/launch.json`,
port 3510); the others work off what is already in `_src/`.

`outline.js` asks Chrome where it put every single character rather than
computing the metrics itself, so kerning, letter-spacing and the page's own line
breaks survive; only the glyph shapes come from the font file.

`_src/` holds the original captures straight off the live pages, backgrounds and all.
Everything else is rebuilt from them. Only `capture.js` writes there, only to the
sections it re-shoots, and it keeps a `.bak` of whatever it replaces and refuses to
write a capture that came back empty — keep that folder, because remaking one means
driving the live app back into that exact state. (`logo/owed-mark.svg` is hand-drawn
from the CSS and is the other thing here with no source above it.)
A section that is one full-bleed image (the film chapters) reports very few parts — its
ground and whatever sits on top of it — which is all there is to cut out of it. `dom2svg.js` is what makes a capture in the first
place (`window.dom2svg(element)` in the page), and `preview.html` is a contact sheet —
serve the site and open `/vectors/preview.html`.
