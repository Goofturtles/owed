/* ============================================================
   Owed — app controller

   Shell: sidebar (>= 900px) or bottom tabs + in-page shelf group
   (< 900px). Views: the wizard (question 1 doubles as the start
   screen), results, the claim script, and — on a phone — Help.
   Every sentence shown comes from the corpus rule or from the fixed
   strings in this file; nothing about rights or odds is invented here.
   ============================================================ */
(function () {
  'use strict';
  // the three-column shell: rail + sidebar labels only from 1200px
  var wideMQ = window.matchMedia ? window.matchMedia('(min-width: 1200px)') : { matches: true, addEventListener: function () {} };
  function isWide() { return !!wideMQ.matches; }
  var panelMode = 'rule';   // what the rail shows: 'rule' or 'script'

  var C = window.OwedCatalog;
  var S = window.OwedStore;
  var E = window.OwedEngine;

  var params = new URLSearchParams(location.search);
  var isDemo = params.get('demo') === '1';

  /* ---------------- boot ---------------- */
  var user = S.getUser();
  if (!user) {
    if (isDemo) {
      user = S.signUp(OwedI18n.t('app.demo.name'), 'demo@owed.local', 'US');
      S.seedDemo();
    } else {
      location.replace('auth.html?mode=signup');
      return;
    }
  } else if (isDemo) {
    S.seedDemo();
  }

  /* ---------------- icons ----------------
     24px, 1.6 stroke, round caps: the same language as the landing tiles. */
  var ICONS = {
    /* where the cover comes from */
    shield: '<path d="M12 3 4.5 6v6c0 4.2 3.1 7.6 7.5 9 4.4-1.4 7.5-4.8 7.5-9V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    card: '<rect x="2.5" y="5.5" width="19" height="13" rx="2.5"/><path d="M2.5 10h19"/><path d="M6.5 14.5h4"/>',
    coins: '<circle cx="12" cy="12" r="8.5"/><path d="M14.5 9.5a2.8 2.8 0 0 0-2.5-1.3c-1.5 0-2.6.8-2.6 2s1 1.7 2.6 2 2.6.8 2.6 2-1.1 2-2.6 2a2.8 2.8 0 0 1-2.5-1.3"/><path d="M12 6.4v11.2"/>',
    wrench: '<path d="M14.7 6.3a4 4 0 0 0 5.2 5.2l-7.4 7.4a2.6 2.6 0 0 1-3.7-3.7Z"/><path d="m5.5 5.5 3 3"/>',
    scales: '<path d="M12 4v16"/><path d="M5 8h14"/><path d="m5 8-2.5 6a3 3 0 0 0 5 0Z"/><path d="m19 8-2.5 6a3 3 0 0 0 5 0Z"/><path d="M8 20h8"/>',
    shop: '<path d="M4 10.5 5.5 5h13l1.5 5.5"/><path d="M4 10.5a2.65 2.65 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.65 2.65 0 0 0 5.3 0"/><path d="M5.5 13v7h13v-7"/><path d="M10 20v-4.5h4V20"/>',
    /* what the thing is */
    headphones: '<path d="M4 14.5V12a8 8 0 0 1 16 0v2.5"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6"/>',
    phone: '<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    tablet: '<rect x="4.5" y="2.5" width="15" height="19" rx="2.5"/><path d="M11 18.5h2"/>',
    laptop: '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M2.5 19h19"/>',
    tv: '<rect x="3" y="4.5" width="18" height="12" rx="2"/><path d="M8 20h8M12 16.5V20"/>',
    console: '<path d="M7 8h10a4.5 4.5 0 0 1 4.5 4.5v1A4.5 4.5 0 0 1 17 18h-1l-2-2h-4l-2 2H7a4.5 4.5 0 0 1-4.5-4.5v-1A4.5 4.5 0 0 1 7 8Z"/><path d="M8 11v4M6 13h4M15.5 12h.01M17.5 14h.01"/>',
    camera: '<path d="M4 8h3l2-2.5h6L17 8h3v11H4Z"/><circle cx="12" cy="13" r="3.2"/>',
    watch: '<rect x="7" y="6" width="10" height="12" rx="3"/><path d="M9.5 6V3h5v3M9.5 18v3h5v-3"/>',
    appliance: '<rect x="4.5" y="3" width="15" height="18" rx="2"/><circle cx="12" cy="13.5" r="4.5"/><path d="M8 6.5h.01M11 6.5h5"/>',
    kettle: '<path d="M5 9h10v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4Z"/><path d="M15 11h2a2.5 2.5 0 0 1 0 5h-2"/><path d="M8 5.5c0-1.4 1-1.4 1-3M11.5 5.5c0-1.4 1-1.4 1-3"/>',
    vacuum: '<path d="M9 20H5a2 2 0 0 1 0-4h4"/><path d="M9 16V8a3 3 0 0 1 6 0v12"/><path d="m15 8 5-5"/>',
    kitchen: '<circle cx="10" cy="13.5" r="6.5"/><path d="M16.5 12 21 8.5"/>',
    tool: '<path d="M14.7 6.3a4 4 0 0 0 5.2 5.2l-7.4 7.4a2.6 2.6 0 0 1-3.7-3.7Z"/><path d="m5.5 5.5 3 3"/>',
    furniture: '<path d="M6 12V5h12v7"/><path d="M4 12h16v4.5H4Z"/><path d="M6 16.5V20M18 16.5V20"/>',
    mattress: '<rect x="3" y="9" width="18" height="8" rx="2"/><path d="M3 13h18M6 17v2.5M18 17v2.5"/>',
    footwear: '<path d="M4 17.5h16a1 1 0 0 0 1-1v-1.2a2 2 0 0 0-1.4-1.9l-4.6-1.6-2.4-4.3H5a1 1 0 0 0-1 1Z"/><path d="M4 14h5.5"/>',
    apparel: '<path d="M8 3 4 6l2 3 2-1v13h8V8l2 1 2-3-4-3a4 4 0 0 1-8 0Z"/>',
    bag: '<rect x="4" y="8" width="16" height="13" rx="2.5"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    bike: '<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="m6 16 4-8h5l3 8M8 8h2M15 8l-2.5 8H6"/>',
    outdoor: '<path d="M12 3 2.5 20h19Z"/><path d="M12 12v8"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 17v4h10v-4"/>',
    toy: '<circle cx="12" cy="13" r="6.5"/><circle cx="7" cy="7" r="2.5"/><circle cx="17" cy="7" r="2.5"/><path d="M10 12h.01M14 12h.01M10 15.5a2.5 2.5 0 0 0 4 0"/>',
    box: '<path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5Z"/><path d="M3 7.5 12 12l9-4.5M12 12v9"/>',
    /* interface */
    chevron: '<path d="m6 9 6 6 6-6"/>',
    next: '<path d="m9.5 6 6 6-6 6"/>',
    back: '<path d="m14.5 6-6 6 6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    x: '<path d="m7 7 10 10M17 7 7 17"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    who: '<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    phoneCall: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    doc: '<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
    out: '<path d="M14 4h6v6"/><path d="M20 4 11 13"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>'
  };

  function ico(name, size) {
    var s = size || 24;
    return '<svg viewBox="0 0 24 24" width="' + s + '" height="' + s + '" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      (ICONS[name] || ICONS.box) + '</svg>';
  }

  var CAT_ICON = {
    phone: 'phone', laptop: 'laptop', tablet: 'tablet', headphones: 'headphones', tv: 'tv',
    console: 'console', camera: 'camera', watch: 'watch', 'appliance-large': 'appliance',
    'appliance-small': 'kettle', vacuum: 'vacuum', kitchen: 'kitchen', 'power-tool': 'tool',
    furniture: 'furniture', mattress: 'mattress', footwear: 'footwear', apparel: 'apparel',
    bag: 'bag', bike: 'bike', outdoor: 'outdoor', printer: 'printer', toy: 'toy', other: 'box'
  };
  function catIcon(id) { return ico(CAT_ICON[id] || 'box'); }

  var SRC_ICON = { manufacturer: 'shield', card: 'card', settlement: 'coins', program: 'wrench', statutory: 'scales', retailer: 'shop' };

  /* who you ask, by where the rule comes from — fixed words, one per source
     type; a settlement has no fixed "who", so that card carries no Ask cell */
  var ASK_WHO = { manufacturer: 'the maker', card: 'your card', retailer: 'the shop', statutory: 'the state or country', program: 'the programme' };

  /* the three strength labels (see LIMITATIONS.md §8), each with the one
     plain sentence that explains it. The keys are the engine's values and
     stay English; only the words shown come from the dictionary. */
  var STRENGTH = {
    'strong':       { cls: 'strong',   tag: 'tag-strong', dot: 'dot-strong', word: OwedI18n.t('app.strength.strong.word'),   plural: OwedI18n.t('app.strength.strong.plural'),   key: OwedI18n.t('app.strength.strong.key') },
    'worth asking': { cls: 'worth',    tag: 'tag-maybe',  dot: 'dot-worth',  word: OwedI18n.t('app.strength.worth.word'),    plural: OwedI18n.t('app.strength.worth.plural'),    key: OwedI18n.t('app.strength.worth.key') },
    'long shot':    { cls: 'longshot', tag: 'tag-long',   dot: 'dot-long',   word: OwedI18n.t('app.strength.longshot.word'), plural: OwedI18n.t('app.strength.longshot.plural'), key: OwedI18n.t('app.strength.longshot.key') }
  };
  var GLYPH = {
    strong: '<svg class="tag-g" viewBox="0 0 24 24" aria-hidden="true"><circle class="g-fill" cx="12" cy="12" r="10"/><path class="g-check" d="m7.5 12.5 3 3 6-6.5" fill="none" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    worth: '<svg class="tag-g" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path class="g-fill" d="M12 3a9 9 0 0 1 0 18Z"/></svg>',
    longshot: '<svg class="tag-g" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>'
  };
  function pill(strength) {
    var s = STRENGTH[strength] || STRENGTH['long shot'];
    return '<span class="tag ' + s.tag + '">' + GLYPH[s.cls] + esc(s.word) + '</span>';
  }

  /* ---------------- elements ---------------- */
  var el = {
    regionPick: document.getElementById('regionPick'),
    signOut: document.getElementById('signOutBtn'),
    side: document.getElementById('side'),
    shelfList: document.getElementById('shelfList'),
    shelfEmpty: document.getElementById('shelfEmpty'),
    shelfMore: document.getElementById('shelfMore'),
    shelfToggle: document.getElementById('shelfToggle'),
    shelfBody: document.getElementById('shelfBody'),
    statItems: document.getElementById('statItems'),
    addBtn: document.getElementById('addBtn'),
    corpusNote: document.getElementById('corpusNote'),
    themeRow: document.getElementById('themeRow'),
    helpTitle: document.getElementById('helpTitle'),
    startRow: document.getElementById('startRow'),
    regionName: document.getElementById('regionName'),
    toast: document.getElementById('toast'),
    tabs: document.querySelectorAll('.tabbar .tab'),
    views: {
      wizard: document.getElementById('viewWizard'),
      results: document.getElementById('viewResults'),
      script: document.getElementById('viewScript')
    }
  };

  /* the select carries region|province: a province or state narrows the law to
     what applies there (an Ontario reader no longer sees Quebec's rules) */
  // first run: work out the country (and the province or state where the clock
  // says which) instead of starting everyone in the United States
  if (!user.regionSet) {
    var where = S.guessWhere();
    var patch = { regionSet: true };
    if (!user.region || user.region === 'US') patch.region = where.region;
    if (!user.subregion && where.subregion) patch.subregion = where.subregion;
    S.updateUser(patch);
    user = S.getUser();
  }
  el.regionPick.value = (user.region || 'US') + (user.subregion ? '|' + user.subregion : '');
  if (el.regionPick.selectedIndex < 0) el.regionPick.value = user.region || 'US';

  /* the select sits invisibly over the region pill; the pill shows its label */
  function syncRegionName() {
    var o = el.regionPick.options[el.regionPick.selectedIndex];
    var g = o && o.parentElement && o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : '';
    if (el.regionName) el.regionName.textContent = o ? (g && o.value.indexOf('|') > 0 ? OwedI18n.t('app.region.placeInCountry', { place: o.text, country: g }) : o.text) : '';
  }
  syncRegionName();

  el.regionPick.addEventListener('change', function () {
    var parts = el.regionPick.value.split('|');
    S.updateUser({ region: parts[0], subregion: parts[1] || '' });
    user = S.getUser();
    syncRegionName();
    toast(OwedI18n.t('app.region.set', { place: el.regionPick.options[el.regionPick.selectedIndex].text }));
    // the select the user is standing on must not lose focus; the results (and
    // an open script) are redrawn in place, never a wizard mid-edit
    if (current.item && (!el.views.results.hidden || !el.views.script.hidden)) redrawResults();
    else renderShelf();
  });

  var back2 = document.getElementById('wizBack2');
  if (back2) back2.addEventListener('click', function () { wizEls.back.click(); });

  /* ---------- Ask anything: a free, keyless AI helper (Pollinations, OpenAI-style
     endpoint), grounded with the reader's current item and its top rules ---------- */
  (function askAnything() {
    var panel = document.getElementById('askPanel'), row = document.getElementById('askRow');
    var log = document.getElementById('askLog'), form = document.getElementById('askForm'), input = document.getElementById('askInput');
    if (!panel || !row || !form) return;
    var history = [];
    function open() { panel.hidden = false; row.setAttribute('aria-expanded', 'true'); input.focus(); }
    function close() { panel.hidden = true; row.setAttribute('aria-expanded', 'false'); row.focus(); }
    row.addEventListener('click', function () { panel.hidden ? open() : close(); });
    document.getElementById('askClose').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !panel.hidden) close(); });
    // three openers, so the panel is never an empty box
    (function seeds() {
      var wrap = document.createElement('div'); wrap.className = 'ask-seeds';
      // each seed is submitted as the question, so it must hit its own short answer below
      ['app.ask.seed.receipt', 'app.ask.seed.script', 'app.ask.seed.howLong'].forEach(function (key) {
        var q = OwedI18n.t(key);
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'ask-seed'; b.textContent = q;
        b.addEventListener('click', function () { input.value = q; form.requestSubmit(); wrap.remove(); });
        wrap.appendChild(b);
      });
      log.appendChild(wrap);
    })();

    /* move the panel: drag its head anywhere, hold Shift to snap it to the
       nearest corner. Where you leave it is remembered. */
    (function draggable() {
      var head = panel.querySelector('.ask-head'), KEY = 'owed:askpos', MARGIN = 20;
      if (!head || !window.matchMedia('(min-width: 769px)').matches) return;
      function place(x, y) {
        var w = panel.offsetWidth, h = panel.offsetHeight;
        x = Math.min(innerWidth - w - 8, Math.max(8, x));
        y = Math.min(innerHeight - h - 8, Math.max(8, y));
        panel.style.left = x + 'px'; panel.style.top = y + 'px';
        panel.style.right = 'auto'; panel.style.bottom = 'auto';
        return { x: x, y: y };
      }
      try {
        var saved = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (saved) requestAnimationFrame(function () { place(saved.x, saved.y); });
      } catch (e) {}
      var sx = 0, sy = 0, ox = 0, oy = 0, on = false;
      head.addEventListener('pointerdown', function (e) {
        if (e.target.closest('button:not(.ask-grip)')) return;   // the close button still closes
        var r = panel.getBoundingClientRect();
        sx = e.clientX; sy = e.clientY; ox = r.left; oy = r.top; on = true;
        panel.classList.add('is-dragging'); panel.classList.remove('is-snapping');
        try { head.setPointerCapture(e.pointerId); } catch (err) {}
        e.preventDefault();
      });
      head.addEventListener('pointermove', function (e) {
        if (!on) return;
        place(ox + (e.clientX - sx), oy + (e.clientY - sy));
      });
      function drop(e) {
        if (!on) return;
        on = false; panel.classList.remove('is-dragging');
        var r = panel.getBoundingClientRect(), pos = { x: r.left, y: r.top };
        if (e && e.shiftKey) {
          // Shift: snap to whichever corner the panel is nearest
          var w = panel.offsetWidth, h = panel.offsetHeight;
          var left = (r.left + r.width / 2) < innerWidth / 2;
          var top = (r.top + r.height / 2) < innerHeight / 2;
          panel.classList.add('is-snapping');
          pos = place(left ? MARGIN : innerWidth - w - MARGIN, top ? MARGIN : innerHeight - h - MARGIN);
          setTimeout(function () { panel.classList.remove('is-snapping'); }, 220);
        }
        try { localStorage.setItem(KEY, JSON.stringify(pos)); } catch (err) {}
      }
      head.addEventListener('pointerup', drop);
      head.addEventListener('pointercancel', function () { on = false; panel.classList.remove('is-dragging'); });
      window.addEventListener('resize', function () {
        if (panel.hidden || !panel.style.left) return;
        place(parseFloat(panel.style.left), parseFloat(panel.style.top));
      });
    })();

    function add(kind, text) {
      var p = document.createElement('p'); p.className = 'ask-msg ' + kind; p.textContent = text;
      log.appendChild(p); log.scrollTop = log.scrollHeight; return p;
    }
    function grounding() {
      var lines = ['You are the helper inside Owed, a free tool that finds who owes someone a free repair (maker warranties, card benefits, repair programmes, consumer law) and writes the words to say. Answer in plain, short sentences for an older reader. Never invent a rule, a deadline or a phone number; if unsure, say what to check. Say it is information, not legal advice, only if asked about legal weight.'];
      var it = current.item;
      if (it) {
        lines.push('The reader is looking at: ' + (it.name || '') + ' (' + (it.brand || 'brand unknown') + ', ' + (C.categoryLabel(it.category, 'en') || '') + ', ' + (E.agePhrase(it.ageMonths, 'en') || 'age unknown') + ', region ' + (it.region || 'US') + ').');
        var top = (current.matches || []).filter(function (m) { return !isLongShot(m); }).slice(0, 6);
        if (top.length) lines.push('Rules Owed found for it: ' + top.map(function (m) { return m.rule.title + ' (' + m.strength + '; ' + firstClause(m.rule.window_note, 10, m.rule._lang) + ')'; }).join(' | '));
      }
      // the prompt stays English (the model is most reliable in English); the answer is in the reader's language
      if (LANG !== 'en') lines.push('Reply in ' + ({ fr: 'French', es: 'Spanish' })[LANG] + '.');
      return lines.join('\n');
    }
    var session = null;
    function onDevice(q) {
      var LM = window.LanguageModel || (window.ai && window.ai.languageModel);
      if (!LM) return Promise.reject(new Error('no model'));
      var ready = session ? Promise.resolve(session) : Promise.resolve(LM.availability ? LM.availability() : 'available').then(function (a) {
        if (a === 'unavailable' || a === 'no') throw new Error('unavailable');
        return LM.create({ initialPrompts: [{ role: 'system', content: grounding() }] });
      }).then(function (s) { session = s; return s; });
      return ready.then(function (s) { return s.prompt(q); }).then(function (t) { t = String(t || '').trim(); if (!t) throw new Error('empty'); return t; });
    }
    // no model: the rulebook answers with what it has — the rules found for the item, then Owed's own short answers
    /* i18n-data: which short answer a question gets; tried in this order, the first hit wins.
       en: the original patterns, tested on the question exactly as typed.
       fr / es: whole words or phrases, lowercase and without accents, tested on the
       question lowercased with its accents removed. A French or Spanish page tries its
       own words first, then the English words, also as whole words (so "pays" is not "pay").
       Each seed question (app.ask.seed.*) must hit its own answer in its own language. */
    var CANNED = [
      { answer: 'app.ask.answer.receipt',
        en: /receipt|proof|statement|invoice/i,
        fr: 'recu|recus|ticket|tickets|facture|factures|preuve|preuves|releve|releves',
        es: 'recibo|recibos|ticket|tickets|factura|facturas|comprobante|comprobantes|prueba|pruebas|estado de cuenta' },
      { answer: 'app.ask.answer.legal',
        en: /legal|lawyer|court|sue|advice/i,
        fr: 'legal|legale|legaux|legales|juridique|juridiques|avocat|avocate|avocats|tribunal|tribunaux|proces|poursuivre|conseil|conseils',
        es: 'legal|legales|juridico|juridica|abogado|abogada|abogados|tribunal|tribunales|juicio|demandar|consejo|consejos|asesoria' },
      { answer: 'app.ask.answer.data',
        en: /data|privacy|store|server|account/i,
        fr: 'donnee|donnees|confidentialite|vie privee|stocke|stockee|stockes|stockees|stocker|stockage|serveur|serveurs|mon compte|votre compte|ton compte|un compte|le compte',
        es: 'dato|datos|privacidad|guarda|guardan|guardado|guardados|almacena|almacenan|almacenamiento|servidor|servidores|mi cuenta|tu cuenta|su cuenta|una cuenta|la cuenta' },
      { answer: 'app.ask.answer.free',
        en: /free|cost|pay|price/i,
        fr: 'gratuit|gratuite|gratuits|gratuites|gratuitement|cout|couts|coute|coutent|prix|payer|payant|payante|paie|paye|paiement|tarif|tarifs|frais',
        es: 'gratis|gratuito|gratuita|cuesta|cuestan|costo|coste|precio|precios|pagar|pago|pagos|tarifa|tarifas|cobran' },
      { answer: 'app.ask.answer.howLong',
        en: /how long|deadline|window|expire|late/i,
        fr: 'combien de temps|delai|delais|date limite|echeance|expire|expiree|expires|expirer|trop tard|en retard',
        es: 'cuanto tiempo|plazo|plazos|fecha limite|vence|vencen|vencimiento|caduca|caducan|expira|expiran|demasiado tarde|muy tarde|es tarde' },
      { answer: 'app.ask.answer.script',
        en: /script|say|call|phone|email/i,
        fr: 'script|dire|dis|appeler|appelle|appel|telephone|courriel|email|mail',
        es: 'guion|script|decir|digo|diga|llamar|llamo|llamada|telefono|correo|email|mail' }
    ];
    var LANG = OwedI18n.lang;
    // lowercase, accents off: "Reçu" and "recu" are the same word
    function fold(s) { return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    // built at run time, and only on a French or Spanish page, so an older browser still parses this file
    function wholeWords(source) {
      return new RegExp('(^|[^\\p{L}\\p{N}])(?:' + source.replace(/ /g, '\\s+') + ')(?=[^\\p{L}\\p{N}]|$)', 'u');
    }
    function cannedAnswer(q) {
      var c;
      if (LANG === 'en') {
        for (c = 0; c < CANNED.length; c++) { if (CANNED[c].en.test(q)) return CANNED[c].answer; }
        return '';
      }
      var f = fold(q);
      for (c = 0; c < CANNED.length; c++) { if (CANNED[c][LANG] && wholeWords(fold(CANNED[c][LANG])).test(f)) return CANNED[c].answer; }
      for (c = 0; c < CANNED.length; c++) { if (wholeWords(CANNED[c].en.source).test(f)) return CANNED[c].answer; }
      return '';
    }
    function localAnswer(q) {
      var out = [];
      var top = (current.matches || []).filter(function (m) { return !isLongShot(m); });
      var words, hits;
      if (LANG === 'en') {
        words = q.toLowerCase().split(/[^a-z0-9]+/).filter(function (w) { return w.length > 3; });
        hits = top.filter(function (m) { var t = (m.rule.title + ' ' + (m.rule.what_you_get || '') + ' ' + (m.rule.how_to_claim || '')).toLowerCase(); return words.some(function (w) { return t.indexOf(w) >= 0; }); }).slice(0, 2);
      } else {
        // letters of any alphabet, accents folded on both sides; a word counts from the start of a rule's word, so "para" is not in "separate"
        var split = new RegExp('[^\\p{L}\\p{N}]+', 'u');
        words = fold(q).split(split).filter(function (w) { return w.length > 3; });
        hits = top.filter(function (m) {
          var ruleWords = fold(m.rule.title + ' ' + (m.rule.what_you_get || '') + ' ' + (m.rule.how_to_claim || '')).split(split);
          return words.some(function (w) { return ruleWords.some(function (rw) { return rw.indexOf(w) === 0; }); });
        }).slice(0, 2);
      }
      hits.forEach(function (m) { out.push(OwedI18n.t('app.ask.ruleLine', { title: m.rule.title, clause: firstClause(m.rule.what_you_get || m.rule.window_note, 22, m.rule._lang) })); });
      var answer = cannedAnswer(q);
      if (answer) out.push(OwedI18n.t(answer));
      if (!out.length) out.push(top.length ? OwedI18n.t('app.ask.bestLead', { title: top[0].rule.title }) : OwedI18n.t('app.ask.noItem'));
      return out.join('\n\n');
    }
    function answer(q) {
      return onDevice(q).catch(function () { return localAnswer(q); });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = input.value.trim(); if (!q) return;
      input.value = '';
      add('me', q); history.push({ role: 'user', content: q });
      var wait = add('bot wait', OwedI18n.t('app.ask.thinking'));
      answer(q).then(function (text) {
        wait.className = 'ask-msg bot'; wait.textContent = text;
        history.push({ role: 'assistant', content: text });
        log.scrollTop = log.scrollHeight;
      });
    });
  })();

  /* ---------- Help opens in a dialog instead of leaving the app ---------- */
  (function helpDialog() {
    var dlg = document.getElementById('helpDialog');
    if (!dlg || typeof dlg.showModal !== 'function') return;
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href="index.html#faq"]');
      if (!a || dlg.contains(a)) return;
      e.preventDefault(); dlg.showModal();
    });
    document.getElementById('helpClose').addEventListener('click', function () { dlg.close(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
  })();

  /* ---------- the rail is resizable: drag its left edge, double-click to reset ---------- */
  (function railResize() {
    var rail = document.getElementById('rail'), app = document.querySelector('.app');
    if (!rail || !app) return;
    var KEY = 'owed:railw', MIN = 300, MAX = 680;
    var saved = 0; try { saved = parseInt(localStorage.getItem(KEY) || '0', 10); } catch (e) {}
    // the panel opens at its widest; the handle can only bring it in from there
    app.style.setProperty('--rail-w', (saved >= MIN && saved <= MAX ? saved : MAX) + 'px');
    var h = document.createElement('button');
    h.type = 'button'; h.className = 'rail-resize'; h.setAttribute('aria-label', OwedI18n.t('app.rail.resizeLabel')); h.title = OwedI18n.t('app.rail.resizeTitle');
    rail.insertBefore(h, rail.firstChild);
    var startX = 0, startW = 0;
    function width() { return rail.getBoundingClientRect().width; }
    h.addEventListener('pointerdown', function (e) {
      startX = e.clientX; startW = width();
      try { h.setPointerCapture(e.pointerId); } catch (err) {}
      h.classList.add('is-dragging'); app.classList.add('is-resizing');
    });
    h.addEventListener('pointermove', function (e) {
      if (!h.classList.contains('is-dragging')) return;
      var w = Math.min(MAX, Math.max(MIN, startW + (startX - e.clientX)));
      app.style.setProperty('--rail-w', w + 'px');
    });
    function end() {
      if (!h.classList.contains('is-dragging')) return;
      h.classList.remove('is-dragging'); app.classList.remove('is-resizing');
      try { localStorage.setItem(KEY, String(Math.round(width()))); } catch (e) {}
    }
    h.addEventListener('pointerup', end); h.addEventListener('pointercancel', end);
    h.addEventListener('dblclick', function () { app.style.setProperty('--rail-w', MAX + 'px'); try { localStorage.removeItem(KEY); } catch (e) {} });
    // keyboard: arrows nudge the width
    h.addEventListener('keydown', function (e) {
      var d = e.key === 'ArrowLeft' ? 24 : e.key === 'ArrowRight' ? -24 : 0; if (!d) return;
      e.preventDefault(); var w = Math.min(MAX, Math.max(MIN, width() + d)); app.style.setProperty('--rail-w', w + 'px');
      try { localStorage.setItem(KEY, String(w)); } catch (x) {}
    });
  })();

  /* ---------- rename a saved thing in place ---------- */
  var renameBtn = document.getElementById('resRename');
  if (renameBtn) renameBtn.addEventListener('click', function () {
    var item = current.item; if (!item) return;
    var title = document.getElementById('resTitle');
    if (title.querySelector('input')) return;
    var old = item.name || '';
    var input = document.createElement('input');
    input.type = 'text'; input.value = old; input.className = 'res-rename-input'; input.setAttribute('aria-label', OwedI18n.t('app.rename.label'));
    title.textContent = ''; title.appendChild(input); input.focus(); input.select();
    var done = false;
    function finish(save) {
      if (done) return; done = true;
      var name = input.value.trim();
      if (save && name && name !== old) {
        S.updateItem(item.id, { name: name, autoName: name === itemLabel(item) });
        renderShelf();
        showResults(S.getItem(item.id) || item, true);
        toast(OwedI18n.t('app.rename.done'));
      } else {
        title.textContent = old;
      }
    }
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); finish(true); } if (e.key === 'Escape') finish(false); });
    input.addEventListener('blur', function () { finish(true); });
  });

  el.signOut.addEventListener('click', function () {
    // the list lives only in this browser; on a shared computer it must not
    // pass to the next person who signs up here
    var clear = window.confirm(OwedI18n.t('app.signOut.confirm'));
    S.signOut({ clear: clear });
    location.href = 'index.html';
  });

  /* the theme row: theme.js owns the 44px button; a click on the label
     beside it is forwarded so the whole row acts as one control */
  el.themeRow.addEventListener('click', function (e) {
    var btn = el.themeRow.querySelector('.theme-btn');
    // theme.js re-renders the button's icon on click, so by the time the
    // event reaches this row e.target (the old svg) is detached and
    // closest() finds nothing — the path recorded at dispatch is reliable
    if (!btn || e.composedPath().indexOf(btn) !== -1) return;
    btn.click();
  });

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* a counted phrase from a plural entry ({ one, other }) that writes its number
     as {count}. English keeps its plain digits ("1263 days left"), as it always
     has; another language writes the number its own way. asHtml: into markup. */
  function counted(key, n, asHtml) {
    return OwedI18n.plural(key, n, { count: OwedI18n.lang === 'en' ? String(n) : OwedI18n.num(n) }, asHtml);
  }

  /* English has always written these dates in the browser's own format;
     another language writes them the page's way */
  function localDate(d, opts) {
    return OwedI18n.lang === 'en' ? d.toLocaleDateString(undefined, opts) : OwedI18n.date(d, opts);
  }

  var toastTimer = null, toastClear;
  function toast(msg) {
    // the node stays in the accessibility tree at all times — writing into a
    // `hidden` live region is never announced
    el.toast.hidden = false;
    el.toast.textContent = msg;
    requestAnimationFrame(function () { el.toast.classList.add('show'); });
    clearTimeout(toastTimer); clearTimeout(toastClear);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove('show');
      // tracked, or a toast fired during the fade has its text wiped
      toastClear = setTimeout(function () { el.toast.textContent = ''; }, 400);
    }, 2400);
  }

  /* panel views; 'help' matches none, which is how the Help tab clears the panel */
  function show(name) {
    Object.keys(el.views).forEach(function (k) {
      el.views[k].hidden = (k !== name);
    });
    // the rail's "Selected" card only makes sense beside an open document
    if (name !== 'script') { hidePanel(); detail.body.innerHTML = ''; }
    // the shelf's "Start" row is lit while a question screen is showing
    if (el.startRow) {
      el.startRow.classList.toggle('is-on', name === 'wizard');
      if (name === 'wizard') el.startRow.setAttribute('aria-current', 'true');
      else el.startRow.removeAttribute('aria-current');
    }
  }

  if (el.startRow) el.startRow.addEventListener('click', function () { showStart(); });

  var mobileMQ = window.matchMedia('(max-width: 899.98px)');
  function isMobile() { return mobileMQ.matches; }

  /* the rail (>= 1200px): a compact "Selected" card while a document is open */
  var detail = {
    panel: document.getElementById('detailPanel'),
    body: document.getElementById('detailBody')
  };
  var selected = null;     // the match whose document is open

  function hidePanel() {
    detail.panel.hidden = true;
  }

  /* the bottom tabs only exist below 900px, but the attribute is kept in
     sync always so a resize lands on the right screen */
  function setTab(name) {
    document.body.setAttribute('data-tab', name);
    Array.prototype.forEach.call(el.tabs, function (t) {
      var on = t.dataset.tab === name;
      t.classList.toggle('is-on', on);
      if (on) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current');
    });
  }

  /* Re-rendering replaces the button the user was standing on, so focus has
     to be placed deliberately or it falls back to <body>. Not during boot:
     the first Tab on a fresh page should still reach the skip link. */
  var booting = true;
  function focusView(name) {
    if (booting) return;
    var target = ({
      results: document.getElementById('resTitle'),
      wizard: document.querySelector('.wiz-step.is-on .wiz-q'),
      script: document.getElementById('detailTitle'),
      help: el.helpTitle
    })[name];
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  var current = { item: null, matches: [] };
  var corpusFailed = false;

  function itemLabel(item) {
    var parts = [item.brand, C.categoryLabel(item.category)].filter(Boolean);
    // brand and kind are one template, so a language can put the noun first
    return parts.length === 2 ? OwedI18n.t('app.item.brandCategory', { brand: parts[0], category: parts[1] }) : parts.join(' ');
  }

  function withRegion(item) {
    var copy = {};
    Object.keys(item).forEach(function (k) { copy[k] = item[k]; });
    copy.region = user.region || item.region || 'US';
    copy.subregion = user.subregion || '';
    return copy;
  }

  /* one count object for the shelf row, the summary strip and the chips —
     long shots are counted apart so they never inflate "to ask" */
  function summarise(matches) {
    var n = { strong: 0, worth: 0, long: 0 };
    matches.forEach(function (m) {
      if (m.strength === 'strong') n.strong++;
      else if (m.strength === 'worth asking') n.worth++;
      else n.long++;
    });
    n.ask = n.strong + n.worth;
    n.total = matches.length;
    return n;
  }

  /* ---------------- shelf ---------------- */
  var SHELF_VISIBLE = 6;
  var shelfExpanded = false;

  function statusHTML(n) {
    // before the rulebook is in, say nothing rather than a misleading "nothing yet"
    if (!E.loaded) return '<span class="srow-status"></span>';
    if (!n.total) return '<span class="srow-status"></span>';
    // one dot and a number; the word is there for screen readers and the tooltip
    var dot, count, title, word;
    if (n.ask) {
      dot = n.strong ? 'dot-strong' : 'dot-worth';
      count = n.ask;
      title = counted('app.shelf.status.ask', count, false);
      word = counted('app.shelf.status.askAfterNumber', count, true);
    } else {
      dot = 'dot-long';
      count = n.long;
      title = counted('app.shelf.status.long', count, false);
      word = counted('app.shelf.status.longAfterNumber', count, true);
    }
    return '<span class="srow-status" title="' + esc(title) + '"><i class="dot ' + dot + '"></i>' +
      '<span class="tnum">' + count + '</span><span class="sr-only">' + word + '</span></span>';
  }

  /* the rail's summary: what the shelf adds up to, from the same matches the
     rows use — nothing invented, and it hides until the rulebook has loaded */
  function renderRailSummary(shelf) {
    var box = document.getElementById('railSummary');
    if (!box) return;
    if (!E.loaded || !shelf.length) { box.hidden = true; return; }
    var strong = 0, dated = 0, soonest = null;
    shelf.forEach(function (item) {
      E.match(withRegion(item)).forEach(function (m) {
        if (m.strength === 'strong') strong++;
        if (m.rule.deadline) {
          dated++;
          if (!soonest || m.rule.deadline < soonest.rule.deadline) soonest = { rule: m.rule, item: item };
        }
      });
    });
    document.getElementById('railThings').textContent = shelf.length;
    document.getElementById('railStrong').textContent = strong;
    document.getElementById('railSoon').textContent = dated;
    var next = document.getElementById('railNext');
    next.textContent = soonest
      ? OwedI18n.t('app.rail.soonest', { date: fmtDate(soonest.rule.deadline), name: soonest.item.name || itemLabel(soonest.item) })
      : OwedI18n.t('app.rail.noDeadline');
    box.hidden = false;
  }

  /* Printing a claim. The script sits in the rail on a wide screen and in the
     script view on a narrow one, and both are inside scrolling, clipped boxes,
     so nothing useful survives being printed in place. A copy is laid out on a
     sheet of its own instead, and everything else is hidden for the moment.
     The sheet is built on beforeprint, so Ctrl+P prints the claim too. */
  var printTimer = 0;

  function buildPrintSheet() {
    if (document.getElementById('printSheet')) return true;   // already up
    // whichever container is actually on screen; both can hold a card at once
    var host = (panelMode === 'script' && detail.panel && !detail.panel.hidden) ? detail.body : scrBody;
    var card = (host && host.querySelector('.scr-card')) || document.querySelector('.scr-card');
    var body = card && card.querySelector('.doc-body');
    if (!body) return false;

    var item = current.item || {};
    var facts = [C.categoryLabel(item.category), item.brand, E.agePhrase(item.ageMonths),
      item.serial ? OwedI18n.t('app.print.serial', { serial: item.serial }) : ''].filter(Boolean).join(' · ');

    var sheet = document.createElement('div');
    sheet.id = 'printSheet';
    sheet.innerHTML =
      '<h1>' + esc(item.name || itemLabel(item) || OwedI18n.t('app.print.untitled')) + '</h1>' +
      (facts ? '<p class="ps-facts">' + esc(facts) + '</p>' : '');

    var copy = body.cloneNode(true);
    var help = copy.querySelector('.scr-help');
    if (help) help.parentNode.removeChild(help);
    // the original ids stay on the live card; two of anything breaks getElementById
    copy.removeAttribute('id');
    var withIds = copy.querySelectorAll('[id]'), n;
    for (n = 0; n < withIds.length; n++) withIds[n].removeAttribute('id');
    sheet.appendChild(copy);

    var note = document.createElement('p');
    note.className = 'ps-note';
    note.textContent = OwedI18n.t('app.print.note', { date: localDate(new Date(),
      { day: 'numeric', month: 'long', year: 'numeric' }) });
    sheet.appendChild(note);

    document.body.appendChild(sheet);
    document.body.classList.add('is-printing');
    return true;
  }

  function clearPrintSheet() {
    if (printTimer) { clearTimeout(printTimer); printTimer = 0; }
    var sheet = document.getElementById('printSheet');
    if (sheet) sheet.parentNode.removeChild(sheet);
    document.body.classList.remove('is-printing');
  }

  window.addEventListener('beforeprint', buildPrintSheet);
  window.addEventListener('afterprint', clearPrintSheet);

  function printClaim() {
    if (!buildPrintSheet()) { toast(OwedI18n.t('app.print.noScript')); return; }
    window.print();
    // afterprint does not fire everywhere. The sheet is invisible on screen, so
    // clearing late costs nothing while clearing early prints a blank page.
    if (printTimer) clearTimeout(printTimer);
    printTimer = setTimeout(clearPrintSheet, 60000);
  }

  /* ---------- the sidebar's middle four ----------
     Everything here is read from the shelf and the rulebook: no new claims,
     no new numbers. A block with nothing to show hides itself. */
  var CLAIM_WORD = { asked: OwedI18n.t('app.side.claim.asked'), waiting: OwedI18n.t('app.side.claim.waiting'), won: OwedI18n.t('app.side.claim.won'), refused: OwedI18n.t('app.side.claim.refused') };

  function daysUntil(iso) {
    var d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return null;
    return Math.round((d - new Date(new Date().toDateString())) / 86400000);
  }

  // labelLang: the language the label is written in, when it can differ from the page (a rule's title)
  function sxRow(label, sub, onClick, cls, labelLang) {
    var li = document.createElement('li');
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'sx-row' + (cls ? ' ' + cls : '');
    var mainLang = labelLang && labelLang !== OwedI18n.lang ? ' lang="' + esc(labelLang) + '"' : '';
    b.innerHTML = '<span class="sx-row-main"' + mainLang + '>' + esc(label) + '</span>' +
      (sub ? '<span class="sx-row-sub">' + esc(sub) + '</span>' : '');
    if (onClick) b.addEventListener('click', onClick);
    li.appendChild(b);
    return li;
  }

  function openRule(itemId, ruleId) {
    var item = S.getItem(itemId);
    if (!item) { toast(OwedI18n.t('app.shelf.gone')); return; }
    showResults(item);
    var m = findMatch(ruleId);
    if (m && isWide()) selectRule(m, { focus: true });
  }

  function renderSideExtras(shelf) {
    var due = document.getElementById('sxDue'), dueList = document.getElementById('sxDueList');
    var cl = document.getElementById('sxClaims'), clList = document.getElementById('sxClaimsList');
    var rc = document.getElementById('sxRecent'), rcList = document.getElementById('sxRecentList');
    var sum = document.getElementById('sxSum');
    if (!due) return;

    // 1. deadlines, soonest first
    var soon = [], strong = 0;
    if (E.loaded) {
      shelf.forEach(function (item) {
        E.match(withRegion(item)).forEach(function (m) {
          if (m.strength === 'strong') strong++;
          if (!m.rule.deadline) return;
          var left = daysUntil(m.rule.deadline);
          if (left == null || left < 0) return;
          soon.push({ item: item, rule: m.rule, left: left });
        });
      });
    }
    soon.sort(function (a, b) { return a.left - b.left; });
    dueList.innerHTML = '';
    soon.slice(0, 2).forEach(function (d) {
      dueList.appendChild(sxRow(d.item.name || itemLabel(d.item),
        fmtDate(d.rule.deadline) + ' · ' + (d.left === 0 ? OwedI18n.t('app.side.dueToday') : counted('app.side.daysLeft', d.left)),
        function () { openRule(d.item.id, d.rule.id); }, d.left <= 30 ? 'is-soon' : ''));
    });
    due.hidden = !soon.length;

    // 2. claims already sent, newest first
    var claims = [];
    shelf.forEach(function (item) {
      var c = item.claims || {};
      Object.keys(c).forEach(function (rid) {
        claims.push({ item: item, ruleId: rid, state: c[rid].state, at: c[rid].at || 0 });
      });
    });
    claims.sort(function (a, b) { return b.at - a.at; });
    clList.innerHTML = '';
    claims.slice(0, 2).forEach(function (c) {
      var word = CLAIM_WORD[c.state] || c.state;
      var when = c.at ? localDate(new Date(c.at), { day: 'numeric', month: 'short' }) : '';
      clList.appendChild(sxRow(c.item.name || itemLabel(c.item),
        word + (when ? ' · ' + when : ''),
        function () { openRule(c.item.id, c.ruleId); }, 'is-' + c.state));
    });
    cl.hidden = !claims.length;

    // 3. rules opened lately
    var recent = (S.getRecent && S.getRecent()) || [];
    rcList.innerHTML = '';
    recent.slice(0, 2).forEach(function (r) {
      // entries saved before languages existed have no lang: their titles were English
      rcList.appendChild(sxRow(r.title || OwedI18n.t('app.side.recentUntitled'), '', function () { openRule(r.itemId, r.ruleId); }, '', r.title ? (r.lang || 'en') : ''));
    });
    rc.hidden = !recent.length;

    // 4. the count, once the rulebook is in
    document.getElementById('sxThings').textContent = shelf.length;
    document.getElementById('sxStrong').textContent = strong;
    document.getElementById('sxWon').textContent = S.rescuedCount ? S.rescuedCount() : 0;
    sum.hidden = !shelf.length || !E.loaded;
  }

  function renderShelf() {
    var shelf = S.getShelf();
    el.shelfList.innerHTML = '';
    el.shelfEmpty.hidden = shelf.length > 0;
    el.side.classList.toggle('is-empty', shelf.length === 0);
    el.statItems.textContent = shelf.length;
    el.statItems.hidden = shelf.length === 0;   // the badge is hidden at zero

    var selectedIdx = -1;
    shelf.forEach(function (item, i) {
      if (current.item && current.item.id === item.id) selectedIdx = i;
    });
    // the selected row is never hidden behind "Show more"
    var limit = (shelfExpanded || selectedIdx >= SHELF_VISIBLE) ? shelf.length : SHELF_VISIBLE;

    renderRailSummary(shelf);
    renderSideExtras(shelf);

    var totalNew = 0;
    shelf.forEach(function (item, i) {
      var matches = E.loaded ? E.match(withRegion(item)) : [];
      // anything matched now that this item had not been shown before
      var fresh = E.loaded
        ? S.newRulesFor(item.id, matches.map(function (m) { return m.rule.id; }))
        : [];
      totalNew += fresh.length;
      if (i >= limit) return;

      var on = !!(current.item && current.item.id === item.id);
      var label = esc(item.name || itemLabel(item));
      var li = document.createElement('li');
      li.className = 'shelf-row';
      // the remove button is a SIBLING of the row button: interactive
      // elements may not nest inside a <button>
      li.innerHTML =
        '<button class="srow' + (on ? ' is-on' : '') + '" type="button"' +
          (on ? ' aria-current="true"' : '') + ' data-id="' + esc(item.id) + '">' +
          '<span class="srow-ico" aria-hidden="true">' + itemPicture(item) + '</span>' +
          '<span class="srow-main">' +
            '<span class="srow-name">' + label + '</span>' +
          '</span>' +
          statusHTML(summarise(matches)) +
        '</button>' +
        '<button class="srow-x" type="button" data-remove="' + esc(item.id) + '" ' +
          'aria-label="' + esc(OwedI18n.t('app.shelf.remove', { name: item.name || itemLabel(item) })) + '" title="' + esc(OwedI18n.t('app.shelf.removeTitle')) + '">' + ico('x') + '</button>';
      el.shelfList.appendChild(li);
    });

    var hiddenCount = shelf.length - limit;
    el.shelfMore.hidden = hiddenCount <= 0;
    if (hiddenCount > 0) el.shelfMore.textContent = counted('app.shelf.showMore', hiddenCount);

    if (totalNew && !renderShelf.announced) {
      renderShelf.announced = true;
      toast(counted('app.shelf.newRules', totalNew));
    }
  }

  function setShelfOpen(open) {
    el.shelfToggle.setAttribute('aria-expanded', String(open));
    el.shelfBody.hidden = !open;
  }

  el.shelfToggle.addEventListener('click', function () {
    setShelfOpen(el.shelfToggle.getAttribute('aria-expanded') !== 'true');
  });

  el.shelfMore.addEventListener('click', function () {
    shelfExpanded = true;
    renderShelf();
    var rows = el.shelfList.querySelectorAll('.srow');
    if (rows[SHELF_VISIBLE]) rows[SHELF_VISIBLE].focus();
  });

  function removeFromShelf(id) {
    var item = S.getItem(id);
    if (!item) return;
    var x = el.shelfList.querySelector('[data-remove="' + CSS.escape(String(id)) + '"]');
    var idx = x ? Array.prototype.indexOf.call(el.shelfList.children, x.closest('.shelf-row')) : -1;

    S.removeItem(id);
    if (current.item && current.item.id === id) {
      showStart();
    } else {
      renderShelf();
    }

    // don't strand focus on the button we just deleted
    var rows = el.shelfList.children;
    var next = rows[Math.min(idx, rows.length - 1)];
    var nextRow = next && next.querySelector('.srow');
    var fallback = el.addBtn.offsetParent ? el.addBtn : el.shelfToggle;
    (nextRow || fallback).focus();

    toast(item.name ? OwedI18n.t('app.shelf.removed', { name: item.name }) : OwedI18n.t('app.shelf.removedUnnamed'));
  }

  el.shelfList.addEventListener('click', function (e) {
    var x = e.target.closest('[data-remove]');
    if (x) {
      e.stopPropagation();
      removeFromShelf(x.dataset.remove);
      return;
    }
    var btn = e.target.closest('.srow');
    if (!btn) return;
    var item = S.getItem(btn.dataset.id);
    if (item) showResults(item);
  });

  /* ---------------- wizard ---------------- */
  var wiz = {};
  function resetWiz() {
    wiz = { step: 1, name: '', serial: '', category: null, brand: '', brandOther: false,
            ageMonths: null, ageUnknown: false, payment: null, broken: true, editingId: null, photo: null };
  }
  resetWiz();

  var wizEls = {
    back: document.getElementById('wizBack'),
    bar: document.getElementById('wizBar'),
    count: document.getElementById('wizCount'),
    note: document.getElementById('wizNote'),
    next: document.getElementById('wizNext'),
    skip: document.getElementById('wizSkip'),
    name: document.getElementById('wizName'),
    serial: document.getElementById('wizSerial'),
    err: document.getElementById('wizErr'),
    brand: document.getElementById('wizBrand'),
    brandList: document.getElementById('brandList'),
    catChips: document.getElementById('catChips'),
    brandChips: document.getElementById('brandChips'),
    ageOpts: document.getElementById('ageOpts'),
    payOpts: document.getElementById('payOpts'),
    broken: document.getElementById('wizBroken'),
    photo: document.getElementById('wizPhoto'),
    photoWrap: document.getElementById('wizPhotoWrap'),
    photoPreview: document.getElementById('wizPhotoPreview'),
    photoImg: document.getElementById('wizPhotoImg'),
    photoNote: document.getElementById('wizPhotoNote'),
    photoRemove: document.getElementById('wizPhotoRemove'),
    more1: document.getElementById('wizMoreQ1'),
    fallback1: document.getElementById('wizFallback1'),
    more2: document.getElementById('wizMoreQ2'),
    fallback2: document.getElementById('wizFallback2')
  };

  /* the typed answer sits behind a "Describe it" row on questions 1 and 2;
     anything that needs the field (a prefill, an error, "Other") opens it */
  function setFallback(step, open) {
    var btn = step === 2 ? wizEls.more2 : wizEls.more1;
    var box = step === 2 ? wizEls.fallback2 : wizEls.fallback1;
    if (!btn || !box) return;
    box.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  }
  function fallbackOpen(step) {
    var box = step === 2 ? wizEls.fallback2 : wizEls.fallback1;
    return !!(box && !box.hidden);
  }
  if (wizEls.more1) wizEls.more1.addEventListener('click', function () {
    var open = !fallbackOpen(1);
    setFallback(1, open);
    if (open) wizEls.name.focus();
  });
  if (wizEls.more2) wizEls.more2.addEventListener('click', function () {
    var open = !fallbackOpen(2);
    setFallback(2, open);
    if (open) wizEls.brand.focus();
  });

  var POPULAR_CATS = ['phone', 'laptop', 'headphones', 'watch', 'appliance-large', 'appliance-small', 'power-tool', 'kitchen', 'footwear', 'furniture'];
  /* a photo of the kind of thing on each question-1 tile (local files only) */
  var CAT_PHOTO = {
    phone: 'phone', laptop: 'laptop', headphones: 'headphones', watch: 'watch',
    'appliance-large': 'washing-machine', 'appliance-small': 'coffee-machine',
    'power-tool': 'drill', kitchen: 'cast-iron-pan', footwear: 'running-shoes', furniture: 'sofa'
  };
  function catPhoto(id) {
    return CAT_PHOTO[id]
      ? '<img src="assets/img/photo/' + CAT_PHOTO[id] + '-800.webp" alt="" width="44" height="44" loading="lazy">'
      : '';
  }
  var COMMON_BRANDS = ['Apple', 'Samsung', 'Sony', 'Bose', 'Dyson', 'Whirlpool', 'DeWalt'];
  var CANT_REMEMBER = OwedI18n.t('app.wizard.cantRemember');
  var PAY_ICON = { visa: 'card', mastercard: 'card', amex: 'card', discover: 'card', debit: 'card', cash: 'coins' };

  // populate static option lists once
  C.BRANDS.forEach(function (b) {
    var o = document.createElement('option');
    o.value = b;
    wizEls.brandList.appendChild(o);
  });

  /* one option row: icon · label · radio on the right. Each tile group is a
     radiogroup: role=radio + aria-checked, one tab stop (the checked tile, or
     the first), arrows move between tiles, Space/Enter picks one. */
  function optRow(attrs, iconHTML, label, on) {
    return '<button class="opt' + (on ? ' is-on' : '') + '" type="button" role="radio" aria-checked="' + on + '" tabindex="-1" ' + attrs + '>' +
      (iconHTML ? '<span class="opt-ico" aria-hidden="true">' + iconHTML + '</span>' : '') +
      '<span class="opt-label">' + esc(label) + '</span>' +
      '<span class="opt-radio" aria-hidden="true">' + ico('check') + '</span>' +
    '</button>';
  }

  /* roving tabindex: the checked tile (else the first) is the group's tab stop */
  function roveTabs(group) {
    var tiles = group.querySelectorAll('.opt');
    var on = group.querySelector('.opt.is-on') || tiles[0];
    Array.prototype.forEach.call(tiles, function (t) { t.setAttribute('tabindex', t === on ? '0' : '-1'); });
  }
  var KEY_STEP = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
  [wizEls.catChips, wizEls.brandChips, wizEls.ageOpts, wizEls.payOpts].forEach(function (group) {
    group.addEventListener('keydown', function (e) {
      var tiles = Array.prototype.slice.call(group.querySelectorAll('.opt'));
      var i = tiles.indexOf(document.activeElement);
      if (i === -1) return;
      var to;
      if (KEY_STEP[e.key]) to = (i + KEY_STEP[e.key] + tiles.length) % tiles.length;
      else if (e.key === 'Home') to = 0;
      else if (e.key === 'End') to = tiles.length - 1;
      else return;
      e.preventDefault();
      tiles.forEach(function (t, k) { t.setAttribute('tabindex', k === to ? '0' : '-1'); });
      tiles[to].focus();
    });
  });

  wizEls.ageOpts.innerHTML = C.AGES.map(function (a) {
    return optRow('data-age="' + esc(a.id) + '"', '', a.label, false);
  }).join('') + optRow('data-age="none"', '', CANT_REMEMBER, false);
  roveTabs(wizEls.ageOpts);

  wizEls.payOpts.innerHTML = C.PAYMENTS.map(function (p) {
    var label = p.id === 'unknown' ? CANT_REMEMBER : p.label;
    return optRow('data-pay="' + esc(p.id) + '"', PAY_ICON[p.id] ? ico(PAY_ICON[p.id]) : '', label, false);
  }).join('');
  roveTabs(wizEls.payOpts);

  function startWizard(prefill, editItem, opts) {
    opts = opts || {};
    resetWiz();

    if (editItem) {
      wiz.editingId = editItem.id;
      wiz.name = editItem.name || '';
      wiz.serial = editItem.serial || '';
      wiz.category = editItem.category;
      wiz.brand = editItem.brand || '';
      wiz.ageMonths = editItem.ageMonths == null ? null : editItem.ageMonths;
      wiz.payment = editItem.payment;
      wiz.broken = editItem.broken !== false;
      wiz.photo = editItem.photo || null;
    } else if (prefill) {
      wiz.name = prefill;
      wiz.category = C.guessCategory(prefill);
      wiz.brand = guessBrandWord(prefill);
    }

    wizEls.name.value = wiz.name;
    wizEls.serial.value = wiz.serial || '';
    wizEls.brand.value = wiz.brand;
    wizEls.broken.checked = wiz.broken;
    showPhoto(wiz.photo, wiz.photo ? OwedI18n.th('app.photo.savedWithItem') : '');
    wizEls.err.hidden = true; document.getElementById('wizName').setAttribute('aria-describedby', 'wizHelp1');
    // the typed answers show only when there is something in them
    setFallback(1, true);   // the model field always shows: specific things get specific rules
    setFallback(2, !!(wiz.brand && !brandIsCommon(wiz.brand)));
    renderCatRows();
    renderBrandRows();
    syncOptions();
    show('wizard');
    goStep(1);          // after show(): goStep places focus in the visible view
    if (opts.focusInput) setTimeout(function () { wizEls.name.focus(); }, 120);
  }

  /* the start screen IS question 1 with nothing selected */
  function showStart() {
    current.item = null;
    renderShelf();
    startWizard('', null, {});
    setTab('things');
  }

  function renderCatRows() {
    // a category read from the text that is not in the six is shown too, so
    // what the field says and what is selected always agree
    var list = POPULAR_CATS.slice();
    if (wiz.category && list.indexOf(wiz.category) === -1 && wiz.category !== 'other') list.unshift(wiz.category);
    list.push('other');
    wizEls.catChips.innerHTML = list.map(function (id) {
      return optRow('data-cat="' + esc(id) + '"', catPhoto(id), C.categoryLabel(id), wiz.category === id);
    }).join('');
    roveTabs(wizEls.catChips);
    // "Something else" is the one tile that needs the words
    if (wiz.category === 'other') setFallback(1, true);
    updateContinue();
  }

  function brandIsCommon(b) {
    var lb = String(b || '').trim().toLowerCase();
    return COMMON_BRANDS.some(function (x) { return x.toLowerCase() === lb; });
  }

  /* the catalog's brand guess is a bare substring match, so "fridge" finds
     "GE": only accept a guess that stands as a whole word in the text */
  function guessBrandWord(text) {
    var gb = C.guessBrand(text);
    if (!gb) return '';
    // an optional plural s keeps "my Nikes" and "Blundstones"
    var re = new RegExp('(^|[^a-z0-9])' + gb.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?([^a-z0-9]|$)', 'i');
    return re.test(String(text)) ? gb : '';
  }

  function renderBrandRows() {
    var b = wiz.brand.trim();
    var other = wiz.brandOther || (b && !brandIsCommon(b));
    wizEls.brandChips.innerHTML = COMMON_BRANDS.map(function (x) {
      return optRow('data-brand="' + esc(x) + '"', '', x, !other && x.toLowerCase() === b.toLowerCase());
    }).join('') + optRow('data-brand=""', '', OwedI18n.t('app.wizard.otherBrand'), !!other);
    roveTabs(wizEls.brandChips);
  }

  function syncOptions() {
    Array.prototype.forEach.call(wizEls.ageOpts.children, function (b) {
      var on = b.dataset.age === 'none'
        ? wiz.ageUnknown
        : wiz.ageMonths != null && Number(b.dataset.age) === Number(wiz.ageMonths);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', String(on));
    });
    roveTabs(wizEls.ageOpts);
    Array.prototype.forEach.call(wizEls.payOpts.children, function (b) {
      var on = b.dataset.pay === wiz.payment;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-checked', String(on));
    });
    roveTabs(wizEls.payOpts);
  }

  /* Continue is dimmed, not disabled, until question 1 has an answer */
  function updateContinue() {
    var ready = wiz.step !== 1 || !!(wiz.name.trim() || wiz.category);
    wizEls.next.classList.toggle('is-dim', !ready);
    if (ready) wizEls.err.hidden = true; document.getElementById('wizName').setAttribute('aria-describedby', 'wizHelp1');
  }

  wizEls.catChips.addEventListener('click', function (e) {
    var row = e.target.closest('[data-cat]');
    if (!row) return;
    wiz.category = row.dataset.cat;
    renderCatRows();
    // the grid was rebuilt under the user: put focus back on the picked tile
    var again = wizEls.catChips.querySelector('[data-cat="' + CSS.escape(wiz.category) + '"]');
    if (again) again.focus();
  });

  wizEls.brandChips.addEventListener('click', function (e) {
    var row = e.target.closest('[data-brand]');
    if (!row) return;
    var b = row.dataset.brand;
    if (b) {
      wiz.brand = b;
      wiz.brandOther = false;
      wizEls.brand.value = b;
      renderBrandRows();
      var again = wizEls.brandChips.querySelector('[data-brand="' + CSS.escape(b) + '"]');
      if (again) again.focus();
      return;
    } else {
      // "Other brand": type it in the field
      wiz.brandOther = true;
      if (brandIsCommon(wiz.brand)) { wiz.brand = ''; wizEls.brand.value = ''; }
      setFallback(2, true);
      wizEls.brand.focus();
    }
    renderBrandRows();
  });

  wizEls.serial.addEventListener('input', function () {
    // serials are printed in caps and read back over the phone: keep them tidy
    wiz.serial = wizEls.serial.value.toUpperCase().replace(/\s+/g, '');
    if (wizEls.serial.value !== wiz.serial) wizEls.serial.value = wiz.serial;
  });

  wizEls.name.addEventListener('input', function () {
    wiz.name = wizEls.name.value;
    var guess = C.guessCategory(wiz.name);
    if (guess) wiz.category = guess;
    var gb = guessBrandWord(wiz.name);
    if (gb && !wiz.brand) { wiz.brand = gb; wizEls.brand.value = gb; renderBrandRows(); }
    renderCatRows();
  });

  wizEls.brand.addEventListener('input', function () {
    wiz.brand = wizEls.brand.value;
    wiz.brandOther = false;
    renderBrandRows();
  });

  wizEls.ageOpts.addEventListener('click', function (e) {
    var b = e.target.closest('[data-age]');
    if (!b) return;
    if (b.dataset.age === 'none') { wiz.ageMonths = null; wiz.ageUnknown = true; }
    else { wiz.ageMonths = Number(b.dataset.age); wiz.ageUnknown = false; }
    syncOptions();
    setTimeout(function () { goStep(4); }, 180);
  });

  wizEls.payOpts.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pay]');
    if (!b) return;
    wiz.payment = b.dataset.pay;
    syncOptions();
  });

  wizEls.broken.addEventListener('change', function () { wiz.broken = wizEls.broken.checked; });

  /* ---------------- a photo of the item ----------------
     The photo is shrunk to a small JPEG and kept with the item in this
     browser. Where the browser ships a built-in model (Chrome's Prompt API)
     it names the item on the device; otherwise a barcode is read when there
     is one. Nothing is uploaded anywhere. */
  var CAT_IDS = POPULAR_CATS.concat(['other']);

  function itemPicture(item) {
    return item && item.photo && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(item.photo)
      ? '<img src="' + item.photo + '" alt="">'
      : catIcon(item.category);
  }

  function showPhoto(dataUrl, noteHTML) {
    var has = !!dataUrl;
    wizEls.photoPreview.hidden = !has;
    wizEls.photoWrap.classList.toggle('has-photo', has);
    if (has) wizEls.photoImg.src = dataUrl; else wizEls.photoImg.removeAttribute('src');
    wizEls.photoNote.innerHTML = noteHTML || '';
  }

  function shrinkPhoto(file, cb) {
    var url = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      var max = 640, s = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * s));
      c.height = Math.max(1, Math.round(img.naturalHeight * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      cb(c.toDataURL('image/jpeg', .82));
    };
    img.onerror = function () { URL.revokeObjectURL(url); cb(null); };
    img.src = url;
  }

  /* Everything the photo gave us, said plainly: what it is, what it looks like,
     what was readable — and, when no model was readable, where to find one. */
  function photoNote(r, did) {
    if (!did || !r || !r.name) {
      return OwedI18n.th('app.photo.unsure');
    }
    var seen = [r.name];
    if (r.condition) seen.push(OwedI18n.t(CONDITION_KEY[r.condition]));
    (r.features || []).forEach(function (f) { seen.push(f); });
    var out = OwedI18n.th('app.photo.seen', { seen: seen.join(' · ') });
    if (r.serial) out += ' ' + OwedI18n.th('app.photo.serial', { serial: r.serial });
    if (!r.model) out += ' ' + OwedI18n.th('app.photo.noModel', { hint: modelHint(r.category) });
    return out + ' ' + OwedI18n.th('app.photo.changeBelow');
  }

  /* where the model number is printed, per kind of thing — the one piece of
     knowledge that turns a photo into an exact product */
  function modelHint(cat) {
    var H = {
      phone: 'app.photo.hint.phone',
      laptop: 'app.photo.hint.laptop',
      headphones: 'app.photo.hint.headphones',
      watch: 'app.photo.hint.watch',
      appliance_large: 'app.photo.hint.applianceLarge',
      appliance_small: 'app.photo.hint.applianceSmall',
      tool: 'app.photo.hint.tool',
      kitchen: 'app.photo.hint.kitchen',
      shoes: 'app.photo.hint.shoes',
      furniture: 'app.photo.hint.furniture'
    };
    return OwedI18n.t(H[cat] || 'app.photo.hint.other');
  }

  function applyIdentified(r) {
    var changed = false;
    if (!r || r.unsure) return false;          // the checks did not agree: say nothing
    // the name says WHAT the thing is — "WH-1000XM4" on its own means nothing
    // with no readable model, a colour still makes the thing recognisable on the shelf
    // r.kind stays the English word the checks agreed on; the reader sees it in their language
    var name = { brand: r.brand, model: r.model, colour: r.colour, kind: r.kind ? OwedI18n.t('app.photo.kind.' + r.kind, null, r.kind) : '' };
    var built = (r.brand && r.model ? OwedI18n.t('app.photo.name.brandModel', name)
      : r.brand ? OwedI18n.t('app.photo.name.brand', name)
      : r.model ? OwedI18n.t('app.photo.name.model', name)
      : name.kind).trim();
    if (!r.brand && !r.model && r.colour) built = OwedI18n.t('app.photo.name.colour', name).trim();
    r.name = built;
    if (r.serial && !wiz.serial.trim()) {
      wiz.serial = r.serial; wizEls.serial.value = r.serial; changed = true;
    }
    if (r.name && !wiz.name.trim()) { wiz.name = String(r.name).slice(0, 80); wizEls.name.value = wiz.name; changed = true; }
    if (r.brand && !wiz.brand.trim()) { wiz.brand = String(r.brand).slice(0, 40); wizEls.brand.value = wiz.brand; changed = true; }
    if (r.category && CAT_IDS.indexOf(r.category) !== -1) { wiz.category = r.category; changed = true; }
    renderCatRows();
    renderBrandRows();
    return changed;
  }

  /* Naming a thing from a photo, without ever inventing one.
     A small on-device model will happily answer "Sony WH-1000XM4" for a
     screenshot, so its word alone is never enough. Three gates, in order:
       1. is this even a photograph of a real object? (asked on its own)
       2. two independent descriptions must agree on what the thing is
       3. the everyday word must be one we know, and a brand or model must
          actually appear as text the model claims to have read
     Anything that fails ends in "I could not tell", never a guess. */
  var KIND_WORDS = ('headphones earbuds speaker soundbar phone smartphone tablet laptop computer monitor ' +
    'television tv camera console watch tracker printer router keyboard mouse ' +
    'washing machine washer dryer dishwasher fridge refrigerator freezer oven cooker hob microwave kettle toaster ' +
    'coffee machine blender mixer vacuum fan heater air conditioner ' +
    'drill saw sander grinder mower trimmer ' +
    'pan pot skillet kettle cookware knife ' +
    'shoes boots trainers sneakers jacket coat backpack bag ' +
    'sofa couch chair table bed mattress desk lamp').split(' ');
  // the model answers these in English and they are checked in English; this is only the word the reader sees
  var CONDITION_KEY = { 'looks new': 'app.photo.condition.looksNew', used: 'app.photo.condition.used', damaged: 'app.photo.condition.damaged' };

  function askModel(session, text, file) {
    return session.prompt([{ role: 'user', content: [{ type: 'text', value: text }, { type: 'image', value: file }] }]);
  }
  function firstJSON(text) {
    var m = String(text).match(/\{[\s\S]*\}/);
    if (!m) throw new Error('no json');
    return JSON.parse(m[0]);
  }
  function kindOf(s) {
    s = String(s || '').toLowerCase().replace(/[^a-z ]/g, ' ');
    for (var i = 0; i < KIND_WORDS.length; i++) if (s.indexOf(KIND_WORDS[i]) >= 0) return KIND_WORDS[i];
    return '';
  }

  function identifyWithBuiltInAI(file) {
    if (!('LanguageModel' in window) || typeof window.LanguageModel.create !== 'function') {
      return Promise.reject(new Error('no built-in model'));
    }
    var session;
    return window.LanguageModel.create({ expectedInputs: [{ type: 'image' }] }).then(function (s) {
      session = s;
      // gate 1: a photograph of a real object, or a picture of a screen?
      return askModel(session,
        'Look at this image. Is it a photograph of a real physical object that someone owns, ' +
        'or is it a screenshot, a web page, an app interface, a document, a drawing or a picture of a person? ' +
        'Reply with ONLY {"photo_of_object":true} or {"photo_of_object":false}.', file);
    }).then(function (t) {
      if (!firstJSON(t).photo_of_object) return { unsure: true };
      // gate 2: two independent descriptions, no example answer in either
      return askModel(session,
        'In three words or fewer, what is the object in this photo? Reply with ONLY the words, no punctuation. ' +
        'If you cannot tell, reply: unknown', file)
        .then(function (plain) {
          return askModel(session,
            'Describe the object in this photo so its warranty can be looked up. ' +
            'Reply with ONLY compact JSON with these keys and nothing else: ' +
            '{"kind":"","colour":"","features":[],"condition":"","brand":"","model":"","serial":"","read_from_photo":""}. ' +
            '"kind" is the everyday word for the object. ' +
            '"colour" is its main colour. ' +
            '"features" is up to four short phrases for what you can actually see — a case, the number of cameras, ' +
            'a screen, buttons, a cable, a dial, wear or damage. Three or four words each. ' +
            '"condition" is one of: looks new, used, damaged, or an empty string. ' +
            '"brand", "model" and "serial" must be left empty unless the characters are printed in the photo and you can read them. ' +
            '"serial" is the serial number, often labelled Serial, S/N or SN. ' +
            '"read_from_photo" is the exact text you can see printed on the object, or an empty string. ' +
            'Describe only what is visible. Never guess a brand or a model from the shape of the object.', file)
            .then(function (t2) { return { plain: String(plain || ''), data: firstJSON(t2) }; });
        });
    }).then(function (out) {
      if (out.unsure) return { unsure: true };
      var d = out.data || {};
      var k1 = kindOf(out.plain), k2 = kindOf(d.kind);
      // the two answers must land on the same everyday word
      if (!k1 || !k2 || k1 !== k2) return { unsure: true };
      // a brand or model is only allowed if the model says it read those words off the item
      var read = String(d.read_from_photo || '').toLowerCase();
      var brand = String(d.brand || '').trim();
      var model = String(d.model || '').trim();
      if (brand && read.indexOf(brand.toLowerCase()) < 0) brand = '';
      if (model && read.indexOf(model.toLowerCase()) < 0) model = '';
      var serial = String(d.serial || '').trim();
      if (serial && read.indexOf(serial.toLowerCase()) < 0) serial = '';
      // a serial is letters and digits, 6 to 20 of them: anything else is not one
      if (serial && !/^[A-Za-z0-9-]{6,20}$/.test(serial)) serial = '';
      // what the photo can honestly show, beyond a name
      var colour = String(d.colour || '').trim().toLowerCase().slice(0, 20);
      var feats = (Array.isArray(d.features) ? d.features : [])
        .map(function (f) { return String(f || '').trim().toLowerCase().replace(/\.$/, ''); })
        .filter(function (f) { return f && f.length < 40; })
        .slice(0, 4);
      var condition = String(d.condition || '').trim().toLowerCase();
      if (['looks new', 'used', 'damaged'].indexOf(condition) < 0) condition = '';
      return { kind: k1, brand: brand, model: model, serial: serial.toUpperCase(),
               colour: colour, features: feats, condition: condition, category: guessCategory(k1) };
    });
  }

  /* the everyday word maps onto one of the app's own categories */
  function guessCategory(kind) {
    var M = {
      headphones: 'headphones', earbuds: 'headphones', speaker: 'headphones', soundbar: 'headphones',
      phone: 'phone', smartphone: 'phone', tablet: 'phone',
      laptop: 'laptop', computer: 'laptop', monitor: 'laptop', printer: 'laptop', router: 'laptop',
      keyboard: 'laptop', mouse: 'laptop', television: 'laptop', tv: 'laptop', console: 'laptop', camera: 'laptop',
      watch: 'watch', tracker: 'watch',
      washer: 'appliance_large', washing: 'appliance_large', machine: 'appliance_large', dryer: 'appliance_large',
      dishwasher: 'appliance_large', fridge: 'appliance_large', refrigerator: 'appliance_large',
      freezer: 'appliance_large', oven: 'appliance_large', cooker: 'appliance_large', hob: 'appliance_large',
      microwave: 'appliance_small', kettle: 'appliance_small', toaster: 'appliance_small', coffee: 'appliance_small',
      blender: 'appliance_small', mixer: 'appliance_small', vacuum: 'appliance_small', fan: 'appliance_small',
      heater: 'appliance_small', conditioner: 'appliance_small',
      drill: 'tool', saw: 'tool', sander: 'tool', grinder: 'tool', mower: 'tool', trimmer: 'tool',
      pan: 'kitchen', pot: 'kitchen', skillet: 'kitchen', cookware: 'kitchen', knife: 'kitchen',
      shoes: 'shoes', boots: 'shoes', trainers: 'shoes', sneakers: 'shoes',
      sofa: 'furniture', couch: 'furniture', chair: 'furniture', table: 'furniture', bed: 'furniture',
      mattress: 'furniture', desk: 'furniture', lamp: 'furniture'
    };
    var c = M[kind] || '';
    return CAT_IDS.indexOf(c) >= 0 ? c : '';
  }

  function readBarcode(file) {
    if (!('BarcodeDetector' in window) || typeof createImageBitmap !== 'function') return Promise.resolve(null);
    return createImageBitmap(file).then(function (bmp) {
      return new window.BarcodeDetector().detect(bmp);
    }).then(function (codes) {
      return codes && codes.length ? String(codes[0].rawValue).slice(0, 40) : null;
    }).catch(function () { return null; });
  }

  wizEls.photo.addEventListener('change', function () {
    var file = wizEls.photo.files && wizEls.photo.files[0];
    wizEls.photo.value = '';
    if (file) usePhotoFile(file);
  });

  /* the camera: a live view and a shutter, so a photo can be taken here rather
     than hunted for in the gallery. The stream never leaves the browser. */
  (function camera() {
    var btn = document.getElementById('wizCamBtn'), sheet = document.getElementById('camSheet');
    var view = document.getElementById('camView'), note = document.getElementById('camNote');
    if (!btn || !sheet) return;
    var stream = null;
    function stop() {
      if (stream) { stream.getTracks().forEach(function (t) { t.stop(); }); stream = null; }
      view.srcObject = null; sheet.hidden = true;
    }
    btn.addEventListener('click', function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        wizEls.photo.click();   // no camera here: fall back to the picker
        return;
      }
      sheet.hidden = false;
      note.textContent = OwedI18n.t('app.camera.starting');
      // a dismissed permission prompt never resolves: do not sit here for ever
      var settled = false;
      var giveUp = setTimeout(function () {
        if (settled) return;
        settled = true; stop();
        toast(OwedI18n.t('app.camera.timedOut'));
        wizEls.photo.click();
      }, 8000);
      navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        .then(function (s) {
          if (settled) { s.getTracks().forEach(function (t) { t.stop(); }); return; }
          settled = true; clearTimeout(giveUp);
          stream = s; view.srcObject = s; view.play();
          note.textContent = OwedI18n.t('app.camera.fillFrame');
        })
        .catch(function () {
          if (settled) return;
          settled = true; clearTimeout(giveUp);
          stop();
          toast(OwedI18n.t('app.camera.unavailable'));
          wizEls.photo.click();
        });
    });
    document.getElementById('camCancel').addEventListener('click', stop);
    sheet.addEventListener('click', function (e) { if (e.target === sheet) stop(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) stop(); });
    document.getElementById('camShoot').addEventListener('click', function () {
      if (!view.videoWidth) return;
      var cv = document.createElement('canvas');
      cv.width = view.videoWidth; cv.height = view.videoHeight;
      cv.getContext('2d').drawImage(view, 0, 0);
      cv.toBlob(function (blob) {
        stop();
        if (blob) usePhotoFile(new File([blob], 'photo.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', .9);
    });
  })();

  function usePhotoFile(file) {
    shrinkPhoto(file, function (dataUrl) {
      if (!dataUrl) { toast(OwedI18n.t('app.photo.unreadable')); return; }
      wiz.photo = dataUrl;
      showPhoto(dataUrl, OwedI18n.th('app.photo.looking'));
      identifyWithBuiltInAI(file).then(function (r) {
        r = r || {};
        var did = applyIdentified(r);
        showPhoto(dataUrl, photoNote(r, did));
        updateContinue();
      }).catch(function () {
        // no on-device model: a barcode is still a real identifier, so keep it
        return readBarcode(file).then(function (code) {
          if (code) {
            if (!wiz.name.trim()) { wiz.name = code; wizEls.name.value = code; updateContinue(); }
            showPhoto(dataUrl, OwedI18n.th('app.photo.barcode', { code: code }));
            return;
          }
          // most phones have no on-device model: help the reader get the number
          // off the photo themselves — iOS and Android can both copy text from
          // a picture, and one tap pastes it straight into the name
          showPhoto(dataUrl, OwedI18n.th('app.photo.whereModel', { hint: modelHint(wiz.category) }));
        });
      });
    });
  }

  // "paste it here": the clipboard read needs this click as its gesture
  wizEls.photoNote.addEventListener('click', function (e) {
    if (!e.target.closest('[data-paste]')) return;
    if (!navigator.clipboard || !navigator.clipboard.readText) { wizEls.name.focus(); return; }
    navigator.clipboard.readText().then(function (t) {
      t = String(t || '').trim().slice(0, 80);
      if (!t) { wizEls.name.focus(); return; }
      wiz.name = t; wizEls.name.value = t; setFallback(1, true); updateContinue();
      toast(OwedI18n.t('app.photo.pasted'));
    }, function () { wizEls.name.focus(); });
  });

  wizEls.photoRemove.addEventListener('click', function () {
    wiz.photo = null;
    showPhoto(null, '');
    wizEls.name.focus();
  });

  function goStep(n) {
    wiz.step = Math.max(1, Math.min(4, n));
    Array.prototype.forEach.call(document.querySelectorAll('.wiz-step'), function (s) {
      s.classList.toggle('is-on', Number(s.dataset.step) === wiz.step);
    });
    wizEls.bar.style.width = (wiz.step / 4 * 100) + '%';
    wizEls.count.textContent = OwedI18n.t('app.wizard.count', { step: wiz.step, total: 4 });
    wizEls.next.textContent = wiz.step === 4 ? OwedI18n.t('app.wizard.finish') : OwedI18n.t('app.wizard.next');
    // skip only where there is no "can't remember" row to do the same job
    wizEls.skip.hidden = wiz.step !== 2;
    // no Back on the start screen; on question 1 it appears only while editing
    wizEls.back.hidden = wiz.step === 1 && !wiz.editingId;
    wizEls.note.hidden = !(wiz.step === 1 && !S.getShelf().length);
    updateContinue();
    // on a phone the answer rows push the card top off-screen; bring the new
    // question back into view before focusing it
    var card = document.querySelector('.wiz');
    if (card && card.getBoundingClientRect().top < 0) card.scrollIntoView();
    focusView('wizard');
  }

  wizEls.next.addEventListener('click', function () {
    if (wiz.step === 1) {
      if (!wiz.name.trim() && !wiz.category) {
        // said twice on purpose: the toast announces it, the line under the
        // field stays until there is an answer
        toast(OwedI18n.t('app.wizard.pickFirst'));
        setFallback(1, true);
        wizEls.err.hidden = false;
        document.getElementById('wizName').setAttribute('aria-describedby', 'wizHelp1 wizErr');
        wizEls.name.focus();
        return;
      }
      if (!wiz.category) { wiz.category = 'other'; renderCatRows(); }
    }
    if (wiz.step === 4) { finishWizard(); return; }
    goStep(wiz.step + 1);
  });

  wizEls.skip.addEventListener('click', function () { goStep(wiz.step + 1); });

  wizEls.back.addEventListener('click', function () {
    if (wiz.step === 1) {
      if (wiz.editingId && current.item) showResults(current.item);
      else showStart();
      return;
    }
    goStep(wiz.step - 1);
  });

  // Enter advances
  [wizEls.name, wizEls.brand].forEach(function (input) {
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); wizEls.next.click(); }
    });
  });

  function finishWizard() {
    var madeUp = itemLabel({ brand: wiz.brand, category: wiz.category });
    var payload = {
      name: wiz.name.trim() || madeUp,
      // true when nobody typed a name (or kept the pre-filled one): the claim message then says
      // "un téléphone Samsung" rather than quoting the label "Téléphone Samsung"
      autoName: !wiz.name.trim() || wiz.name.trim() === madeUp,
      brand: wiz.brand.trim(),
      category: wiz.category || 'other',
      ageMonths: wiz.ageMonths,   // null = the user could not remember; never invent an age
      payment: wiz.payment || 'unknown',
      broken: wiz.broken,
      serial: wiz.serial.trim(),
      region: user.region || 'US',
      subregion: user.subregion || '',
      photo: wiz.photo || null    // a small JPEG data URL; lives only in this browser
    };

    var item;
    if (wiz.editingId) {
      item = S.updateItem(wiz.editingId, payload);
    } else {
      item = S.addItem(payload);
    }
    // the item can have been removed in another tab while it was being edited
    if (!item) { showStart(); return; }
    renderShelf();
    showResults(item);
  }

  /* a new check starts clean: nothing selected in the shelf */
  function startNew(prefill) {
    current.item = null;
    renderShelf();
    startWizard(prefill || '', null, { focusInput: true });
    setTab('check');
  }

  el.addBtn.addEventListener('click', function () { startNew(''); });

  /* ---------------- results ---------------- */
  var resEls = {
    icon: document.getElementById('resIcon'),
    title: document.getElementById('resTitle'),
    sub: document.getElementById('resSub'),
    summary: document.getElementById('resSummary'),
    filter: document.getElementById('resFilter'),
    groups: document.getElementById('resGroups'),
    none: document.getElementById('resNone'),
    recheck: document.getElementById('resRecheck')
  };

  resEls.recheck.addEventListener('click', function () {
    if (current.item) { startWizard(null, current.item, { focusInput: true }); setTab('check'); }
  });

  function setCounts(n) {
    var map = n ? { all: n.total, strong: n.strong, worth: n.worth, longshot: n.long } : {};
    Array.prototype.forEach.call(resEls.filter.querySelectorAll('[data-n]'), function (s) {
      s.textContent = n ? map[s.dataset.n] : '';
    });
  }

  function showResults(item, keepFocus) {
    current.item = item;
    resEls.title.textContent = item.name || itemLabel(item);
    resEls.icon.innerHTML = itemPicture(item);
    resEls.sub.textContent = [
      C.categoryLabel(item.category),
      item.brand,
      E.agePhrase(item.ageMonths),
      item.serial ? OwedI18n.t('app.results.serial', { serial: item.serial }) : ''
    ].filter(Boolean).join(' · ');

    // Never say "nothing matched" when the truth is "the rulebook isn't here yet".
    if (!E.loaded) {
      current.matches = [];
      resEls.summary.hidden = false;
      resEls.summary.innerHTML = '<p class="res-state">' + (corpusFailed
        ? OwedI18n.th('app.results.failed')
        : OwedI18n.th('app.results.loading')) + '</p>';
      resEls.groups.innerHTML = '';
      resEls.none.hidden = true;
      resEls.filter.hidden = true;
      setCounts(null);
      show('results');
      hidePanel();
      if (!keepFocus) { setTab('things'); focusView('results'); }
      return;
    }

    var matches = E.match(withRegion(item));
    current.matches = matches;
    var n = summarise(matches);
    setCounts(n);
    selected = null;

    if (!matches.length) {
      resEls.summary.hidden = true;
      resEls.summary.innerHTML = '';
      resEls.filter.hidden = true;
      resEls.groups.innerHTML = '';
      resEls.none.hidden = false;
    } else {
      resEls.none.hidden = true;
      resEls.filter.hidden = false;
      resEls.summary.hidden = false;
      resEls.summary.innerHTML = renderSummary(n);
      startMarked = false;
      var leads = matches.filter(function (m) { return !isLongShot(m); });
      var longs = matches.filter(isLongShot);
      // only the best tier is open: strong first; worth asking folded under it
      // (open only when nothing is strong); long shots folded unless they are all there is
      var strongs = leads.filter(function (m) { return m.strength === 'strong'; });
      var worths = leads.filter(function (m) { return m.strength !== 'strong'; });
      if (strongs.length) {
        resEls.groups.innerHTML = E.group(strongs).map(renderGroup).join('') +
          renderFold(worths, false, STRENGTH['worth asking'].plural, OwedI18n.t('app.results.fold.worthNote'), 'worth asking') +
          renderLongShots(longs, false);
      } else {
        resEls.groups.innerHTML = E.group(leads).map(renderGroup).join('') + renderLongShots(longs, !leads.length);
      }
    }

    // remember which rules we have shown, so new ones can be flagged later
    S.markSeen(item.id, matches.map(function (m) { return m.rule.id; }));

    show('results');
    renderShelf();
    if (!keepFocus) {
      setTab('things');
      // on a phone the list folds away so the answer starts near the top
      if (isMobile()) setShelfOpen(false);
      focusView('results');
    }
  }

  /* one plain sentence and a three-part key. The stat tiles and the bar said
     the same numbers three times over (round-2 judges; Zillow and Glassdoor
     open their results with one sentence, then the list). */
  function renderSummary(n) {
    // one line; the chips underneath carry the counts by strength
    if (n.ask) {
      return '<p class="res-line">' + counted('app.results.summary.ask', n.ask, true) + '</p>';
    }
    return '<p class="res-line none">' + OwedI18n.th(n.long ? 'app.results.summary.onlyLong' : 'app.results.summary.none') + '</p>';
  }

  var startMarked = false;

  function isLongShot(m) { return m.strength === 'long shot'; }

  /* a source group shows every real lead it holds; nothing folds inside it */
  function renderGroup(g) {
    return '<section class="rgroup">' +
      '<h2 class="rgroup-head">' +
        '<span class="rgroup-ico" aria-hidden="true">' + ico(SRC_ICON[g.type] || 'box', 18) + '</span>' +
        '<span class="rgroup-title">' + esc(g.label) + '</span>' +
        '<span class="sr-only">, </span>' +
        '<span class="rgroup-count tnum">' + g.items.length + '</span>' +
      '</h2>' +
      '<div class="rgroup-list">' + g.items.map(renderCard).join('') + '</div>' +
    '</section>';
  }

  /* every long shot on the page sits behind ONE quiet row at the end, so the
     list of real leads is never broken up by "show more" buttons. When there
     is no real lead, the long shots are the answer and stay open. */
  function renderLongShots(longs, open) {
    return renderFold(longs, open, STRENGTH['long shot'].plural, OwedI18n.t('app.results.fold.longNote'), 'long shot');
  }
  /* word is the engine's strength id ('worth asking' | 'long shot'), never shown:
     the fold's words are whole phrases per strength, counted where they count */
  var FOLD_WORDS = {
    'worth asking': { show: 'app.results.fold.showWorth', hide: 'app.results.fold.hideWorth' },
    'long shot':    { show: 'app.results.fold.showLong',  hide: 'app.results.fold.hideLong' }
  };
  function renderFold(list, open, title, note, word) {
    if (!list.length) return '';
    var words = FOLD_WORDS[word] || FOLD_WORDS['long shot'];
    return '<section class="rgroup rgroup-long">' +
      '<h2 class="rgroup-head">' +
        '<span class="rgroup-ico" aria-hidden="true">' + ico('box', 18) + '</span>' +
        '<span class="rgroup-title">' + esc(title) + '</span>' +
        '<span class="sr-only">, </span>' +
        '<span class="rgroup-count tnum">' + list.length + '</span>' +
      '</h2>' +
      '<div class="rgroup-list">' +
        '<div class="rgroup-more"' + (open ? '' : ' hidden') + '>' + list.map(renderCard).join('') + '</div>' +
        (open ? '' : '<button class="rgroup-toggle" type="button" data-more data-hide="' + esc(OwedI18n.t(words.hide)) + '" aria-expanded="false">' + counted(words.show, list.length, true) + '</button>') +
      '</div>' +
    '</section>';
  }

  /* ddAttr: extra attributes for the value, e.g. ' lang="en"' (empty on an English page) */
  function kv(icon, label, valueHTML, ddAttr) {
    return '<div><dt>' + ico(icon, 18) + label + '</dt><dd' + (ddAttr || '') + '>' + valueHTML + '</dd></div>';
  }

  var NEW_TAB = '<span class="sr-only"> ' + OwedI18n.th('app.link.newTab') + '</span>';

  /* A rule's words are in the rule's own language (rule._lang), which is English
     wherever data/coverage.<lang>.json has no translation for it. On a page in
     another language they are marked, so a screen reader reads them as written.
     Every one of these is empty when the two languages match, as they always do
     on an English page. */
  function ruleLang(r) { return (r && r._lang) || 'en'; }
  function langAttr(r) { return ruleLang(r) !== OwedI18n.lang ? ' lang="' + esc(ruleLang(r)) + '"' : ''; }
  function inRuleLang(r, html) { return ruleLang(r) !== OwedI18n.lang ? '<span lang="' + esc(ruleLang(r)) + '">' + html + '</span>' : html; }
  // words no translation file carries (a contact line, an explainer's name) are always English
  var EN_ATTR = OwedI18n.lang !== 'en' ? ' lang="en"' : '';

  /* pageLang: set only inside an element marked as the rule's language, so the
     link's own words go back to the page's language */
  function ruleLink(url, cls, pageLang) {
    if (!/^https?:\/\//i.test(String(url || ''))) return '';
    return '<a class="' + cls + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"' + (pageLang ? ' lang="' + esc(OwedI18n.lang) + '"' : '') + '>' +
      OwedI18n.th('app.rule.read') + ' ' + ico('out', 16) + NEW_TAB + '</a>';
  }

  /* Someone else's page about the same law — The Repair Association keeps the
     state summaries current so Owed does not carry a second copy to maintain.
     Named in the link text so it never reads as one of our own pages. */
  function orgLink(ex, cls) {
    if (!ex || !/^https?:\/\//i.test(String(ex.url || ''))) return '';
    var who = [ex.org, ex.label].filter(Boolean).join(': ');
    return '<a class="' + cls + '" href="' + esc(ex.url) + '" target="_blank" rel="noopener noreferrer">' +
      (EN_ATTR ? '<span' + EN_ATTR + '>' + esc(who) + '</span>' : esc(who)) + ' ' + ico('out', 16) + NEW_TAB + '</a>';
  }

  /* the short source word in a row's first column */
  var SRC_WORD = {
    manufacturer: OwedI18n.t('app.card.src.manufacturer'), card: OwedI18n.t('app.card.src.card'),
    settlement: OwedI18n.t('app.card.src.settlement'), program: OwedI18n.t('app.card.src.program'),
    statutory: OwedI18n.t('app.card.src.statutory'), retailer: OwedI18n.t('app.card.src.retailer')
  };

  /* one row, Cal.com's bookings geometry: facts · headline + reason + who · action */
  function renderCard(m) {
    var r = m.rule;
    var s = STRENGTH[m.strength] || STRENGTH['long shot'];
    // "Start here" goes on the top lead: the first strong card, or the first
    // worth-asking one when nothing is strong. Never on a long shot.
    var isStart = !startMarked && !isLongShot(m);
    if (isStart) startMarked = true;

    // facts are built only from fields that exist; nothing is guessed
    var win = firstClause(r.window_note, 6, r._lang);
    var col1 = '<span class="rc-src">' + esc(SRC_WORD[r.source_type] || OwedI18n.t('app.card.src.other')) + '</span>' +
      (win ? '<span class="rc-when">' + esc(win) + '</span>' : '') +
      // an unknown purchase date on a timed rule: the clock cannot be read yet, and the row says so
      (m.timing === 'unknown' ? '<span class="rc-deadline">' + OwedI18n.th('app.card.dateUnknown') + '</span>' : '') +
      (r.deadline ? '<span class="rc-deadline">' + OwedI18n.th('app.card.by', { date: fmtDate(r.deadline) }) + '</span>' : '');

    // the two buttons repeat on every row; the title tells them apart for AT
    var tid = 'rt-' + esc(r.id);
    // wide: "Details" opens the rail panel (no fold-out)
    var wide = isWide();

    return '<article class="rcard ' + s.cls + (isStart ? ' is-start' : '') + '" data-rule="' + esc(r.id) + '">' +
      '<div class="rc-row">' +
        '<div class="rc-main">' +
          (isStart ? '<span class="rc-start">' + OwedI18n.th('app.card.startHere') + '</span>' : '') +
          '<h3 class="rc-title" id="' + tid + '"><button class="rc-details" type="button" data-toggle' + (wide ? '' : ' aria-expanded="false"') + langAttr(r) + '>' + esc(r.title) + '</button></h3>' +
          '<div class="rc-meta"><span class="rc-src">' + esc(SRC_WORD[r.source_type] || OwedI18n.t('app.card.src.other')) + (win ? ' · ' + inRuleLang(r, esc(win)) : '') + '</span>' +
            (r.deadline ? '<span class="rc-deadline">' + OwedI18n.th('app.card.by', { date: fmtDate(r.deadline) }) + '</span>' : '') + '</div>' +
        '</div>' +
        '<div class="rc-side">' + pill(m.strength) + '<button class="btn btn-accent" type="button" data-script aria-describedby="' + tid + '">' + OwedI18n.th('app.card.getScript') + '</button></div>' +
      '</div>' +
      '<div class="rc-body" hidden>' + docBody(m) + '</div>' +
    '</article>';
  }

  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  /* the inside of the rule's document card: what you get, the steps, the
     label · value rows, why it matched, the source link */
  function docBody(m, h) {
    var r = m.rule;
    h = h || 'h4';   // h4 under a card's h3 title; h3 under the rail's h2
    var L = langAttr(r);
    // a contact made into a link is a number or an address; one left as words is English
    var contact = r.contact ? linkify(r.contact) : '';
    return (L ? '<p class="rc-why"' + (OwedI18n.langOf('app.rule.englishOnly') !== OwedI18n.lang ? ' lang="en"' : '') + '>' + OwedI18n.th('app.rule.englishOnly') + '</p>' : '') +
      '<p class="rc-get"' + L + '>' + esc(r.what_you_get) + '</p>' +
      '<' + h + ' class="rc-h">' + OwedI18n.th('app.doc.howToClaim') + '</' + h + '>' +
      '<ol class="rc-steps" role="list"' + L + '>' + steps(r.how_to_claim, r._lang).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
      '<dl class="rc-kv">' +
        kv('clock', OwedI18n.th('app.doc.window'), esc(r.window_note), L) +
        (r.deadline ? kv('calendar', OwedI18n.th('app.doc.deadline'), esc(fmtDate(r.deadline))) : '') +
        (r.contact ? kv('phoneCall', OwedI18n.th('app.doc.contact'), contact, contact.charAt(0) === '<' ? '' : EN_ATTR) : '') +
        (r.source_url ? kv('doc', OwedI18n.th('app.doc.source'), ruleLink(r.source_url, 'rc-link')) : '') +
        (r.explainer && r.explainer.url ? kv('scales', OwedI18n.th('app.doc.explainer'), orgLink(r.explainer, 'rc-link')) : '') +
      '</dl>' +
      (m.reason ? '<p class="rc-why">' + OwedI18n.th('app.doc.why', { reason: m.reason }) + '</p>' : '');
  }

  /* the first clause of a note, at most `max` words, never ending on a
     dangling little word — the full note is one tap away under Details */
  var DANGLING = /^(a|an|the|and|or|of|from|for|after|if|when|with|on|in|to|at|by|than|but|as|that|which|who|once|until|unless|while|is|are|was|be|you|your|it|its|they|we|this|per|up|any|about)$/i;
  // i18n-data: the same little words in French and Spanish, by the language of the RULE's text
  // (lowercase; an elided form is written with a straight apostrophe)
  var DANGLING_WORDS = {
    fr: ['le', 'la', 'les', "l'", 'un', 'une', 'des', 'du', 'de', "d'", 'au', 'aux', 'à', 'et', 'ou', 'ni', 'mais',
      'en', 'pour', 'par', 'sur', 'sous', 'dans', 'avec', 'sans', 'chez', 'vers', 'entre', 'contre', 'selon', 'après', 'avant',
      'depuis', 'dès', "jusqu'", "jusqu'à", 'pendant', 'si', "s'", 'que', "qu'", 'qui', 'dont', 'où', 'quand', 'lorsque', "lorsqu'", 'comme',
      'ce', 'cet', 'cette', 'ces', "c'", 'son', 'sa', 'ses', 'votre', 'vos', 'leur', 'leurs', 'mon', 'ma', 'mes', 'notre', 'nos',
      'vous', 'il', 'elle', 'ils', 'elles', 'on', 'nous', 'se', 'ne', "n'", 'y', 'est', 'sont', 'était', 'être', 'a', 'ont',
      'plus', 'moins', 'tout', 'toute', 'tous', 'toutes', 'chaque', 'environ'],
    es: ['el', 'la', 'los', 'las', 'lo', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'a', 'y', 'e', 'o', 'u', 'ni', 'pero',
      'en', 'con', 'sin', 'por', 'para', 'desde', 'hasta', 'hacia', 'entre', 'sobre', 'tras', 'ante', 'bajo', 'según', 'durante',
      'si', 'que', 'quien', 'quienes', 'cual', 'cuales', 'cuando', 'donde', 'como', 'mientras',
      'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas', 'su', 'sus', 'tu', 'tus', 'mi', 'mis', 'nuestro', 'nuestra',
      'usted', 'ustedes', 'se', 'le', 'les', 'me', 'te', 'nos', 'es', 'son', 'está', 'están', 'fue', 'ser', 'ha', 'han',
      'más', 'menos', 'cada', 'cualquier', 'todo', 'toda', 'todos', 'todas', 'aproximadamente']
  };
  function dangles(word, lang) {
    var list = DANGLING_WORDS[lang];
    if (!list) return DANGLING.test(word);
    return list.indexOf(String(word).toLowerCase().replace(/’/g, "'")) !== -1;
  }
  /* lang: the rule's language (rule._lang); English when not given */
  function firstClause(text, max, lang) {
    var t = String(text || '').trim();
    if (!t) return '';
    var clause = t.split(/\.\s|,\s|;\s|:\s|\s[—–-]\s|\s\(/)[0].replace(/\.+$/, '');
    // French sets a no-break space before : and ; so the clause can end on one
    if (DANGLING_WORDS[lang]) clause = clause.replace(/\s+$/, '');
    var words = clause.split(/\s+/);
    if (words.length <= max) return clause;
    words = words.slice(0, max);
    while (words.length > 2 && dangles(words[words.length - 1], lang)) words.pop();
    return words.join(' ') + '…';
  }

  /* how_to_claim as numbered steps: one sentence each, at most four —
     anything past the fourth joins the last so no instruction is dropped */
  var ABBREV = /(^|\s)([A-Z]|St|Ave|Rd|Dr|Mr|Mrs|Ms|No|Inc|Ltd|Co|vs|approx|e\.g|i\.e|etc)\.$/;
  // i18n-data: where a sentence ends, by the language of the RULE's text. English is as it
  // always was. French and Spanish also end on … and past a closing » ” " ) (French sets a
  // space before »), take a lowercase start after « “ ( ¿ ¡ as a continuation, accented
  // letters included, and know their own abbreviations.
  var SENTENCE = {
    en: { split: /([.!?]+)\s+/, abbrev: ABBREV, cont: /^[a-z]/ },
    fr: {
      split: /([.!?…]+(?:\s?»|[”")\]])*)\s+/,
      abbrev: /(^|[\s(«])(\p{Lu}|MM|Mme|Mmes|Mlle|Dr|Pr|Me|St|Ste|av|Av|boul|Boul|bd|Bd|ch|app|no|No|tél|env|min|max|etc|ex|cf|Cie|cie|Inc|inc|Ltée|ltée|art|c\.-à-d|J\.-C)\.$/u,
      cont: /^[«“"(\s]*\p{Ll}/u
    },
    es: {
      split: /([.!?…]+(?:\s?»|[”")\]])*)\s+/,
      abbrev: /(^|[\s(¿¡«])(\p{Lu}|Sr|Sra|Srta|Sres|Dr|Dra|Ud|Uds|Vd|Vds|Av|av|Avda|avda|núm|Núm|nro|Nro|tel|Tel|aprox|etc|ej|pág|art|Cía|cía|S\.A|S\.L|EE\.UU|dcha|izq)\.$/u,
      cont: /^[«“"(¿¡\s]*\p{Ll}/u
    }
  };
  /* lang: the rule's language (rule._lang); English when not given */
  function steps(text, lang) {
    var rules = SENTENCE[lang] || SENTENCE.en;
    var raw = String(text || '').trim().split(rules.split);
    var out = [];
    for (var i = 0; i < raw.length; i += 2) {
      var s = (raw[i] || '').trim();
      if (!s) continue;
      // French keeps the no-break space it sets before ! ? and »
      if (rules !== SENTENCE.en) s = raw[i].replace(/^\s+/, '');
      s += (raw[i + 1] || '');
      // "805 W. 5th Street" / "e.g. the receipt": an abbreviation or a
      // lowercase continuation is not a sentence break — rejoin
      var prev = out[out.length - 1];
      if (prev && (rules.abbrev.test(prev) || rules.cont.test(s))) out[out.length - 1] = prev + ' ' + s;
      else out.push(s);
    }
    if (out.length > 4) out = out.slice(0, 3).concat([out.slice(3).join(' ')]);
    return out;
  }

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  /* "2026-11-02" reads as "2 November 2026"; anything else is shown as is.
     English keeps its own spelling-out (it prints what it always printed, even for
     a day the month does not have); another language asks OwedI18n.date, which
     shows an impossible day as written */
  function fmtDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    var d = m ? Number(m[3]) : 0;
    if (!m || !MONTHS[Number(m[2]) - 1] || d < 1 || d > 31) return String(s || '');
    if (OwedI18n.lang !== 'en') return OwedI18n.date(m[0]);
    return d + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1];
  }

  function linkify(s) {
    var v = String(s).trim();
    // only ever emit http(s) and tel: hrefs — a hand-edited corpus must not be
    // able to introduce a javascript: or data: link
    if (/^https?:\/\//i.test(v)) {
      // the link shows its site, not the whole address
      var host = v.replace(/^https?:\/\/(www\.)?/i, '').replace(/[\/?#].*$/, '');
      return '<a href="' + esc(v) + '" target="_blank" rel="noopener noreferrer">' + esc(host || v) + NEW_TAB + '</a>';
    }
    if (/^[+()\d][\d\s().+-]{6,}$/.test(v)) {
      return '<a href="tel:' + esc(v.replace(/[^+\d]/g, '')) + '">' + esc(v) + '</a>';
    }
    return esc(v);
  }

  resEls.groups.addEventListener('click', function (e) {
    var moreBtn = e.target.closest('[data-more]');
    if (moreBtn) {
      var box = moreBtn.previousElementSibling;
      if (box) {
        var opening = box.hidden;
        box.hidden = !opening;
        if (!moreBtn.dataset.show) moreBtn.dataset.show = moreBtn.textContent;
        moreBtn.textContent = opening ? (moreBtn.dataset.hide || OwedI18n.t('app.results.fold.hide')) : moreBtn.dataset.show;
        moreBtn.setAttribute('aria-expanded', opening ? 'true' : 'false');
        if (opening) { var firstToggle = box.querySelector('[data-toggle]'); if (firstToggle) firstToggle.focus(); }
        else moreBtn.scrollIntoView({ block: 'nearest' });
      }
      return;
    }

    var card = e.target.closest('.rcard');
    if (!card || e.target.closest('a')) return;
    var m = findMatch(card.dataset.rule);
    if (!m) return;

    // three panes: any click on a card selects it into the panel; its button
    // goes straight on to the script there
    if (isWide()) {
      if (e.target.closest('[data-script]')) { selectRule(m, { focus: false, render: false }); showScript(m); }
      else selectRule(m, { focus: true });
      return;
    }

    var toggle = e.target.closest('[data-toggle]');
    if (toggle) {
      var body = card.querySelector('.rc-body');
      var open = body.hidden;
      body.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      return;
    }

    if (e.target.closest('[data-script]')) showScript(m);
  });

  /* ---------------- detail panel (>= 1200px) ---------------- */
  function selectRule(m, opts) {
    if (m && m.rule && S.pushRecent) S.pushRecent({ ruleId: m.rule.id, itemId: current.item && current.item.id, title: m.rule.title, lang: m.rule._lang || 'en' });
    opts = opts || {};
    selected = m;
    Array.prototype.forEach.call(resEls.groups.querySelectorAll('.rcard'), function (c) {
      var on = !!m && c.dataset.rule === m.rule.id;
      c.classList.toggle('is-selected', on);
      if (on) c.setAttribute('aria-current', 'true'); else c.removeAttribute('aria-current');
    });
    if (!m) return;
    if (opts.render !== false) {
      detail.body.className = 'detail-body';
      detail.body.innerHTML = renderDetail(m);
      panelMode = 'rule';
    }
    detail.panel.hidden = false;
    if (opts.focus) focusView('detail');
  }

  /* the rule as a document card (Mistral Le Chat): a small top bar with the
     kind of thing and the status pill, the body, one black action */
  function renderDetail(m) {
    var r = m.rule;
    var s = STRENGTH[m.strength] || STRENGTH['long shot'];
    return '<div class="doc">' +
      '<div class="doc-top">' + ico(SRC_ICON[r.source_type] || 'box', 18) +
        '<span class="doc-kicker">' + OwedI18n.th('app.doc.kicker') + '</span>' + pill(m.strength) +
      '</div>' +
      '<div class="doc-body">' +
        '<h2 class="dp-title" id="detailTitle" tabindex="-1"' + langAttr(r) + '>' + esc(r.title) + '</h2>' +
        '<p class="dp-key">' + esc(s.key) + '</p>' +
        docBody(m, 'h3') +
      '</div>' +
      '<div class="doc-foot">' +
        '<button class="btn btn-accent" type="button" data-script>' + OwedI18n.th('app.doc.getWords') + '</button>' +
      '</div>' +
    '</div>';
  }

  detail.body.addEventListener('click', function (e) {
    if (panelMode === 'script') { handleScriptClick(e, true); return; }
    if (panelMode === 'rule' && selected && e.target.closest('[data-script]')) showScript(selected);
  });

  /* redraw the results in place without moving focus, keeping the selected
     rule and an open script — used when the region changes and when the
     1200px line is crossed (fold-out cards <-> the panel) */
  function redrawResults() {
    if (!current.item) return;
    if (el.views.results.hidden && el.views.script.hidden) return;
    var wasScript = !el.views.script.hidden || panelMode === 'script';
    var keep = wasScript && scrCurrent ? scrCurrent.match : selected;
    showResults(S.getItem(current.item.id) || current.item, true);
    var again = keep && findMatch(keep.rule.id);
    if (!again) return;
    if (wasScript) showScript(again, true);
    else if (isWide()) selectRule(again, { focus: false });
  }
  if (wideMQ.addEventListener) wideMQ.addEventListener('change', redrawResults);
  else if (wideMQ.addListener) wideMQ.addListener(redrawResults);

  function findMatch(ruleId) {
    for (var i = 0; i < current.matches.length; i++) {
      if (current.matches[i].rule.id === ruleId) return current.matches[i];
    }
    return null;
  }

  /* ---------------- script view ---------------- */
  var scrBody = document.getElementById('scrBody');
  var scrCurrent = null;

  /* the facts the reader must get right in bold: the rule's name, the item,
     when it was bought — only where a line actually carries them. The phrases are
     the values the engine put into the line (the title, the name, the age phrase), so
     this finds them in any language. langs[i]: a lang for phrase i when it is not
     in the page's language (the rule's title), else empty */
  function boldPhrases(line, phrases, langs) {
    var l = String(line), lower = l.toLowerCase();
    var ranges = [];
    (phrases || []).forEach(function (p, n) {
      var t = String(p || '').trim();
      if (t.length < 3) return;
      var i = lower.indexOf(t.toLowerCase());
      if (i === -1) return;
      var overlaps = ranges.some(function (r) { return i < r[1] && i + t.length > r[0]; });
      if (!overlaps) ranges.push([i, i + t.length, (langs && langs[n]) || '']);
    });
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var out = '', at = 0;
    ranges.forEach(function (r) {
      out += esc(l.slice(at, r[0])) + '<b' + (r[2] ? ' lang="' + esc(r[2]) + '"' : '') + '>' + esc(l.slice(r[0], r[1])) + '</b>';
      at = r[1];
    });
    return out + esc(l.slice(at));
  }

  function showScript(m, keepFocus) {
    var s = E.script(m, current.item, user);
    var r = m.rule;
    scrCurrent = { match: m, script: s };
    // three panes: the script takes the panel's place and the list stays put
    var inPanel = isWide() && !el.views.results.hidden;

    var L = langAttr(r);
    var rows = '';
    if (s.who) rows += kv('phoneCall', OwedI18n.th('app.script.who'), linkify(s.who));
    // the title is the rule's language and the link beside it the page's; marked on the dd
    // and the link, not a span, so `dd:has(> a:first-child)` still lines the row up
    rows += kv('doc', OwedI18n.th('app.script.rule'), esc(r.title) + ruleLink(r.source_url, 'rc-link', !!L), L);
    if (s.deadline) rows += kv('calendar', OwedI18n.th('app.doc.deadline'), esc(fmtDate(s.deadline)));

    // the facts to get right: the rule's name, the thing, when it was bought
    var keyPhrases = [r.title, current.item && current.item.name, E.agePhrase(current.item && current.item.ageMonths)];
    var keyLangs = [L ? ruleLang(r) : '', '', ''];
    // a hint in the rule's language carries the age in that language too; bold it there as well
    // (the hint paragraph already carries the rule's lang, so the <b> needs none of its own)
    if ((r._lang || 'en') !== OwedI18n.lang) {
      keyPhrases.push(E.agePhrase(current.item && current.item.ageMonths, r._lang || 'en'));
      keyLangs.push('');
    }
    // the paragraph from the rule's own hint is in the rule's language. engine.script() writes
    // hello, bought, rule, [serial], [hint], close: with a hint, it is the one before the last
    var hintAt = L && typeof s.hintIndex === 'number' ? s.hintIndex : -1;

    var top = inPanel
      ? '<div class="doc-top">' +
          '<button class="btn btn-quiet scr-back" id="scrBack" type="button">' + ico('back', 18) + ' ' + OwedI18n.th('app.script.backToRule') + '</button>' +
          '<span class="doc-kicker">' + OwedI18n.th('app.script.kicker') + '</span>' +
          pill(m.strength) +
        '</div>'
      : '<div class="doc-top">' +
          '<button class="iconbtn scr-back" id="scrBack" type="button" aria-label="' + esc(OwedI18n.t('app.script.backToResults')) + '">' + ico('back') + '</button>' +
          '<span class="doc-kicker">' + OwedI18n.th('app.script.kicker') + '</span>' +
          pill(m.strength) +
        '</div>';

    var html =
      '<div class="scr-card doc">' + top +
        '<div class="doc-body">' +
          '<h2 class="scr-for"' + (inPanel ? ' id="detailTitle"' : '') + '>' + OwedI18n.th('app.script.heading') + '</h2>' +
          '<dl class="scr-kv">' + rows + '</dl>' +
          '<div class="scr-lines">' +
            s.lines.map(function (l, i) { return '<p' + (i === hintAt ? L : '') + '>' + boldPhrases(l, keyPhrases, keyLangs) + '</p>'; }).join('') +
          '</div>' +
          '<p class="scr-help">' + OwedI18n.th('app.script.help') + '</p>' +
        '</div>' +
        '<div class="doc-foot">' +
          '<button class="btn btn-accent" type="button" id="copyScript">' + OwedI18n.th('app.script.copy') + '</button>' +
          '<button class="btn btn-ghost" type="button" id="sendScript">' + OwedI18n.th('app.script.send') + '</button>' +
          '<button class="btn btn-ghost" type="button" id="markAsked">' + OwedI18n.th('app.script.asked') + '</button>' +
          '<button class="btn btn-ghost" type="button" id="markWon">' + OwedI18n.th('app.script.won') + '</button>' +
          '<button class="btn btn-ghost" type="button" id="printClaim">' + OwedI18n.th('app.script.print') + '</button>' +
        '</div>' +
      '</div>';

    if (inPanel) {
      selectRule(m, { focus: false, render: false });
      scrBody.innerHTML = '';   // the narrow-layout copy would keep the same ids
      detail.body.className = 'detail-body is-script';
      detail.body.innerHTML = html;
      panelMode = 'script';
      detail.panel.hidden = false;
      if (!keepFocus) focusView('script');
      return;
    }
    scrBody.innerHTML = html;
    show('script');
    if (!keepFocus) focusView('script');
  }

  scrBody.addEventListener('click', function (e) { handleScriptClick(e, false); });

  function handleScriptClick(e, inPanel) {
    if (e.target.closest('#scrBack')) {
      if (inPanel) { selectRule(selected || (scrCurrent && scrCurrent.match), { focus: true }); }
      else { show('results'); focusView('results'); }
      return;
    }
    if (!scrCurrent) return;
    var copy = e.target.closest('#copyScript');
    if (copy) {
      var done = function () {
        copy.textContent = OwedI18n.t('app.script.copied');
        toast(OwedI18n.t('app.script.copiedToast'));   // the button label alone is not announced
        setTimeout(function () { copy.textContent = OwedI18n.t('app.script.copy'); }, 1800);
      };
      var failed = function () { toast(OwedI18n.t('app.script.copyFailed')); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(scrCurrent.script.text).then(done, failed);
      } else { failed(); }
      return;
    }
    if (e.target.closest('#sendScript')) {
      // through Owed = straight to them, from the reader's own email app or their page;
      // there is no server here, so nothing is sent on their behalf or stored
      var rule = scrCurrent.match.rule, text = scrCurrent.script.text;
      var contact = String(rule.contact || '').trim();
      var subject = current.item && current.item.name
        ? OwedI18n.t('app.script.subjectItem', { title: rule.title, name: current.item.name })
        : OwedI18n.t('app.script.subject', { title: rule.title });
      var putOnClipboard = function (then) {
        // the clipboard call can hang behind a permission prompt: never let that block the send
        var fired = false, go = function () { if (!fired) { fired = true; then(); } };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(go, go); else go();
        setTimeout(go, 500);
      };
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) {
        location.href = 'mailto:' + contact + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(text);
        toast(OwedI18n.t('app.script.sentEmail'));
      } else if (/^https?:\/\//i.test(contact)) {
        putOnClipboard(function () { window.open(contact, '_blank', 'noopener'); toast(OwedI18n.t('app.script.sentLink')); });
      } else if (/^\+?[\d\s().-]{7,}$/.test(contact)) {
        putOnClipboard(function () { toast(OwedI18n.t('app.script.sentPhone', { phone: contact })); if (/Mobi|Android/i.test(navigator.userAgent)) location.href = 'tel:' + contact.replace(/[^\d+]/g, ''); });
      } else {
        putOnClipboard(function () { toast(OwedI18n.t('app.script.sentOther')); if (rule.source_url) window.open(rule.source_url, '_blank', 'noopener'); });
      }
      return;
    }
    if (e.target.closest('#markAsked')) {
      if (!S.setClaimState(current.item.id, scrCurrent.match.rule.id, 'asked')) { showStart(); return; }
      toast(OwedI18n.t('app.script.askedToast'));
      renderShelf();
      return;
    }
    if (e.target.closest('#printClaim')) { printClaim(); return; }
        if (e.target.closest('#markWon')) {
      var ruleId = scrCurrent.match.rule.id;
      // null when the item was removed in another tab: nothing to count
      if (!S.setClaimState(current.item.id, ruleId, 'won')) { showStart(); return; }
      toast(OwedI18n.t('app.script.wonToast'));
      renderShelf();
      if (inPanel) {
        // stay on this rule in the panel rather than jumping to the top
        showResults(S.getItem(current.item.id) || current.item, true);
        var again = findMatch(ruleId);
        if (again) selectRule(again, { focus: true }); else focusView('results');
      } else {
        showResults(S.getItem(current.item.id) || current.item);
      }
    }
  }

  /* ---------------- help (mobile settings list) ---------------- */
  function showHelp() {
    show('help');
    setTab('help');
    focusView('help');
  }

  function showThings() {
    if (current.item) {
      showResults(current.item);
      setShelfOpen(true);
    } else {
      showStart();
    }
  }

  Array.prototype.forEach.call(el.tabs, function (t) {
    t.addEventListener('click', function () {
      var name = t.dataset.tab;
      if (name === 'things') showThings();
      else if (name === 'check') { if (document.body.getAttribute('data-tab') !== 'check') startNew(''); }
      else showHelp();
    });
  });

  // the Help screen exists only on a phone; widen out of it and go home
  function onMediaChange() {
    if (!isMobile() && document.body.getAttribute('data-tab') === 'help') showThings();
  }
  if (mobileMQ.addEventListener) mobileMQ.addEventListener('change', onMediaChange);
  else if (mobileMQ.addListener) mobileMQ.addListener(onMediaChange);

  /* ---------------- keyboard ---------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return;
    // inside a field, Escape belongs to the field (closing a datalist or a
    // select) — it must never throw away what was typed or the results
    if (e.target.closest && e.target.closest('input, select, textarea')) return;
    if (!el.views.script.hidden) { show('results'); focusView('results'); }
    else if (document.body.getAttribute('data-tab') === 'help') { showThings(); }
    else if (!el.views.results.hidden) {
      // in the panel: script -> its rule -> back to the card in the list
      if (panelMode === 'script') { selectRule(selected || scrCurrent.match, { focus: true }); return; }
      if (panelMode === 'rule' && detail.panel.contains(document.activeElement)) {
        var back = resEls.groups.querySelector('.rcard.is-selected [data-toggle]');
        if (back) { back.focus(); return; }
      }
      showStart();
    }
    else if (!el.views.wizard.hidden) {
      // question 1 with nothing being edited is already the start screen
      if (wiz.step === 1 && !wiz.editingId) return;
      wizEls.back.click();
    }
  });

  /* ---------------- load corpus, then go ---------------- */
  renderShelf();
  showStart();
  booting = false;

  E.load('data/coverage.json').then(function (n) {
    // a round figure: the book grows, and an exact count reads as a promise
    var round = Math.floor(n / 100) * 100;
    el.corpusNote.textContent = n >= 100
      ? OwedI18n.t('app.corpus.over', { count: OwedI18n.lang === 'en' ? String(round) : OwedI18n.num(round) })
      : counted('app.corpus.count', n);
    renderShelf();
    // if the user clicked an item while the rulebook was still loading, redraw it
    if (current.item && !el.views.results.hidden) showResults(current.item, true);

    var pending = params.get('new');
    if (pending) {
      history.replaceState(null, '', 'app.html');
      startNew(pending);
    } else if (isDemo && S.getShelf().length && params.get('start') !== 'new') {
      // start=new keeps the demo on question one (the launch film opens there)
      showResults(S.getShelf()[0]);
    }
  }).catch(function (err) {
    if (window.console && console.error) console.error('rulebook', err);
    corpusFailed = true;
    el.corpusNote.textContent = OwedI18n.t('app.corpus.failed');
    toast(OwedI18n.t('app.corpus.failedToast'));
  });

  /* ---------------- result filter chips ----------------
     Operates on whatever has already been rendered, so it does not need to
     know how results are built. Re-applies on every fresh render. */
  (function resultFilter() {
    var bar = resEls.filter;
    var groups = resEls.groups;
    var active = 'all';

    /* A filter that matches nothing used to collapse the whole results area
       to zero height with no message at all. */
    var empty = document.createElement('p');
    empty.className = 'res-filter-empty';
    empty.hidden = true;
    empty.setAttribute('role', 'status');
    groups.parentNode.insertBefore(empty, groups.nextSibling);

    // one whole sentence per filter id (data-f in app.html), counted by the rows that did match
    var EMPTY = { strong: 'app.filter.empty.strong', worth: 'app.filter.empty.worth', longshot: 'app.filter.empty.longshot' };

    function apply() {
      // a filter is a request to see those rows, so fold-outs open
      if (active !== 'all') {
        Array.prototype.forEach.call(groups.querySelectorAll('.rgroup-more[hidden]'), function (box) {
          box.hidden = false;
          var t = box.nextElementSibling;
          if (t && t.hasAttribute('data-more')) t.remove();
        });
      }
      var cards = groups.querySelectorAll('.rcard');
      Array.prototype.forEach.call(cards, function (c) {
        c.classList.toggle('is-hidden', active !== 'all' && !c.classList.contains(active));
      });
      // a group whose every row is filtered out should go too
      Array.prototype.forEach.call(groups.querySelectorAll('.rgroup'), function (g) {
        var any = g.querySelector('.rcard:not(.is-hidden)');
        g.hidden = !any;
      });
      var shown = groups.querySelectorAll('.rcard:not(.is-hidden)').length;
      var blank = active !== 'all' && cards.length > 0 && shown === 0;
      empty.hidden = !blank;
      // (a blank filter is always one of the three: 'all' never filters anything out)
      if (blank && EMPTY[active]) {
        empty.textContent = counted(EMPTY[active], cards.length);
      }
    }

    bar.addEventListener('click', function (e) {
      var b = e.target.closest('.fchip');
      if (!b) return;
      active = b.dataset.f;
      Array.prototype.forEach.call(bar.querySelectorAll('.fchip'), function (c) {
        c.classList.toggle('is-on', c === b);
        c.setAttribute('aria-pressed', String(c === b));
      });
      apply();
    });
    // results are re-rendered wholesale, so re-apply when the list changes
    new MutationObserver(apply).observe(groups, { childList: true });
  })();

})();
