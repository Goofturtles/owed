/** Render every frame of the film. Deterministic: each frame is seek(t) then shoot. */
import { chromium } from '../film/node_modules/playwright-core/index.mjs';
import { mkdirSync, rmSync } from 'node:fs';
const FPS = 30, DUR = 150, OUT = 'film2/frames/';
rmSync(OUT, { recursive: true, force: true });   // never encode half of a previous cut
mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chrome', args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
await p.goto('http://localhost:3510/film2/index.html?capture=1', { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
// every weight the film uses, and every image decoded, before frame zero
await p.evaluate(() => Promise.all(
  ['500 40px Inter', '600 40px Inter', '700 92px Inter'].map(f => document.fonts.load(f))));
  /* document.fonts.load resolves happily when nothing matched, so assert */
  if (!await p.evaluate(() => document.fonts.check('700 92px Inter')))
    throw new Error('Inter did not load - every frame would be set in a fallback face');
await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => {}))));
await new Promise(r => setTimeout(r, 3000));
const total = Math.round(DUR * FPS);
for (let i = 0; i < total; i++) {
  await p.evaluate(t => window.owedFilm.seek(t), i / FPS);
  await p.screenshot({ path: `${OUT}f${String(i).padStart(5, '0')}.png` });
  if (i % 300 === 0) console.log(i, '/', total);
}
console.log('captured', total);
await b.close();
