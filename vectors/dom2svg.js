/* ============================================================
   dom2svg — turn the live page into real SVG shapes and text
   ------------------------------------------------------------
   Not a screenshot: every box becomes a <rect> (or a <path> when
   the corners differ), every run of text becomes a <text>, inline
   icons keep their own vector paths, and only photographs are
   embedded as raster. Each element becomes its own <g id="...">
   so After Effects can split the file into layers.

   window.dom2svg(rootElement) -> SVG string, cropped to the
   element's own box with the origin moved to its top-left.
   ============================================================ */
(function () {
  'use strict';

  var imgCache = {};
  var uid = 0;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function num(v) { var n = parseFloat(v); return isFinite(n) ? n : 0; }
  /* Chrome hands back color(srgb 1 1 1 / .92) for color-mix(), and space-separated
     rgb() too, so parse through a canvas instead of a regex: it normalises every
     colour syntax to one shape. Without this, those fills silently vanished. */
  var probe = document.createElement('canvas').getContext('2d');
  var colorCache = {};
  function parseColor(c) {
    c = String(c == null ? '' : c).trim();
    if (!c || c === 'transparent' || c === 'none') return { hex: '#000000', a: 0 };
    if (colorCache[c]) return colorCache[c];
    var out;
    var m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(c);
    if (m) {
      out = { hex: hex3(+m[1], +m[2], +m[3]), a: m[4] === undefined ? 1 : parseFloat(m[4]) };
    } else {
      probe.fillStyle = '#010203';
      probe.fillStyle = c;
      var v = probe.fillStyle;                       // '#rrggbb' or 'rgba(r, g, b, a)'
      if (v === '#010203' && c.toLowerCase() !== '#010203') {
        out = { hex: '#000000', a: 0 };              // the browser could not read it
      } else if (v.charAt(0) === '#') {
        out = { hex: v, a: 1 };
      } else {
        var q = /rgba?\(([^)]+)\)/.exec(v);
        var p2 = q ? q[1].split(',').map(parseFloat) : [0, 0, 0, 0];
        out = { hex: hex3(p2[0], p2[1], p2[2]), a: p2.length > 3 ? p2[3] : 1 };
      }
    }
    colorCache[c] = out;
    return out;
  }
  function hex3(r, g, b) {
    return '#' + [r, g, b].map(function (n) {
      return ('0' + Math.round(n || 0).toString(16)).slice(-2);
    }).join('');
  }
  function alphaOf(color) { return parseColor(color).a; }
  function rgb(color) { return parseColor(color).hex; }

  function r4(cs) {
    return ['borderTopLeftRadius', 'borderTopRightRadius',
      'borderBottomRightRadius', 'borderBottomLeftRadius'].map(function (k) {
      return num(cs[k]);
    });
  }

  /* a rounded box: one <rect> when every corner matches, a <path> when they differ */
  function boxShape(x, y, w, h, radii, attrs) {
    var same = radii.every(function (r) { return Math.abs(r - radii[0]) < 0.5; });
    if (same) {
      return '<rect x="' + x.toFixed(2) + '" y="' + y.toFixed(2) +
        '" width="' + w.toFixed(2) + '" height="' + h.toFixed(2) + '"' +
        (radii[0] > 0.5 ? ' rx="' + Math.min(radii[0], w / 2, h / 2).toFixed(2) + '"' : '') +
        ' ' + attrs + '/>';
    }
    var m = Math.min(w, h) / 2;
    var tl = Math.min(radii[0], m), tr = Math.min(radii[1], m),
        br = Math.min(radii[2], m), bl = Math.min(radii[3], m);
    var d = 'M' + (x + tl) + ' ' + y +
      'H' + (x + w - tr) + 'A' + tr + ' ' + tr + ' 0 0 1 ' + (x + w) + ' ' + (y + tr) +
      'V' + (y + h - br) + 'A' + br + ' ' + br + ' 0 0 1 ' + (x + w - br) + ' ' + (y + h) +
      'H' + (x + bl) + 'A' + bl + ' ' + bl + ' 0 0 1 ' + x + ' ' + (y + h - bl) +
      'V' + (y + tl) + 'A' + tl + ' ' + tl + ' 0 0 1 ' + (x + tl) + ' ' + y + 'Z';
    return '<path d="' + d + '" ' + attrs + '/>';
  }

  /* CSS linear-gradient -> an SVG gradient, so the closing band stays vector */
  function gradient(bg, x, y, w, h, defs) {
    var m = /linear-gradient\(([^]*)\)$/.exec(bg.trim());
    if (!m) return null;
    var body = m[1];
    var parts = [], depth = 0, cur = '';
    for (var i = 0; i < body.length; i++) {
      var ch = body[i];
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { parts.push(cur); cur = ''; continue; }
      cur += ch;
    }
    parts.push(cur);
    var angle = 180, first = parts[0].trim();
    if (/deg\s*$/.test(first)) { angle = num(first); parts.shift(); }
    else if (/^to /.test(first)) {
      angle = { 'to top': 0, 'to right': 90, 'to bottom': 180, 'to left': 270 }[first] || 180;
      parts.shift();
    }
    var stops = parts.map(function (p, idx) {
      p = p.trim();
      var cm = /(#[0-9a-f]{3,8}|rgba?\([^)]*\)|[a-z]+)\s*(.*)$/i.exec(p);
      if (!cm) return null;
      var pos = /([\d.]+)%/.exec(cm[2]);
      return {
        color: rgb(cm[1].indexOf('rgb') === 0 ? cm[1] : cm[1]),
        raw: cm[1],
        offset: pos ? num(pos[1]) : (idx / Math.max(1, parts.length - 1)) * 100,
        op: alphaOf(cm[1]) || (cm[1].indexOf('rgba') === 0 ? 0 : 1)
      };
    }).filter(Boolean);
    if (stops.length < 2) return null;
    var rad = (angle - 90) * Math.PI / 180;
    var id = 'grad' + (++uid);
    defs.push('<linearGradient id="' + id + '" x1="' + (50 - Math.cos(rad) * 50) + '%" y1="' +
      (50 - Math.sin(rad) * 50) + '%" x2="' + (50 + Math.cos(rad) * 50) + '%" y2="' +
      (50 + Math.sin(rad) * 50) + '%">' +
      stops.map(function (s) {
        return '<stop offset="' + s.offset + '%" stop-color="' + s.color +
          '" stop-opacity="' + (s.raw.indexOf('rgba') === 0 ? alphaOf(s.raw) : 1) + '"/>';
      }).join('') + '</linearGradient>');
    return 'url(#' + id + ')';
  }

  /* photographs and the film canvas are the only things that cannot be vector */
  function raster(el) {
    var key = el.tagName === 'CANVAS' ? 'canvas:' + (el.id || Math.random()) : el.currentSrc || el.src;
    if (imgCache[key]) return imgCache[key];
    try {
      var data;
      if (el.tagName === 'CANVAS') {
        data = el.toDataURL('image/jpeg', 0.86);
      } else {
        var c = document.createElement('canvas');
        var w = el.naturalWidth || el.width, h = el.naturalHeight || el.height;
        if (!w || !h) return null;
        var scale = Math.min(1, 1600 / Math.max(w, h));
        c.width = Math.round(w * scale); c.height = Math.round(h * scale);
        c.getContext('2d').drawImage(el, 0, 0, c.width, c.height);
        data = c.toDataURL('image/jpeg', 0.86);
      }
      imgCache[key] = data;
      return data;
    } catch (e) { return null; }
  }

  /* one <text> per visual line, placed on its own baseline */
  function textRuns(node, cs, origin, out) {
    var raw = node.nodeValue;
    if (!raw || !raw.trim()) return;
    var size = num(cs.fontSize);
    var fill = rgb(cs.color);
    var op = alphaOf(cs.color);
    if (op < 0.02 || size < 1) return;
    var stack = cs.fontFamily.split(',').map(function (f) { return f.replace(/["']/g, '').trim(); })
      .filter(function (f) { return f && !/^(-apple-system|BlinkMacSystemFont|system-ui|ui-[a-z]+)$/i.test(f); });
    if (!stack.length) stack.push('Inter');   // only when the stack was all system tokens
    stack.push('Arial', 'sans-serif');
    var family = stack.slice(0, 4).join(', ');
    var weight = cs.fontWeight;
    var tracking = num(cs.letterSpacing);

    // group the words by the line they landed on
    var words = [], re = /\S+\s*/g, m;
    while ((m = re.exec(raw))) words.push({ start: m.index, end: m.index + m[0].length });
    var range = document.createRange();
    var lines = [];
    words.forEach(function (w) {
      range.setStart(node, w.start);
      range.setEnd(node, w.end);
      var r = range.getBoundingClientRect();
      if (!r.width && !r.height) return;
      var line = lines[lines.length - 1];
      if (!line || Math.abs(line.top - r.top) > size * 0.4) {
        lines.push({ top: r.top, bottom: r.bottom, left: r.left, text: raw.slice(w.start, w.end) });
      } else {
        line.text += raw.slice(w.start, w.end);
        line.left = Math.min(line.left, r.left);
      }
    });
    var tt = cs.textTransform;
    var recase = function (t) {
      if (tt === 'uppercase') return t.toUpperCase();
      if (tt === 'lowercase') return t.toLowerCase();
      if (tt === 'capitalize') return t.replace(/[a-z]/g, function (ch) { return ch.toUpperCase(); });
      return t;
    };
    lines.forEach(function (l) {
      var t = recase(l.text.replace(/\s+$/, ''));
      if (!t.trim()) return;
      // alphabetic baseline inside the line box
      var baseline = l.top + (l.bottom - l.top) / 2 + size * 0.36;
      out.push('<text x="' + (l.left - origin.x).toFixed(2) + '" y="' + (baseline - origin.y).toFixed(2) +
        '" font-family="' + esc(family) + '" font-size="' + size.toFixed(2) +
        '" font-weight="' + weight + '" fill="' + fill + '"' +
        (op < 0.99 ? ' fill-opacity="' + op.toFixed(2) + '"' : '') +
        (Math.abs(tracking) > 0.05 ? ' letter-spacing="' + tracking.toFixed(2) + '"' : '') +
        ' xml:space="preserve">' + esc(t) + '</text>');
    });
  }

  function walk(el, origin, out, defs, depth) {
    var cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    /* A closed <details> is the case display/visibility miss entirely: Chrome
       skips its contents without changing either one, and still hands back a
       real 880x55 box, so the answers were being drawn under the rows that
       follow them. checkVisibility() is the question actually worth asking. */
    if (el.checkVisibility && !el.checkVisibility()) return;
    // text kept for screen readers only: on screen it is a 1px clipped box, and
    // drawing it lands "to ask" and "(opens in a new tab)" on top of real labels
    if (cs.clip === 'rect(0px, 0px, 0px, 0px)' || /inset\(50%\)/.test(cs.clipPath) ||
        (el.className && /sr-only/.test(el.className))) return;
    var op = num(cs.opacity);
    if (op < 0.02) return;
    var r = el.getBoundingClientRect();
    if (r.width < 0.5 || r.height < 0.5) {
      if (!el.children.length) return;
    }
    var x = r.left - origin.x, y = r.top - origin.y;

    var pieces = [];

    // an inline icon keeps its own paths, exactly as drawn
    if (el.tagName.toLowerCase() === 'svg') {
      var clone = el.cloneNode(true);
      clone.setAttribute('width', r.width);
      clone.setAttribute('height', r.height);
      clone.removeAttribute('class');
      var vb = clone.getAttribute('viewBox');
      var inner = clone.outerHTML
        .replace(/^<svg/i, '<svg x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '"')
        .replace(/\scurrentColor/g, ' ' + rgb(cs.color));
      inner = inner.replace(/(fill|stroke)="currentColor"/g, '$1="' + rgb(cs.color) + '"');
      if (!vb) inner = inner.replace(/^<svg/, '<svg viewBox="0 0 ' + r.width + ' ' + r.height + '"');
      out.push('<g id="' + esc(idFor(el)) + '">' + inner + '</g>');
      return;   // its children are already inside
    }

    // background
    var bgc = cs.backgroundColor, bgi = cs.backgroundImage;
    var radii = r4(cs);
    if (alphaOf(bgc) > 0.01) {
      pieces.push(boxShape(x, y, r.width, r.height, radii,
        'fill="' + rgb(bgc) + '"' + (alphaOf(bgc) < 0.99 ? ' fill-opacity="' + alphaOf(bgc).toFixed(2) + '"' : '')));
    }
    if (bgi && bgi !== 'none' && bgi.indexOf('gradient') >= 0) {
      var g = gradient(bgi, x, y, r.width, r.height, defs);
      if (g) pieces.push(boxShape(x, y, r.width, r.height, radii, 'fill="' + g + '"'));
    }

    // border (uniform only — the pages use hairlines)
    var bw = num(cs.borderTopWidth);
    if (bw > 0.4 && alphaOf(cs.borderTopColor) > 0.01 &&
        Math.abs(bw - num(cs.borderBottomWidth)) < 0.4 &&
        Math.abs(bw - num(cs.borderLeftWidth)) < 0.4) {
      pieces.push(boxShape(x + bw / 2, y + bw / 2, r.width - bw, r.height - bw, radii,
        'fill="none" stroke="' + rgb(cs.borderTopColor) + '" stroke-width="' + bw.toFixed(2) + '"' +
        (alphaOf(cs.borderTopColor) < 0.99 ? ' stroke-opacity="' + alphaOf(cs.borderTopColor).toFixed(2) + '"' : '')));
    } else if (bw > 0.4 || num(cs.borderBottomWidth) > 0.4) {
      // a single-edge rule (section hairlines)
      [['Top', y, y], ['Bottom', y + r.height, y + r.height]].forEach(function (e) {
        var w = num(cs['border' + e[0] + 'Width']);
        var c = cs['border' + e[0] + 'Color'];
        if (w > 0.4 && alphaOf(c) > 0.01) {
          pieces.push('<line x1="' + x.toFixed(2) + '" y1="' + e[1].toFixed(2) + '" x2="' +
            (x + r.width).toFixed(2) + '" y2="' + e[2].toFixed(2) + '" stroke="' + rgb(c) +
            '" stroke-width="' + w.toFixed(2) + '"/>');
        }
      });
    }

    // photographs and the film canvas
    if (el.tagName === 'IMG' || el.tagName === 'CANVAS') {
      var data = raster(el);
      if (data) {
        pieces.push('<image x="' + x.toFixed(2) + '" y="' + y.toFixed(2) + '" width="' +
          r.width.toFixed(2) + '" height="' + r.height.toFixed(2) +
          '" preserveAspectRatio="xMidYMid slice" href="' + data + '"/>');
      }
    }

    // a <select> paints its chosen option, which is not a text node
    if (el.tagName === 'SELECT') {
      var opt = el.options[el.selectedIndex];
      if (opt) {
        var pad = num(cs.paddingLeft), fs = num(cs.fontSize);
        pieces.push('<text x="' + (x + pad).toFixed(2) + '" y="' + (y + r.height / 2 + fs * 0.36).toFixed(2) +
          '" font-family="Inter, Arial, sans-serif" font-size="' + fs.toFixed(2) +
          '" font-weight="' + cs.fontWeight + '" fill="' + rgb(cs.color) + '">' + esc(opt.text) + '</text>');
      }
    }

    // this element's own text, then its children
    var kids = [];
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3) textRuns(n, cs, origin, kids);
      else if (n.nodeType === 1) walk(n, origin, kids, defs, depth + 1);
    }

    if (!pieces.length && !kids.length) return;
    var body = pieces.concat(kids).join('');
    // an ellipsis row or any hidden overflow: clip it, or long names run over
    // their neighbours once the CSS truncation is gone
    if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.textOverflow === 'ellipsis') &&
        r.width > 1 && r.height > 1) {
      var cid = 'clip' + (++uid);
      defs.push('<clipPath id="' + cid + '">' +
        boxShape(x, y, r.width, r.height, radii, '') + '</clipPath>');
      body = '<g clip-path="url(#' + cid + ')">' + body + '</g>';
    }
    var attrs = op < 0.99 ? ' opacity="' + op.toFixed(2) + '"' : '';
    // only name the groups worth naming, so the AE layer list stays readable
    var id = depth <= 3 || el.id || /card|panel|row|btn|tile|head|chip|tag/.test(el.className || '')
      ? ' id="' + esc(idFor(el)) + '"' : '';
    out.push('<g' + id + attrs + '>' + body + '</g>');
  }

  function idFor(el) {
    if (el.id) return el.id;
    var c = (typeof el.className === 'string' ? el.className : '').trim().split(/\s+/)[0];
    return (c || el.tagName.toLowerCase()) + '-' + (++uid);
  }

  /* jump every running animation to its end, so a capture never lands
     mid-fade (the script lines animate in and were coming out invisible) */
  function settle() {
    if (!document.getAnimations) return;
    document.getAnimations().forEach(function (a) {
      try {
        a.finish();                       // a one-shot lands on its end state
      } catch (e) {
        // an endless loop (the marquee, the card's story) cannot "finish":
        // park it mid-cycle, where those loops sit fully arrived
        try {
          var d = a.effect && a.effect.getComputedTiming().duration;
          if (d) a.currentTime = d * 0.5;
          a.pause();
        } catch (e2) {}
      }
    });
  }

  window.dom2svg = function (root, opts) {
    opts = opts || {};
    uid = 0;
    settle();
    var r = root.getBoundingClientRect();
    var origin = { x: r.left, y: r.top };
    var out = [], defs = [];
    walk(root, origin, out, defs, 0);
    var bg = opts.background || getComputedStyle(document.body).backgroundColor;
    var back = alphaOf(bg) > 0.01 && opts.background !== 'none'
      ? '<rect id="page-background" x="0" y="0" width="' + r.width.toFixed(2) +
        '" height="' + r.height.toFixed(2) + '" fill="' + rgb(bg) + '"/>' : '';
    return '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
      'width="' + Math.round(r.width) + '" height="' + Math.round(r.height) + '" ' +
      'viewBox="0 0 ' + Math.round(r.width) + ' ' + Math.round(r.height) + '">' +
      (defs.length ? '<defs>' + defs.join('') + '</defs>' : '') +
      back + out.join('') + '</svg>';
  };

  /* every animation settled, every reveal shown, every image decoded */
  /* every reveal shown and every image decoded; the animations themselves are
     settled per capture by settle(), which lands one-shots on their end state
     and parks endless loops mid-cycle */
  window.dom2svgPrep = function () {
    document.querySelectorAll('.reveal').forEach(function (e) { e.classList.add('in'); });
    var imgs = Array.prototype.slice.call(document.images);
    imgs.forEach(function (i) { i.loading = 'eager'; });
    var fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    return fonts.then(function () { return Promise.all(imgs.map(function (i) {
      return i.complete ? Promise.resolve() : new Promise(function (res) {
        i.onload = i.onerror = res;
      });
    })); }).then(function () { return imgs.length; });
  };
})();
