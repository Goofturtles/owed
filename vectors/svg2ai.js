/* SVG -> .ai, the format After Effects imports as vectors.

   An Illustrator file with PDF compatibility switched on IS a PDF — same bytes,
   same structure — and After Effects reads .ai through its PDF parser. So we
   print each SVG with Chrome (paths stay paths, text stays text with the font
   embedded, photographs ride along) and hand it over with the extension AE
   accepts. Rename one back to .pdf and any PDF reader opens it.

   The page is left transparent: nothing paints the paper, so an .ai piece drops
   onto footage without a white card behind it.

   Run from the owed folder:  node vectors/svg2ai.js
   Needs the vendored browser driver: if the require below fails on a fresh
   clone (film/node_modules is git-ignored), run `cd film && npm i` first.   */
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'film', 'node_modules', 'playwright-core'));

const ROOT = __dirname;
const IN = path.join(ROOT, 'outlined');   // type already turned into paths
const OUT = path.join(ROOT, 'ai');
const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';

/* The page size must come from the ROOT <svg>. Matching loosely would find a
   nested icon's 36x36 instead, and the art would be cropped to a stamp with
   nothing to show for it — so read only the first tag, and refuse to guess. */
function dims(svg, file) {
  const tag = /<svg\b[^>]*>/.exec(svg);
  if (!tag) throw new Error(file + ': no <svg> tag');
  const w = /(?:^|\s)width="(\d+(?:\.\d+)?)(?:px)?"/.exec(tag[0]);
  const h = /(?:^|\s)height="(\d+(?:\.\d+)?)(?:px)?"/.exec(tag[0]);
  if (!w || !h) throw new Error(file + ': root <svg> has no plain width/height — ' + tag[0].slice(0, 120));
  return [parseFloat(w[1]), parseFloat(h[1])];
}

/* Everything under outlined/, and only that. The .svg files beside it keep
   their live text, which is right for Figma and the web; After Effects needs
   the outlined copies, because its shape converter drops type. */
function walk(dir, hits) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, hits);
    else if (e.name.endsWith('.svg')) hits.push(path.relative(IN, p));
  }
  return hits;
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const problems = [];
  let done = 0, bytes = 0;
  try {
    const page = await browser.newPage();

    /* The geometry in these files was measured on the live page in the product's
       own stack, which resolves to SF Pro here. Render it in anything else and
       every box is cut for the wrong width — Inter is ~15% wider, which is what
       pushed "Get script" off centre inside its own pill. fonts.check() answers
       about faces the page has exercised, not what is installed, so measure: if
       the stack's first family is really resolving, its width differs from a
       family that cannot exist. */
    await page.setContent('<!doctype html><meta charset="utf-8">' +
      '<link rel="stylesheet" href="' + FONTS + '">', { waitUntil: 'load' });
    const capture = await page.evaluate(async () => {
      try { await document.fonts.load('500 16px Inter'); } catch (e) {}
      await document.fonts.ready;
      const measure = fam => {
        const el = document.createElement('span');
        el.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:500 16px ' + fam;
        el.textContent = 'Get script Check something new';
        document.body.appendChild(el);
        const px = el.getBoundingClientRect().width;
        el.remove();
        return px;
      };
      return { sf: measure('"SF Pro Display"'), none: measure('"__missing__"'), inter: measure('Inter,"__missing__"') };
    });
    if (Math.abs(capture.sf - capture.none) < 0.5) throw new Error(
      'SF Pro Display is not available — the art was measured in it, so every line would ' +
      'render in a substitute and every centred label would drift. Install SF Pro, or re-capture ' +
      'the pages with the font you do have.');

    if (!fs.existsSync(IN)) throw new Error('run `node vectors/outline.js` first — ' + IN + ' is missing');
    fs.rmSync(OUT, { recursive: true, force: true });   // never leave an .ai whose SVG is gone
    const files = walk(IN, []);

    for (const rel of files) {
      const svg = fs.readFileSync(path.join(IN, rel), 'utf8');
      const [w, h] = dims(svg, rel);
      /* Do NOT override the art's font. Every box, baseline and line break in
         these files was measured on the live page, which renders the product's
         Apple-first stack — SF Pro on this machine. Forcing Inter here (a face
         ~15% wider) pushed every centred label off centre and every line long:
         "Get script" measures 63.9 in SF Pro and 73.6 in Inter, inside a pill
         built for 63.9. Render what was measured; the PDF embeds it. */
      await page.setContent('<!doctype html><meta charset="utf-8">' +
        '<link rel="stylesheet" href="' + FONTS + '">' +
        '<style>html,body{margin:0;padding:0;background:transparent}svg{display:block}' +
        '</style>' + svg, { waitUntil: 'load' });

      const target = path.join(OUT, rel.replace(/\.svg$/, '.ai'));
      fs.mkdirSync(path.dirname(target), { recursive: true });
      await page.pdf({
        path: target,
        width: w + 'px',
        height: h + 'px',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
        pageRanges: '1'          // one page per file; the size check below catches a spill
      });

      // the art must fit the paper, or page 1 is a crop and the rest is dropped
      const box = await page.evaluate(() => {
        const s = document.querySelector('svg').getBoundingClientRect();
        return [s.width, s.height];
      });
      if (Math.abs(box[0] - w) > 2 || Math.abs(box[1] - h) > 2) {
        problems.push(rel + ': art is ' + Math.round(box[0]) + 'x' + Math.round(box[1]) +
          ' but paper is ' + Math.round(w) + 'x' + Math.round(h));
      }
      const size = fs.statSync(target).size;
      if (size < 800) problems.push(rel + ': only ' + size + ' bytes, probably blank');
      bytes += size;
      if (++done % 50 === 0) console.log(String(done).padStart(4) + ' / ' + files.length);
    }
    console.log('\n' + done + ' .ai files, ' + Math.round(bytes / 1048576) + ' MB');
  } finally {
    await browser.close();
  }
  if (problems.length) {
    console.error('\nPROBLEMS (' + problems.length + '):\n  ' + problems.slice(0, 20).join('\n  '));
    process.exitCode = 1;
  }
})().catch(err => { console.error('\nFAILED: ' + err.message); process.exitCode = 1; });
