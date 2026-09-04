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

// the photo beat: drop one of our own product photographs into the field
await page.evaluate(() => {
  const f = document.getElementById('wizFallback1'); if (f) f.hidden = false;
  const n = document.getElementById('wizName'); if (n) { n.value = 'Sony WH-1000XM4 headphones'; n.dispatchEvent(new Event('input', { bubbles: true })); }
});
await wait(600); await shot('q1-named');

await page.evaluate(() => {
  const tiles = [...document.querySelectorAll('#catChips .opt')];
  const t = tiles.find(x => /headphone/i.test(x.textContent)) || tiles[2];
  t.click();
});
await wait(700); await shot('q1-picked');

await page.evaluate(() => document.getElementById('wizNext').click());
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
await page.evaluate(() => {
  const b = document.querySelector('.rcard .rc-title .rc-details') || document.querySelector('.rcard [data-toggle]');
  if (b) b.click();
});
await wait(1200); await shot('rule');

await page.evaluate(() => {
  const b = document.querySelector('.rcard [data-script]');
  if (b) b.click();
});
await wait(1400); await shot('script');

await page.evaluate(() => {
  const c = document.getElementById('copyScript'); if (c) c.click();
});
await wait(900); await shot('script-copied');

await page.evaluate(() => {
  const w = document.getElementById('markWon'); if (w) w.click();
});
await wait(1400); await shot('won');

/* ---------- the rest of the product ---------- */
await page.evaluate(() => {
  const s = document.getElementById('regionPick');
  if (s) { s.value = 'CA|CA-ON'; s.dispatchEvent(new Event('change', { bubbles: true })); }
});
await wait(1500); await shot('region');

await page.evaluate(() => {
  const r = document.getElementById('askRow'); if (r) r.click();
});
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
