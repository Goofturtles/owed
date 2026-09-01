/* ============================================================
   Owed — the stage light

   Real volumetric light scattering, not a shape pretending to be
   one. The classic post-process approach: build a light mask, then
   for every pixel march back toward the source accumulating what
   the mask lets through, with decay. That is what produces actual
   god rays — shafts that break up, fan out and get eaten by haze —
   rather than a clip-path triangle with a gradient in it.

   Drifting fbm haze gives the beam something to scatter off, and a
   sparse dust field catches the light inside the cone.

   Raw WebGL to match scene.js. ~5KB, no dependency, own origin.

   Progressive enhancement: the CSS cones in landing.css are the
   fallback and are visible by default. They are only hidden once
   this has a live context and has drawn, so losing WebGL leaves a
   lit stage rather than an empty one.
   ============================================================ */
(function () {
  'use strict';

  var host = document.querySelector('.spot');
  if (!host) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var canvas = document.createElement('canvas');
  canvas.className = 'spot-gl';
  canvas.setAttribute('aria-hidden', 'true');

  var gl = null;
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true })
      || canvas.getContext('experimental-webgl', { antialias: false, alpha: true, premultipliedAlpha: true });
  } catch (e) { gl = null; }
  if (!gl) return;

  var VERT = [
    'attribute vec2 p;',
    'void main(){ gl_Position = vec4(p, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',
    'uniform vec2 uRes;',
    'uniform float uTime;',
    'uniform vec3 uCool;',
    'uniform vec3 uWarm;',

    'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',

    'float vnoise(vec2 p){',
    '  vec2 i = floor(p), f = fract(p);',
    '  vec2 u = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
    '}',

    // three octaves is enough for haze and keeps the march affordable
    'float fbm(vec2 p){',
    '  float v = 0.0, a = 0.5;',
    '  for (int i = 0; i < 3; i++) { v += a * vnoise(p); p *= 2.03; a *= 0.5; }',
    '  return v;',
    '}',

    // what the light gets through at this point: a bright source, chewed
    // into by slowly drifting haze
    'float mask(vec2 uv, vec2 src, float ar){',
    '  vec2 d = (uv - src) * vec2(ar, 1.0);',
    '  float core = smoothstep(0.46, 0.0, length(d));',
    '  if (core <= 0.001) return 0.0;',
    '  float haze = fbm(uv * vec2(3.4, 2.2) + vec2(uTime * 0.021, -uTime * 0.043));',
    '  float bite = fbm(uv * vec2(7.0, 3.0) - vec2(uTime * 0.014, uTime * 0.03));',
    '  return core * (0.42 + 0.72 * haze) * (0.62 + 0.5 * bite);',
    '}',

    'void main(){',
    '  vec2 uv = gl_FragCoord.xy / uRes;',
    '  float ar = uRes.x / uRes.y;',
    '  vec2 src = vec2(0.5, 1.16);',            // the lamp, just off the top edge

    // march back toward the source, accumulating with decay
    '  vec2 delta = (uv - src) * (1.0 / 34.0) * 0.72;',
    '  vec2 p = uv;',
    '  float illum = 0.0, decay = 1.0;',
    '  for (int i = 0; i < 34; i++){',
    '    p -= delta;',
    '    illum += mask(p, src, ar) * decay;',
    '    decay *= 0.962;',
    '  }',
    '  illum /= 34.0;',
    '  illum *= 2.7;',

    // the beam has to die before the section edge or it reads as a gradient
    '  illum *= smoothstep(-0.25, 0.86, uv.y);',
    '  illum *= smoothstep(1.04, 0.90, uv.y);',   // trim the bulb, keep the shaft
    '  illum *= smoothstep(0.0, 0.30, 1.0 - abs(uv.x - 0.5) * 2.0);',

    // dust caught in the beam
    '  vec2 gp = uv * vec2(ar, 1.0) * 34.0;',
    '  vec2 gi = floor(gp);',
    '  float rnd = hash(gi);',
    '  vec2 c = fract(gp) - 0.5;',
    '  c.y += sin(uTime * (0.10 + rnd * 0.16) + rnd * 44.0) * 0.30;',
    '  c.x += cos(uTime * (0.07 + rnd * 0.11) + rnd * 21.0) * 0.24;',
    '  float mote = smoothstep(0.13, 0.0, length(c)) * step(0.976, rnd);',
    '  float dust = mote * illum * 2.4;',

    // cool at the top, a touch warmer where it lands
    '  vec3 col = mix(uCool, uWarm, smoothstep(0.85, 0.0, uv.y));',
    '  float a = clamp(illum + dust, 0.0, 0.86);',
    '  gl_FragColor = vec4(col * (illum + dust), a);',   // premultiplied
    '}'
  ].join('\n');

  function compile(type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      if (window.console && console.warn) console.warn('godray shader:', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh); return null;
    }
    return sh;
  }

  var vs = compile(gl.VERTEX_SHADER, VERT);
  var fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  var prog = gl.createProgram();
  gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  var uRes = gl.getUniformLocation(prog, 'uRes');
  var uTime = gl.getUniformLocation(prog, 'uTime');
  var uCool = gl.getUniformLocation(prog, 'uCool');
  var uWarm = gl.getUniformLocation(prog, 'uWarm');

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);   // premultiplied

  /* Colours come from CSS so the light stays on-palette when the theme
     tokens change, rather than being hardcoded here twice. Read off the host,
     which is where the tokens are scoped, and cached: getComputedStyle forces
     a style flush and this used to run on every frame. */
  var cool = [0.86, 1.0, 0.93], warm = [0.71, 0.90, 0.80];

  function parseColour(name, fallback) {
    var v = getComputedStyle(host).getPropertyValue(name).trim();
    var m = v.match(/^#?([0-9a-f]{6})$/i);
    if (!m) return fallback;
    var n = parseInt(m[1], 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  function readColours() {
    cool = parseColour('--ray-cool', cool);
    warm = parseColour('--ray-warm', warm);
  }

  // the march is soft, so half resolution is free quality-wise and
  // roughly a quarter of the fragment cost
  var SCALE = 0.5;
  var w = 0, h = 0;

  function resize() {
    var r = host.getBoundingClientRect();
    var nw = Math.max(1, Math.round(r.width * SCALE));
    var nh = Math.max(1, Math.round(r.height * SCALE));
    if (nw === w && nh === h) return;
    w = nw; h = nh;
    canvas.width = w; canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
  }

  function draw(t) {
    gl.uniform1f(uTime, t);
    gl.uniform3fv(uCool, cool);
    gl.uniform3fv(uWarm, warm);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  host.appendChild(canvas);
  readColours();
  resize();
  draw(0);

  // the theme toggle rewrites the tokens; re-read rather than re-poll
  if ('MutationObserver' in window) {
    new MutationObserver(function () {
      readColours();
      if (!running) draw(0);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }
  host.classList.add('has-gl');    // only now are the CSS cones redundant

  var lost = false;
  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault(); lost = true; stop();
    host.classList.remove('has-gl');   // hand the stage back to the CSS cones
  });

  if (reduce) {
    window.addEventListener('resize', function () { resize(); draw(0); }, { passive: true });
    return;                        // a still beam, which is the point of the section
  }

  var running = false, raf = 0, t0 = 0, elapsed = 0, dirty = false;
  function loop(now) {
    if (!running) return;
    if (!t0) t0 = now - elapsed * 1000;   // resume where it left off
    elapsed = (now - t0) / 1000;
    if (dirty) { dirty = false; resize(); }
    draw(elapsed);
    raf = requestAnimationFrame(loop);
  }
  function start() {
    if (running || lost) return;          // never spin against a dead context
    running = true; t0 = 0; raf = requestAnimationFrame(loop);
  }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.isIntersecting ? start() : stop(); });
    }, { threshold: 0 }).observe(host);
  } else {
    start();
  }

  window.addEventListener('resize', function () {
    dirty = true;                       // the loop picks it up on the next frame
    if (!running) { resize(); draw(elapsed); }
  }, { passive: true });
})();
