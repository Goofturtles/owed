// Owed — builds the site, already animated, from the .ai parts beside this file.
//
// Run it: After Effects > File > Scripts > Run Script File… > owed-animate.jsx
// Keep this file next to the "ai" folder it came with; it finds the art itself.
//
// What you get:
//   Owed / Landing / <section>      one comp per section, parts rising in
//   Owed / App / <screen>           the tool's screens, the same way
//   Owed / Landing scroll           the whole page, scrolled top to bottom
//   Owed / The four questions       the wizard, one after another
// Every layer is continuously rasterised, so it stays sharp at any scale, and
// every part is its own layer — retime, restagger or throw any of them away.
//
// AE's engine is old JavaScript: no let, no arrow functions, no forEach. Keep
// this file that way if you edit it.

/*__DATA__*/

(function () {
  var here = File($.fileName).parent;
  var AI = new Folder(here.fsName + "/ai");
  if (!AI.exists) {
    alert("Cannot find the art.\n\nKeep owed-animate.jsx in the same folder as the 'ai' folder, then run it again.");
    return;
  }

  var FPS = 30;
  var RISE = 16;          // the page lifts a section 16px as it fades in
  var FADE = 0.5;         // and takes about half a second over it
  var STAGGER = 0.06;     // one part after another, close but readable
  var HOLD = 1.1, TRAVEL = 1.7;   // the scroll's pace, matching the reel

  var made = { comps: 0, layers: 0, missing: [] };
  var cache = {};

  function easeOut(prop, key) {
    try {
      var easeIn = new KeyframeEase(0, 75), easeOutK = new KeyframeEase(0, 25);
      /* Position is spatial: it has ONE speed graph, not one per dimension.
         Handing it two eases throws, and a silent catch would leave every move
         linear without saying so. */
      var spatial = (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL ||
                     prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL);
      var dims = spatial ? 1 : ((prop.value instanceof Array) ? prop.value.length : 1);
      var ins = [], outs = [];
      for (var n = 0; n < dims; n++) { ins[ins.length] = easeIn; outs[outs.length] = easeOutK; }
      prop.setTemporalEaseAtKey(key, ins, outs);
    } catch (e) {}
  }

  function importAI(rel) {
    if (cache[rel]) return cache[rel];
    var f = new File(AI.fsName + "/" + rel);
    if (!f.exists) { made.missing[made.missing.length] = rel; return null; }
    var opts = new ImportOptions(f);
    try {
      if (opts.canImportAs(ImportAsType.FOOTAGE)) opts.importAs = ImportAsType.FOOTAGE;
    } catch (e) {}
    var item = null;
    // one file AE dislikes must not cost the other eight hundred
    try { item = app.project.importFile(opts); }
    catch (e) { made.missing[made.missing.length] = rel + "  (" + e.toString() + ")"; return null; }
    cache[rel] = item;
    return item;
  }

  function folder(name, parent) {
    var f = app.project.items.addFolder(name);
    if (parent) f.parentFolder = parent;
    return f;
  }

  function comp(name, w, h, dur, parent) {
    var c = app.project.items.addComp(name, Math.max(4, Math.round(w)), Math.max(4, Math.round(h)),
                                      1, Math.max(1, dur), FPS);
    c.parentFolder = parent;
    c.bgColor = [1, 1, 1];
    made.comps++;
    return c;
  }

  // one part, sitting where the page puts it, rising into place
  function place(c, item, part, at) {
    var L = c.layers.add(item);
    L.name = part.name;
    L.collapseTransformation = true;          // the sun switch: sharp at any scale
    var x = part.x + part.w / 2, y = part.y + part.h / 2;
    var pos = L.transform.position, op = L.transform.opacity;
    pos.setValueAtTime(at, [x, y + RISE]);
    pos.setValueAtTime(at + FADE, [x, y]);
    easeOut(pos, 2);
    op.setValueAtTime(at, 0);
    op.setValueAtTime(at + FADE, 100);
    easeOut(op, 2);
    made.layers++;
    return L;
  }

  // a layer is born with the comp's duration at that moment; stretching the
  // comp afterwards leaves every layer ending early, and the comp blank after
  function fill(c) {
    for (var j = 1; j <= c.layers.length; j++) {
      try { c.layers[j].outPoint = c.duration; } catch (e) {}
    }
  }

  function buildSection(sec, parent) {
    var span = sec.parts.length ? (sec.parts.length - 1) * STAGGER + FADE + 1.2 : 3;
    var c = comp(sec.name, sec.w, sec.h, span, parent);
    /* Forward, so the page's own painting order survives: each add goes in at
       the top, so the part drawn last on the page ends up the top layer. */
    for (var i = 0; i < sec.parts.length; i++) {
      var item = importAI(sec.parts[i].ai);
      if (item) place(c, item, sec.parts[i], i * STAGGER);
    }
    if (!sec.parts.length) {
      var whole = importAI(sec.ai);
      if (whole) {
        var L = c.layers.add(whole);
        L.collapseTransformation = true;
        L.transform.opacity.setValueAtTime(0, 0);
        L.transform.opacity.setValueAtTime(FADE, 100);
        made.layers++;
      }
    }
    fill(c);
    return c;
  }

  // the marquee does not fade in, it runs
  function runMarquee(c, sec) {
    for (var i = 1; i <= c.layers.length; i++) {
      var L = c.layers[i];
      var w = L.source ? L.source.width : 0;
      if (w < sec.w * 1.5) continue;                  // only the long track
      var p = L.transform.position;
      // the LAST key is where the part settles; the first is 16px above it
      var v = p.numKeys ? p.keyValue(p.numKeys) : p.value;
      while (p.numKeys > 0) p.removeKey(1);
      var op = L.transform.opacity;
      while (op.numKeys > 0) op.removeKey(1);
      op.setValue(100);
      p.setValueAtTime(0, [v[0], v[1]]);
      p.setValueAtTime(8, [v[0] - w / 2, v[1]]);
      try {
        p.setInterpolationTypeAtKey(1, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        p.setInterpolationTypeAtKey(2, KeyframeInterpolationType.LINEAR, KeyframeInterpolationType.LINEAR);
        p.expression = "loopOut('cycle')";
      } catch (e) {}
      c.duration = 12;          // the cycle runs 8s, so the loop has room to show
      fill(c);
      break;
    }
  }

  // the answers open one at a time, over the closed section
  function openAnswers(c) {
    var t = 1.4;
    for (var i = 0; i < DATA.faq.length; i++) {
      var item = importAI(DATA.faq[i].ai);
      if (!item) continue;
      var L = c.layers.add(item);
      L.name = DATA.faq[i].name;
      L.collapseTransformation = true;
      /* These overlays are 55px taller than the closed section, because that is
         how far the section grows when an answer opens. AE would centre the
         layer and lose the alignment, so pin its top-left to the comp's. */
      L.transform.position.setValue([item.width / 2, item.height / 2]);
      var op = L.transform.opacity;
      op.setValueAtTime(t, 0);
      op.setValueAtTime(t + 0.35, 100);
      op.setValueAtTime(t + 1.6, 100);
      op.setValueAtTime(t + 1.95, 0);
      made.layers++;
      t += 2.1;
    }
    if (c.duration < t) c.duration = t + 0.5;
    fill(c);
  }

  app.beginUndoGroup("Build Owed");
  try {
    var root = folder("Owed", null);
    var fLanding = folder("Landing", root);
    var fApp = folder("App", root);
    var fArt = folder("Art", root);

    var i, n, c;
    for (i = 0; i < DATA.landing.length; i++) {
      c = buildSection(DATA.landing[i], fLanding);
      if (DATA.landing[i].name === "05-sources-marquee") runMarquee(c, DATA.landing[i]);
      if (DATA.landing[i].name === "10-questions") openAnswers(c);
    }
    for (i = 0; i < DATA.app.length; i++) buildSection(DATA.app[i], fApp);

    // the whole page, scrolled the way a person reads it
    var boardItem = importAI(DATA.board.ai);
    if (boardItem) {
      var stops = [0], run = 0;
      for (i = 0; i < DATA.board.order.length; i++) {
        for (n = 0; n < DATA.landing.length; n++) {
          if (DATA.landing[n].name === DATA.board.order[i]) {
            run += DATA.landing[n].h;
            // a 73px move given a full 1.7s reads as a stall, not a scroll
            if (run < DATA.board.h - 900 && run - stops[stops.length - 1] > 200) {
              stops[stops.length] = run;
            }
          }
        }
      }
      if (DATA.board.h > 900 && DATA.board.h - 900 - stops[stops.length - 1] > 200) {
        stops[stops.length] = DATA.board.h - 900;
      }
      var dur = stops.length * (HOLD + TRAVEL) + 1;
      var scroll = comp("Landing scroll", 1430, 900, dur, root);
      var S = scroll.layers.add(boardItem);
      S.collapseTransformation = true;
      var sp = S.transform.position, t = 0, cx = DATA.board.w / 2, cy = DATA.board.h / 2;
      for (i = 0; i < stops.length; i++) {
        sp.setValueAtTime(t, [cx, cy - stops[i]]);
        t += HOLD;
        sp.setValueAtTime(t, [cx, cy - stops[i]]);
        if (i < stops.length - 1) {
          easeOut(sp, sp.numKeys);          // leave the stop gently too
          t += TRAVEL;
          sp.setValueAtTime(t, [cx, cy - stops[i + 1]]);
          easeOut(sp, sp.numKeys);
        }
      }
      made.layers++;
    }

    // the four questions, one after another
    var strip = importAI(DATA.strip.ai);
    if (strip) {
      var q = comp("The four questions", 483, 852, 10, root);
      var Q = q.layers.add(strip);
      Q.collapseTransformation = true;
      var qp = Q.transform.position;
      var step = DATA.strip.w / 4 + 40 * 0.25;   // strip.w/4 already holds 3/4 of a gap
      for (i = 0; i < 4; i++) {
        var at = i * 2.4;
        var px = DATA.strip.w / 2 - i * step;
        qp.setValueAtTime(at, [px, DATA.strip.h / 2]);          // arrive
        qp.setValueAtTime(at + 1.8, [px, DATA.strip.h / 2]);    // hold, then travel
        if (qp.numKeys > 2) easeOut(qp, qp.numKeys - 1);
      }
      q.duration = 4 * 2.4 + 0.6;
      fill(q);
      made.layers++;
    }

    for (var key in cache) if (cache[key]) cache[key].parentFolder = fArt;
  } catch (err) {
    alert("Stopped: " + err.toString() + (err.line ? "\nline " + err.line : ""));
  }
  app.endUndoGroup();

  var msg = "Built " + made.comps + " comps and " + made.layers + " layers.\n\n" +
    "Open Owed > Landing scroll to see the page move.";
  if (made.missing.length) {
    msg += "\n\nMissing art (" + made.missing.length + "), starting with:\n" +
      made.missing.slice(0, 6).join("\n");
  }
  alert(msg);
})();
