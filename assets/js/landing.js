/* ============================================================
   Owed — landing page behaviour
   ============================================================ */
(function () {
  'use strict';

  var C = window.OwedCatalog;

  /* ---------- sticky nav ---------- */
  var nav = document.getElementById('nav');
  var darkBands = document.querySelectorAll('.on-dark-band');   /* none on the SaaS page; the film sets its own flag */
  var filmEl = document.getElementById('film');
  var onScroll = function () {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 8);
    // dark glass while the pill floats over a dark band (the statement card,
    // a dark chapter) or over the film's dark chapter (data-dark from its loop)
    var dark = false;
    for (var i = 0; i < darkBands.length && !dark; i++) {
      var r = darkBands[i].getBoundingClientRect();
      dark = r.top < 72 && r.bottom > 20;
    }
    if (!dark && filmEl && filmEl.dataset.dark === '1') {
      var fr = filmEl.getBoundingClientRect();
      dark = fr.bottom > 72;
    }
    nav.classList.toggle('on-dark', dark);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- the film: scroll-scrubbed video, three chapters ----------
     Ported from owed-cinematic/src/App.tsx + useVideoScrub.ts. Progress p is
     scrollY over the track's scroll span; the video is seeked towards a
     smoothed p * duration (tau 8) on every frame and is never played. */
  (function film() {
    if (!filmEl) return;
    var video = filmEl.querySelector('.film-video');
    var overlay = filmEl.querySelector('.film-overlay');
    var scenes = filmEl.querySelectorAll('.film-scene');
    var dots = filmEl.querySelectorAll('[data-dot]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var CH = { promise: 0, places: 0.43, how: 0.48, action: 0.83 };

    function span() { return Math.max(1, filmEl.offsetHeight - window.innerHeight); }
    function progress() {
      var top = filmEl.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, -top / span()));
    }
    /* the original's visibility curves: each text is fully gone before the next appears */
    function s1(p) { return p < 0.2 ? 1 : Math.max(0, 1 - (p - 0.2) / 0.08); }
    function s2(p) {
      if (p < 0.32) return 0;
      if (p < 0.4) return (p - 0.32) / 0.08;
      if (p < 0.55) return 1;
      return Math.max(0, 1 - (p - 0.55) / 0.08);
    }
    function s3(p) {
      if (p < 0.67) return 0;
      if (p < 0.75) return (p - 0.67) / 0.08;
      return 1;
    }

    filmEl.classList.add('is-js');   // the stagger only hides things once this loop can show them again

    var duration = 0, current = 0, target = 0, last = performance.now(), lastChapter = -1;
    var sceneOn = [null, null, null];
    if (video) {
      var onMeta = function () { if (isFinite(video.duration) && video.duration > 0) duration = video.duration; };
      video.addEventListener('loadedmetadata', onMeta);
      if (video.readyState >= 1) onMeta();
      video.addEventListener('loadeddata', function () { filmEl.classList.add('is-live'); });
      if (video.readyState >= 2) filmEl.classList.add('is-live');
      video.addEventListener('error', function () { filmEl.classList.remove('is-live'); });
      /* the whole file is only fetched once the reader shows intent to move,
         and never on a connection that asked to save data */
      var saveData = !!(navigator.connection && navigator.connection.saveData);
      var upgraded = false;
      var upgrade = function () {
        if (upgraded || saveData) return;
        upgraded = true;
        video.preload = 'auto';
        try { video.load(); } catch (e) { /* keep metadata */ }
      };
      ['scroll', 'touchstart', 'keydown', 'wheel', 'pointerdown'].forEach(function (ev) {
        window.addEventListener(ev, upgrade, { passive: true, once: true });
      });
    }

    /* the dissolve to paper over the last tenth of the track, smoothed so a
       fast scroll never jumps it */
    var fadeSmooth = 0;

    /* the loop only runs while the film is on screen */
    var visible = true, running = false;
    function tick(now) {
      if (!visible) { running = false; return; }
      var dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      var p = progress();
      var ops = [s1(p), s2(p), s3(p)];
      for (var i = 0; i < scenes.length; i++) {
        var sc = scenes[i], o = ops[i] || 0, on = o > 0.3;
        sc.style.opacity = o;
        sc.style.visibility = o <= 0 ? 'hidden' : '';
        if (sceneOn[i] !== on) {
          sceneOn[i] = on;
          sc.classList.toggle('is-show', on);
          sc.classList.toggle('is-on', on);
          sc.setAttribute('aria-hidden', String(!on));
          if (on) sc.removeAttribute('inert'); else sc.setAttribute('inert', '');
        }
      }
      // the dissolve to paper: nothing until 0.9, complete at 1
      var fadeTarget = Math.min(1, Math.max(0, (p - 0.9) / 0.1));
      fadeSmooth += (fadeTarget - fadeSmooth) * (1 - Math.exp(-dt * 6));
      if (Math.abs(fadeTarget - fadeSmooth) < 0.001) fadeSmooth = fadeTarget;
      var fade = reduce ? fadeTarget : fadeSmooth;
      filmEl.style.setProperty('--fade', fade.toFixed(3));
      var fading = fade > 0.005;
      filmEl.classList.toggle('is-fading', fading);
      filmEl.classList.toggle('is-faded', fade >= 0.999);
      filmEl.classList.toggle('is-mid', p > 0.25 && !fading);
      // the chapter text is unseen while it dissolves: out of the tab order too
      if (overlay && overlay.hasAttribute('inert') !== fading) {
        if (fading) overlay.setAttribute('inert', ''); else overlay.removeAttribute('inert');
      }
      var dark = p > 0.6 && !fading;
      filmEl.classList.toggle('is-dark', dark);
      var flag = dark ? '1' : '0';
      if (filmEl.dataset.dark !== flag) { filmEl.dataset.dark = flag; onScroll(); }
      var chapter = p < 0.3 ? 0 : p < 0.65 ? 1 : 2;
      if (chapter !== lastChapter) {
        lastChapter = chapter;
        for (var d = 0; d < dots.length; d++) {
          if (d === chapter) dots[d].setAttribute('aria-current', 'true'); else dots[d].removeAttribute('aria-current');
        }
      }
      if (video && duration > 0) {
        // reduced motion: three stills, one per chapter, instead of a camera move
        target = (reduce ? [0, 0.43, 0.83][chapter] : p) * duration;
        if (reduce) current = target;
        else {
          current += (target - current) * (1 - Math.exp(-dt * 8));
          if (Math.abs(target - current) < 0.002) current = target;
        }
        if (!video.seeking && Math.abs(video.currentTime - current) > 0.01) {
          try { video.currentTime = current; } catch (e) { /* not seekable yet */ }
        }
      }
      requestAnimationFrame(tick);
    }
    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      requestAnimationFrame(tick);
    }
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        visible = es[es.length - 1].isIntersecting;
        if (visible) start();
      }, { rootMargin: '120px 0px' }).observe(filmEl);
    }
    start();

    /* chapter buttons: scroll the track to a point on 0-1 */
    filmEl.addEventListener('click', function (e) {
      var b = e.target.closest('[data-go]');
      if (!b) return;
      var key = b.dataset.go, v;
      if (key === 'next') {
        var p = progress();
        v = p < 0.3 ? CH.places : p < 0.65 ? CH.action : 1;
      } else {
        v = CH[key];
      }
      if (typeof v !== 'number') return;
      window.scrollTo({ top: filmEl.offsetTop + v * span(), behavior: reduce ? 'auto' : 'smooth' });
    });
  })();

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
        '<h3 class="try-h">' + t.heading + '</h3>' +
        '<p class="muted try-sub">Four questions in the app narrow this to the ones worth asking about.</p>' +
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
    var text = Array.prototype.map.call(body.querySelectorAll('p:not(.sr-only)'), function (p) {
      return p.innerText.trim();
    }).join('\n');
    // the button holds an icon as well as a label, so only the label swaps
    var lbl = btn.querySelector('span') || btn;
    var status = document.getElementById('copyStatus');
    var done = function () {
      var old = lbl.textContent;
      lbl.textContent = 'Copied';
      btn.classList.add('is-copied');
      if (status) status.textContent = 'Script copied to the clipboard.';
      setTimeout(function () {
        lbl.textContent = old;
        btn.classList.remove('is-copied');
        if (status) status.textContent = '';
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
    '.product-shot, .sources-grid, .section-head, .prob-card, .feat-card, .hw-step, .hw-shot, .ck-col, .sc-left, .sc-fig, .env-card, .env-copy, .env-diagram, .env-chips, .reg-row, .faq-item, .cta-card'
  );

  var io = null;
  function revealAll() {
    if (io) { io.disconnect(); io = null; }
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
    io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px 0px 0px', threshold: 0.01 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });

    // Failsafe: if anything is still hidden a moment after load, show it.
    window.addEventListener('load', function () {
      setTimeout(revealAll, 900);
    });
    // a hard floor only for a load event that never comes; 2.5s used to
    // reveal every section while the reader was still on the first one
    setTimeout(revealAll, 6000);
  }


  /* ============================================================
     script showcase — after Descript's "Edit for Clarity"

     One document, three real scenarios, tabs beneath it. Every line
     below is drawn from a rule in data/coverage.json; nothing here is
     an invented deadline.

       0  amex-extended-warranty-us
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
          'The maker\u2019s own warranty has ended, which is exactly what this benefit is for. Could you tell me what you need from me, and confirm the claim deadline?'
        ]
      },
      {
        who: 'The shop you bought it from',
        rule: 'Consumer Rights Act 2015',
        due: 'Up to 6 years \u00b7 England, Wales & NI',
        src: 'UK Consumer Rights Act 2015, s.9',
        lines: [
          'Hi \u2014 I\u2019m writing about a dishwasher I bought from you in \u00abMarch 2024\u00bb. It has stopped draining.',
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
        // the word-by-word copy is for the eye; assistive tech gets the line
        p.setAttribute('aria-hidden', 'true');
        body.appendChild(p);
        var sr = document.createElement('p');
        sr.className = 'sr-only';
        sr.textContent = line.replace(/[\u00ab\u00bb]/g, '');
        body.appendChild(sr);
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

  /* ---------- read from: pause the moving list (WCAG 2.2.2) ---------- */
  (function sourcesPause() {
    var btn = document.querySelector('[data-pause]');
    var track = document.querySelector('.sources-track');
    if (!btn || !track) return;
    // the name stays "Pause the list"; aria-pressed carries the state
    btn.addEventListener('click', function () {
      var paused = track.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    });
    // the loop only runs while the strip is on screen
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) { track.classList.toggle('is-off', !en.isIntersecting); });
      }, { threshold: 0 }).observe(track);
    }
  })();

  /* ---------- the script: a caption lights its number on the card ----------
     Decorative coupling (Vercel, Grammarly): hovering caption N turns
     marker N on the script card to the accent. The section reads fully
     without it, so it is pointer-only and never required. */
  (function scriptCallouts() {
    var fig = document.querySelector('.sc-fig');
    var caps = document.querySelectorAll('.sc-cap');
    if (!fig || !caps.length) return;
    function on(n) {
      if (n) fig.setAttribute('data-on', n); else fig.removeAttribute('data-on');
      Array.prototype.forEach.call(caps, function (c) {
        c.classList.toggle('is-on', !!n && c.getAttribute('data-n') === n);
      });
    }
    Array.prototype.forEach.call(caps, function (c) {
      var n = c.getAttribute('data-n');
      c.addEventListener('mouseenter', function () { on(n); });
      c.addEventListener('mouseleave', function () { on(''); });
    });
  })();

  /* ---------- beyond money: the one number Owed counts ----------
     Read from this browser's own shelf (the same store the app writes):
     items with at least one claim marked won. Self-reported, per
     LIMITATIONS.md section 10; nothing here converts it to anything. */
  (function envCount() {
    var el = document.getElementById('envCount');
    if (!el) return;
    var n = 0;
    try {
      var shelf = JSON.parse(localStorage.getItem('owed:shelf') || '[]');
      if (Array.isArray(shelf)) {
        shelf.forEach(function (it) {
          var c = it && it.claims;
          if (!c || typeof c !== 'object') return;
          for (var k in c) {
            if (c[k] && c[k].state === 'won') { n++; break; }
          }
        });
      }
    } catch (e) { n = 0; }
    if (n) {
      el.textContent = 'In this browser so far: ' + n + (n === 1 ? ' thing' : ' things') + ' marked as fixed.';
    }
  })();
})();
