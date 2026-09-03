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
    // no bar at all over the film; the glass appears once the page has
    // covered the film (the owner: "no bg when it fades out, then add the bar")
    var sheet = document.querySelector('.film + section');
    var edge = sheet ? sheet.getBoundingClientRect().top <= 72 : window.scrollY > 8;
    nav.classList.toggle('is-stuck', edge);
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

  /* ---------- the film: a scroll-scrubbed frame sequence, three chapters ----------
     Ported from owed-cinematic. Progress p is scrollY over the track's scroll
     span. Seeking a 12 MB mp4 on every frame stuttered (each seek decodes from
     the last keyframe), so the film is 121 WebP frames (every second frame of
     the 24 fps clip, 1280 wide on laptops, 720 on phones) drawn to a canvas:
     the nearest LOADED frame to a smoothed p is painted, never a seek. Frames
     load in a spread order (0, 60, 30, 90, 15 ...) so the whole track has a
     coarse film within a second and fills in from there. */
  (function film() {
    if (!filmEl) return;
    var canvas = filmEl.querySelector('.film-canvas');
    var overlay = filmEl.querySelector('.film-overlay');
    var scenes = filmEl.querySelectorAll('.film-scene');
    var dots = filmEl.querySelectorAll('[data-dot]');
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    /* the frames play over the first F of the track and hold the last frame;
       the rest of the track is dwell for the third chapter (the owner: it
       "disappears way too fast" when the film and the text ended together) */
    var F = 0.85;
    function q(p) { return Math.min(1, p / F); }
    var CH = { promise: 0, places: 0.43 * F, how: 0.48 * F, action: 0.83 * F };

    /* the track = scrub + hold (p runs 0..1 over it) + one cover screen in
       which the white page rides up over the held frame (Apple's portal /
       garage-door curtain: hold, then an opaque block with a negative margin;
       no cross-fade). Heights come from the sticky element, not innerHeight,
       so the iOS toolbar collapsing cannot jump the frame. */
    var stick = filmEl.querySelector('.film-sticky');
    function vh() { return stick ? stick.offsetHeight : window.innerHeight; }
    function span() { return Math.max(1, filmEl.offsetHeight - vh() * 2); }
    function cover() { var top = filmEl.getBoundingClientRect().top; return Math.min(1, Math.max(0, (-top - span()) / vh())); }
    function progress() {
      var top = filmEl.getBoundingClientRect().top;
      return Math.min(1, Math.max(0, -top / span()));
    }
    /* the original's visibility curves: each text is fully gone before the next appears */
    function s1(p) { p = q(p); return p < 0.2 ? 1 : Math.max(0, 1 - (p - 0.2) / 0.08); }
    function s2(p) {
      p = q(p);
      if (p < 0.32) return 0;
      if (p < 0.4) return (p - 0.32) / 0.08;
      if (p < 0.55) return 1;
      return Math.max(0, 1 - (p - 0.55) / 0.08);
    }
    function s3(p) {
      p = q(p);
      if (p < 0.67) return 0;
      if (p < 0.75) return (p - 0.67) / 0.08;
      return 1;
    }

    filmEl.classList.add('is-js');   // the stagger only hides things once this loop can show them again

    var current = 0, target = 0, last = performance.now(), lastChapter = -1, ps = 0;
    var sceneOn = [null, null, null];

    /* ---- the frame bank ---- */
    // every frame of the 24 fps clip on desktop (241 at 1920x1080, WebP q88);
    // every second frame at 960x540 on phones and under Save-Data
    var small = window.innerWidth < 760 || (navigator.connection && navigator.connection.saveData);
    var N = small ? 121 : 241, frames = new Array(N), loaded = 0, ctx = null, drawn = -1;
    var W = 0, H = 0, FW = 1920, FH = 1080;
    var dir = 'assets/film/' + (small ? 'm' : 'd') + '/';
    if (small) { FW = 960; FH = 540; }
    if (canvas) { ctx = canvas.getContext('2d', { alpha: false }); ctx.imageSmoothingQuality = 'high'; }

    function frameSrc(i) { return dir + 'f' + ('00' + (i + 1)).slice(-3) + '.webp'; }
    /* coarse first: 0, 120, 60, 30, 90, 15, 45 ... then every gap */
    function order() {
      var out = [], seen = {};
      function add(i) { if (!seen[i]) { seen[i] = 1; out.push(i); } }
      add(0); add(N - 1);
      for (var step = 64; step >= 1; step = step >> 1) {
        for (var i = 0; i < N; i += step) add(i);
      }
      return out;
    }
    var queue = order(), inflight = 0, MAX = 4;
    function pump() {
      while (inflight < MAX && queue.length) {
        (function (i) {
          var img = new Image();
          img.decoding = 'async';
          inflight++;
          img.onload = function () {
            inflight--; frames[i] = img; loaded++;
            if (loaded === 1) filmEl.classList.add('is-live');
            drawn = -1;          // a nearer frame may exist now
            pump();
          };
          img.onerror = function () { inflight--; pump(); };
          img.src = frameSrc(i);
        })(queue.shift());
      }
    }
    /* nearest loaded frame to a fractional index */
    function nearest(f) {
      var i = Math.round(f);
      if (frames[i]) return i;
      for (var d = 1; d < N; d++) {
        if (i - d >= 0 && frames[i - d]) return i - d;
        if (i + d < N && frames[i + d]) return i + d;
      }
      return -1;
    }
    function size() {
      if (!canvas) return;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (w === W && h === H) return;
      W = w; H = h; canvas.width = w; canvas.height = h; drawn = -1;
    }
    function paint(f) {
      if (!ctx) return;
      size();
      var i = nearest(f);
      if (i < 0 || i === drawn) return;
      drawn = i;
      // cover: the frame fills the stage the way object-fit: cover would
      var s = Math.max(W / FW, H / FH), dw = FW * s, dh = FH * s;
      ctx.drawImage(frames[i], (W - dw) / 2, (H - dh) / 2, dw, dh);
    }
    pump();
    window.addEventListener('resize', function () { drawn = -1; }, { passive: true });

    /* the dissolve to paper over the last tenth of the track, smoothed so a
       fast scroll never jumps it */

    /* the loop only runs while the film is on screen */
    var visible = true, running = false;
    function tick(now) {
      if (!visible) { running = false; return; }
      var dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      var p = progress();
      // the text and the scrim follow a smoothed progress so wheel steps do not snap them
      ps += (p - ps) * (1 - Math.exp(-dt * 10));
      if (Math.abs(p - ps) < 0.0005) ps = p;
      var ops = [s1(ps), s2(ps), s3(ps)];
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
      // the dissolve to white: nothing until the reader reaches the foot of
      // the track (owner's call), then over the last 4%
      // the cover: the sheet's progress over the frame (0 = about to enter,
      // 1 = fully over; the sticky releases there). Scroll is the only easing.
      var cv = cover();
      var fading = cv > 0;
      filmEl.style.setProperty('--dim', (cv * 0.5).toFixed(3));   // Apple's scrim: the held frame dims under the sheet
      filmEl.classList.toggle('is-covering', fading);
      filmEl.classList.toggle('is-mid', p > 0.25 && !fading);
      if (overlay && overlay.hasAttribute('inert') !== fading) {
        if (fading) overlay.setAttribute('inert', ''); else overlay.removeAttribute('inert');
      }
      var dark = q(p) > 0.6 && cv < 1 - 72 / vh();   // white nav text until the sheet reaches the bar
      filmEl.classList.toggle('is-dark', dark);
      var flag = dark ? '1' : '0';
      if (filmEl.dataset.dark !== flag) { filmEl.dataset.dark = flag; onScroll(); }
      var chapter = q(p) < 0.3 ? 0 : q(p) < 0.65 ? 1 : 2;
      if (chapter !== lastChapter) {
        lastChapter = chapter;
        for (var d = 0; d < dots.length; d++) {
          if (d === chapter) dots[d].setAttribute('aria-current', 'true'); else dots[d].removeAttribute('aria-current');
        }
      }
      if (canvas) {
        // reduced motion: three stills, one per chapter, instead of a camera move
        target = (reduce ? [0, 0.43, 0.83][chapter] : q(p)) * (N - 1);
        if (reduce) current = target;
        else {
          current += (target - current) * (1 - Math.exp(-dt * 8));
          if (Math.abs(target - current) < 0.01) current = target;
        }
        paint(current);
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
        v = q(p) < 0.3 ? CH.places : q(p) < 0.65 ? CH.action : 1;
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

  /* ---------- reveal on scroll ----------
     Content must never be left invisible: the observer is a progressive
     enhancement, and a failsafe reveals everything shortly after load. */
  var revealables = document.querySelectorAll(
    '.proof-head, .proof-track, .show-copy, .show-media, .stat, .places .h2, .place-grid > li, .env .h2, .env-card, .faq-head, .faq-item, .cta > .wrap-1200 > *, .footer .wrap-1200 > *'
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
      el.style.transitionDelay = Math.min(n, 6) * 90 + 'ms';
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


  /* ---------- read from: pause the moving list (WCAG 2.2.2) ---------- */
  (function proofPause() {
    var btn = document.querySelector('[data-pause]');
    var track = document.querySelector('.proof-track');
    if (!btn || !track) return;
    btn.addEventListener('click', function () {
      var paused = track.classList.toggle('is-paused');
      btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      btn.setAttribute('aria-label', paused ? 'Resume the moving list' : 'Pause the moving list');
    });
  })();

  /* ---------- environment: the reader's own figures ----------
     data-table holds counts from data/coverage.json (region x age bucket):
     [rules still open, of those with no end date]. */
  (function envCalc() {
    var form = document.getElementById('envForm');
    var region = document.getElementById('envRegion'), age = document.getElementById('envAge');
    var n = document.getElementById('envN'), pct = document.getElementById('envPct'), bar = document.getElementById('envBar');
    if (!form || !region || !age || !n) return;
    var table;
    try { table = JSON.parse(form.getAttribute('data-table') || '{}'); } catch (e) { return; }
    function paint() {
      var row = table[region.value + ':' + age.value];
      if (!row) return;
      var p = row[0] ? Math.round(row[1] / row[0] * 100) : 0;
      n.textContent = row[0];
      pct.textContent = p + '%';
      if (bar) bar.style.setProperty('--w', p + '%');
    }
    region.addEventListener('change', paint);
    age.addEventListener('change', paint);
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    paint();
  })();
})();
