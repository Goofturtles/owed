/* Break every section into its individual parts — one file per button, tile,
   chip, card, row, icon and heading — so each one is its own layer in After
   Effects instead of a piece of a flat board.

   A part is a group that either carries a name from the page (an id) or paints
   its own surface (a rect that covers it, filled or stroked). That is exactly
   what a button, a tile and a card look like once the page is drawn as shapes,
   and it is the level a motion designer actually animates.

   Run from the owed folder:  node vectors/explode.js                        */
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'film', 'node_modules', 'playwright-core'));

const ROOT = __dirname;
const FONTS = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
const PAD = 1;              // a 1px border strokes half a pixel outside the box

function slug(s) {
  return (s || '').replace(/[\u2018\u2019]/g, "'").replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '').toLowerCase().slice(0, 44) || '';
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const problems = [];
  const notes = [];
  let total = 0;
  try {
    const page = await browser.newPage();
    fs.rmSync(path.join(ROOT, 'pieces'), { recursive: true, force: true });

    /* The geometry in these files was measured on the live page in the product's
       own stack, which resolves to SF Pro here. Every crop below is measured the same way, so
       rendering it in anything else cuts every box to the wrong width — Inter is ~15% wider, which is what
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

    for (const folder of ['landing', 'app']) {
      const files = fs.readdirSync(path.join(ROOT, folder))
        .filter(f => f.endsWith('.svg') && !f.startsWith('00-'));   // boards are the parts already
      for (const file of files) {
        const svg = fs.readFileSync(path.join(ROOT, folder, file), 'utf8');
        await page.setContent('<!doctype html><meta charset="utf-8">' +
          '<link rel="stylesheet" href="' + FONTS + '">' +
          /* No font override: the crops must be measured in the same face the
             page was measured in, or every box is cut for the wrong width. */
          '<style>html,body{margin:0}svg{display:block}</style>' +
          svg, { waitUntil: 'networkidle' });
        await page.evaluate(() => document.fonts.ready);

        const parts = await page.evaluate((PAD) => {
          const root = document.querySelector('svg');
          const defs = root.querySelector('defs');
          const defsTxt = defs ? defs.outerHTML : '';
          const W = parseFloat(root.getAttribute('width'));
          const H = parseFloat(root.getAttribute('height'));

          /* A surface: the group paints its own ground. Compare by area, not by
             an exact match — a label re-rendered in Inter can sit a pixel or two
             wider than the tile it belongs to, and an exact test threw two of
             the eleven category tiles away for it. */
          const surface = (g, bb) => [...g.children].some(c => {
            if (c.tagName !== 'rect') return false;
            const f = c.getAttribute('fill'), s = c.getAttribute('stroke');
            if ((!f || f === 'none') && !s) return false;
            const r = c.getBBox();
            return r.width * r.height >= bb.width * bb.height * 0.7;
          });

          const seen = new Map();
          const out = [];
          const nodes = [];
          for (const g of root.querySelectorAll('g')) {
            let bb;
            try { bb = g.getBBox(); } catch (e) { continue; }
            if (bb.width < 8 || bb.height < 8) continue;
            /* The outermost wrapper used to be skipped as "the section itself",
               which quietly left the section's own ground — the black band under
               the closing block, the sidebar's grey — belonging to no part at
               all. It is stripped down to its own paint below like any other
               container, so it becomes the ground layer and the parts of a
               section still add up to the section. */
            const named = g.hasAttribute('id');
            if (!named && !surface(g, bb)) continue;
            /* A wrapper sitting exactly on the part it wraps is not a second
               part. Keep whichever of the two the page actually named, or the
               part lands as "21-part.svg" with its real name thrown away. */
            const key = [bb.x, bb.y, bb.width, bb.height].map(n => Math.round(n)).join(',');
            if (seen.has(key)) {
              const kept = out[seen.get(key)];
              if (named && !kept.id) { kept.id = g.getAttribute('id'); kept.markup = g.outerHTML; }
              continue;
            }
            seen.set(key, out.length);
            nodes.push(g);
            out.push({
              id: g.getAttribute('id') || '',
              kind: g.querySelector('image') ? 'photo' : (g.querySelector('path,circle,polygon,polyline') && !g.querySelector('text')) ? 'icon' : '',
              text: (g.textContent || '').trim().replace(/\s+/g, ' '),
              x: bb.x - PAD, y: bb.y - PAD,
              w: Math.ceil(bb.width + PAD * 2), h: Math.ceil(bb.height + PAD * 2),
              markup: g.outerHTML
            });
          }
          /* The parts nest: 001-nav IS the whole nav, and it contains every
             other nav part. Stacked in After Effects that container re-draws
             the lot on top, so nothing can be animated apart. Give each part
             only what is its own — its surface, its own text — and let its
             children be the separate parts they already are.

             The marquee is the exception: its track is one long strip of names
             that has to travel as a piece, so anything far wider than the page
             keeps its contents and its children stop being parts. */
          const OVERSIZE = W * 2;
          /* The section's own wrapper is the ground, never a travelling track —
             and in the marquee it is itself wider than the page, because the
             track hangs out of it. Left in, it would swallow the whole section. */
          const rootIdx = out.findIndex(o => o.w >= W - 2 && o.h >= H - 2);
          const wide = nodes.filter((n, i) => out[i].w > OVERSIZE && i !== rootIdx);
          const drop = new Set();
          nodes.forEach((n, i) => {
            if (wide.some(t => t !== n && t.contains(n))) drop.add(i);
          });
          /* The ground is the section's own area, not the reach of whatever
             hangs out of it: the marquee's track drags the wrapper's box to
             10462, and an artboard that wide would then out-scroll the track. */
          if (rootIdx >= 0) {
            out[rootIdx].x = 0; out[rootIdx].y = 0;
            out[rootIdx].w = Math.round(W); out[rootIdx].h = Math.round(H);
          }
          const kept = [], keptNodes = [];
          out.forEach((o, i) => { if (!drop.has(i)) { kept.push(o); keptNodes.push(nodes[i]); } });
          const keepSet = new Set(keptNodes);
          kept.forEach((o, i) => {
            const node = keptNodes[i];
            if (wide.indexOf(node) >= 0) return;         // the track travels whole
            const clone = node.cloneNode(true);
            const mine = [...node.querySelectorAll('*')];
            const twins = [...clone.querySelectorAll('*')];
            mine.forEach((el, n) => {
              if (el !== node && keepSet.has(el) && twins[n] && twins[n].parentNode) {
                twins[n].parentNode.removeChild(twins[n]);
              }
            });
            o.markup = clone.outerHTML;
            // it is named for what it says, so re-read that after the cut:
            // a header stripped of its labels is a hairline, not "Check something"
            o.text = (clone.textContent || '').trim().replace(/\s+/g, ' ');
            o.empty = !clone.querySelector('rect,path,line,circle,polygon,polyline,text,image,ellipse,use');
          });
          return { defs: defsTxt, parts: kept.filter(o => !o.empty), W: W, H: H };
        }, PAD);

        const dir = path.join(ROOT, 'pieces', folder, file.replace(/\.svg$/, ''));
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true });

        const used = {};
        let n = 0;
        for (const p of parts.parts) {
          /* Name it what it says. A wrapper's text is every label it contains
             run together, which names nothing — fall back to the page's own name
             for the element, then to what the shape is. */
          const said = slug(p.text);
          let name = (said && said.length <= 40) ? said
            : slug(p.id.replace(/-\d+$/, '')) || p.kind || said || 'part';
          if (name === 'svg' || name === 'part') name = p.kind || name;
          if (used[name]) name = name + '-' + (++used[name]);
          else used[name] = 1;
          n++;
          const body = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
            'width="' + p.w + '" height="' + p.h + '" viewBox="' + p.x.toFixed(2) + ' ' + p.y.toFixed(2) +
            ' ' + p.w + ' ' + p.h + '"><title>' + name + '</title>' + parts.defs + p.markup + '</svg>';
          fs.writeFileSync(path.join(dir, String(n).padStart(3, '0') + '-' + name + '.svg'), body);
        }
        if (!n) problems.push(folder + '/' + file + ': no parts found');
        // a section that is one full-bleed image (the film chapters) has
        // nothing smaller inside to cut out — the section file is that part
        else if (n < 3) notes.push(folder + '/' + file + ': ' + n + ' part(s) — a full-bleed section');
        for (const p of parts.parts) {
          // the marquee track repeats itself off-screen, so its row really is
          // wider than the page: real art, but a 100-inch artboard
          // the page is real art but a 100-inch artboard, worth knowing about
          if (p.w > parts.W * 2) notes.push(folder + '/' + file + ': "' + (p.text.slice(0, 24) || p.id) +
            '" is ' + p.w + ' wide against a ' + Math.round(parts.W) + ' page');
        }
        total += n;
        console.log(String(n).padStart(4) + '  ' + folder + '/' + file.replace(/\.svg$/, ''));
      }
    }
    console.log('\n' + total + ' parts written');
    if (notes.length) console.log('\nnotes:\n  ' + notes.join('\n  '));
  } finally {
    await browser.close();
  }
  if (problems.length) { console.error('\nPROBLEMS:\n  ' + problems.join('\n  ')); process.exitCode = 1; }
})().catch(e => { console.error('\nFAILED: ' + e.message); process.exitCode = 1; });
