/* ============================================================
   Owed — scroll feel

   Two things, both optional and both self-disabling:

   1. SMOOTH — wheel input drives a target position that the real
      scroll eases toward. This is the thing that makes sites like
      zero.university feel expensive; they use Lenis for it. Written
      by hand here (~60 lines) rather than adding a dependency.

   2. GUIDED — entering a pinned section scrolling downward plays
      the animation through for you. The moment you scroll again,
      it lets go completely and never grabs that section twice.

   Never runs under prefers-reduced-motion, and never on touch —
   hijacking a phone's native scroll always feels broken.
   ============================================================ */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  var api = { smooth: false, guided: false, cancelGuided: function () {} };
  window.OwedScroll = api;
  if (reduce || !fine) return;

  var docEl = document.documentElement;
  var maxCache = -1;
  function maxScroll() {
    // reading scrollHeight inside the wheel handler forces a sync layout on
    // every event; the page only changes height on resize or media load
    if (maxCache < 0) maxCache = docEl.scrollHeight - window.innerHeight;
    return maxCache;
  }
  function clamp(v) { return Math.max(0, Math.min(maxScroll(), v)); }
  // pinned sections and lazy media change the height after first paint
  window.addEventListener('load', function () { maxCache = -1; });
  document.addEventListener('animationend', function () { maxCache = -1; });

  /* ---------------- 1. smooth ---------------- */
  var target = window.scrollY;
  var current = target;
  var raf = null;
  // NOT a boolean flag: scroll events are dispatched in the *next* rendering
  // update, long after a synchronous flag would have been cleared, so a flag
  // makes every one of our own writes look like an external scroll — which
  // resynced and cancelled the rAF every frame and left the page crawling at
  // about a seventh of normal speed. Compare positions instead.
  var lastApplied = -1;

  function apply(y) {
    lastApplied = Math.round(y);
    window.scrollTo(0, y);
  }

  function loop() {
    raf = null;
    var d = target - current;
    if (Math.abs(d) < 0.35) {
      current = target;
      apply(current);
      return;
    }
    current += d * 0.115;               // the ease; lower = heavier glide
    apply(current);
    raf = requestAnimationFrame(loop);
  }
  function kick() { if (raf === null) raf = requestAnimationFrame(loop); }

  window.addEventListener('wheel', function (e) {
    if (e.ctrlKey) return;                                  // pinch-zoom
    if (e.target && e.target.closest && e.target.closest('[data-native-scroll]')) return;
    e.preventDefault();
    // deltaMode 1 = lines, 2 = pages
    var k = e.deltaMode === 1 ? 18 : (e.deltaMode === 2 ? window.innerHeight : 1);
    target = clamp(target + e.deltaY * k);
    kick();
  }, { passive: false });

  // Anything that moves the page by other means — keyboard, scrollbar drag,
  // anchor jumps, find-in-page, focus — has to win. Resync to reality.
  window.addEventListener('scroll', function () {
    // within a couple of px of where we last put it, this is our own write
    if (Math.abs(window.scrollY - lastApplied) <= 2) return;
    target = current = window.scrollY;
    lastApplied = Math.round(current);
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
  }, { passive: true });

  window.addEventListener('resize', function () {
    maxCache = -1;
    target = current = window.scrollY;
    lastApplied = Math.round(current);
  }, { passive: true });

  api.smooth = true;
  api.scrollTo = function (y) { target = clamp(y); kick(); };

  /* ---------------- 2. guided ---------------- */
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-guided]'));
  if (!sections.length) return;

  var guiding = false, gRaf = null, gDone = [], lastY = window.scrollY;

  function stopGuide() {
    if (!guiding) return;
    guiding = false;
    if (gRaf !== null) { cancelAnimationFrame(gRaf); gRaf = null; }
    // hand the smooth layer back exactly where the page actually is
    target = current = window.scrollY;
  }
  api.cancelGuided = stopGuide;

  // Scrolling DOWN does not interrupt: the run is short and it is meant to play
  // through. Scrolling UP is the deliberate "let me out" gesture and releases
  // immediately. Keyboard, pointer and focus always release too — a run nobody
  // can escape is a trap, and focusin is the one that matters for NVDA/JAWS in
  // browse mode, which swallow arrow keys and move the page with scrollIntoView
  // so keydown alone would never reach us.
  window.addEventListener('wheel', function (e) {
    if (guiding && e.deltaY < 0) stopGuide();
  }, { passive: true, capture: true });

  ['touchstart', 'keydown', 'pointerdown', 'focusin'].forEach(function (evt) {
    window.addEventListener(evt, function () { if (guiding) stopGuide(); },
      { passive: true, capture: true });
  });

  /* Tell the visitor the page has handed control back. Only on a run that
     finished by itself — if they scrolled out of it they are already moving
     and do not need telling. Clears on their next real input. */
  function showCue(sec) {
    sec.classList.add('is-done');
    function clear() {
      sec.classList.remove('is-done');
      ['wheel', 'keydown', 'touchstart', 'pointerdown'].forEach(function (e) {
        window.removeEventListener(e, clear, true);
      });
    }
    ['wheel', 'keydown', 'touchstart', 'pointerdown'].forEach(function (e) {
      window.addEventListener(e, clear, { passive: true, capture: true });
    });
  }

  function guide(sec) {
    var startY = window.scrollY;
    var travel = sec.offsetHeight - window.innerHeight;
    var endY = clamp(sec.getBoundingClientRect().top + window.scrollY + travel);
    var dist = endY - startY;
    if (dist <= 60) return;

    // Paced so the words and the pages can actually be read on the way through.
    // This runs past the WCAG 2.2.2 five-second mark, which is only acceptable
    // because that criterion is satisfied a different way: there is a real
    // stop mechanism — scrolling up, any key, a pointer press or a focus move
    // all release it immediately, and it never grabs the same section twice.
    var dur = Math.min(10500, Math.max(6200, dist * 4.2));
    var t0 = null;
    guiding = true;
    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }

    function step(ts) {
      if (!guiding) return;
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      // easeInOutCubic — starts gently so the handover is not a jolt
      var e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
      var y = startY + dist * e;
      current = target = y;
      apply(y);
      if (p < 1) { gRaf = requestAnimationFrame(step); return; }
      guiding = false; gRaf = null;
      showCue(sec);          // the run finished on its own: say so
    }
    gRaf = requestAnimationFrame(step);
  }

  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    var down = y > lastY;
    lastY = y;
    if (guiding || !down) return;        // upward is always free
    // Arm immediately. This used to wait ~160ms for the gesture to go quiet,
    // because an in-flight wheel would cancel the guide — but downward scroll
    // no longer cancels, so the wait was pointless and it meant the guide
    // needed a pause at exactly the right scroll position, which never
    // happens in normal scrolling. That is why it almost never engaged.
    arm();
  }, { passive: true });

  function arm() {
    if (guiding) return;
    for (var i = 0; i < sections.length; i++) {
      if (gDone[i]) continue;
      var r = sections[i].getBoundingClientRect();
      // fire as the section pins to the top of the viewport
      if (r.top <= 8 && r.top > -420) {
        gDone[i] = true;
        guide(sections[i]);
        break;
      }
    }
  }

  api.guided = true;
})();
