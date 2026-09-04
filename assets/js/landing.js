/* ============================================================
   Owed — landing page behaviour
   ============================================================ */
(function () {
  'use strict';

  var C = window.OwedCatalog;

  /* ---------- sticky nav ---------- */
  /* signed in already: the page says so — no "Sign in", and "Start free"
     becomes the way back to the shelf */
  (function signedIn() {
    var u = null;
    try { u = JSON.parse(localStorage.getItem('owed:user') || 'null'); } catch (e) { u = null; }
    if (!u || !u.name || u.name === 'You') return;
    var first = (u.name || '').trim().split(/\s+/)[0];
    document.querySelectorAll('a[href^="auth.html"]').forEach(function (l) {
      if (/sign in/i.test(l.textContent)) {
        // the sign-in button becomes "Hi, Name" and opens a small settings menu
        var btn = document.createElement('button');
        btn.type = 'button'; btn.className = l.className + ' nav-me'; btn.textContent = 'Hi, ' + first;
        btn.setAttribute('aria-haspopup', 'menu'); btn.setAttribute('aria-expanded', 'false');
        var menu = document.createElement('div');
        menu.className = 'nav-menu'; menu.setAttribute('role', 'menu'); menu.hidden = true;
        menu.innerHTML =
          '<p class="nav-menu-who"><b></b><span></span></p>' +
          '<a role="menuitem" href="app.html">Open my shelf</a>' +
          '<a role="menuitem" href="auth.html">Change my name or email</a>' +
          '<button role="menuitem" type="button" data-menu="theme">Switch light / dark</button>' +
          '<a role="menuitem" href="index.html#faq">Help</a>' +
          '<button role="menuitem" type="button" data-menu="out">Sign out</button>';
        menu.querySelector('b').textContent = u.name; menu.querySelector('span').textContent = u.email || '';
        var wrap = document.createElement('span'); wrap.className = 'nav-me-wrap';
        l.parentNode.insertBefore(wrap, l); wrap.appendChild(btn); wrap.appendChild(menu); l.remove();
        function setOpen(o) { menu.hidden = !o; btn.setAttribute('aria-expanded', o ? 'true' : 'false'); }
        btn.addEventListener('click', function () { setOpen(menu.hidden); });
        document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) setOpen(false); });
        document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
        menu.addEventListener('click', function (e) {
          var b = e.target.closest('[data-menu]'); if (!b) return;
          if (b.dataset.menu === 'theme') { var t = document.querySelector('.theme-btn'); if (t) t.click(); }
          if (b.dataset.menu === 'out') { try { localStorage.removeItem('owed:user'); } catch (x) {} location.reload(); }
          setOpen(false);
        });
        return;
      }
      l.href = 'app.html';
      if (/start free|find my repair|get my script/i.test(l.textContent)) l.textContent = 'Open my shelf';
    });
  })();

  /* inertial smooth scroll (the Lenis feel, inline because the CSP allows no CDN):
     the wheel moves a target, the page eases toward it every frame, and the
     clamp at the ends turns into a natural slow stop. Touch, keys and the
     scrollbar stay native; off under reduced motion. */
  (function smoothScroll() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;
    var target = window.scrollY, current = window.scrollY, running = false, last = 0;
    function max() { return Math.max(0, document.documentElement.scrollHeight - window.innerHeight); }
    function frame(now) {
      var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      current += (target - current) * (1 - Math.exp(-dt * 6.5));   // Lenis' lerp ~0.1 per frame
      if (Math.abs(target - current) < 0.4) { current = target; window.scrollTo(0, current); running = false; return; }
      window.scrollTo(0, current);
      requestAnimationFrame(frame);
    }
    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;                                           // pinch-zoom
      if (e.target.closest && e.target.closest('.proof-track, .nav-menu, textarea, [data-native-scroll]')) return;
      e.preventDefault();
      var d = e.deltaMode === 1 ? e.deltaY * 32 : e.deltaMode === 2 ? e.deltaY * window.innerHeight : e.deltaY;
      if (!running) { current = window.scrollY; target = current; }
      // the soft landing at both ends: within 600px of the top or the bottom,
      // heading toward it, each wheel tick counts for less the closer you get
      var m = max(), toEdge = d > 0 ? (m - target) : target, ZONE = 600;
      if (toEdge < ZONE) d *= 0.3 + 0.7 * Math.pow(Math.max(0, toEdge) / ZONE, 1.4);
      target = Math.min(m, Math.max(0, target + d));
      if (!running) { running = true; last = performance.now(); requestAnimationFrame(frame); }
    }, { passive: false });
    // anything else that moves the page (keys, scrollbar, anchors) resets the target
    window.addEventListener('scroll', function () {
      // a scroll we did not make (anchor, keys, scrollbar, a script): adopt it instead of fighting it
      if (!running || Math.abs(window.scrollY - current) > 2) { target = current = window.scrollY; running = false; }
    }, { passive: true });
  })();

  /* the film's field: the desktop example is cut mid-word on a phone */
  (function shortPlaceholder() {
    var f = document.getElementById('tryItem');
    if (f && window.matchMedia('(max-width: 640px)').matches) f.placeholder = 'What broke?';
  })();

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
    var F = 0.92;
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
    var pPrev = -1, lastMove = performance.now(), idleAmp = 0, idlePos = 0;
    var cue = filmEl.querySelector('.film-cue');
    var lastScroll = performance.now(), pScroll = -1;
    function activity() { lastMove = performance.now(); }
    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, activity, { passive: true }); });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) { lastMove = performance.now(); idleAmp = 0; idlePos = 0; drawn = -1; } });
    var sceneOn = [null, null, null];

    /* ---- the frame bank ---- */
    // every frame of the 24 fps clip on desktop (241 at 1920x1080, WebP q88);
    // every second frame at 960x540 on phones and under Save-Data
    var small = window.innerWidth < 760 || (navigator.connection && navigator.connection.saveData);
    var N = small ? 121 : 241, frames = new Array(N), loaded = 0, ctx = null, drawn = -1;
    var W = 0, H = 0, FW = 1920, FH = 1080;
    var dir = 'assets/film/' + (small ? 'm' : 'd') + '/';
    if (small) { FW = 960; FH = 540; }
    if (canvas) { ctx = canvas.getContext('2d', { alpha: false }); ctx.imageSmoothingQuality = 'medium'; }

    function frameSrc(i) { return dir + 'f' + ('00' + (i + 1)).slice(-3) + '.webp'; }
    /* the fast bank: 121 small frames (2 MB) load first and are what the eye
       sees while scrolling; the 1080p frame is painted only once the scroll
       settles. Decoding 960x540 is ~5ms, 1080p is 15-30ms — that was the lag. */
    var LO_N = 121, lo = new Array(LO_N), loLoaded = 0, loQueue = [], loInflight = 0;
    function loSrc(i) { return 'assets/film/l/f' + ('00' + (i + 1)).slice(-3) + '.webp'; }   // 1280x720: sharp enough to scrub on a big display, ~8ms to decode
    (function () { var o = [0, LO_N - 1, 60, 30, 90, 15, 45, 75, 105]; var seen = {}; o.forEach(function (i) { seen[i] = 1; loQueue.push(i); }); for (var i = 0; i < LO_N; i++) if (!seen[i]) loQueue.push(i); })();
    function pumpLo() {
      if (small) return;
      while (loInflight < 6 && loQueue.length) {
        (function (i) {
          var img = new Image(); img.decoding = 'async'; loInflight++;
          img.onload = function () { loInflight--; lo[i] = img; loLoaded++; if (loLoaded === 1) filmEl.classList.add('is-live'); drawn = -1; pumpLo(); };
          img.onerror = function () { loInflight--; pumpLo(); };
          img.src = loSrc(i);
        })(loQueue.shift());
      }
    }
    function nearestLo(f) {
      var i = Math.round(f / 2);
      if (lo[i]) return i;
      for (var d = 1; d < LO_N; d++) { if (i - d >= 0 && lo[i - d]) return i - d; if (i + d < LO_N && lo[i + d]) return i + d; }
      return -1;
    }
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
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);   // 2 doubled the fill cost for no visible gain
      var w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
      if (w === W && h === H) return;
      W = w; H = h; canvas.width = w; canvas.height = h; drawn = -1;
      for (var q = 0; q < N; q++) { if (bitmaps[q]) { try { bitmaps[q].close(); } catch (e) {} bitmaps[q] = null; } }
    }
    /* Chrome evicts decoded 1080p images from its cache, so drawing an Image
       can force a synchronous re-decode (10-20ms) — that was the scroll lag.
       Keep a window of ready-decoded bitmaps around the current frame. */
    var bitmaps = new Array(N), decoding = new Array(N), AHEAD = 8, KEEP = 14, bmW = 0, bmH = 0;
    var canBitmap = typeof window.createImageBitmap === 'function';
    function ensureBitmaps(c) {
      if (!canBitmap) return;
      var started = 0;
      for (var d = 0; d <= AHEAD && started < 3; d++) {
        var cands = d ? [c + d, c - d] : [c];
        for (var k = 0; k < cands.length && started < 3; k++) {
          var i = cands[k];
          if (i < 0 || i >= N || !frames[i] || bitmaps[i] || decoding[i]) continue;
          decoding[i] = 1; started++;
          (function (i) {
            // decoded at the size it will be drawn (cover geometry), so a bitmap
            // costs the stage's pixels, not 1080p's, and drawImage needs no scaling
            var sc = Math.max(W / FW, H / FH);
            createImageBitmap(frames[i], { resizeWidth: Math.round(FW * sc), resizeHeight: Math.round(FH * sc), resizeQuality: 'high' }).then(function (b) {
              bitmaps[i] = b; decoding[i] = 0;
              if (i === drawn) drawn = -1;   // repaint from the crisp decoded copy
            }, function () { decoding[i] = 0; });
          })(i);
        }
      }
      for (var m = 0; m < N; m++) {
        if (bitmaps[m] && Math.abs(m - c) > KEEP) { try { bitmaps[m].close(); } catch (e) {} bitmaps[m] = null; }
      }
    }
    var drawnKind = '', lastMotion = performance.now();
    function paint(f, of, alpha) {
      if (!ctx) return;
      size();
      var now = performance.now();
      var settled = (now - lastMotion) > 160;
      var s = Math.max(W / FW, H / FH), dw = FW * s, dh = FH * s;
      var i = nearest(f);
      if (settled || small) ensureBitmaps(Math.round(f));
      // sharp frame: only when settled and already decoded (never a sync 1080p decode mid-scroll)
      var useHi = small || (settled && i >= 0 && (bitmaps[i] || !lo.length));
      if (!useHi) {
        var li = nearestLo(f);
        if (li >= 0) {
          if (drawnKind === 'lo' && drawn === li && !alpha) return;
          drawn = li; drawnKind = 'lo';
          var ls = Math.max(W / 1280, H / 720), lw = 1280 * ls, lh = 720 * ls;
          ctx.drawImage(lo[li], (W - lw) / 2, (H - lh) / 2, lw, lh);
          if (alpha > 0) { var lo2 = nearestLo(of); if (lo2 >= 0) { ctx.globalAlpha = alpha; ctx.drawImage(lo[lo2], (W - lw) / 2, (H - lh) / 2, lw, lh); ctx.globalAlpha = 1; } }
          return;
        }
        if (i < 0) return;
      }
      if (i < 0) return;
      if (drawnKind === 'hi' && i === drawn && !alpha) return;
      drawn = i; drawnKind = 'hi';
      var x = Math.round((W - dw) / 2), y = Math.round((H - dh) / 2);
      if (bitmaps[i]) ctx.drawImage(bitmaps[i], x, y); else ctx.drawImage(frames[i], x, y, dw, dh);
      if (alpha > 0) {
        var oi = nearest(of);
        if (oi >= 0) { ctx.globalAlpha = alpha; if (bitmaps[oi]) ctx.drawImage(bitmaps[oi], x, y); else ctx.drawImage(frames[oi], x, y, dw, dh); ctx.globalAlpha = 1; }
      }
    }
    pumpLo();
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
      ps += (p - ps) * (1 - Math.exp(-dt * 8));
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
        // idle life: after 700ms without scrolling the frame drifts on a slow
        // sine (±8 frames, 7s period — seamless by construction); the drift
        // eases out the moment the reader scrolls, so the scrub takes over
        if (p !== pPrev) { lastMove = now; pPrev = p; }
        var base = (reduce ? [0, 0.43, 0.83][chapter] : q(p)) * (N - 1);
        /* idle loop: after 10 s with no scroll, pointer or key, the film plays
           on from the scrub frame at 4 fps over a 48-frame window and returns
           to its start through a 6-frame crossfade, so the loop has no cut.
           Any activity eases it back to the scrub frame; coming back to the
           tab snaps it back at once. */
        var idle = false;   // the film holds still; a scroll cue appears instead (below)
        if (p !== pScroll) { lastScroll = now; pScroll = p; }
        if (cue) cue.classList.toggle('is-on', chapter === 2 && p < 0.97 && cover() === 0);   // only on the film's last chapter, scrolling or not
        var LOOP = 48, FADE = 6, of = 0, alpha = 0;
        if (idle) {
          idlePos += dt * 4;
          if (idlePos >= LOOP) idlePos = FADE + (idlePos - LOOP);
          if (idlePos > LOOP - FADE) { alpha = (idlePos - (LOOP - FADE)) / FADE; of = base + (idlePos - (LOOP - FADE)); }
          idleAmp = idlePos;
        } else {
          idleAmp += (0 - idleAmp) * (1 - Math.exp(-dt * 4));
          if (idleAmp < 0.05) idleAmp = 0;
          idlePos = idleAmp;
        }
        target = Math.min(N - 1, Math.max(0, base + idleAmp));
        if (reduce || idle) current = target;
        else {
          current += (target - current) * (1 - Math.exp(-dt * 6));
          if (Math.abs(target - current) < 0.01) current = target;
        }
        if (Math.abs(target - current) > 0.4 && !idle) lastMotion = now;
        paint(current, Math.min(N - 1, Math.max(0, of)), alpha);
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
      el.style.transitionDelay = Math.min(n, 6) * (el.classList.contains('faq-item') ? 130 : 90) + 'ms';
    });
    io = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          obs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -18% 0px', threshold: 0.12 });   // fires once the piece is really in view, not at the first pixel
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });

    // Failsafe: show what is on screen right now if the observer has not —
    // never the whole page (that spent every intro before the reader got there).
    function revealVisible() {
      Array.prototype.forEach.call(revealables, function (el) {
        var r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.9 && r.bottom > 0) el.classList.add('in');
      });
    }
    window.addEventListener('load', function () { setTimeout(revealVisible, 1200); });
    setTimeout(revealVisible, 6000);
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
