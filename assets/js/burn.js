/* ============================================================
   Owed — the burn
   The film's last stretch burns away like paper to reveal the page under
   it. A noise field decides where the scene has already burned through
   (there the page shows, singed brown near the front), a black char rim
   and a white-hot ember line follow the burn front, sparks lift off it and
   smoke drifts ahead. Drawn on the GPU as a WebGL fragment shader.

   Two modes. In texture mode the shader samples the film itself (a second,
   CORS-enabled copy of the video, kept in step with the scene) and paints
   it wherever the paper has not burned yet, transparent where it has, so
   the real page beneath shows through the holes. If the CDN refuses a
   CORS copy, paper mode paints the page colour into the holes instead
   and leaves the real video visible around them. If WebGL is missing,
   mount() returns null and the caller keeps its CSS crossfade.
   ============================================================ */
(function () {
  'use strict';

  var VERT = [
    'attribute vec2 a_pos;',
    'varying vec2 v_uv;',
    'void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    '#ifdef GL_FRAGMENT_PRECISION_HIGH',
    'precision highp float;',
    '#else',
    'precision mediump float;',
    '#endif',
    'varying vec2 v_uv;',
    'uniform vec2 u_res;',
    'uniform float u_t;',
    'uniform float u_time;',
    'uniform vec3 u_paper;',
    'uniform sampler2D u_tex;',
    'uniform vec2 u_texScale;',   /* object-cover mapping of the video into the canvas */
    'uniform float u_mode;',      /* 1 = texture mode, 0 = paper mode */
    'float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }',
    'float noise(vec2 p) {',
    '  vec2 i = floor(p), f = fract(p);',
    '  f = f * f * (3.0 - 2.0 * f);',
    '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),',
    '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);',
    '}',
    'float fbm4(vec2 p) {',
    '  float v = 0.0, a = 0.5;',
    '  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.0, 9.0); a *= 0.5; }',
    '  return v;',
    '}',
    'float fbm3(vec2 p) {',
    '  float v = 0.0, a = 0.5;',
    '  for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.11 + vec2(5.0, 13.0); a *= 0.5; }',
    '  return v;',
    '}',
    'void main() {',
    '  vec2 uv = v_uv;',
    '  vec2 p = uv * vec2(u_res.x / u_res.y, 1.0);',
    '  /* a broad field shapes the holes, a fine one frays their edges */',
    '  float n = fbm4(p * 2.6);',
    '  float fine = fbm3(p * 12.0 + 3.7);',
    '  /* the fire starts low and climbs, the way a held sheet burns (uv.y is 0 at the bottom) */',
    '  float field = n * 0.56 + fine * 0.14 + uv.y * 0.30;',
    '  float t = u_t * 1.16;',
    '  float d = field - t;',
    '  float edge = 0.038;',
    '  float haze = 0.12;',
    '  /* the fire is uneven along the front and crawls with time */',
    '  float crawl = fbm3(p * 6.0 + vec2(u_time * 0.30, -u_time * 0.18));',
    '  float heat = 0.5 + 0.5 * crawl;',
    '  float flicker = 0.82 + 0.18 * sin(u_time * 12.0 + n * 61.0 + fine * 25.0);',
    '  /* the film where it has not burned */',
    '  vec2 tuv = (uv - 0.5) * u_texScale + 0.5;',
    '  vec3 film = texture2D(u_tex, vec2(tuv.x, 1.0 - tuv.y)).rgb;',
    '  vec3 col = vec3(0.0);',
    '  float alpha = 0.0;',
    '  if (d < 0.0) {',
    '    /* burned through: the page beneath, singed brown towards the front,',
    '       ash flecks at the rim. Paper mode paints the page colour itself. */',
    '    float s = smoothstep(-0.075, 0.0, d);',
    '    vec3 singe = mix(vec3(0.62, 0.47, 0.32), vec3(0.20, 0.13, 0.08), s);',
    '    float fleck = smoothstep(0.82, 0.95, noise(p * 90.0 + 7.0)) * smoothstep(-0.03, 0.0, d);',
    '    if (u_mode > 0.5) {',
    '      col = mix(singe, vec3(0.05, 0.035, 0.025), fleck);',
    '      alpha = max(s * s * 0.82, fleck * 0.9);',
    '    } else {',
    '      float grain = (noise(p * 160.0) - 0.5) * 0.05 * (1.0 - u_t);',
    '      col = mix(u_paper * (1.0 + grain), singe, s * s * 0.85);',
    '      col = mix(col, vec3(0.05, 0.035, 0.025), fleck * 0.9);',
    '      alpha = 1.0;',
    '    }',
    '  } else if (d < edge) {',
    '    float k = d / edge;',
    '    vec3 charred = vec3(0.04, 0.025, 0.02);',
    '    vec3 emberCool = vec3(0.85, 0.18, 0.02);',
    '    vec3 emberHot = vec3(1.0, 0.80, 0.35);',
    '    vec3 ember = mix(emberCool, emberHot, heat * flicker);',
    '    /* black char against the hole, a white-hot thread where the fire is,',
    '       a duller red where it has died down, then the glow thins into the film */',
    '    col = mix(charred, ember, smoothstep(0.14, 0.42, k));',
    '    col += vec3(1.0, 0.9, 0.6) * 0.8 * heat * smoothstep(0.34, 0.42, k) * (1.0 - smoothstep(0.42, 0.56, k));',
    '    float fireA = 1.0 - smoothstep(0.5, 1.0, k) * (0.75 + 0.2 * (1.0 - heat));',
    '    if (u_mode > 0.5) { col = mix(film, col, fireA); alpha = 1.0; } else { alpha = fireA; }',
    '  } else {',
    '    /* the unburned film, with a warm glow next to the fire and drifting smoke */',
    '    float k = clamp((d - edge) / haze, 0.0, 1.0);',
    '    float smoke = fbm3(p * 4.0 + vec2(u_time * 0.12, -u_time * 0.45));',
    '    vec3 glow = vec3(1.0, 0.5, 0.18) * heat;',
    '    vec3 soot = vec3(0.18, 0.14, 0.11);',
    '    vec3 fire = mix(glow, soot, smoothstep(0.0, 0.5, k));',
    '    float fireA = (0.34 * (1.0 - k) * (1.0 - k)) * (0.55 + 0.45 * smoke) * (0.6 + 0.4 * heat);',
    '    /* sparks: tiny bright points lifting off the front */',
    '    vec2 sp = vec2(p.x * 60.0 + crawl * 3.0, p.y * 60.0 - u_time * 6.0 + n * 10.0);',
    '    float spark = smoothstep(0.985, 1.0, noise(sp)) * (1.0 - k) * heat;',
    '    fire += vec3(1.0, 0.85, 0.5) * spark * 3.0;',
    '    fireA = min(1.0, fireA + spark * 2.0);',
    '    if (u_mode > 0.5) { col = mix(film, fire, fireA); alpha = 1.0; } else { col = fire; alpha = fireA; }',
    '  }',
    '  gl_FragColor = vec4(col * alpha, alpha);',
    '}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }

  function parseColor(str) {
    var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(str || '');
    if (!m) return [0.969, 0.965, 0.949];   /* the light paper */
    return [+m[1] / 255, +m[2] / 255, +m[3] / 255];
  }

  /**
   * mount(canvas, videoSrc, onMode)
   * videoSrc: the film's URL; a CORS copy is attempted for texture mode.
   * onMode(mode): called once the mode is known ('texture' | 'paper').
   */
  function mount(canvas, videoSrc, onMode) {
    if (!canvas) return null;
    var gl = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: 'high-performance' })
        || canvas.getContext('experimental-webgl', { alpha: true, premultipliedAlpha: true });
    } catch (e) { gl = null; }
    if (!gl) return null;

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var uRes = gl.getUniformLocation(prog, 'u_res');
    var uT = gl.getUniformLocation(prog, 'u_t');
    var uTime = gl.getUniformLocation(prog, 'u_time');
    var uPaper = gl.getUniformLocation(prog, 'u_paper');
    var uTex = gl.getUniformLocation(prog, 'u_tex');
    var uTexScale = gl.getUniformLocation(prog, 'u_texScale');
    var uMode = gl.getUniformLocation(prog, 'u_mode');

    /* one texture, filled from the CORS video whenever it has a frame */
    var tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([233, 237, 241]));
    gl.uniform1i(uTex, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    var w = 0, h = 0, cleared = false, lost = false;
    var mode = 'paper', texVideo = null, texReady = false, texW = 0, texH = 0;
    function dropCopy() {
      if (!texVideo) return;
      try { texVideo.removeAttribute('src'); texVideo.load(); } catch (e) { /* nothing to release */ }
      if (texVideo.parentNode) texVideo.parentNode.removeChild(texVideo);
      texVideo = null; texReady = false;
    }
    canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); lost = true; dropCopy(); });

    /* the CORS copy of the film for texture mode; the mode is reported on
       every change, so a copy that fails late is never mistaken for a working one */
    function tell(m) { if (mode !== m) { mode = m; if (onMode) onMode(m); } }
    if (videoSrc) {
      texVideo = document.createElement('video');
      texVideo.crossOrigin = 'anonymous';
      texVideo.muted = true;
      texVideo.playsInline = true;
      texVideo.preload = 'metadata';
      texVideo.setAttribute('aria-hidden', 'true');
      texVideo.style.position = 'absolute';
      texVideo.style.width = '1px'; texVideo.style.height = '1px';
      texVideo.style.opacity = '0'; texVideo.style.pointerEvents = 'none';
      texVideo.addEventListener('loadeddata', function () {
        texW = texVideo.videoWidth; texH = texVideo.videoHeight;
        /* prove the copy is readable before promising texture mode */
        try {
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.getError();   /* drain anything stale so only this upload is judged */
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texVideo);
          if (gl.getError() !== gl.NO_ERROR) throw new Error('tainted');
          texReady = true;
          tell('texture');
        } catch (e) { texReady = false; tell('paper'); }
      });
      texVideo.addEventListener('error', function () { texReady = false; tell('paper'); });
      texVideo.src = videoSrc;
      (canvas.parentNode || document.body).appendChild(texVideo);
    } else {
      tell('paper');
    }

    function size() {
      /* the burn is soft by nature, so it is drawn at three quarters of the
         pixel size and scaled up; phones get one device pixel per point at most */
      var small = window.innerWidth < 900;
      var dpr = Math.min(window.devicePixelRatio || 1, small ? 1 : 1.5) * 0.75;
      var cw = Math.max(1, Math.round(canvas.clientWidth * dpr));
      var ch = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (cw !== w || ch !== h) {
        w = cw; h = ch;
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    function paper() {
      return parseColor(getComputedStyle(document.body).backgroundColor);
    }

    /* keep the texture copy on the same frame as the scene */
    function sync(seconds) {
      if (!texVideo || !texReady || !isFinite(seconds)) return;
      if (!texVideo.seeking && Math.abs(texVideo.currentTime - seconds) > 0.02) {
        try { texVideo.currentTime = seconds; } catch (e) { /* not seekable */ }
      }
    }

    /* t: 0 (nothing burned) to 1 (all gone); time in seconds for the fire;
       frameTime: the scene's current video time, so the texture copy matches */
    var doneT = -1;
    function draw(t, time, frameTime) {
      if (lost) return false;
      if (t <= 0) {
        if (!cleared) { size(); gl.clear(gl.COLOR_BUFFER_BIT); cleared = true; }
        doneT = -1;
        return true;
      }
      cleared = false;
      sync(frameTime);
      /* fully burned: one static frame, no work per frame after that */
      if (t >= 1 && doneT >= 1 && w === canvas.width && h === canvas.height) return true;
      doneT = t;
      size();
      var pc = paper();
      var useTex = texReady && texVideo.readyState >= 2;
      if (useTex) {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, texVideo); }
        catch (e) { useTex = false; texReady = false; tell('paper'); }
      }
      /* object-cover: scale the video's uv so it fills the canvas like the <video> does */
      var sx = 1, sy = 1;
      if (useTex && texW && texH) {
        var ca = w / h, va = texW / texH;
        if (ca > va) sy = va / ca; else sx = ca / va;
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uRes, w, h);
      gl.uniform1f(uT, t);
      gl.uniform1f(uTime, time || 0);
      gl.uniform3f(uPaper, pc[0], pc[1], pc[2]);
      gl.uniform2f(uTexScale, sx, sy);
      gl.uniform1f(uMode, useTex ? 1 : 0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return true;
    }

    return {
      draw: draw,
      isLost: function () { return lost; },
      mode: function () { return texReady ? 'texture' : 'paper'; },
      /* fetch the copy in one linear pass once the reader has shown intent */
      warm: function () {
        if (texVideo && texVideo.preload !== 'auto') {
          texVideo.preload = 'auto';
          try { texVideo.load(); } catch (e) { /* keep metadata */ }
        }
      }
    };
  }

  window.OwedBurn = { mount: mount };
})();
