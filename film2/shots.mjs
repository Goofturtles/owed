/**
 * Capture the real app at every beat the launch film needs.
 * Each shot is the product itself, at 1440x900, saved to film2/shots/.
 * Run from owed/:  node film2/shots.mjs
 */
import { chromium } from '../film/node_modules/playwright-core/index.mjs';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:3510';
const OUT = new URL('./shots/', import.meta.url).pathname.replace(/^\//, '');
mkdirSync(OUT, { recursive: true });

const wait = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ channel: 'chrome', args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
const shot = async name => { await page.screenshot({ path: `${OUT}${name}.png` }); console.log('shot', name); };

/* ---------- the landing page ---------- */
await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
await wait(2500);
await page.evaluate(() => {
  const t = document.getElementById('film');
  const vh = t.querySelector('.film-sticky').offsetHeight;
  scrollTo(0, t.offsetTop + (t.offsetHeight - vh * 2) * 0.82);
});
await wait(1500);
await shot('land-hero');

await page.evaluate(() => { document.querySelector('.places').scrollIntoView(); scrollBy(0, -80); });
await wait(1600); await shot('land-places');
await page.evaluate(() => { document.querySelector('.env-card').scrollIntoView(); scrollBy(0, -80); });
await wait(1800); await shot('land-env');

/* ---------- the wizard, question by question ---------- */
await page.goto(`${BASE}/app.html?demo=1&start=new`, { waitUntil: 'load' });
await wait(2600);
await shot('q1');

// pick the tile first: that is question one answered
await page.locator('#catChips .opt', { hasText: 'Headphones' }).first().click();
await wait(700); await shot('q1-picked');

// then the photo beat — a real file through the real input, so whatever the
// app genuinely does with it is what the film shows
await page.setInputFiles('#wizPhoto', 'assets/img/photo/headphones-800.webp');
await wait(3500); await shot('q1-named');
console.log('photo note:', await page.textContent('#wizPhotoNote'));

await page.locator('#wizNext').click();
await wait(900); await shot('q2');
await page.evaluate(() => {
  const tiles = [...document.querySelectorAll('.wiz-step.is-on .opt')];
  (tiles.find(x => /sony/i.test(x.textContent)) || tiles[0]).click();
});
await wait(500);
await page.evaluate(() => document.getElementById('wizNext').click());
await wait(900); await shot('q3');
await page.evaluate(() => {
  const tiles = [...document.querySelectorAll('.wiz-step.is-on .opt')];
  (tiles.find(x => /year or so|about a year/i.test(x.textContent)) || tiles[2]).click();
});
await wait(1100); await shot('q4');
await page.evaluate(() => {
  const tiles = [...document.querySelectorAll('.wiz-step.is-on .opt')];
  (tiles.find(x => /visa/i.test(x.textContent)) || tiles[0]).click();
});
await wait(500);
await page.evaluate(() => document.getElementById('wizNext').click());
await wait(2200); await shot('results');

/* ---------- the rule, then the words to say ---------- */
await page.locator('.rcard .rc-title .rc-details').first().click();
await wait(1200); await shot('rule');

await page.locator('.rcard [data-script]').first().click();
await wait(1400); await shot('script');

await page.locator('#copyScript').click();
await wait(900); await shot('script-copied');

await page.locator('#markWon').click();
await wait(1400); await shot('won');

/* ---------- the rest of the product ---------- */
await page.evaluate(() => {
  const s = document.getElementById('regionPick');
  if (s) { s.value = 'CA|CA-ON'; s.dispatchEvent(new Event('change', { bubbles: true })); }
});
await wait(1500); await shot('region');

await page.locator('#askRow').click();
await wait(600);
await page.evaluate(() => {
  const i = document.getElementById('askInput'), f = document.getElementById('askForm');
  if (i && f) { i.value = 'Do I need my receipt?'; f.requestSubmit(); }
});
await wait(2600); await shot('ask');

/* ---------- dark theme, for the night band ---------- */
await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); const a = document.getElementById('askClose'); if (a) a.click(); });
await wait(1400); await shot('dark-results');

await browser.close();
console.log('done');
