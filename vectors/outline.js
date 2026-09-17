/* Turn every line of type into real paths.

   After Effects' "Create Shapes from Vector Layer" converts paths and nothing
   else, so type imported as type — however it is encoded — simply vanishes when
   you run it. Illustrator's answer is Type > Create Outlines. This is that step,
   done here so the .ai files arrive ready.

   Positions come from Chrome, not from a metrics calculation: the browser is
   asked where it put every single character (getStartPositionOfChar), so
   kerning, letter-spacing and the page's own line breaks are preserved exactly.
   Only the glyph SHAPE comes from the font file.

   Run from the owed folder:  node vectors/outline.js                        */
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'film', 'node_modules', 'playwright-core'));
const opentype = require(path.join(__dirname, '..', 'film', 'node_modules', 'opentype.js'));

const ROOT = __dirname;
const OUT = path.join(ROOT, 'outlined');
const SRC = ['landing', 'app', 'pieces', 'logo'];

/* The one face installed here, and so the one the pages were captured in.
   Chrome has no bold cut to use, so it fakes 600+ by widening the outline while
   keeping the advance identical — measured: every weight sets "Get script" at
   64.875px. That is why the emboldening below is a stroke and not a wider face:
   it must add weight without moving a single character. */
const FONT_ENV = process.env.OWED_FONT;
const FONT_CANDIDATES = [
  FONT_ENV,
  path.join(process.env.LOCALAPPDATA || '', 'Microsoft/Windows/Fonts/SFPRODISPLAYREGULAR.OTF'),
  'C:/Windows/Fonts/SFPRODISPLAYREGULAR.OTF',
  '/Library/Fonts/SF-Pro-Display-Regular.otf',
  '/System/Library/Fonts/SFNSDisplay.ttf'
].filter(Boolean);
const FAKE_BOLD_AT = 600;
const EMBOLDEN = 1 / 24;      // Skia's fake-bold stroke, as a fraction of the type size

function walk(dir, hits) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, hits);
    else if (e.name.endsWith('.svg')) hits.push(path.relative(ROOT, p));
  }
  return hits;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

(async () => {
  const FONT_FILE = FONT_CANDIDATES.filter(f => fs.existsSync(f))[0];
  if (!FONT_FILE) throw new Error('cannot find SF Pro Display Regular, the face the art was ' +
    'measured in. Looked in: ' + FONT_CANDIDATES.join(' | ') + '  — set OWED_FONT to its path.');
  const buf = fs.readFileSync(FONT_FILE);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));

  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const problems = [], missingGlyphs = new Set();
  let files = 0, runs = 0;
  try {
    const page = await browser.newPage();
    // a one-file look must not empty the tree the converter reads next
    if (!process.argv[2]) fs.rmSync(OUT, { recursive: true, force: true });

    const only = process.argv[2];        // one file, for a quick look
    const all = SRC.flatMap(d => walk(path.join(ROOT, d), []))
      .filter(r => !only || r.split(path.sep).join('/') === only);
    if (!all.length) throw new Error('nothing to outline' + (only ? ': ' + only : ''));
    for (const rel of all) {
      const svg = fs.readFileSync(path.join(ROOT, rel), 'utf8');
      await page.setContent('<!doctype html><meta charset="utf-8">' +
        '<style>html,body{margin:0}svg{display:block}</style>' + svg, { waitUntil: 'load' });

      // ask the renderer where each character actually sits
      const spans = await page.evaluate(() => {
        const out = [];
        document.querySelectorAll('text').forEach((t, idx) => {
          const chars = [];
          const s = t.textContent;
          for (let i = 0; i < s.length; i++) {
            if (!s[i].trim()) continue;                  // a space has no outline
            let pt;
            try { pt = t.getStartPositionOfChar(i); } catch (e) { continue; }
            chars.push({ ch: s[i], x: pt.x, y: pt.y });
          }
          const cs = getComputedStyle(t);
          out.push({ idx, chars,
            size: parseFloat(t.getAttribute('font-size')) || parseFloat(cs.fontSize),
            weight: parseInt(t.getAttribute('font-weight') || cs.fontWeight, 10) || 400,
            fill: t.getAttribute('fill') || '#000000',
            opacity: t.getAttribute('fill-opacity') });
        });
        return out;
      });

      // build one path per run, then swap it in for the <text> in document order
      const paths = spans.map(run => {
        if (!run.chars.length) return '';
        let d = '';
        for (const c of run.chars) {
          if (font.charToGlyphIndex(c.ch) === 0) { missingGlyphs.add(c.ch); continue; }
          const p = font.getPath(c.ch, c.x, c.y, run.size, { kerning: false });
          d += p.toPathData(2) + ' ';
        }
        if (!d.trim()) return '';
        const bold = run.weight >= FAKE_BOLD_AT
          ? ' stroke="' + esc(run.fill) + '" stroke-width="' + (run.size * EMBOLDEN).toFixed(3) +
            '" stroke-linejoin="round"' + (run.opacity ? ' stroke-opacity="' + esc(run.opacity) + '"' : '')
          : '';
        runs++;
        return '<path d="' + d.trim() + '" fill="' + esc(run.fill) + '"' +
          (run.opacity ? ' fill-opacity="' + esc(run.opacity) + '"' : '') + bold + '/>';
      });

      let i = 0, missed = 0;
      const outSvg = svg.replace(/<text\b[^>]*>[\s\S]*?<\/text>/g, () => {
        const p = paths[i++];
        if (p === undefined) { missed++; return ''; }
        return p;
      });
      if (i !== spans.length || missed) problems.push(rel + ': matched ' + i + ' of ' + spans.length + ' runs');

      const target = path.join(OUT, rel);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, outSvg);
      if (++files % 100 === 0) console.log(String(files).padStart(4) + ' / ' + all.length);
    }
    console.log('\n' + files + ' files outlined, ' + runs + ' runs of type turned into paths');
    if (missingGlyphs.size) problems.push('the face does not carry these characters, so they were ' +
      'left out of the outlines: ' + JSON.stringify([...missingGlyphs].join('')));
  } finally {
    await browser.close();
  }
  if (problems.length) { console.error('\nPROBLEMS:\n  ' + problems.slice(0, 20).join('\n  ')); process.exitCode = 1; }
})().catch(e => { console.error('\nFAILED: ' + e.message); process.exitCode = 1; });
