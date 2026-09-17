/* Re-capture the two places a closed <details> ruined, and build the FAQ's
   animated states while we are in there.

   Chrome hides a closed <details>'s contents without touching display or
   visibility, and still reports a full-size box for it, so every answer was
   being drawn — hidden under the row below it, except the last one, which had
   nothing to hide under. dom2svg now asks checkVisibility() instead.

   Needs the site served:  the "owed" entry in .claude/launch.json, port 3510.
   Run from the owed folder:  node vectors/capture.js                        */
const fs = require('fs');
const path = require('path');
const { chromium } = require(path.join(__dirname, '..', 'film', 'node_modules', 'playwright-core'));

const ROOT = __dirname;
const SRC = path.join(ROOT, '_src');
const BASE = 'http://localhost:3510/';
/* The pages ship a strict CSP (script-src 'self'), so the library cannot be
   injected inline — it is loaded from the origin serving it instead. */
const LIB_URL = BASE + 'vectors/dom2svg.js';

const slug = s => s.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase().slice(0, 34);

/* _src holds the only copies of the captures, and remaking one means driving
   the live app back into that exact state. So a capture has to look like a
   capture before it is allowed to land on top of one, and whatever it replaces
   is kept alongside it. */
function write(rel, svg) {
  const texts = (svg.match(/<text/g) || []).length;
  const shapes = (svg.match(/<rect|<path|<image/g) || []).length;
  if (svg.length < 1500 || (!texts && !shapes)) {
    throw new Error(rel + ': that capture is empty or tiny (' + svg.length + ' bytes, ' +
      texts + ' text runs, ' + shapes + ' shapes) — refusing to overwrite the original');
  }
  const p = path.join(SRC, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  if (fs.existsSync(p)) fs.copyFileSync(p, p + '.bak');
  fs.writeFileSync(p, svg);
  const m = /<svg[^>]*width="(\d+)"[^>]*height="(\d+)"/.exec(svg);
  console.log('  ' + String(Math.round(svg.length / 1024)).padStart(4) + ' KB  ' +
    (m ? m[1] + 'x' + m[2] : '?').padEnd(10) + rel);
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1430, height: 900 } });

    // ---------- the landing page: the FAQ, closed and open ----------
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.addScriptTag({ url: LIB_URL });
    await page.evaluate(() => window.dom2svgPrep());
    await page.evaluate(() => document.querySelector('#faq').scrollIntoView());
    await page.waitForTimeout(600);

    const questions = await page.evaluate(() => window.dom2svg(document.querySelector('#faq')));
    console.log('landing — the FAQ with every answer closed');
    write('landing/10-questions.svg', questions);

    const labels = await page.evaluate(() =>
      [...document.querySelectorAll('#faq .faq-item summary h3')].map(h => h.textContent.trim()));

    console.log('landing — one state per answer, and each answer on its own');
    const fresh = [];
    for (let i = 0; i < labels.length; i++) {
      const name = String(i + 1).padStart(2, '0') + '-' + slug(labels[i]);
      const shot = await page.evaluate(async (i) => {
        const items = [...document.querySelectorAll('#faq .faq-item')];
        items.forEach((d, n) => { if (n === i) d.setAttribute('open', ''); else d.removeAttribute('open'); });
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const faq = document.querySelector('#faq');
        const body = items[i].querySelector('.faq-body');
        const fr = faq.getBoundingClientRect(), br = body.getBoundingClientRect();
        const whole = window.dom2svg(faq);
        const part = window.dom2svg(body, { background: 'none' });
        // the answer alone, but sitting where it sits in the section, so it
        // drops onto the closed board at 0,0 and lands in the right place
        const inner = part.slice(part.indexOf('>', part.indexOf('<svg')) + 1, part.lastIndexOf('</svg>'));
        const placed = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
          'width="' + Math.round(fr.width) + '" height="' + Math.round(fr.height) + '" viewBox="0 0 ' +
          Math.round(fr.width) + ' ' + Math.round(fr.height) + '"><g transform="translate(' +
          (br.left - fr.left).toFixed(2) + ',' + (br.top - fr.top).toFixed(2) + ')">' + inner + '</g></svg>';
        return { whole, placed };
      }, i);
      write('landing/animated/faq-open-' + name + '.svg', shot.whole);
      write('landing/animated/faq-answer-' + name + '.svg', shot.placed);
      fresh.push('faq-open-' + name + '.svg', 'faq-answer-' + name + '.svg');
    }
    await page.evaluate(() => document.querySelectorAll('#faq .faq-item')
      .forEach(d => d.removeAttribute('open')));

    /* The files are named from the live question copy, so a reworded question
       would leave its old slug behind forever and the AE script would animate
       the same answer twice. Clear the strays only once their replacements are
       safely written — never before, or a failed run leaves nothing at all. */
    const dir = path.join(SRC, 'landing', 'animated');
    for (const f of fs.readdirSync(dir)) {
      if (f.endsWith('.svg') && fresh.indexOf(f) < 0) {
        fs.rmSync(path.join(dir, f));
        console.log('  removed a stale state: ' + f);
      }
    }

    // ---------- the app: the help dialog, same bug ----------
    /* app.html sends a signed-out visitor to auth.html, so seed the same
       localStorage record signing in would leave. This is a throwaway browser
       profile, not anyone's real one. */
    await page.evaluate(() => localStorage.setItem('owed:user', JSON.stringify({
      name: 'Arjun', email: 'arjun@example.com', region: 'CA',
      subregion: 'Ontario, Canada', createdAt: 1700000000000
    })));
    await page.goto(BASE + 'app.html', { waitUntil: 'networkidle' });
    if (!/app\.html/.test(page.url())) throw new Error('the app bounced to ' + page.url() +
      ' — the seeded user was not accepted');
    await page.addScriptTag({ url: LIB_URL });
    await page.evaluate(() => window.dom2svgPrep());
    await page.evaluate(() => {
      const d = document.getElementById('helpDialog');
      if (!d.open) d.showModal();
      d.querySelectorAll('details').forEach(x => x.removeAttribute('open'));
    });
    await page.waitForTimeout(500);
    const help = await page.evaluate(() => window.dom2svg(document.getElementById('helpDialog')));
    console.log('app — the help dialog, answers closed');
    write('app/12-help-dialog.svg', help);
  } finally {
    await browser.close();
  }
})().catch(e => { console.error('\nFAILED: ' + e.message); process.exitCode = 1; });
