/* ============================================================
   Owed — landing page behaviour
   ============================================================ */
(function () {
  'use strict';

  var C = window.OwedCatalog;

  /* ---------- sticky nav ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function () {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- smooth anchor scroll ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    // the skip link must actually move focus, not just scroll
    if (a.classList.contains('skip-link')) return;
    var id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    // scrolling alone leaves keyboard focus behind in the nav, so the next Tab
    // carries on from the wrong place (WCAG 2.4.3)
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- hero try-it teaser ---------- */
  var form = document.getElementById('tryForm');
  var input = document.getElementById('tryItem');
  var result = document.getElementById('tryResult');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function teaserFor(text) {
    var cat = C.guessCategory(text);
    var brand = C.guessBrand(text);
    var label = cat ? C.categoryLabel(cat) : null;

    var lines = [];
    lines.push({ tone: 'ok', text: "The maker's own warranty — most start at a year, some run for life" });
    lines.push({ tone: 'ok', text: 'Extra cover from the card you paid with, often a whole extra year' });
    lines.push({ tone: 'maybe', text: 'Open payouts and free repair programmes for known faults' });
    lines.push({ tone: 'ok', text: 'Your legal cover, which usually outlasts the printed warranty' });

    var heading;
    if (brand && label) {
      heading = 'A ' + esc(label).toLowerCase() + ' from ' + esc(brand) + " — here's what we'd check";
    } else if (label) {
      heading = 'A ' + esc(label).toLowerCase() + " — here's what we'd check";
    } else if (brand) {
      heading = esc(brand) + " — here's what we'd check";
    } else {
      heading = "Here's what we'd check for that";
    }

    return { heading: heading, lines: lines, known: !!(brand || cat) };
  }

  if (form && input && result) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }
      var t;
      try {
        t = teaserFor(text);
      } catch (err) {
        // let the form submit for real rather than dying silently
        form.submit();
        return;
      }
      var items = t.lines.map(function (l) {
        return '<li><span class="dot ' + l.tone + '" aria-hidden="true"></span>' + l.text + '</li>';
      }).join('');

      result.hidden = false;
      result.innerHTML =
        '<h2 class="try-h">' + t.heading + '</h2>' +
        '<p class="muted" style="font-size:.82rem">Four questions in the app narrows this to the ones that actually apply to you.</p>' +
        '<ul>' + items + '</ul>' +
        '<a class="btn btn-accent go" href="auth.html?mode=signup&amp;item=' + encodeURIComponent(text) + '">Check my ' +
        (C.guessCategory(text) ? esc(C.categoryLabel(C.guessCategory(text))).toLowerCase() : 'item') + '</a>';
    });
  }

  /* ---------- copy button ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var card = btn.closest('.script-card');
    var body = card && card.querySelector('.script-body');
    if (!body) return;
    var text = body.innerText.trim();
    // the button holds an icon as well as a label, so only the label swaps
    var lbl = btn.querySelector('span') || btn;
    var done = function () {
      var old = lbl.textContent;
      lbl.textContent = 'Copied';
      btn.classList.add('is-copied');
      setTimeout(function () {
        lbl.textContent = old;
        btn.classList.remove('is-copied');
      }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  });

  /* ---------- reveal on scroll ----------
     Content must never be left invisible: the observer is a progressive
     enhancement, and a failsafe reveals everything shortly after load. */
  var revealables = document.querySelectorAll(
    '.showcase-panel, .section-head, .figure, .step, .tile, .script-card, .earth-lead, .earth-honest, .faq-item, .cta-inner, .stat-cell, .finder-doc, .finder-note-out'
  );

  function revealAll() {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('in'); });
  }

  if ('IntersectionObserver' in window && revealables.length) {
    // Stagger by position WITHIN the parent, not by index across the page:
    // a flat counter gave the fourth card in one row the same delay as the
    // first card in the next, so rows landed out of order.
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('reveal');
      var sibs = el.parentElement ? el.parentElement.children : [el];
      var n = Array.prototype.indexOf.call(sibs, el);
      el.style.transitionDelay = Math.min(n, 5) * 70 + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px 0px 0px', threshold: 0.01 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });

    // Failsafe: if anything is still hidden a moment after load, show it.
    window.addEventListener('load', function () {
      setTimeout(revealAll, 900);
    });
    setTimeout(revealAll, 2500);
  }


  /* ============================================================
     script showcase — after Descript's "Edit for Clarity"

     One document, three real scenarios, tabs beneath it. Every line
     below is drawn from a rule in data/coverage.json; nothing here is
     an invented deadline.

       0  cards-us-amex-extended-warranty
       1  uk-six-year-claim-window
       2  elec-nintendo-joycon-drift-free-repair

     Marked words are wrapped in «guillemets» in the source strings and
     become <mark> at render time.
     ============================================================ */
  (function scriptStage() {
    var card = document.getElementById('scriptCard');
    var body = document.getElementById('scriptBody');
    var tabsWrap = document.querySelector('.script-tabs');
    if (!card || !body || !tabsWrap) return;

    var tabs = tabsWrap.querySelectorAll('.script-tab');
    var ink = tabsWrap.querySelector('.script-tab-ink');
    var who = document.getElementById('scriptWho');
    var rule = document.getElementById('scriptRule');
    var due = document.getElementById('scriptDue');
    var src = document.getElementById('scriptSrc');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    var SCENES = [
      {
        who: 'American Express \u00b7 benefits line',
        rule: 'Extended warranty benefit',
        due: 'Tell them within 30 days',
        src: 'Amex US extended warranty guide',
        lines: [
          'Hi \u2014 I\u2019d like to open a claim under the \u00abextended warranty benefit\u00bb on my card.',
          'I bought Sony WH\u20111000XM4 headphones on \u00ab12 June 2025\u00bb and paid for them with this card. They stopped charging last week.',
          'Sony\u2019s one\u2011year warranty has ended, which is exactly what this benefit is for. Could you tell me what you need from me, and confirm the claim deadline?'
        ]
      },
      {
        who: 'The shop you bought it from',
        rule: 'Consumer Rights Act 2015',
        due: 'Up to 6 years \u00b7 England & Wales',
        src: 'UK Consumer Rights Act 2015, s.19',
        lines: [
          'Hi \u2014 I\u2019m writing about a dishwasher I bought from you in \u00abMarch 2023\u00bb. It has stopped draining.',
          'Under the \u00abConsumer Rights Act 2015\u00bb goods have to be of satisfactory quality and last a reasonable time, and my claim is against you as the seller rather than the manufacturer.',
          'A dishwasher failing after two years isn\u2019t reasonable, so I\u2019m asking for a repair. Could you confirm how you\u2019d like to arrange that?'
        ]
      },
      {
        who: 'Nintendo UK \u00b7 repair centre',
        rule: 'Joy-Con drift repair programme',
        due: 'No time limit',
        src: 'Nintendo UK support, drift repairs',
        lines: [
          'Hi \u2014 I\u2019d like to book a \u00abfree Joy-Con drift repair\u00bb. The left stick moves on its own.',
          'Nintendo has said publicly that drifting Joy-Cons are repaired \u00abfree of charge\u00bb in the UK and Europe, with \u00abno time limit\u00bb, even outside the 24-month warranty and even where it\u2019s ordinary wear.',
          'They\u2019re out of warranty, so I\u2019m asking under that programme rather than a warranty claim. Could you send me the repair form?'
        ]
      }
    ];

    /* ---- render one scene as words, so it can arrive a word at a time ----
       The text goes in as real text nodes: with the stylesheet's .w rule
       inert (no .is-lit) everything is still there, and a screen reader
       reads the finished sentence either way. */
    function render(scene) {
      body.classList.remove('is-lit');
      body.textContent = '';
      var i = 0;
      scene.lines.forEach(function (line) {
        var p = document.createElement('p');
        // split on the guillemets, alternating plain / marked
        line.split('\u00ab').forEach(function (chunk, ci) {
          var marked = null, rest = chunk;
          if (ci > 0) {
            var cut = chunk.indexOf('\u00bb');
            marked = chunk.slice(0, cut);
            rest = chunk.slice(cut + 1);
          }
          if (marked !== null) {
            var m = document.createElement('mark');
            m.style.setProperty('--mark-delay', Math.min(i * 16, 900) + 'ms');
            addWords(m, marked, function () { return i++; });
            p.appendChild(m);
          }
          addWords(p, rest, function () { return i++; });
        });
        body.appendChild(p);
      });
      return i;
    }

    function addWords(host, text, tick) {
      if (!text) return;
      // keep the spaces: split on the gaps, not through them
      text.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { host.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement('span');
        w.className = 'w';
        w.textContent = part;
        w.style.setProperty('--d', Math.min(tick() * 16, 900) + 'ms');
        host.appendChild(w);
      });
    }

    function light() {
      // The words were just rebuilt, so the browser needs to paint the dark
      // start state before the class flips or there is nothing to animate
      // from. rAF is the right hook, but it stalls in a backgrounded tab, so
      // a timer backs it up.
      var done = false;
      var go = function () { if (done) return; done = true; body.classList.add('is-lit'); };
      requestAnimationFrame(function () { requestAnimationFrame(go); });
      setTimeout(go, 140);
    }

    function moveInk(el) {
      if (!ink) return;
      ink.style.setProperty('--w', el.offsetWidth + 'px');
      ink.style.setProperty('--x', el.offsetLeft + 'px');
    }

    var current = -1;
    var armed = false;      // set once the card has actually been seen
    function show(n, focusTab) {
      n = (n + SCENES.length) % SCENES.length;
      if (n === current) return;
      current = n;
      var scene = SCENES[n];

      who.textContent = scene.who;
      rule.textContent = scene.rule;
      // the dot is a child of .script-due, so rewrite only the label after it
      due.lastChild.nodeValue = scene.due;
      src.textContent = scene.src;
      card.setAttribute('aria-labelledby', 'scriptTab' + n);

      Array.prototype.forEach.call(tabs, function (t, k) {
        var on = k === n;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on) moveInk(t);
        if (on && focusTab) t.focus();
      });

      render(scene);
      if (reduce) { body.classList.add('is-lit'); return; }
      if (!armed) return;   // the observer below lights the first one
      card.classList.add('is-swapping');
      setTimeout(function () { card.classList.remove('is-swapping'); }, 1900);
      light();
    }

    Array.prototype.forEach.call(tabs, function (t) {
      t.addEventListener('click', function () { show(+t.dataset.i, false); });
    });

    // arrow keys, Home and End — the part that makes role="tablist" honest
    tabsWrap.addEventListener('keydown', function (e) {
      // horizontal tablist: Left/Right only. Swallowing Up/Down would stop
      // the page scrolling while a tab has focus.
      var k = e.key, n = current;
      if (k === 'ArrowRight') n = current + 1;
      else if (k === 'ArrowLeft') n = current - 1;
      else if (k === 'Home') n = 0;
      else if (k === 'End') n = SCENES.length - 1;
      else return;
      e.preventDefault();
      show(n, true);
    });

    tabsWrap.classList.add('is-armed');
    current = -1;
    show(0, false);
    // the pill can only be placed once the tabs have their final width
    window.addEventListener('load', function () { moveInk(tabs[current]); });
    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { moveInk(tabs[current]); }, 120);
    });

    // hold the words back until the card is actually on screen
    /* Hold the words back until the card is on screen, then let them arrive.

       This deliberately does not lean on IntersectionObserver alone: its
       callbacks can be delivered late, and when they are, the centrepiece of
       the section sits blank. A plain scroll check costs nothing and always
       fires while someone is actually scrolling, so whichever notices first
       wins. */
    if (reduce) {
      armed = true;
      body.classList.add('is-lit');
    } else {
      var seen = function () {
        if (armed) return;
        armed = true;
        light();
        window.removeEventListener('scroll', onScrollCheck);
        window.removeEventListener('resize', onScrollCheck);
      };
      var inView = function () {
        var r = card.getBoundingClientRect();
        return r.top < window.innerHeight * 0.85 && r.bottom > 0;
      };
      var ticking = false;
      var onScrollCheck = function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () { ticking = false; if (inView()) seen(); });
      };
      window.addEventListener('scroll', onScrollCheck, { passive: true });
      window.addEventListener('resize', onScrollCheck, { passive: true });

      if ('IntersectionObserver' in window) {
        var sio = new IntersectionObserver(function (es) {
          es.forEach(function (en) { if (en.isIntersecting) { sio.disconnect(); seen(); } });
        }, { threshold: 0.15 });
        sio.observe(card);
      }

      if (inView()) seen();
      // last resort: the script must never be left invisible
      setTimeout(function () { armed = true; body.classList.add('is-lit'); }, 12000);
    }
  })();

  /* ============================================================
     earth - pill depth field

     The pills drift with the scroll rather than on a loop of their
     own. That is deliberate: scroll-linked movement is driven by the
     reader, so there is no perpetual motion to have to offer a pause
     control for, and nothing moves while the page is being read.
     ============================================================ */
  (function pillField() {
    var field = document.getElementById('pillfield');
    if (!field) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(max-width: 760px)').matches) return;   // stacked there

    var pills = field.querySelectorAll('.pf-pill');
    var ticking = false;

    function depth(el) {
      // near things travel furthest, which is what sells the depth
      return el.classList.contains('pf-far') ? 14
           : el.classList.contains('pf-mid') ? 28 : 46;
    }

    function update() {
      ticking = false;
      var r = field.getBoundingClientRect();
      var vh = window.innerHeight;
      if (r.bottom < -300 || r.top > vh + 300) return;
      // -1 above the fold .. +1 below it
      var p = ((r.top + r.height / 2) - vh / 2) / (vh / 2 + r.height / 2);
      p = Math.max(-1, Math.min(1, p));
      for (var i = 0; i < pills.length; i++) {
        pills[i].style.setProperty('--py', (p * depth(pills[i])).toFixed(1) + 'px');
      }
    }
    function onScroll() { if (ticking) return; ticking = true; requestAnimationFrame(update); }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    /* Pointer parallax. Ambient by design: the ceiling is "you notice
       something responded, you could not say what moved", so the near layer
       tops out at 12px. Written to the `translate` property rather than
       `transform` so it composes with each pill's rotation instead of
       overwriting it. Fine pointers only - on touch there is no hover to
       parallax against, and it would just cost frames. */
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var tx = 0, ty = 0, cx = 0, cy = 0, live = false, praf = 0;

    window.addEventListener('pointermove', function (e) {
      tx = (e.clientX / window.innerWidth - .5) * 2;
      ty = (e.clientY / window.innerHeight - .5) * 2;
    }, { passive: true });

    var stacked = window.matchMedia('(max-width: 760px)');
    function clearTranslate() {
      for (var i = 0; i < pills.length; i++) pills[i].style.translate = '';
    }
    // below the breakpoint the pills are a plain wrapped row; a stale inline
    // translate from the desktop layout would leave them nudged off-grid
    if (stacked.addEventListener) {
      stacked.addEventListener('change', function (e) { if (e.matches) clearTranslate(); });
    }

    function glide() {
      if (!live || stacked.matches) { praf = 0; return; }
      cx += (tx - cx) * .07;
      cy += (ty - cy) * .07;
      for (var i = 0; i < pills.length; i++) {
        var el = pills[i];
        var k = depth(el) / 46 * 12;          // 12 / 7 / 4px by layer
        el.style.translate = (cx * k).toFixed(2) + 'px ' + (cy * k).toFixed(2) + 'px';
      }
      praf = requestAnimationFrame(glide);
    }

    // only run the loop while the field is actually on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          live = en.isIntersecting;
          if (live && !praf) praf = requestAnimationFrame(glide);
        });
      }, { threshold: 0 }).observe(field);
    } else {
      live = true; praf = requestAnimationFrame(glide);
    }
  })();

  /* ---------- one FAQ open at a time ---------- */
  var faqs = document.querySelectorAll('.faq-item');
  Array.prototype.forEach.call(faqs, function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      Array.prototype.forEach.call(faqs, function (other) {
        if (other !== d) other.open = false;
      });
    });
  });
})();
