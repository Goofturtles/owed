/* geometry check: does anything visible leave the frame or hit the caption? */
import { chromium } from '../film/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ channel: 'chrome', args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await p.goto('http://localhost:3510/film2/index.html?capture=1', { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 2500));
const bad = [];
for (let t = 0; t <= 150; t += 1 / 30) {
  await p.evaluate(x => window.owedFilm.seek(x), t);
  const r = await p.evaluate(() => {
    const out = { off: [], hit: [], ink: null, lap: [], empty: false };
    /* dead air: a stretch with nothing on screen but the ground reads as a
       hole in the cut, which is the failure this whole film was rebuilt to
       avoid. The moving pool of light does not count as content. */
    const anyPart = [...document.querySelectorAll('.part')].some(d => Number(d.style.opacity || 0) > 0.05);
    const anyPhoto = [...document.querySelectorAll('.photo')].some(d => Number(d.style.opacity || 0) > 0.05);
    const anyChrome = ['.type', '.cap', '.stat-row', '.lock', '.tick', '.url']
      .some(s => Number(document.querySelector(s).style.opacity || 0) > 0.05);
    /* The headline layer can be up while every word inside it is still at 0,
       so ask whether any INK is actually on screen. words() emits .w spans
       with their own opacity; typed() emits bare text with no spans. */
    const inked = (layerSel, host) => {
      if (Number(document.querySelector(layerSel).style.opacity || 0) <= 0.05) return false;
      const el = document.querySelector(host);
      if (!el.textContent.trim()) return false;
      const ws = el.querySelectorAll('.w');
      return ws.length ? [...ws].some(w => Number(w.style.opacity || 1) > 0.05) : true;
    };
    const solid = ['.stat-row', '.lock', '.tick', '.url']
      .some(s => Number(document.querySelector(s).style.opacity || 0) > 0.05);
    out.empty = !anyPart && !anyPhoto && !solid && !inked('.type', '#big') && !inked('.cap', '#cap');
    /* type must never be visible while a ground is mid-dissolve: the ink
       colour is switched by a class on a hard threshold, so a headline caught
       inside the dissolve renders in the wrong colour for the ground. */
    const gv = k => Number(document.querySelector('.ground.g-' + k).style.opacity || 0);
    const mixing = ['white', 'black', 'blue'].some(k => { const v = gv(k); return v > 0.06 && v < 0.94; });
    const typeVis = Math.max(
      Number(document.querySelector('.type').style.opacity || 0),
      Number(document.querySelector('.cap').style.opacity || 0));
    if (mixing && typeVis > 0.03) out.ink = [typeVis.toFixed(2), gv('white').toFixed(2), gv('black').toFixed(2), gv('blue').toFixed(2)].join('/');
    const capEl = document.getElementById('cap');
    const capVis = Number(getComputedStyle(capEl.parentElement).opacity) > 0.5;
    const cb = capEl.getBoundingClientRect();
    document.querySelectorAll('.part').forEach((d, i) => {
      if (Number(d.style.opacity || 0) < 0.5) return;
      const r = d.getBoundingClientRect();
      const src = d.firstChild.getAttribute('src').split('/').pop().replace('.png', '');
      if (r.top < -4 || r.left < -4 || r.bottom > 1084 || r.right > 1924) out.off.push(src);
      if (capVis && cb.width && r.bottom > cb.top + 6 && r.top < cb.bottom - 6 &&
          r.right > cb.left + 6 && r.left < cb.right - 6) out.hit.push(src);
    });
    /* parts must not sit on top of one another, except where the film means
       to swap a component for its own answered state */
    const OK = new Set(['tile-on|tile2', 'btn-copied|script-buttons']);
    const vis = [...document.querySelectorAll('.part')]
      .filter(d => Number(d.style.opacity || 0) > 0.55)
      .map(d => ({ n: d.firstChild.getAttribute('src').split('/').pop().replace('.png', ''), r: d.getBoundingClientRect() }));
    for (let a = 0; a < vis.length; a++) for (let b = a + 1; b < vis.length; b++) {
      const A = vis[a], B = vis[b];
      const ox = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
      const oy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (ox > 8 && oy > 8 && !OK.has([A.n, B.n].sort().join('|'))) out.lap.push(A.n + '+' + B.n);
    }
    return out;
  });
  if (r.off.length || r.hit.length || r.ink || r.lap.length || r.empty)
    bad.push([Math.round(t * 100) / 100, r.off.join(','), r.hit.join(','), r.ink || '',
              [...new Set(r.lap)].join(','), r.empty ? 'yes' : '']);
}
const fmt = bad.map(x => `${x[0]} off=[${x[1]}] capHit=[${x[2]}] inkMix=[${x[3]}] overlap=[${x[4]}] empty=[${x[5]}]`);
console.log(fmt.length ? fmt.join('\n') + `\n(${fmt.length} total)` : 'CLEAN');
await b.close();
