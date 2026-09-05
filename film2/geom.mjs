/* geometry check: does anything visible leave the frame or hit the caption? */
import { chromium } from '../film/node_modules/playwright-core/index.mjs';
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await p.goto('http://localhost:3510/film2/index.html?capture=1', { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 2500));
const bad = [];
for (let t = 0; t <= 150; t += 0.25) {
  await p.evaluate(x => window.owedFilm.seek(x), t);
  const r = await p.evaluate(() => {
    const out = { off: [], hit: [] };
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
    return out;
  });
  if (r.off.length || r.hit.length) bad.push([Math.round(t * 100) / 100, r.off.join(','), r.hit.join(',')]);
}
const fmt = bad.map(x => `${x[0]} off=[${x[1]}] capHit=[${x[2]}]`);
console.log(fmt.length ? fmt.slice(0, 40).join('\n') + `\n(${fmt.length} total)` : 'CLEAN');
await b.close();
