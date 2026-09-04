/* Owed — launch film timeline.
   One rule: everything is a pure function of t. seek(t) fully describes the
   frame, so the capture script can render any instant, in any order, and the
   film always looks the same. No CSS animation, no timers in the render path. */
(function () {
  'use strict';

  var DUR = 120;                      // 64 bars at 128 BPM = 120.0s
  var stage = document.getElementById('stage');
  var L = {};
  document.querySelectorAll('[data-l]').forEach(function (el) { L[el.dataset.l] = el; });

  /* ---------- small maths ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function outExpo(p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); }
  function outCubic(p) { return 1 - Math.pow(1 - p, 3); }
  function inOut(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  /** fade in over [i0,i1], hold, fade out over [o0,o1] */
  function band(t, i0, i1, o0, o1) {
    if (t < i0 || t > o1) return 0;
    if (t < i1) return outCubic(seg(t, i0, i1));
    if (t > o0) return 1 - outCubic(seg(t, o0, o1));
    return 1;
  }
  function set(el, o, transform) {
    if (!el) return;
    el.style.opacity = o;
    if (transform !== undefined) el.style.transform = transform;
  }
  function hideAll(keys) { keys.forEach(function (k) { set(L[k], 0); }); }

  /* ---------- type helpers ---------- */
  function typed(text, p, showCaret) {
    var n = Math.round(text.length * clamp(p, 0, 1));
    var s = text.slice(0, n).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    return s + (showCaret ? '<span class="caret"></span>' : '');
  }
  /** words appear one at a time; blue words are marked with * in the source */
  function wordsHTML(text, t, t0, step) {
    return text.split(' ').map(function (w, i) {
      var blue = w.charAt(0) === '*';
      if (blue) w = w.slice(1);
      var p = outExpo(seg(t, t0 + i * step, t0 + i * step + .42));
      var y = (1 - p) * 26;
      return '<span class="w' + (blue ? ' blue' : '') + '" style="opacity:' + p.toFixed(3) +
        ';transform:translateY(' + y.toFixed(1) + 'px)">' + w + '</span>';
    }).join(' ');
  }

  /* ---------- the pointer ---------- */
  function cursor(t, path, clicks) {
    var i = 0;
    while (i < path.length - 2 && t > path[i + 1].t) i++;
    var a = path[i], b = path[Math.min(i + 1, path.length - 1)];
    var p = b.t === a.t ? 1 : inOut(seg(t, a.t, b.t));
    set(L.cursor, band(t, path[0].t - .3, path[0].t + .1, path[path.length - 1].t + .2, path[path.length - 1].t + .5),
      'translate(' + lerp(a.x, b.x, p).toFixed(1) + 'px,' + lerp(a.y, b.y, p).toFixed(1) + 'px)');
    var ring = L.cursor.querySelector('.cursor-ring'), best = 0, scale = .4;
    clicks.forEach(function (c) {
      var q = seg(t, c, c + .5);
      if (q > 0 && q < 1) { best = Math.max(best, 1 - q); scale = .4 + q * 1.5; }
    });
    ring.style.opacity = best.toFixed(3);
    ring.style.transform = 'scale(' + scale.toFixed(2) + ')';
  }

  /* ---------- a product screen, as a card ---------- */
  function shot(key, t, i0, i1, o0, o1, from, to) {
    var o = band(t, i0, i1, o0, o1);
    if (o <= 0) { set(L[key], 0); return; }
    var p = inOut(seg(t, i0, o1));
    var s = lerp(from.s, to.s, p), x = lerp(from.x || 0, to.x || 0, p), y = lerp(from.y || 0, to.y || 0, p);
    var r = lerp(from.r || 0, to.r || 0, p);
    set(L[key], o, 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + s.toFixed(4) + ') rotate(' + r.toFixed(2) + 'deg)');
  }
  function photo(key, t, i0, i1, o0, o1, s0, s1) {
    var o = band(t, i0, i1, o0, o1);
    if (o <= 0) { set(L[key], 0); return; }
    var s = lerp(s0, s1, seg(t, i0, o1));
    set(L[key], o, 'scale(' + s.toFixed(4) + ')');
    L[key].querySelector('img').style.transform = 'scale(' + s.toFixed(4) + ')';
  }

  var SHOT_KEYS = ['s-hero', 's-q1', 's-q1p', 's-q1n', 's-q2', 's-q3', 's-q4', 's-res', 's-rule',
    's-script', 's-copied', 's-won', 's-places', 's-region', 's-ask', 's-dark', 's-env'];
  var PHOTO_KEYS = ['ph-head', 'ph-wash', 'ph-drill', 'ph-laptop', 'ph-fixed'];

  /* =====================================================================
     THE FILM
     ===================================================================== */
  function seek(t) {
    t = clamp(t, 0, DUR);
    hideAll(SHOT_KEYS); hideAll(PHOTO_KEYS);
    set(L.stats, 0); set(L.lock, 0); set(L.tick, 0); set(L.url, 0);
    set(L.cursor, 0);

    /* --- grounds --- */
    var black = Math.max(band(t, 0, .01, 11.0, 12.0), band(t, 93.6, 94.4, 99.2, 99.8), band(t, 115.0, 115.8, 120, 120));
    var blue = Math.max(band(t, 11.0, 12.2, 19.9, 21.2), band(t, 103.4, 104.4, 109.6, 110.6));
    var white = Math.max(band(t, 3.9, 4.4, 11.0, 11.6), band(t, 20.2, 21.2, 93.8, 94.4), band(t, 99.4, 100.0, 115.2, 115.8));
    set(L.white, white); set(L.black, black); set(L.blue, blue);
    stage.classList.toggle('on-dark', black > .5);
    stage.classList.toggle('on-blue', blue > .5 && black <= .5);

    /* --- 0.0–4.2  something broke --- */
    var typedEl = document.getElementById('typed');
    if (t < 4.4) {
      set(L['t-typed'], band(t, .35, 1.0, 3.9, 4.35));
      var line = t < 2.4 ? typed('Something broke.', seg(t, .6, 2.0), true)
        : 'Something broke.<br>' + typed('Again.', seg(t, 2.5, 3.3), true);
      typedEl.innerHTML = line;
    } else set(L['t-typed'], 0);

    /* --- 4.2–8.4  the thing itself --- */
    photo('ph-head', t, 4.0, 4.8, 7.8, 8.5, 1.06, 1.16);

    /* --- 8.4–11.4  and you buy another --- */
    photo('ph-wash', t, 8.4, 8.7, 9.2, 9.5, 1.05, 1.11);
    photo('ph-drill', t, 9.4, 9.7, 10.2, 10.5, 1.05, 1.11);
    photo('ph-laptop', t, 10.4, 10.7, 11.1, 11.5, 1.05, 1.11);

    /* --- 11.4–15.0  Stop. --- */
    /* --- 15.0–20.0  the promise --- */
    var wordsEl = document.getElementById('words');
    var wOpacity = 0, wHTML = '';
    if (t >= 12.2 && t < 15.0) {
      wOpacity = band(t, 12.2, 12.8, 14.5, 15.0);
      var sp = outExpo(seg(t, 12.2, 13.4));
      wHTML = '<span class="w" style="display:inline-block;transform:scale(' + lerp(.72, 1, sp).toFixed(3) + ')">Stop.</span>';
    } else if (t >= 15.0 && t < 20.4) {
      wOpacity = band(t, 15.0, 15.4, 19.6, 20.3);
      wHTML = wordsHTML('Somebody already owes you a *free *repair.', t, 15.2, .17);
    } else if (t >= 110.0 && t < 115.4) {
      wOpacity = band(t, 110.4, 111.0, 114.8, 115.4);
      wHTML = wordsHTML('Check *your *thing.', t, 110.6, .2);
    }
    set(L['t-words'], wOpacity);
    if (wOpacity > 0) wordsEl.innerHTML = wHTML;

    /* --- 20.2–24.6  the site --- */
    shot('s-hero', t, 20.4, 21.4, 24.0, 24.8, { s: .92, y: 90 }, { s: 1.00, y: -30 });

    /* --- 24.6–28.8  the mark --- */
    if (t >= 24.4 && t < 29.0) {
      var lp = outExpo(seg(t, 24.6, 25.6));
      set(L.lock, band(t, 24.6, 25.2, 28.2, 29.0),
        'translate(-50%,-50%) scale(' + lerp(.86, 1, lp).toFixed(3) + ')');
    }

    /* --- 28.8–44.6  the four questions --- */
    var C = { s: .88, y: -70 };
    shot('s-q1', t, 28.9, 29.6, 32.6, 33.1, { s: .86, x: 120, y: -70 }, { s: .88, x: 0, y: -70 });
    shot('s-q1p', t, 33.0, 33.4, 36.0, 36.4, C, { s: .90, y: -70 });
    shot('s-q1n', t, 36.3, 36.8, 40.0, 40.5, C, { s: .90, y: -70 });
    shot('s-q2', t, 40.4, 40.7, 41.6, 41.9, C, { s: .89, y: -70 });
    shot('s-q3', t, 41.8, 42.1, 43.0, 43.3, C, { s: .89, y: -70 });
    shot('s-q4', t, 43.2, 43.5, 44.4, 44.8, C, { s: .89, y: -70 });

    if (t >= 29.4 && t <= 33.4) {
      cursor(t, [{ t: 29.4, x: 1180, y: 760 }, { t: 31.0, x: 905, y: 468 }, { t: 33.2, x: 905, y: 468 }], [31.3]);
    } else if (t >= 37.0 && t <= 40.2) {
      cursor(t, [{ t: 37.0, x: 700, y: 700 }, { t: 38.2, x: 690, y: 640 }, { t: 40.0, x: 690, y: 640 }], [38.5]);
    }

    /* --- 44.6–54.0  what it found --- */
    shot('s-res', t, 44.7, 45.4, 49.6, 50.2, { s: .86, y: -70 }, { s: .92, y: -70 });
    shot('s-rule', t, 53.9, 54.6, 58.6, 59.2, { s: 1.24, x: -190, y: -30 }, { s: 1.30, x: -210, y: -60 });

    /* the crop into the ranking: the same shot, pushed in */
    if (t >= 50.0 && t < 54.2) {
      var zp = inOut(seg(t, 50.0, 54.0));
      set(L['s-res'], band(t, 50.0, 50.4, 53.6, 54.2),
        'translate(' + lerp(-180, -230, zp).toFixed(0) + 'px,' + lerp(-30, -90, zp).toFixed(0) + 'px) scale(' + lerp(1.42, 1.58, zp).toFixed(3) + ')');
    }

    /* --- 59.0–74.0  the words to say --- */
    shot('s-script', t, 59.1, 59.9, 66.4, 67.0, { s: 1.30, x: -300, y: -40 }, { s: 1.42, x: -330, y: -90 });
    shot('s-copied', t, 66.9, 67.4, 70.2, 70.7, { s: 1.32, x: -300, y: -150 }, { s: 1.36, x: -310, y: -180 });
    shot('s-won', t, 70.6, 71.1, 73.6, 74.2, { s: 1.32, x: -300, y: -150 }, { s: 1.36, x: -310, y: -180 });
    if (t >= 63.0 && t <= 67.2) {
      cursor(t, [{ t: 63.0, x: 1100, y: 820 }, { t: 65.4, x: 1206, y: 742 }, { t: 67.0, x: 1206, y: 742 }], [65.7]);
    } else if (t >= 70.8 && t <= 73.6) {
      cursor(t, [{ t: 70.8, x: 1206, y: 742 }, { t: 72.0, x: 1330, y: 742 }, { t: 73.4, x: 1330, y: 742 }], [72.3]);
    }

    /* --- 74.0–79.0  fixed --- */
    photo('ph-fixed', t, 74.1, 74.8, 78.4, 79.1, 1.14, 1.05);
    if (t >= 75.0 && t < 79.0) {
      var tp = outExpo(seg(t, 75.2, 76.0));
      set(L.tick, band(t, 75.2, 75.7, 78.4, 79.0), 'scale(' + lerp(.4, 1, tp).toFixed(3) + ')');
    }

    /* --- 79.0–104.0  the rest of the product --- */
    shot('s-places', t, 79.1, 79.8, 83.4, 84.0, { s: .92, y: -70 }, { s: .98, y: -70 });
    shot('s-region', t, 84.0, 84.7, 88.4, 89.0, { s: 1.30, x: 430, y: 40 }, { s: 1.36, x: 400, y: 10 });
    shot('s-ask', t, 89.0, 89.7, 93.4, 94.0, { s: 1.26, x: -300, y: -40 }, { s: 1.32, x: -330, y: -70 });
    shot('s-dark', t, 94.2, 94.9, 98.6, 99.2, { s: .92, y: -70 }, { s: .98, y: -70 });
    shot('s-env', t, 99.6, 100.3, 103.2, 103.8, { s: .94, y: -70 }, { s: 1.00, y: -70 });

    /* --- 104.0–110.0  the numbers --- */
    if (t >= 104.0 && t < 110.4) {
      set(L.stats, band(t, 104.6, 105.2, 109.6, 110.3));
      L.stats.querySelectorAll('div').forEach(function (d, i) {
        var p = outExpo(seg(t, 104.8 + i * .16, 105.5 + i * .16));
        d.style.opacity = p.toFixed(3);
        d.style.transform = 'translateY(' + ((1 - p) * 22).toFixed(1) + 'px)';
      });
    }

    /* --- 110.0–115.4  the mark again --- */
    if (t >= 110.0 && t < 115.6) {
      var l2 = outExpo(seg(t, 113.0, 114.0));
      set(L.lock, band(t, 113.0, 113.6, 115.0, 115.6),
        'translate(-50%,calc(-50% + 120px)) scale(' + lerp(.9, 1, l2).toFixed(3) + ')');
    }

    /* --- 115.4–120  where to find it --- */
    if (t >= 115.6) {
      set(L.url, band(t, 116.0, 116.6, 120, 120));
      document.getElementById('url').innerHTML = typed('goofturtles.github.io/owed', seg(t, 116.2, 118.2), t < 119.4);
    }

    /* --- captions --- */
    var caps = [
      [4.6, 8.2, 'So you look up the price of a new one.'],
      [8.6, 11.2, 'And you buy another one.'],
      [21.6, 24.4, 'Owed reads the fine print and finds who still has to fix it — <b>free</b>.'],
      [25.6, 28.6, 'Four questions. No receipt needed.'],
      [29.8, 32.8, 'One: what broke.'],
      [36.8, 40.2, 'Or photograph it — Owed reads the model off the item.'],
      [40.8, 44.4, 'Who made it. How old it is. How you paid.'],
      [45.6, 49.8, 'Four places may owe you a free repair.'],
      [50.6, 53.8, 'Ranked honestly: <b>strong</b>, worth asking, long shot.'],
      [55.0, 58.8, 'The rule itself — in the company&rsquo;s own words, with its source.'],
      [60.2, 66.4, 'And the words to say, <b>written for you</b>.'],
      [67.6, 70.2, 'Copy it.'],
      [71.4, 73.8, 'Send it. Then mark it won.'],
      [75.4, 78.6, 'Ask. Get it fixed. <b>Pay nothing.</b>'],
      [80.0, 83.6, 'It checks five places at once.'],
      [85.0, 88.6, 'And the law where you actually live.'],
      [90.0, 93.6, 'Ask anything — answered on your own device.'],
      [95.2, 98.8, 'Nothing you type ever leaves your browser.'],
      [100.6, 103.4, 'Every repair is one less thing made.']
    ];
    var capOn = 0, capText = '';
    for (var i = 0; i < caps.length; i++) {
      var c = caps[i], o = band(t, c[0], c[0] + .5, c[1] - .45, c[1]);
      if (o > capOn) { capOn = o; capText = c[2]; }
    }
    // a caption over a photograph, or over a screen zoomed to fill the frame,
    // needs its own ground to stay readable
    var onPhoto = (t > 4.0 && t < 11.6) || (t > 74.0 && t < 79.2) ||
                  (t > 49.9 && t < 74.3) || (t > 83.9 && t < 94.1);
    set(L.scrim, onPhoto ? capOn : 0);
    L.cap.classList.toggle('over-photo', onPhoto);
    set(L.cap, capOn);
    if (capOn > 0) document.getElementById('cap').innerHTML = capText;
  }

  /* ---------- preview + capture hooks ---------- */
  function fit() {
    var s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080);
    if (document.body.classList.contains('capture')) s = 1;
    stage.style.transform = 'scale(' + s + ')';
    document.body.style.height = document.body.classList.contains('capture') ? '1080px' : '';
  }
  window.addEventListener('resize', fit);

  var params = new URLSearchParams(location.search);
  if (params.get('capture') === '1') document.body.classList.add('capture');
  fit();

  var scrub = document.getElementById('scrub'), clock = document.getElementById('clock'),
      play = document.getElementById('play');
  var playing = false, t0 = 0, base = 0;
  function frame(now) {
    if (!playing) return;
    var t = base + (now - t0) / 1000;
    if (t >= DUR) { t = DUR; playing = false; play.textContent = 'Play'; }
    scrub.value = t; clock.textContent = t.toFixed(1); seek(t);
    if (playing) requestAnimationFrame(frame);
  }
  play.addEventListener('click', function () {
    playing = !playing;
    play.textContent = playing ? 'Pause' : 'Play';
    if (playing) { base = Number(scrub.value); t0 = performance.now(); requestAnimationFrame(frame); }
  });
  scrub.addEventListener('input', function () {
    playing = false; play.textContent = 'Play';
    clock.textContent = Number(scrub.value).toFixed(1); seek(Number(scrub.value));
  });

  seek(Number(params.get('t') || 0));
  window.owedFilm = { seek: seek, duration: DUR };
})();
