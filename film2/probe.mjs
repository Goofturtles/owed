import { chromium } from '../film/node_modules/playwright-core/index.mjs';
import { mkdirSync } from 'node:fs';
const OUT = 'film2/probe/'; mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ channel: 'chrome' });
const p = await b.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
await p.goto('http://localhost:3510/film2/index.html?capture=1', { waitUntil: 'load' });
await p.evaluate(() => document.fonts.ready);
await new Promise(r => setTimeout(r, 2500));
for (const t of [6.0, 16.5, 22.5, 31.0, 38.5, 47.0, 52.0, 56.5, 63.0, 68.5, 72.5, 76.5, 81.5, 86.5, 91.5, 96.5, 101.5, 113.5]) {
  await p.evaluate(x => window.owedFilm.seek(x), t);
  await new Promise(r => setTimeout(r, 120));
  await p.screenshot({ path: `${OUT}t${String(t).padStart(5,'0')}.png` });
}
console.log('errors:', errs.length ? errs.slice(0,5) : 'none');
await b.close();
