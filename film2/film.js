/* Owed — launch film, cut to GRID-FM "End of Neon".
   Track: 150.00s, 123.05 BPM → beat 0.4876s, bar 1.9505s, first downbeat 0.050s.
   Every entrance lands on a beat and every scene change on a bar line.

   One rule: the frame is a pure function of t. seek(t) sets every layer from
   scratch, so frames can be rendered in any order and always match. */
(function () {
  'use strict';

  var DUR = 150, BEAT = 0.48760, BAR = BEAT * 4, T0 = 0.050;
  function bar(n) { return T0 + BAR * n; }
  function beat(n) { return T0 + BEAT * n; }

  var stage = document.getElementById('stage');
  var L = {};
  document.querySelectorAll('[data-l]').forEach(function (el) { L[el.dataset.l] = el; });

  /* ---------- maths ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function seg(t, a, b) { return b === a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a), 0, 1); }
  function outExpo(p) { return p >= 1 ? 1 : 1 - Math.pow(2, -10 * p); }
  function outBack(p) { var c = 1.70158, c3 = c + 1; return 1 + c3 * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); }
  function outCubic(p) { return 1 - Math.pow(1 - p, 3); }
  function inOut(p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function band(t, i0, i1, o0, o1) {
    if (t < i0 || t > o1) return 0;
    if (t < i1) return outCubic(seg(t, i0, i1));
    if (t > o0) return 1 - outCubic(seg(t, o0, o1));
    return 1;
  }
  function set(el, o, tr) { if (!el) return; el.style.opacity = o; if (tr !== undefined) el.style.transform = tr; }

  /* ---------- the parts of the product ---------- */
  var PARTS = ['tile0','tile1','tile2','tile3','tile4','tile5','tile6','tile7','tile8','tile9','tile-on',
    'wiz-ico','wiz-bar','btn-next','shell-side','photo-note','brands','ages','pays',
    'res-line','res-chips','group-head','card0','card1','rail-check','rail-legend','pane-head',
    'doc-rule','script-kv','script-body','script-buttons','btn-copy','btn-copied',
    'region-pill','ask-panel','place0','place1','place2','place3','place4','env0','env1','env2','env3'];
  var P = {};
  (function build() {
    var host = document.getElementById('parts');
    PARTS.forEach(function (name) {
      var d = document.createElement('div');
      d.className = 'part';
      var img = document.createElement('img');
      img.src = 'parts/' + name + '.png';
      img.alt = '';
      d.appendChild(img);
      host.appendChild(d);
      P[name] = d;
    });
  })();
  /** parts are captured at 2x; lay them out at their CSS size */
  function sizeParts() {
    PARTS.forEach(function (name) {
      var d = P[name], img = d.firstChild;
      if (!img.naturalWidth) return;
      var w = img.naturalWidth / 2, h = img.naturalHeight / 2;
      d.style.width = w + 'px'; d.style.height = h + 'px';
      d.style.marginLeft = (-w / 2) + 'px'; d.style.marginTop = (-h / 2) + 'px';
    });
  }
  window.addEventListener('load', sizeParts);

  /* ---------- the camera never rests ----------
     Type layers get a slow float built from three sines of different, mutually
     irrational periods, so no two of them are stationary at the same instant
     and no frame in the film is ever identical to the one before it. */
  function flo(t, ph) {
    return {
      x: 13 * Math.sin(t * 0.5236 + ph),
      y: 11 * Math.sin(t * 0.6981 + ph * 1.7 + 0.6),
      s: 1 + 0.014 * Math.sin(t * 0.4488 + ph * 0.8 + 1.1)
    };
  }
  function fstr(f, extra) {
    return (extra || '') + ' translate(' + f.x.toFixed(2) + 'px,' + f.y.toFixed(2) +
      'px) scale(' + f.s.toFixed(4) + ')';
  }

  /* ---------- scene drift: nothing in this film ever sits still ---------- */
  var drift = { x: 0, y: 0, s: 1 };
  function setDrift(t, t0, t1, ax, ay, s0, s1) {
    var p = seg(t, t0, t1);
    drift.x = ax * p; drift.y = ay * p; drift.s = lerp(s0, s1, p);
  }

  /**
   * One part, arriving on its own beat.
   * at/out are absolute times; x,y are the part's centre in frame coordinates.
   */
  function part(key, t, at, out, x, y, k, opt) {
    var d = P[key]; if (!d) return;
    opt = opt || {};
    var o = band(t, at, at + (opt.fade || 0.26), out - (opt.outFade || 0.3), out);
    if (o <= 0) { d.style.opacity = 0; return; }
    var e = outBack(seg(t, at, at + (opt.dur || 0.52)));           // the pop
    var live = seg(t, at, out);                                    // the slow life after it
    var dx = (opt.fromX || 0) * (1 - e), dy = (opt.fromY === undefined ? 34 : opt.fromY) * (1 - e);
    var s = k * lerp(opt.fromS === undefined ? 0.90 : opt.fromS, 1, e) * (1 + (opt.grow || 0) * live) * drift.s;
    var X = (x + dx) * drift.s + drift.x, Y = (y + dy) * drift.s + drift.y;
    var r = (opt.rot || 0) * (1 - e);
    d.style.opacity = o;
    d.style.transform = 'translate(' + X.toFixed(1) + 'px,' + Y.toFixed(1) + 'px) scale(' + s.toFixed(4) +
      ') rotate(' + r.toFixed(2) + 'deg)';
  }

  function photo(key, t, i0, i1, o0, o1, s0, s1) {
    var o = band(t, i0, i1, o0, o1);
    var d = L[key]; if (!d) return;
    if (o <= 0) { d.style.opacity = 0; return; }
    d.style.opacity = o;
    d.firstChild.style.transform = 'scale(' + lerp(s0, s1, seg(t, i0, o1)).toFixed(4) + ')';
  }

  function typed(text, p, caret) {
    var n = Math.round(text.length * clamp(p, 0, 1));
    return text.slice(0, n).replace(/&/g, '&amp;').replace(/</g, '&lt;') + (caret ? '<span class="caret"></span>' : '');
  }
  /** words arrive one per beat-fraction; * marks a word in the accent colour */
  function words(text, t, t0, step) {
    return text.split(' ').map(function (w, i) {
      var blue = w.charAt(0) === '*'; if (blue) w = w.slice(1);
      var p = outExpo(seg(t, t0 + i * step, t0 + i * step + 0.44));
      var dir = i % 2 ? 1 : -1;
      return '<span class="w' + (blue ? ' blue' : '') + '" style="opacity:' + p.toFixed(3) +
        ';transform:translate(' + ((1 - p) * 46 * dir).toFixed(1) + 'px,' + ((1 - p) * 10).toFixed(1) + 'px)">' + w + '</span>';
    }).join(' ');
  }

  function dot(t, at, out, x, y, hit) {
    var o = band(t, at, at + 0.3, out - 0.3, out);
    if (o <= 0) { L.dot.style.opacity = 0; return; }
    var pulse = hit ? 1 + 0.9 * Math.max(0, 1 - Math.abs(t - hit) / 0.32) : 1;
    L.dot.style.opacity = o;
    L.dot.style.transform = 'translate(' + (x * drift.s + drift.x).toFixed(1) + 'px,' +
      (y * drift.s + drift.y).toFixed(1) + 'px) scale(' + (pulse * drift.s).toFixed(3) + ')';
  }

  /* =====================================================================
     THE FILM — bars are the cut grid; the track is 76.9 bars long
     ===================================================================== */
  function seek(t) {
    t = clamp(t, 0, DUR);
    PARTS.forEach(function (k) { P[k].style.opacity = 0; });
    ['ph-head','ph-wash','ph-drill','ph-laptop','ph-fixed'].forEach(function (k) { L[k].style.opacity = 0; });
    set(L.stats, 0); set(L.lock, 0); set(L.tick, 0); set(L.url, 0); set(L.dot, 0); set(L.glow, 0);
    drift.x = 0; drift.y = 0; drift.s = 1;

    /* ---- grounds ---- */
    var black = Math.max(band(t, 0, .01, bar(7.6), bar(8)), band(t, bar(52) - .3, bar(52), bar(55), bar(55.4)),
                         band(t, bar(64) - .4, bar(64), DUR, DUR));
    var blue = Math.max(band(t, bar(8) - .01, bar(8), bar(16.6), bar(17)), band(t, bar(58) - .3, bar(58), bar(63.7), bar(64.1)));
    var white = Math.max(band(t, bar(3.9), bar(4.1), bar(7.7), bar(8)), band(t, bar(16.8), bar(17.2), bar(51.8), bar(52.2)),
                         band(t, bar(55.2), bar(55.6), bar(58), bar(58.3)));
    set(L.white, white); set(L.black, black); set(L.blue, blue);

    /* a pool of light that is always present and always moving, so the ground
       itself is alive on the beats where nothing else is on screen */
    var gf = flo(t, 4.1);
    set(L.glow, (0.30 + 0.13 * Math.sin(t * 0.3107)).toFixed(3),
      'translate(' + (gf.x * 7).toFixed(1) + 'px,' + (gf.y * 6).toFixed(1) + 'px) scale(' +
      (1 + 0.07 * Math.sin(t * 0.2291 + 0.8)).toFixed(4) + ')');
    stage.classList.toggle('on-dark', black > .5);
    stage.classList.toggle('on-blue', blue > .5 && black <= .5);

    var bigEl = document.getElementById('big'), bigO = 0, bigHTML = '';
    var capEl = document.getElementById('cap'), capO = 0, capHTML = '', capArt = false;

    /* ============ INTRO 0–15.7s : something broke ============ */
    if (t < bar(4)) {
      bigO = band(t, bar(0.2), bar(0.7), bar(3.6), bar(3.95));
      bigHTML = t < bar(2)
        ? typed('Something broke.', seg(t, bar(0.4), bar(1.7)), true)
        : 'Something broke.<br>' + typed('Again.', seg(t, bar(2.1), bar(2.9)), true);
    }
    photo('ph-head', t, bar(4), bar(4.15), bar(5.85), bar(6), 1.05, 1.14);
    photo('ph-wash', t, bar(6), bar(6.06), bar(6.44), bar(6.5), 1.04, 1.10);
    photo('ph-drill', t, bar(6.5), bar(6.56), bar(6.94), bar(7), 1.04, 1.10);
    photo('ph-laptop', t, bar(7), bar(7.06), bar(7.7), bar(7.8), 1.04, 1.10);

    /* ============ BUILD 15.7–33.2s : the turn ============ */
    if (t >= bar(8) && t < bar(9.6)) {
      bigO = band(t, bar(8), bar(8.15), bar(9.3), bar(9.55));
      var sp = outExpo(seg(t, bar(8), bar(8.9)));
      bigHTML = '<span class="w" style="display:inline-block;transform:scale(' + lerp(1.35, 1, sp).toFixed(3) +
        ');filter:blur(' + ((1 - sp) * 14).toFixed(1) + 'px)">Stop.</span>';
    } else if (t >= bar(9.6) && t < bar(13.4)) {
      bigO = band(t, bar(9.7), bar(10), bar(13), bar(13.35));
      bigHTML = words('Somebody already owes you a *free *repair.', t, bar(9.8), BEAT * 0.5);
    } else if (t >= bar(14) && t < bar(17)) {
      bigO = band(t, bar(14.1), bar(14.5), bar(16.6), bar(16.95));
      bigHTML = words('*Four questions. That is all.', t, bar(14.2), BEAT * 0.75);
    }
    /* the mark draws itself on the blue */
    if (t >= bar(12.6) && t < bar(14.2)) {
      var lp = outExpo(seg(t, bar(12.7), bar(13.6)));
      set(L.lock, band(t, bar(12.7), bar(13), bar(13.9), bar(14.15)),
        'translate(-50%,-50%) scale(' + lerp(.8, 1, lp).toFixed(3) + ')');
      document.getElementById('tickPath').style.strokeDashoffset = (30 * (1 - outCubic(seg(t, bar(13), bar(13.7))))).toFixed(2);
    }

    /* ============ FULL 33.2–58.6s : the product, part by part ============ */
    /* the shell arrives, then the question, then the ten tiles pop in */
    if (t >= bar(17) && t < bar(25.6)) {
      setDrift(t, bar(17), bar(25.6), -40, -18, 1.0, 1.05);
      set(L.glow, band(t, bar(17), bar(18), bar(25), bar(25.6)) * .8,
        'translate(' + (-260 + drift.x) + 'px,' + (60 + drift.y) + 'px) scale(' + drift.s.toFixed(3) + ')');
      part('pane-head', t, bar(17.2), bar(25.5), 0, -428, 1.5, { fromY: -44 });
      part('wiz-ico', t, bar(17.8), bar(25.4), 0, -330, 2.3, { fromS: .35, dur: .5 });
      part('wiz-bar', t, bar(18.4), bar(25.4), 0, -248, 2.2, { fromY: 0, fromS: .4 });

      /* ten tiles, one per half beat — the components popping up */
      var GX = [-520, -260, 0, 260, 520], k = 2.15;
      for (var i = 0; i < 10; i++) {
        var col = i % 5, row = (i / 5) | 0;
        part('tile' + i, t, beat(bar(19) / BEAT + i * 0.5), bar(25.3),
          GX[col], -70 + row * 268, k,
          { fromY: 46, fromS: .72, dur: .62, rot: (i % 2 ? 3 : -3) });
      }
      part('btn-next', t, bar(22.2), bar(25.3), 0, 372, 1.6, { fromY: 26 });
      /* the light lands on the answer */
      if (t >= bar(22.6)) {
        part('tile-on', t, bar(23), bar(25.3), 0, -70, 2.28, { fromS: .96, fromY: 0, dur: .4 });
        dot(t, bar(22.6), bar(25.3), 0, -70, bar(23));
      }
    }
    if (t >= bar(23.2) && t < bar(25.5)) {
      capO = band(t, bar(23.3), bar(23.7), bar(25.1), bar(25.45)); capHTML = 'One tap. That is question one.';
    }

    /* the photo answer */
    if (t >= bar(25.6) && t < bar(28)) {
      setDrift(t, bar(25.6), bar(28), 30, -14, 1.0, 1.06);
      part('photo-note', t, bar(25.7), bar(27.9), 0, 20, 2.5, { fromY: 40, fromS: .86 });
      capO = band(t, bar(26), bar(26.4), bar(27.5), bar(27.9));
      capHTML = 'Or photograph it — it keeps the photo and says where the model number hides.';
    }

    /* the other three questions, one per bar */
    if (t >= bar(28) && t < bar(31)) {
      setDrift(t, bar(28), bar(31), -20, 0, 1.0, 1.04);
      part('brands', t, bar(28), bar(29), 0, -20, 2.6, { fromX: 90, fromY: 0, fromS: .9 });
      part('ages', t, bar(29), bar(30), 0, -20, 2.5, { fromX: 90, fromY: 0, fromS: .9 });
      part('pays', t, bar(30), bar(31), 0, -20, 2.2, { fromX: 90, fromY: 0, fromS: .9 });
      capO = band(t, bar(28.2), bar(28.6), bar(30.6), bar(30.95));
      capHTML = 'Who made it. How old it is. How you paid.';
    }

    /* what it found — the list builds row by row */
    if (t >= bar(31) && t < bar(37)) {
      setDrift(t, bar(31), bar(37), 0, -30, 1.0, 1.06);
      part('res-line', t, bar(31), bar(36.9), 0, -396, 1.8, { fromY: 30 });
      part('res-chips', t, bar(31.5), bar(36.9), 0, -280, 1.7, { fromY: 24 });
      part('group-head', t, bar(32), bar(36.9), 0, -172, 1.8, { fromX: -60, fromY: 0 });
      part('card0', t, bar(32.5), bar(36.9), 0, 0, 1.8, { fromY: 40 });
      part('card1', t, bar(33.2), bar(36.9), 0, 292, 1.8, { fromY: 40 });
      capO = band(t, bar(33.8), bar(34.2), bar(36.4), bar(36.8));
      capHTML = 'Ranked honestly: <b>strong</b>, worth asking, long shot.';
    }

    /* ============ BREAKDOWN 58.6–76.1s : the payoff, quiet ============ */
    if (t >= bar(37) && t < bar(40)) {
      setDrift(t, bar(37), bar(40), 20, 0, 1.0, 1.05);
      part('doc-rule', t, bar(37), bar(39.9), 0, -34, 1.18, { fromY: 40, fromS: .93 });
      capO = band(t, bar(37.6), bar(38), bar(39.4), bar(39.8));
      capHTML = 'The rule itself, in their own words.';
    }
    if (t >= bar(40) && t < bar(46)) {
      setDrift(t, bar(40), bar(46), 0, -22, 1.0, 1.07);
      part('script-kv', t, bar(40), bar(45.9), 0, -360, 1.62, { fromY: 30 });
      part('script-body', t, bar(40.7), bar(45.9), 0, -10, 1.62, { fromY: 40, fromS: .94 });
      part('script-buttons', t, bar(43.2), bar(45.9), 0, 320, 1.42, { fromY: 30 });
      capO = band(t, bar(41.4), bar(41.8), bar(43), bar(43.4));
      capHTML = 'The words to say, <b>written for you</b>.';
      /* the light lands on Copy script, then the button turns over.
         -229/272 is the measured centre of #copyScript inside .doc-foot at 1.42x. */
      if (t >= bar(43.6)) dot(t, bar(43.6), bar(45.9), -229, 280, bar(44.1));
      if (t >= bar(44.1)) part('btn-copied', t, bar(44.1), bar(45.9), -229, 280, 1.42, { fromS: .96, fromY: 0, dur: .34 });
    }

    /* ============ RISE 76.1–95.7s ============ */
    if (t >= bar(46) && t < bar(49)) {
      setDrift(t, bar(46), bar(49), -18, 0, 1.0, 1.05);
      part('script-buttons', t, bar(46), bar(48.9), 0, 40, 1.9, { fromY: 30 });
      dot(t, bar(46.6), bar(48.9), 306, -13, bar(47));
      capO = band(t, bar(46.4), bar(46.8), bar(48.4), bar(48.8));
      capHTML = 'Send it straight to them. Then mark it won.';
    }
    photo('ph-fixed', t, bar(49), bar(49.2), bar(51.6), bar(52), 1.30, 1.10);
    if (t >= bar(49.3) && t < bar(52)) {
      var tp = outBack(seg(t, bar(49.4), bar(50.2)));
      set(L.tick, band(t, bar(49.4), bar(49.7), bar(51.6), bar(52)), 'scale(' + lerp(.3, 1, tp).toFixed(3) + ')');
      capO = band(t, bar(50.2), bar(50.5), bar(51.6), bar(51.95));
      capHTML = 'Asked. Fixed. <b>Nothing paid.</b>'; capArt = true;
    }

    /* five places, one per beat */
    if (t >= bar(52) && t < bar(55.2)) {
      setDrift(t, bar(52), bar(55.2), 0, -16, 1.0, 1.05);
      for (var j = 0; j < 5; j++) {
        part('place' + j, t, bar(52.3) + j * BEAT * 0.75, bar(55.1), -700 + j * 350, 10, 1.85,
          { fromY: 40, fromS: .8, dur: .6 });
      }
      capO = band(t, bar(53.6), bar(54), bar(54.7), bar(55.1));
      capHTML = 'It checks five places at once.';
    }

    /* the province, then the helper */
    if (t >= bar(55.4) && t < bar(58)) {
      setDrift(t, bar(55.4), bar(58), 0, 0, 1.0, 1.05);
      part('region-pill', t, bar(55.5), bar(57.9), 0, -10, 3.3, { fromY: 30, fromS: .86 });
      capO = band(t, bar(56), bar(56.4), bar(57.5), bar(57.9));
      capHTML = 'And the law where you actually live.';
    }
    if (t >= bar(58) && t < bar(61.9)) {
      setDrift(t, bar(58), bar(61.9), 0, -20, 1.0, 1.06);
      part('ask-panel', t, bar(58.2), bar(61.8), 0, -18, 1.10, { fromY: 44, fromS: .9 });
      capO = band(t, bar(59), bar(59.4), bar(61.3), bar(61.75));
      capHTML = 'Ask anything — answered on your own device.'; capArt = true;
    }

    /* ============ PEAK 95.7–124.9s ============ */
    if (t >= bar(62) && t < bar(64)) {
      bigO = band(t, bar(62.1), bar(62.5), bar(63.6), bar(63.95));
      bigHTML = words('Nothing you type *ever *leaves your browser.', t, bar(62.2), BEAT * 0.5);
    }
    if (t >= bar(64) && t < bar(68)) {
      setDrift(t, bar(64), bar(68), 0, -18, 1.0, 1.05);
      for (var e2 = 0; e2 < 4; e2++) {
        part('env' + e2, t, bar(64.4) + e2 * BEAT, bar(67.9), -660 + e2 * 440, -10, 1.52,
          { fromY: 44, fromS: .82, dur: .6 });
      }
      capO = band(t, bar(66), bar(66.4), bar(67.4), bar(67.85));
      capHTML = 'Every repair is one less thing made.';
    }

    /* the numbers count up on the beat */
    if (t >= bar(68) && t < bar(72.5)) {
      set(L.stats, band(t, bar(68.2), bar(68.6), bar(71.9), bar(72.4)), fstr(flo(t, 0.9)));
      var kids = L.stats.querySelectorAll('div');
      for (var s2 = 0; s2 < kids.length; s2++) {
        var pp = outExpo(seg(t, bar(68.2) + s2 * BEAT * 0.6, bar(68.2) + s2 * BEAT * 0.6 + 0.6));
        kids[s2].style.opacity = pp.toFixed(3);
        kids[s2].style.transform = 'translateY(' + ((1 - pp) * 30).toFixed(1) + 'px)';
        var num = kids[s2].querySelector('b[data-n]');
        if (num) num.textContent = Math.round(Number(num.dataset.n) * pp) + '+';
      }
    }

    /* ============ CLOSE 124.9–150s ============ */
    if (t >= bar(72) && t < bar(76.2)) {
      bigO = band(t, bar(72.1), bar(72.5), bar(75.8), bar(76.15));
      bigHTML = words('Check *your *thing.', t, bar(72.3), BEAT * 0.9);
    }
    if (t >= bar(73.4)) {
      var l3 = outExpo(seg(t, bar(73.5), bar(74.4)));
      set(L.lock, band(t, bar(73.5), bar(73.9), DUR, DUR),
        fstr(flo(t, 2.2), 'translate(-50%,calc(-50% + 150px)) scale(' + lerp(.9, 1, l3).toFixed(3) + ')'));
      document.getElementById('tickPath').style.strokeDashoffset = 0;
    }
    if (t >= bar(74.6)) {
      set(L.url, band(t, bar(74.8), bar(75.2), DUR, DUR), fstr(flo(t, 3.4)));
      document.getElementById('url').innerHTML = typed('goofturtles.github.io/owed', seg(t, bar(74.9), bar(76.2)), t < DUR - 1.2);
    }

    /* ---- commit the type ---- */
    set(L['t-big'], bigO);
    bigEl.innerHTML = bigO > 0 ? bigHTML : '';
    bigEl.style.transform = fstr(flo(t, 0));
    var artBeat = (t > bar(4) && t < bar(8)) || (t > bar(49) && t < bar(52)) || capArt;
    set(L.scrim, artBeat ? capO : 0);
    L.cap.classList.toggle('over-art', artBeat);
    set(L.cap, capO);
    capEl.innerHTML = capO > 0 ? capHTML : '';
    capEl.style.transform = fstr(flo(t, 1.6));
  }

  /* ---------- preview + capture ---------- */
  function fit() {
    var s = document.body.classList.contains('capture') ? 1 : Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = 'scale(' + s + ')';
  }
  window.addEventListener('resize', fit);
  var params = new URLSearchParams(location.search);
  if (params.get('capture') === '1') document.body.classList.add('capture');
  fit();

  var scrub = document.getElementById('scrub'), clock = document.getElementById('clock'),
      play = document.getElementById('play'), audio = document.getElementById('track');
  var playing = false, base = 0, t0 = 0;
  function frame(now) {
    if (!playing) return;
    var t = base + (now - t0) / 1000;
    if (t >= DUR) { t = DUR; playing = false; play.textContent = 'Play'; if (audio) audio.pause(); }
    scrub.value = t; clock.textContent = t.toFixed(2); seek(t);
    if (playing) requestAnimationFrame(frame);
  }
  play.addEventListener('click', function () {
    playing = !playing; play.textContent = playing ? 'Pause' : 'Play';
    if (playing) {
      base = Number(scrub.value); t0 = performance.now();
      if (audio) { audio.currentTime = base; audio.play().catch(function () {}); }
      requestAnimationFrame(frame);
    } else if (audio) audio.pause();
  });
  scrub.addEventListener('input', function () {
    playing = false; play.textContent = 'Play'; if (audio) audio.pause();
    clock.textContent = Number(scrub.value).toFixed(2); seek(Number(scrub.value));
  });

  sizeParts();
  seek(Number(params.get('t') || 0));
  window.owedFilm = { seek: function (t) { sizeParts(); seek(t); }, duration: DUR, bar: bar };
})();
