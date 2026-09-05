/**
 * Capture the app as PARTS, not pages: every tile, row, pill and panel as its
 * own image, so the film can bring each one in on its own beat.
 * Run from owed/:  node film2/parts.mjs
 */
import { chromium } from '../film/node_modules/playwright-core/index.mjs';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:3510';
const OUT = 'film2/parts/';
mkdirSync(OUT, { recursive: true });
const wait = ms => new Promise(r => setTimeout(r, ms));

const browser = await chromium.launch({ channel: 'chrome', args: ['--force-color-profile=srgb'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

/** one element, on its own, at 2x */
async function part(sel, name, nth = 0) {
  const el = page.locator(sel).nth(nth);
  await el.waitFor({ state: 'visible', timeout: 8000 });
  await el.screenshot({ path: `${OUT}${name}.png` });
  console.log('part', name);
}

/* ================= the wizard ================= */
await page.goto(`${BASE}/app.html?demo=1&start=new`, { waitUntil: 'load' });
await wait(2600);

// the ten category tiles, each on its own
const tiles = await page.locator('#catChips .opt').count();
for (let i = 0; i < Math.min(tiles, 10); i++) await part('#catChips .opt', `tile${i}`, i);
await part('.wiz-ico', 'wiz-ico');
await part('.wiz-progress', 'wiz-bar');
await part('#wizNext', 'btn-next');
await part('.side', 'shell-side');

/* the answered states, for the quick middle beats */
await page.locator('#catChips .opt', { hasText: 'Headphones' }).first().click();
await wait(600);
await part('#catChips .opt', 'tile-on', 2);
await page.setInputFiles('#wizPhoto', 'assets/img/photo/headphones-800.webp');
await wait(3200);
await part('.wiz-photo-preview', 'photo-note');

await page.locator('#wizNext').click(); await wait(900);
await part('.wiz-step.is-on .opt-list', 'brands');
await page.locator('.wiz-step.is-on .opt').first().click(); await wait(400);
await page.locator('#wizNext').click(); await wait(900);
await part('.wiz-step.is-on .opt-list', 'ages');
await page.locator('.wiz-step.is-on .opt').nth(2).click(); await wait(1100);
await part('.wiz-step.is-on .opt-list', 'pays');
await page.locator('.wiz-step.is-on .opt').first().click(); await wait(400);
await page.locator('#wizNext').click(); await wait(2400);

/* ================= the results ================= */
await part('.res-summary', 'res-line');
await part('.res-filter', 'res-chips');
await part('.rgroup-head', 'group-head');
const cards = await page.locator('.rcard:visible').count();
console.log('visible cards', cards);
for (let i = 0; i < Math.min(cards, 5); i++) await part('.rcard:visible', `card${i}`, i);
await part('.rail-block', 'rail-check');
await part('.rail-legend', 'rail-legend');
await part('.pane-head:visible', 'pane-head');

/* ================= the rule, then the script ================= */
await page.locator('.rcard .rc-title .rc-details').first().click();
await wait(1200);
await part('#detailPanel .doc, .rail .doc', 'doc-rule');

await page.locator('.rcard [data-script]').first().click();
await wait(1500);
await part('.scr-lines', 'script-body');
await part('.scr-kv', 'script-kv');
await part('.doc-foot', 'script-buttons');
await part('#copyScript', 'btn-copy');

await page.locator('#copyScript').click(); await wait(900);
await part('#copyScript', 'btn-copied');
await page.locator('#markWon').click(); await wait(1500);
try { await part('.toast, [role="status"]', 'toast-won'); } catch (e) { console.log('no toast'); }

/* ================= the rest ================= */
await page.evaluate(() => {
  const s = document.getElementById('regionPick');
  if (s) { s.value = 'CA|CA-ON'; s.dispatchEvent(new Event('change', { bubbles: true })); }
});
await wait(1400);
await part('.util-region', 'region-pill');

await page.locator('#askRow').click(); await wait(500);
await page.evaluate(() => {
  const i = document.getElementById('askInput'), f = document.getElementById('askForm');
  if (i && f) { i.value = 'Do I need my receipt?'; f.requestSubmit(); }
});
await wait(3000);
await part('#askPanel', 'ask-panel');

/* ================= the landing, for the wide beats ================= */
await page.goto(`${BASE}/index.html`, { waitUntil: 'load' });
await wait(2500);
await page.evaluate(() => { document.querySelector('.places').scrollIntoView(); scrollBy(0, -80); });
await wait(1700);
const places = await page.locator('.place-grid > li').count();
for (let i = 0; i < Math.min(places, 5); i++) await part('.place-grid > li', `place${i}`, i);

await page.evaluate(() => { document.querySelector('.env-card').scrollIntoView(); scrollBy(0, -80); });
await wait(1900);
const cells = await page.locator('.env-cells li').count();
for (let i = 0; i < Math.min(cells, 4); i++) await part('.env-cells li', `env${i}`, i);

await browser.close();
console.log('done');
