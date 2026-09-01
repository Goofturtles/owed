/* ============================================================
   Owed — the stack

   A scroll-driven flythrough of the paperwork: a deep run of
   translucent pages of fine print that the camera travels into,
   until the one clause that matters lights up.

   Written against raw WebGL on purpose. A library would be ~600KB
   for a scene this small — more than the entire rest of the site —
   and would add a second external origin. This is ~8KB and ships
   from our own directory.

   Progressive enhancement: if WebGL is missing, the context is lost,
   or the visitor asked for reduced motion, the canvas stays hidden
   and the static fallback underneath is what you get.
   ============================================================ */
(function () {
  'use strict';

  var host = document.getElementById('stack');
  if (!host) return;

  var canvas = host.querySelector('canvas');
  // #stack is the tall scroll track; the canvas lives in the 100vh sticky stage.
  // Size against the stage, but read scroll progress from the track.
  var stage = canvas && canvas.parentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || reduce) return;

  var gl = null;
  try {
    // no MSAA: the pages are soft blended quads, so it costs framebuffer for
    // almost no visible gain, and two full-viewport buffers is the real risk here
    gl = canvas.getContext('webgl', { antialias: false, alpha: true })
      || canvas.getContext('experimental-webgl', { antialias: false, alpha: true });
  } catch (e) { gl = null; }
  if (!gl) return;

  /* ---------------- tiny mat4 ---------------- */
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (far + near) * nf, -1,
            0, 0, 2 * far * near * nf, 0];
  }
  function trs(tx, ty, tz, rz, sx, sy) {
    var c = Math.cos(rz), s = Math.sin(rz);
    return [c * sx, s * sx, 0, 0,
            -s * sy, c * sy, 0, 0,
            0, 0, 1, 0,
            tx, ty, tz, 1];
  }

  /* ---------------- procedural page of fine print ----------------
     Drawn once to a canvas rather than shipped as an image: it is
     sharper at any zoom, costs no request, and lets the highlighted
     row sit at a known v coordinate. */
  var HI_ROW = 22, ROWS = 46;

  function makePageTexture() {
    var c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    var x = c.getContext('2d');
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, 512, 512);

    var y = 26, row = 0, rnd = 1;
    function rand() { rnd = (rnd * 16807) % 2147483647; return rnd / 2147483647; }

    while (y < 496 && row < ROWS) {
      // paragraph breaks and a heading now and then
      if (row % 11 === 5) { y += 9; row++; continue; }
      var indent = (row % 11 === 6) ? 46 : 30;
      var w = 512 - indent - 30 - rand() * 46;
      var h = (row % 11 === 6) ? 5.5 : 3.4;
      x.fillStyle = (row % 11 === 6) ? 'rgba(18,18,14,.86)' : 'rgba(18,18,14,.55)';
      // draw the line as a run of word-blocks so it reads as type, not a bar
      var cx = indent;
      while (cx < indent + w) {
        var wordW = 8 + rand() * 30;
        if (cx + wordW > indent + w) wordW = indent + w - cx;
        x.fillRect(cx, y, wordW, h);
        cx += wordW + 5;
      }
      y += (row % 11 === 6) ? 15 : 10;
      row++;
    }

    var t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  }

  /* ---------------- shaders ---------------- */
  var VS =
    'attribute vec2 aPos;' +
    'varying vec2 vUv;' +
    'varying float vDepth;' +
    'uniform mat4 uProj, uModel;' +
    'void main(){' +
    '  vUv = aPos * 0.5 + 0.5;' +
    '  vec4 mv = uModel * vec4(aPos, 0.0, 1.0);' +
    '  vDepth = -mv.z;' +
    '  gl_Position = uProj * mv;' +
    '}';

  var FS =
    'precision mediump float;' +
    'varying vec2 vUv;' +
    'varying float vDepth;' +
    'uniform sampler2D uTex;' +
    'uniform vec3 uPaper, uInk, uAccent, uFog;' +
    'uniform float uAlpha, uHighlight, uHiY, uInkFade;' +
    'void main(){' +
    // texture alpha channel is the "how much ink is here" mask
    '  float ink = 1.0 - texture2D(uTex, vUv).r;' +
    '  vec3 col = mix(uPaper, uInk, ink * uInkFade);' +
    // the one clause that matters
    '  float band = smoothstep(0.016, 0.0, abs(vUv.y - uHiY));' +
    '  col = mix(col, uAccent, band * uHighlight * (0.30 + ink * 0.55));' +
    // dissolve into the page background with distance
    '  float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));' +
    '  col = mix(col * 0.80, col, smoothstep(0.0, 0.010, edge));' +
    '  float fog = clamp((vDepth - 6.0) / 26.0, 0.0, 1.0);' +
    '  col = mix(col, uFog, fog);' +
    '  float a = uAlpha * (1.0 - fog * 0.86);' +
    '  if (a < 0.004) discard;' +
    '  gl_FragColor = vec4(col, a);' +
    '}';

  function compile(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s));
    }
    return s;
  }

  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) {
    return; // leave the static fallback in place
  }
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  var U = {};
  ['uProj', 'uModel', 'uTex', 'uPaper', 'uInk', 'uAccent', 'uFog', 'uAlpha', 'uHighlight', 'uHiY', 'uInkFade']
    .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

  var tex = makePageTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.uniform1i(U.uTex, 0);
  gl.uniform1f(U.uHiY, 1.0 - (26 + HI_ROW * 10) / 512);

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.DEPTH_TEST); // painter's order, back to front

  /* ---------------- the pages ---------------- */
  var COUNT = window.innerWidth < 700 ? 18 : 30;
  var HIT = Math.floor(COUNT * 0.62);
  var pages = [];
  (function build() {
    var r = 7;
    function rnd() { r = (r * 16807) % 2147483647; return r / 2147483647; }
    for (var i = 0; i < COUNT; i++) {
      // Ring the pages around the centre line rather than scattering them across
      // it: the camera flies down a corridor of paperwork and the caption in the
      // middle of the screen stays readable the whole way.
      var ang = rnd() * Math.PI * 2;
      var rad = 1.30 + rnd() * 1.25;
      var hit = (i === HIT);
      if (hit) rad = 0.62;               // the one that matters comes in close
      pages.push({
        z: -i * 1.35,
        x: Math.cos(ang) * rad * 1.45,
        y: Math.sin(ang) * rad * 0.95,
        rot: (rnd() - 0.5) * 0.3,
        hi: hit ? 1 : 0
      });
    }
  })();

  /* ---------------- theme colours, read from the tokens ---------------- */
  var COL = { paper: [1, 1, 1], ink: [0.09, 0.09, 0.06], accent: [0.04, 0.36, 0.23], fog: [0.99, 0.99, 0.96] };
  function hex(v, fb) {
    v = (v || '').trim();
    var m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return fb;
    var n = parseInt(m[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    COL.paper = hex(cs.getPropertyValue('--card'), COL.paper);
    COL.ink = hex(cs.getPropertyValue('--ink'), COL.ink);
    COL.accent = hex(cs.getPropertyValue('--accent'), COL.accent);
    COL.fog = hex(cs.getPropertyValue('--paper-2'), COL.fog);
  }
  readTheme();
  new MutationObserver(function () { readTheme(); schedule(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------------- sizing ---------------- */
  var W = 0, H = 0, proj = null, aspect = 1.6, pageScale = 1, ringScale = 1;
  // reused every draw — allocating these per page per frame is ~3000 arrays/s
  var mProj = new Float32Array(16), mModel = new Float32Array(16);
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var r = stage.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width * dpr));
    var h = Math.max(1, Math.round(r.height * dpr));
    if (w === W && h === H) return;
    W = w; H = h;
    canvas.width = w; canvas.height = h;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    gl.viewport(0, 0, w, h);
    aspect = r.width / Math.max(1, r.height);
    proj = perspective(52 * Math.PI / 180, aspect, 0.1, 100);
    mProj.set(proj);
    // In portrait the horizontal field is narrow, so a page that reads as one
    // sheet on a laptop fills the whole phone. Shrink the sheets and widen the
    // corridor until it reads as depth again rather than a wall of text.
    var portrait = Math.min(1, Math.max(0, (1.15 - aspect) / 0.75));
    pageScale = 1 - portrait * 0.34;
    ringScale = 1 + portrait * 0.85;
  }

  /* ---------------- scroll → camera ---------------- */
  var progress = 0, target = 0;
  function measure() {
    var r = host.getBoundingClientRect();
    var travel = r.height - window.innerHeight;
    if (travel <= 0) { target = 0.5; return; }
    target = Math.min(1, Math.max(0, -r.top / travel));
  }

  /* ---------------- caption sync ---------------- */
  var caps = host.querySelectorAll('[data-cap]');
  function captions(p) {
    for (var i = 0; i < caps.length; i++) {
      var a = Number(caps[i].dataset.from), b = Number(caps[i].dataset.to);
      caps[i].classList.toggle('is-on', p >= a && p < b);
    }
  }

  /* ---------------- render ---------------- */
  var running = false, raf = null, lost = false;

  function frame() {
    raf = null;
    resize();
    measure();
    // eased follow so the camera glides, but snap on a big jump (anchor link,
    // resize, restored scroll position) instead of crawling there over seconds
    var d = target - progress;
    progress += (Math.abs(d) > 0.25) ? d : d * 0.16;
    // Travel less than the full depth of the stack. Covering all 32 pages over
    // the run meant one whipped past every ~228ms, which reads as fast no
    // matter how long the scroll takes — the fog hides that we stop short.
    var camZ = 5.0 - progress * (COUNT * 0.66);

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniformMatrix4fv(U.uProj, false, mProj);
    gl.uniform3fv(U.uPaper, COL.paper);
    gl.uniform3fv(U.uInk, COL.ink);
    gl.uniform3fv(U.uAccent, COL.accent);
    gl.uniform3fv(U.uFog, COL.fog);

    // farthest first so alpha blends correctly without depth sorting
    for (var i = pages.length - 1; i >= 0; i--) {
      var p = pages[i];
      var rel = p.z - camZ;          // negative = in front of camera
      if (rel > -0.30 || rel < -34) continue;   // behind us, or too far
      var near = Math.min(1, Math.max(0, (-rel - 0.30) / 1.8)); // fade as we pass through
      gl.uniform1f(U.uAlpha, 0.94 * near);
      gl.uniform1f(U.uHighlight, p.hi);
      gl.uniform1f(U.uInkFade, 1.0);
      mModel.set(trs(p.x * ringScale, p.y * ringScale, p.z - camZ, p.rot,
                     1.15 * pageScale, 0.76 * pageScale));
      gl.uniformMatrix4fv(U.uModel, false, mModel);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    captions(target);

    // idle once the camera has caught up; scroll/resize/theme wake it again
    if (running && Math.abs(target - progress) > 0.0002) schedule();
  }

  function schedule() { if (raf === null) raf = requestAnimationFrame(frame); }
  function start() { if (!running && !lost) { running = true; schedule(); } }
  function stop() { running = false; if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }
  // give the framebuffer back while off-screen: a full-viewport buffer held
  // for the page lifetime is what actually risks a context loss on low-end GPUs
  function release() { stop(); if (W !== 1) { canvas.width = canvas.height = 1; W = H = 0; } }

  // only run while the section is actually on screen
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : release(); });
    }, { rootMargin: '120px' }).observe(host);
  } else {
    start();
  }
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else {
      var r = host.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) start();
    }
  });
  window.addEventListener('resize', function () { W = H = 0; schedule(); }, { passive: true });
  window.addEventListener('scroll', function () { if (running) schedule(); }, { passive: true });

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); lost = true; stop(); host.classList.remove('is-live');
  });

  host.classList.add('is-live');   // hides the static fallback
  resize();
  start();
})();
