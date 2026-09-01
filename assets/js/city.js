/* ============================================================
   Owed — the city of fine print

   An isometric city the camera drifts across as you scroll. Every
   block is somewhere cover hides: the maker, the card, the payout,
   the repair programme, the law. A handful are lit in accent — those
   are the ones holding a rule that applies to you.

   Raw WebGL again, ~9KB, same reasoning as scene.js: a library for
   one scene would outweigh the entire rest of the site.

   Progressive enhancement: no WebGL, a lost context, or reduced
   motion and the static fallback underneath is what you get.
   ============================================================ */
(function () {
  'use strict';

  var host = document.getElementById('city');
  if (!host) return;

  var canvas = host.querySelector('canvas');
  var stage = canvas && canvas.parentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canvas || reduce) return;

  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: true, alpha: true, depth: true })
      || canvas.getContext('experimental-webgl', { antialias: true, alpha: true, depth: true });
  } catch (e) { gl = null; }
  if (!gl) return;

  /* ---------------- mat4 ---------------- */
  function perspective(fovy, aspect, near, far) {
    var f = 1 / Math.tan(fovy / 2), nf = 1 / (near - far);
    return [f / aspect, 0, 0, 0, 0, f, 0, 0,
            0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
  }
  function mul(a, b) {
    var o = new Array(16);
    for (var i = 0; i < 4; i++) {
      var b0 = b[i * 4], b1 = b[i * 4 + 1], b2 = b[i * 4 + 2], b3 = b[i * 4 + 3];
      for (var j = 0; j < 4; j++) {
        o[i * 4 + j] = a[j] * b0 + a[4 + j] * b1 + a[8 + j] * b2 + a[12 + j] * b3;
      }
    }
    return o;
  }
  function lookAt(ex, ey, ez, cx, cy, cz) {
    var zx = ex - cx, zy = ey - cy, zz = ez - cz;
    var zl = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1;
    zx /= zl; zy /= zl; zz /= zl;
    // x = normalize(cross(worldUp, z)) with worldUp = (0,1,0) => (z.z, 0, -z.x)
    var xx = zz, xy = 0, xz = -zx;
    var xl = Math.sqrt(xx * xx + xz * xz) || 1;
    xx /= xl; xz /= xl;
    // y = cross(z, x)
    var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    return [xx, yx, zx, 0, xy, yy, zy, 0, xz, yz, zz, 0,
            -(xx * ex + xy * ey + xz * ez), -(yx * ex + yy * ey + yz * ez), -(zx * ex + zy * ey + zz * ez), 1];
  }
  // writes in place: a fresh Array per block per frame is ~7000 allocations/sec
  function boxMatrix(out, x, y, z, sx, sy, sz) {
    out[0] = sx; out[1] = 0;  out[2] = 0;  out[3] = 0;
    out[4] = 0;  out[5] = sy; out[6] = 0;  out[7] = 0;
    out[8] = 0;  out[9] = 0;  out[10] = sz; out[11] = 0;
    out[12] = x; out[13] = y; out[14] = z;  out[15] = 1;
    return out;
  }

  /* ---------------- geometry: one unit box ----------------
     Each vertex carries a shade so the faces read as lit without
     any lighting maths in the shader. */
  function boxData() {
    var pos = [], shade = [];
    function quad(a, b, c, d, s) {
      var t = [a, b, c, a, c, d];
      for (var i = 0; i < 6; i++) { pos.push(t[i][0], t[i][1], t[i][2]); shade.push(s); }
    }
    var p = [[-.5,0,-.5],[.5,0,-.5],[.5,0,.5],[-.5,0,.5],
             [-.5,1,-.5],[.5,1,-.5],[.5,1,.5],[-.5,1,.5]];
    quad(p[7], p[6], p[5], p[4], 1.00);   // roof (CCW from above)
    quad(p[3], p[2], p[6], p[7], 0.82);   // front
    quad(p[2], p[1], p[5], p[6], 0.62);   // right
    quad(p[0], p[3], p[7], p[4], 0.70);   // left
    quad(p[1], p[0], p[4], p[5], 0.52);   // back
    return { pos: new Float32Array(pos), shade: new Float32Array(shade), count: pos.length / 3 };
  }

  var VS =
    'attribute vec3 aPos;' +
    'attribute float aShade;' +
    'uniform mat4 uVP, uModel;' +
    'uniform vec3 uEye;' +
    'varying float vShade;' +
    'varying float vDepth;' +
    'void main(){' +
    '  vec4 w = uModel * vec4(aPos, 1.0);' +
    '  vShade = aShade;' +
    '  vDepth = length(w.xz - uEye.xz);' +
    '  gl_Position = uVP * w;' +
    '}';

  var FS =
    'precision mediump float;' +
    'varying float vShade; varying float vDepth;' +
    'uniform vec3 uColor, uFog;' +
    'uniform float uAccent;' +
    'void main(){' +
    '  vec3 col = uColor * vShade;' +
    // the accent blocks glow a little on their roof
    '  col = mix(col, col + vec3(0.10, 0.26, 0.16), uAccent * step(0.95, vShade));' +
    '  float fog = clamp((vDepth - 14.0) / 30.0, 0.0, 1.0);' +
    '  col = mix(col, uFog, fog);' +
    '  gl_FragColor = vec4(col, 1.0 - fog * 0.05);' +
    '}';

  function compile(t, src) {
    var s = gl.createShader(t);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  var prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (e) { return; }
  gl.useProgram(prog);

  var box = boxData();
  var bp = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bp);
  gl.bufferData(gl.ARRAY_BUFFER, box.pos, gl.STATIC_DRAW);
  var aPos = gl.getAttribLocation(prog, 'aPos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);

  var bs = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bs);
  gl.bufferData(gl.ARRAY_BUFFER, box.shade, gl.STATIC_DRAW);
  var aShade = gl.getAttribLocation(prog, 'aShade');
  gl.enableVertexAttribArray(aShade);
  gl.vertexAttribPointer(aShade, 1, gl.FLOAT, false, 0, 0);

  var U = {};
  ['uVP', 'uModel', 'uEye', 'uColor', 'uFog', 'uAccent'].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);          // every face is CCW-outward; saves ~40% of fragments
  gl.enable(gl.BLEND);
  // separate alpha, or the destination alpha resolves low on a transparent canvas
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  /* ---------------- the city ---------------- */
  var small = window.innerWidth < 700;
  var COLS = small ? 6 : 9, ROWS = small ? 15 : 22, GAP = 2.15;
  var blocks = [];
  (function build() {
    var r = 20250831;
    function rnd() { r = (r * 16807) % 2147483647; return r / 2147483647; }
    for (var z = 0; z < ROWS; z++) {
      for (var x = 0; x < COLS; x++) {
        if (rnd() < 0.16) continue;                       // squares and streets
        var mid = Math.abs(x - (COLS - 1) / 2) / ((COLS - 1) / 2);
        var h = 0.7 + rnd() * (3.6 - mid * 1.9);          // taller toward the middle
        blocks.push({
          x: (x - (COLS - 1) / 2) * GAP + (rnd() - .5) * .28,
          z: -z * GAP,
          h: h,
          w: 1.05 + rnd() * .38,
          d: 1.05 + rnd() * .38,
          tone: Math.floor(rnd() * 5),
          accent: rnd() < 0.13 ? 1 : 0
        });
      }
    }
  })();

  /* ---------------- palette from the tokens ---------------- */
  var TONES = [[1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1], [1, 1, 1]];
  var FOG = [.03, .04, .035];
  function hex(v, fb) {
    v = (v || '').trim();
    var m = /^#([0-9a-f]{6})$/i.exec(v);
    if (!m) return fb;
    var n = parseInt(m[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function readTheme() {
    var cs = getComputedStyle(document.documentElement);
    // the section sets its own fixed ground, so the fog reads from the host
    var hostCs = getComputedStyle(host);
    TONES = [
      hex(cs.getPropertyValue('--il-paper'), [1, 1, 1]),
      hex(cs.getPropertyValue('--il-mint'), [.74, .91, .82]),
      hex(cs.getPropertyValue('--il-sand'), [.95, .89, .75]),
      hex(cs.getPropertyValue('--il-blue'), [.78, .86, .94]),
      hex(cs.getPropertyValue('--il-blush'), [.96, .83, .80])
    ];
    FOG = hex(hostCs.getPropertyValue('--city-ground'), [.03, .04, .035]);
  }
  readTheme();
  new MutationObserver(function () { readTheme(); schedule(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------------- sizing + scroll ---------------- */
  var W = 0, H = 0, proj = null;
  var mVP = new Float32Array(16), mModel = new Float32Array(16);
  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var r = stage.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (w === W && h === H) return;
    W = w; H = h;
    canvas.width = w; canvas.height = h;
    canvas.style.width = r.width + 'px';
    canvas.style.height = r.height + 'px';
    gl.viewport(0, 0, w, h);
    proj = perspective(36 * Math.PI / 180, r.width / Math.max(1, r.height), 0.1, 160);
  }

  var progress = 0, target = 0;
  function measure() {
    var r = host.getBoundingClientRect();
    var travel = r.height - window.innerHeight;
    target = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0.5;
  }

  var running = false, raf = null, lost = false;
  function frame() {
    raf = null;
    resize();
    measure();
    var d = target - progress;
    progress += (Math.abs(d) > 0.25) ? d : d * 0.14;

    // the camera tracks down the avenue, holding an isometric angle
    var travelZ = -progress * (ROWS - 7) * GAP;
    var ex = 12.5, ey = 15.5, ez = travelZ + 16.5;
    // aim a touch above the rooftops: keeps clear ground behind the copy
    var cx = 0.4, cy = 3.4, cz = travelZ;
    var view = lookAt(ex, ey, ez, cx, cy, cz);
    mVP.set(mul(proj, view));

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniformMatrix4fv(U.uVP, false, mVP);
    gl.uniform3f(U.uEye, ex, ey, ez);
    gl.uniform3fv(U.uFog, FOG);

    for (var i = 0; i < blocks.length; i++) {
      var b = blocks[i];
      if (b.z > ez + 4 || b.z < ez - 46) continue;    // behind, or past the fog
      gl.uniform3fv(U.uColor, TONES[b.tone]);
      gl.uniform1f(U.uAccent, b.accent);
      boxMatrix(mModel, b.x, 0, b.z, b.w, b.h, b.d);
      gl.uniformMatrix4fv(U.uModel, false, mModel);
      gl.drawArrays(gl.TRIANGLES, 0, box.count);
    }

    if (running && Math.abs(target - progress) > 0.0004) schedule();
  }
  function schedule() { if (raf === null && !lost) raf = requestAnimationFrame(frame); }
  function start() { if (!running && !lost) { running = true; schedule(); } }
  function stop() { running = false; if (raf !== null) { cancelAnimationFrame(raf); raf = null; } }
  // hand the framebuffer back: full-viewport MSAA + depth is tens of MB, and
  // holding two of those for the page lifetime is what actually risks a
  // context loss on low-end hardware
  function release() { stop(); if (W !== 1) { canvas.width = canvas.height = 1; W = H = 0; } }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : release(); });
    }, { rootMargin: '150px' }).observe(host);
  } else { start(); }
  window.addEventListener('scroll', function () { if (running) schedule(); }, { passive: true });
  window.addEventListener('resize', function () { W = H = 0; schedule(); }, { passive: true });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else {
      var r = host.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) start();
    }
  });
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); lost = true; stop(); host.classList.remove('is-live');
  });

  host.classList.add('is-live');
  resize();
  start();
})();
