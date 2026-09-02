/* ============================================================
   Owed — motion controller
   Progressive enhancement only. Every effect here is optional;
   content is fully readable if this file never runs.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- scroll progress ---------------- */
  (function progress() {
    if (reduce) return;
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    var raf = null;
    function update() {
      raf = null;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? Math.min(1, window.scrollY / h) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    }
    window.addEventListener('scroll', function () {
      if (raf === null) raf = requestAnimationFrame(update);
    }, { passive: true });
    update();
  })();

  /* ---------------- the finder ----------------
     Cycles three real examples: light the clause in the wall of small print,
     then swap the verdict beside it. Every example below is a plain-English
     paraphrase of a rule that is actually in data/coverage.json. */
  (function finder() {
    var wall = document.getElementById('finderWall');
    var out = document.querySelector('.finder-note-out');
    if (!wall || !out) return;

    var hits = wall.querySelectorAll('p[data-hit]');
    if (!hits.length) return;

    // Every line here traces to a specific rule in data/coverage.json, including
    // the caveats that rule states about itself. `doc` is the SOURCE that rule
    // was read from - never the user's own paperwork, which Owed does not read.
    var CASES = [
      // coverage.json is explicit that the six years is the window to BRING a
      // claim, not a promise the product lasts that long — and that Scotland is
      // five, not six. Say it the way the rule says it.
      { doc: 'Consumer Rights Act 2015 — s. 9',
        page: 'statute · verified',
        item: 'Sony WH-1000XM4 · 2 years old · England',
        verdict: 'The shop may still owe the repair',
        meta: 'Consumer Rights Act · 6 years to bring a claim' },
      { doc: 'Visa Signature — guide to benefits',
        page: 'guide · check your issuer',
        item: 'MacBook Air · 14 months · paid by card',
        verdict: 'One more year of cover',
        meta: "Card extended warranty · after Apple's ran out" },
      // NOT the 2026 good-working-order rule: coverage.json says that one
      // "starts 5 October 2026, and only covers new items bought or leased on
      // or after that date", so a three-year-old machine can never use it.
      // The durability warranty has no start date and no fixed end.
      { doc: 'Quebec Consumer Protection Act — s. 38',
        page: 'statute · verified',
        item: 'Whirlpool dishwasher · 3 years · Quebec',
        verdict: 'It should still be working',
        meta: 'Quebec legal warranty · must last a reasonable time' }
    ];

    var elDoc = document.getElementById('finderDocName');
    var elPage = document.getElementById('finderDocPage');
    var elFor = document.getElementById('finderFor');
    var elVerdict = document.getElementById('finderVerdict');
    var elMeta = document.getElementById('finderMeta');
    var i = 0;

    function paint(n) {
      Array.prototype.forEach.call(hits, function (p) {
        p.classList.toggle('is-hit', Number(p.dataset.hit) === n);
      });
      // publish the marked line's centre so the margin note can ride down to it
      var hit = wall.querySelector('p.is-hit');
      if (hit) {
        var grid = wall.closest('.finder-grid');
        if (grid) {
          // .finder-wall is static inside a positioned .finder-doc, so
          // hit.offsetTop is ALREADY relative to the doc — adding wall.offsetTop
          // double-counted the doc bar and only looked right because the
          // -3.4rem offset happened to cancel it.
          grid.style.setProperty('--hit-y', (hit.offsetTop + hit.offsetHeight / 2) + 'px');
        }
      }
      var c = CASES[n];
      if (elDoc) elDoc.textContent = c.doc;
      if (elPage) elPage.textContent = c.page;
      if (elFor) elFor.textContent = c.item;
      if (elVerdict) elVerdict.textContent = c.verdict;
      if (elMeta) elMeta.textContent = c.meta;
    }

    paint(0);
    // one still example is the whole story; only cycle if motion is welcome
    if (reduce) return;

    var timer = null, shown = 1;
    function step() {
      // WCAG 2.2.2: auto-updating content needs a stop. Rather than add a
      // control nobody would press, run one full pass and rest on the first
      // example. Pausing off-screen is a courtesy, not compliance.
      if (shown >= CASES.length) { stop(); return; }
      shown++;
      out.classList.add('is-swapping');
      Array.prototype.forEach.call(hits, function (p) { p.classList.remove('is-hit'); });
      setTimeout(function () {
        i = (i + 1) % CASES.length;
        paint(i);
        out.classList.remove('is-swapping');
      }, 340);
    }

    function start() { if (timer === null) timer = setInterval(step, 2200); }
    function stop() { if (timer !== null) { clearInterval(timer); timer = null; } }

    // don't animate a section nobody is looking at
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { en.isIntersecting ? start() : stop(); });
      }, { threshold: .25 }).observe(wall);
    } else {
      start();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { stop(); return; }
      // resume only if the section is still on screen
      var r = wall.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) start();
    });

    // --hit-y is a pixel measurement; a reflow across a breakpoint invalidates
    // it, and under reduced motion paint() otherwise runs exactly once
    var rt = null;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { paint(i); }, 150);
    }, { passive: true });
  })();

  /* ---------------- headline: split into words ----------------
     Wraps each word of [data-split] in its own inline-block span so the
     headline can rise word by word. Recurses through elements so the
     <em> emphasis and its styling survive intact. */
  function splitWords(root, startDelay, stepMs) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          if (!n.nodeValue.trim()) return;
          var frag = document.createDocumentFragment();
          n.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            var s = document.createElement('span');
            s.className = 'split-w';
            s.textContent = part;
            s.style.setProperty('--wd', startDelay + i * stepMs);
            i++;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) {
          walk(n);
        }
      });
    })(root);
    return i;
  }

  /* ---------------- hero entrance ---------------- */
  (function entrance() {
    // tells the stylesheet it is safe to hide [data-enter] — see motion.css
    document.body.classList.add('js-enter');
    var words = 0;
    Array.prototype.forEach.call(document.querySelectorAll('[data-split]'), function (el) {
      words += splitWords(el, 120, 70);
    });

    // everything else falls in after the headline has finished landing
    var base = 120 + words * 70;
    var items = document.querySelectorAll('[data-enter]');
    Array.prototype.forEach.call(items, function (el, i) {
      // the eyebrow leads the headline; the rest follows it
      el.style.setProperty('--d', i === 0 ? 40 : base + (i - 1) * 90);
    });
    requestAnimationFrame(function () {
      document.body.classList.add('enter-ready');
    });
    // Failsafe: never leave content stuck at opacity 0.
    setTimeout(function () {
      if (!document.body.classList.contains('enter-ready')) {
        document.body.classList.add('enter-ready');
      }
      var hidden = document.querySelectorAll('[data-enter], .split-w');
      Array.prototype.forEach.call(hidden, function (el) {
        if (getComputedStyle(el).opacity === '0') {
          el.style.opacity = '1';
          el.style.transform = 'none';
          el.style.filter = 'none';
        }
      });
    }, 3000);
  })();


  /** Animate a number from `from` to `to`. */
  function countTo(el, from, to, dur, prefix, suffix) {
    prefix = prefix || '';
    suffix = suffix || '';
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var p = Math.min(1, (ts - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(from + (to - from) * eased);
      el.textContent = prefix + v.toLocaleString() + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ---------------- generic in-view counters ---------------- */
  (function counters() {
    var els = document.querySelectorAll('[data-count-to]');
    if (!els.length) return;
    if (reduce || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(els, function (el) {
        el.textContent = (el.dataset.prefix || '') + Number(el.dataset.countTo).toLocaleString() + (el.dataset.suffix || '');
      });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        countTo(el, Number(el.dataset.countFrom || 0), Number(el.dataset.countTo),
                Number(el.dataset.countDur || 1100), el.dataset.prefix || '', el.dataset.suffix || '');
        io.unobserve(el);
      });
    }, { threshold: .4 });
    Array.prototype.forEach.call(els, function (el) { io.observe(el); });
  })();

  /* The "one step lit at a time" controller that lived here is gone. The
     steps are four ruled rows now, all legible at once, so there is no
     current step to advance and nothing to pin on hover. */

  /* ---------------- spotlight on cards ---------------- */
  /* ---------------- earth bar fill ---------------- */
  /* ---------------- scroll progress as a CSS variable ----------------
     Publishes 0..1 through each pinned section as --p so CSS can drive the
     floating cards and the city tags. Deliberately independent of
     scene.js: the cards must still work when WebGL is unavailable. */
  (function progressVars() {
    var secs = Array.prototype.slice.call(document.querySelectorAll('#stack, #city'));
    if (!secs.length) return;
    var raf = null;
    function update() {
      raf = null;
      for (var i = 0; i < secs.length; i++) {
        var r = secs[i].getBoundingClientRect();
        var travel = r.height - window.innerHeight;
        var p = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0;
        secs[i].style.setProperty('--p', p.toFixed(4));
      }
    }
    function onScroll() { if (raf === null) raf = requestAnimationFrame(update); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
    // Only now is it safe for CSS to hide anything behind --p. Without this the
    // city tags never appear, and any throw in an earlier IIFE here would have
    // caused exactly that.
    document.body.classList.add('js-p');
    // promote the cross-fading words only while the section is in play
    var city = document.getElementById('city');
    if (city && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) { city.classList.toggle('is-near', e.isIntersecting); });
      }, { rootMargin: '200px' }).observe(city);
    }
  })();

  /* ---------------- magnetic buttons ---------------- */
  (function magnetic() {
    if (reduce || !window.matchMedia('(hover: hover)').matches) return;
    // the hero submit sits inside a pill with no overflow clipping — it would
    // visibly poke through the border while you aim at it
    var btns = document.querySelectorAll('.btn-accent:not(.hero-try-btn)');
    Array.prototype.forEach.call(btns, function (btn) {
      btn.classList.add('magnetic');
      // measure once on enter, not on every move — reading the rect mid-move
      // forces a layout on each pointer event
      var r = null;
      btn.addEventListener('pointerenter', function () { r = btn.getBoundingClientRect(); });
      btn.addEventListener('pointermove', function (e) {
        if (!r) r = btn.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .18;
        var y = (e.clientY - r.top - r.height / 2) * .3;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      }, { passive: true });
      btn.addEventListener('pointerleave', function () { r = null; btn.style.transform = ''; });
      btn.addEventListener('pointerdown', function () { btn.style.transform = ''; });
    });
  })();

})();
