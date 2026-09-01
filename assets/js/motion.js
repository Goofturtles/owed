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

    var CASES = [
      // coverage.json is explicit that the six years is the window to BRING a
      // claim, not a promise the product lasts that long — and that Scotland is
      // five, not six. Say it the way the rule says it.
      { item: 'Sony WH-1000XM4 · 2 years old · England',
        verdict: 'The shop may still owe the repair',
        meta: 'Consumer Rights Act · 6 years to bring a claim' },
      { item: 'MacBook Air · 14 months · paid by card',
        verdict: 'One more year of cover',
        meta: "Card extended warranty · after Apple's ran out" },
      { item: 'Whirlpool dishwasher · 3 years · Quebec',
        verdict: 'Free repair, parts and labour',
        meta: 'Legal guarantee · 3 to 6 years' }
    ];

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
          grid.style.setProperty('--hit-y',
            (hit.offsetTop + wall.offsetTop + hit.offsetHeight / 2) + 'px');
        }
      }
      var c = CASES[n];
      if (elFor) elFor.textContent = c.item;
      if (elVerdict) elVerdict.textContent = c.verdict;
      if (elMeta) elMeta.textContent = c.meta;
    }

    paint(0);
    // one still example is the whole story; only cycle if motion is welcome
    if (reduce) return;

    var timer = null;
    function step() {
      out.classList.add('is-swapping');
      Array.prototype.forEach.call(hits, function (p) { p.classList.remove('is-hit'); });
      setTimeout(function () {
        i = (i + 1) % CASES.length;
        paint(i);
        out.classList.remove('is-swapping');
      }, 340);
    }

    function start() { if (timer === null) timer = setInterval(step, 4200); }
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

  /* ---------------- step scroll highlight ---------------- */
  (function steps() {
    var steps = document.querySelectorAll('.step');
    if (reduce || !steps.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        en.target.classList.toggle('active', en.isIntersecting);
      });
    }, { rootMargin: '-38% 0px -38% 0px', threshold: 0 });
    Array.prototype.forEach.call(steps, function (el) { io.observe(el); });
  })();

  /* ---------------- spotlight on cards ---------------- */
  (function spotlight() {
    if (reduce || !window.matchMedia('(hover: hover)').matches) return;
    document.addEventListener('pointermove', function (e) {
      var card = e.target.closest('.check');
      if (!card) return;
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  })();

  /* ---------------- script typewriter trigger ---------------- */
  (function script() {
    var body = document.querySelector('.script-body');
    var card = document.querySelector('.script-card');
    if (!body) return;
    if (reduce || !('IntersectionObserver' in window)) {
      body.classList.add('typed');
      if (card) card.classList.add('typed');
      return;
    }
    // opt in to being hidden only now that the reveal is guaranteed to run
    body.classList.add('js-anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        body.classList.add('typed');
        if (card) card.classList.add('typed');
        io.disconnect();
      });
    }, { threshold: .3 });
    io.observe(body);
    // last resort: never leave the claim script blank
    setTimeout(function () {
      if (!body.classList.contains('typed')) body.classList.remove('js-anim');
    }, 8000);
  })();

  /* ---------------- earth bar fill ---------------- */
  (function earthBar() {
    var bar = document.querySelector('.earth-bar');
    if (!bar) return;
    if (!('IntersectionObserver' in window) || reduce) { bar.classList.add('fill'); return; }
    bar.classList.add('js-anim');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        bar.classList.add('fill');
        io.disconnect();
      });
    // the bar is only 5px tall, so a fast scroll can blow past a 50% ratio.
    // Any sliver counts.
    }, { threshold: 0 });
    io.observe(bar);
    // if it somehow never fires, show the real value rather than a false 0%
    setTimeout(function () {
      if (!bar.classList.contains('fill')) bar.classList.remove('js-anim');
    }, 8000);
  })();

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

  /* ---------------- cta: ambient loop ---------------- */
  (function ctaVideo() {
    var v = document.querySelector('.cta-video');
    if (!v) return;
    if (reduce) { v.removeAttribute('src'); return; }
    if (!('IntersectionObserver' in window)) return;
    var started = false;
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          if (!started) { started = true; v.preload = 'auto'; v.load(); }
          var pr = v.play();
          if (pr && pr.catch) pr.catch(function () {});   // autoplay refusal is fine
        } else if (started) {
          v.pause();
        }
      });
    }, { rootMargin: '200px' }).observe(v);
  })();

  /* ---------------- magnetic buttons ---------------- */
  (function magnetic() {
    if (reduce || !window.matchMedia('(hover: hover)').matches) return;
    // the hero submit sits inside a pill with no overflow clipping — it would
    // visibly poke through the border while you aim at it
    var btns = document.querySelectorAll('.btn-accent:not(.hero-try-btn), .btn-primary.btn-lg');
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
