/* ============================================================
   Owed — the landing's loading bar

   The film is a scroll-scrubbed frame sequence. On a first visit its
   frames stream in while the visitor is already scrolling, so most of
   the scroll paints a frame that has not arrived yet (measured on a cold
   cache: 67% of scroll frames at 20 Mbps, 94% at 6 Mbps). This holds the
   page behind a loading bar until the frames the scrub draws are in, and
   the fonts, then lifts.

   Runs in the head, before paint, so the bar is the first thing drawn.
   Without JavaScript nothing here runs and the bar is never shown.

   landing.js reports the film:  OwedBoot.expect(n), then OwedBoot.tick()
   once per frame, loaded or failed (a missing frame must not stall it).
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var KEY = 'owed:filmWarm';   // this tab has loaded the film once; the cache has it
  var CAP = 10000;             // never hold anyone longer than this, loaded or not
  var noop = function () {};

  var api = { active: false, expect: noop, tick: noop };
  window.OwedBoot = api;

  var warm = false;
  try { warm = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  if (warm) return;
  // a link to a section further down (#faq, #checks) lands off the film, so
  // making it wait for the film's frames buys that visitor nothing
  var hash = location.hash;
  if (hash && hash !== '#main' && hash !== '#film') return;
  // a search result's text link (#:~:text=) jumps to words further down too
  var nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  if (nav && String(nav.name).indexOf(':~:') >= 0) return;
  // reduced motion shows the film as three stills, so there is nothing to scrub
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  api.active = true;
  root.classList.add('is-booting');

  var t0 = performance.now(), last = t0;
  var total = 0, done = 0, domReady = false, finished = false, lifted = false;
  var shown = 0, lastNow = -1;
  var box = null, bar = null, fill = null, held = [];

  function real() { return total ? Math.min(1, done / total) : 0; }

  api.expect = function (n) { if (!finished) total += Math.max(0, n | 0); };
  api.tick = function () { if (finished) return; done++; if (domReady && done >= total) finish(); };

  /* The bar follows the real count and never runs backwards; it reads 100%
     only when everything is in. Before the page has parsed little or nothing
     is counted, so it also creeps toward 8% to show it has not stalled. Time-based,
     so a 60 Hz screen fills as fast as a 240 Hz one. */
  function frame(now) {
    var dt = Math.min(100, now - last); last = now;
    if (!fill) {
      box = document.getElementById('boot');
      bar = box && box.querySelector('[role="progressbar"]');
      fill = box && box.querySelector('.boot-fill');
    }
    if (fill) {
      if (finished) {
        shown = Math.min(1, shown + dt / 160);   // the last stretch takes at most 160 ms
      } else {
        var creep = domReady ? 0 : Math.min(0.08, (now - t0) / 4000 * 0.08);
        var goal = Math.max(real(), creep);
        if (goal > shown) shown += (goal - shown) * (1 - Math.exp(-dt / 140));
      }
      fill.style.transform = 'scaleX(' + shown.toFixed(4) + ')';
      var pct = finished ? 100 : Math.round(real() * 100);
      if (pct !== lastNow && bar) { bar.setAttribute('aria-valuenow', String(pct)); lastNow = pct; }
    }
    if (finished && (shown >= 1 || !fill)) { lift(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  function finish() {
    if (finished) return;
    finished = true;
    // warm even after the cap: someone who waited once should not wait again,
    // and the frames keep downloading after the lift
    try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
    setTimeout(lift, 600);   // the lift must not depend on animation frames alone
  }

  function lift() {
    if (lifted) return;
    lifted = true;
    box = box || document.getElementById('boot');
    // the page comes back first, then the veil fades off the film's first frame
    root.classList.remove('is-booting');
    root.classList.add('is-lifting');
    for (var i = 0; i < held.length; i++) held[i].removeAttribute('inert');
    held = [];
    var main = document.getElementById('main');
    if (main) main.removeAttribute('aria-busy');
    if (box) box.setAttribute('aria-hidden', 'true');   // a fading bar is not something to read out

    // the browser could not focus a #main target while the page was inert
    var target = hash && hash.length > 1 && document.getElementById(hash.slice(1));
    if (target && target.hasAttribute('tabindex') && (!document.activeElement || document.activeElement === document.body)) {
      try { target.focus({ preventScroll: true }); } catch (e) {}
    }

    var gone = function () {
      root.classList.remove('is-lifting');
      if (box && box.parentNode) box.parentNode.removeChild(box);
    };
    if (reduce || !box) gone();
    else setTimeout(gone, 700);
  }

  document.addEventListener('DOMContentLoaded', function () {
    // CSS hides the page from sight, focus and screen readers from first
    // paint; inert covers anything inside that sets its own visibility
    if (!finished) {
      box = box || document.getElementById('boot');
      var kids = document.body.children;
      for (var i = 0; i < kids.length; i++) {
        var k = kids[i];
        if (k === box || k.tagName === 'SCRIPT' || k.hasAttribute('inert')) continue;
        k.setAttribute('inert', ''); held.push(k);
      }
      var main = document.getElementById('main');
      if (main) main.setAttribute('aria-busy', 'true');
    }

    // the fonts count for a little, so a line never re-sets under the reveal
    api.expect(4);
    // ...but a font request that stalls may hold it for 3 s at most
    var fontsDone = false;
    var fontsIn = function () { if (fontsDone) return; fontsDone = true; api.tick(); api.tick(); api.tick(); api.tick(); };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fontsIn, fontsIn);
    else fontsIn();
    setTimeout(fontsIn, 3000);

    domReady = true;
    if (done >= total) finish();
  });

  setTimeout(finish, CAP);
})();
