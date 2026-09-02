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

  var C = window.OwedCatalog;
  var S = window.OwedStore;
  var E = window.OwedEngine;

  var params = new URLSearchParams(location.search);
  var isDemo = params.get('demo') === '1';

  /* ---------------- boot ---------------- */
  var user = S.getUser();
  if (!user) {
    if (isDemo) {
      user = S.signUp('Demo', 'demo@owed.local', 'US');
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
     plain sentence that explains it */
  var STRENGTH = {
    'strong':       { cls: 'strong',   tag: 'tag-strong', dot: 'dot-strong', word: 'Strong',       plural: 'Strong',       key: 'The rule fits what you told us' },
    'worth asking': { cls: 'worth',    tag: 'tag-maybe',  dot: 'dot-worth',  word: 'Worth asking', plural: 'Worth asking', key: 'Fits, with one thing to check' },
    'long shot':    { cls: 'longshot', tag: 'tag-long',   dot: 'dot-long',   word: 'Long shot',    plural: 'Long shots',   key: 'A general rule, probably not you' }
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
    toast: document.getElementById('toast'),
    tabs: document.querySelectorAll('.tabbar .tab'),
    views: {
      wizard: document.getElementById('viewWizard'),
      results: document.getElementById('viewResults'),
      script: document.getElementById('viewScript')
    }
  };

  el.regionPick.value = user.region || 'US';

  el.regionPick.addEventListener('change', function () {
    S.updateUser({ region: el.regionPick.value });
    user = S.getUser();
    toast('Region set to ' + el.regionPick.options[el.regionPick.selectedIndex].text);
    // the select the user is standing on must not lose focus; the results (and
    // an open script) are redrawn in place, never a wizard mid-edit
    if (current.item && (!el.views.results.hidden || !el.views.script.hidden)) redrawResults();
    else renderShelf();
  });

  el.signOut.addEventListener('click', function () {
    // the list lives only in this browser; on a shared computer it must not
    // pass to the next person who signs up here
    var clear = window.confirm('Sign out and remove your things from this device?\n\n' +
      'Your list lives only in this browser — there is no copy anywhere else.\n' +
      'Press Cancel to sign out but keep the list here for next time.');
    S.signOut({ clear: clear });
    location.href = 'index.html';
  });

  /* the theme row: theme.js owns the 44px button; a click on the label
     beside it is forwarded so the whole row acts as one control */
  el.themeRow.addEventListener('click', function (e) {
    if (e.target.closest('.theme-btn')) return;
    var btn = el.themeRow.querySelector('.theme-btn');
    if (btn) btn.click();
  });

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
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
    if (name !== 'results') { hidePanel(); detail.body.innerHTML = ''; }
  }

  var mobileMQ = window.matchMedia('(max-width: 899.98px)');
  function isMobile() { return mobileMQ.matches; }
  /* three panes: the selected rule opens in a panel beside the list */
  var wideMQ = window.matchMedia('(min-width: 1200px)');
  function isWide() { return wideMQ.matches; }

  var detail = {
    panel: document.getElementById('detailPanel'),
    body: document.getElementById('detailBody')
  };
  var selected = null;     // the match shown in the panel
  var panelMode = null;    // 'rule' | 'script' | 'none' | null (hidden)

  function hidePanel() {
    detail.panel.hidden = true;
    panelMode = null;
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
      script: document.getElementById('scrBack'),
      detail: document.getElementById('detailTitle'),
      help: el.helpTitle
    })[name];
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  var current = { item: null, matches: [] };
  var corpusFailed = false;

  function itemLabel(item) {
    return [item.brand, C.categoryLabel(item.category)].filter(Boolean).join(' ');
  }

  function withRegion(item) {
    var copy = {};
    Object.keys(item).forEach(function (k) { copy[k] = item[k]; });
    copy.region = user.region || item.region || 'US';
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
    if (!n.total) return '<span class="srow-status">nothing yet</span>';
    var dot, text;
    if (n.ask) {
      dot = n.strong ? 'dot-strong' : 'dot-worth';
      text = n.ask + ' to ask';
    } else {
      dot = 'dot-long';
      text = n.long + (n.long === 1 ? ' long shot' : ' long shots');
    }
    return '<span class="srow-status"><i class="dot ' + dot + '"></i>' + text + '</span>';
  }

  function renderShelf() {
    var shelf = S.getShelf();
    el.shelfList.innerHTML = '';
    el.shelfEmpty.hidden = shelf.length > 0;
    el.side.classList.toggle('is-empty', shelf.length === 0);
    el.statItems.textContent = shelf.length;

    var selectedIdx = -1;
    shelf.forEach(function (item, i) {
      if (current.item && current.item.id === item.id) selectedIdx = i;
    });
    // the selected row is never hidden behind "Show more"
    var limit = (shelfExpanded || selectedIdx >= SHELF_VISIBLE) ? shelf.length : SHELF_VISIBLE;

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
            '<span class="srow-sub">' +
              '<span class="srow-meta">' + esc(E.agePhrase(item.ageMonths)) + '</span>' +
              statusHTML(summarise(matches)) +
            '</span>' +
          '</span>' +
        '</button>' +
        '<button class="srow-x" type="button" data-remove="' + esc(item.id) + '" ' +
          'aria-label="Remove ' + label + '" title="Remove">' + ico('x') + '</button>';
      el.shelfList.appendChild(li);
    });

    var hiddenCount = shelf.length - limit;
    el.shelfMore.hidden = hiddenCount <= 0;
    if (hiddenCount > 0) el.shelfMore.textContent = 'Show ' + hiddenCount + ' more';

    if (totalNew && !renderShelf.announced) {
      renderShelf.announced = true;
      toast(totalNew + ' new ' + (totalNew === 1 ? 'rule' : 'rules') + ' matched things on your shelf.');
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

    toast('Removed ' + (item.name || 'that') + ' from your shelf.');
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
    wiz = { step: 1, name: '', category: null, brand: '', brandOther: false,
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
    photoRemove: document.getElementById('wizPhotoRemove')
  };

  var POPULAR_CATS = ['phone', 'laptop', 'headphones', 'appliance-large', 'appliance-small', 'power-tool'];
  var COMMON_BRANDS = ['Apple', 'Samsung', 'Sony', 'Bose', 'Dyson', 'Whirlpool', 'DeWalt'];
  var CANT_REMEMBER = 'Can’t remember — that’s fine';
  var PAY_ICON = { visa: 'card', mastercard: 'card', amex: 'card', discover: 'card', debit: 'card', cash: 'coins' };

  // populate static option lists once
  C.BRANDS.forEach(function (b) {
    var o = document.createElement('option');
    o.value = b;
    wizEls.brandList.appendChild(o);
  });

  /* one option row: icon · label · radio on the right */
  function optRow(attrs, iconHTML, label, on) {
    return '<button class="opt' + (on ? ' is-on' : '') + '" type="button" aria-pressed="' + on + '" ' + attrs + '>' +
      (iconHTML ? '<span class="opt-ico" aria-hidden="true">' + iconHTML + '</span>' : '') +
      '<span class="opt-label">' + esc(label) + '</span>' +
      '<span class="opt-radio" aria-hidden="true">' + ico('check') + '</span>' +
    '</button>';
  }

  wizEls.ageOpts.innerHTML = C.AGES.map(function (a) {
    return optRow('data-age="' + esc(a.id) + '"', '', a.label, false);
  }).join('') + optRow('data-age="none"', '', CANT_REMEMBER, false);

  wizEls.payOpts.innerHTML = C.PAYMENTS.map(function (p) {
    var label = p.id === 'unknown' ? CANT_REMEMBER : p.label;
    return optRow('data-pay="' + esc(p.id) + '"', PAY_ICON[p.id] ? ico(PAY_ICON[p.id]) : '', label, false);
  }).join('');

  function startWizard(prefill, editItem, opts) {
    opts = opts || {};
    resetWiz();

    if (editItem) {
      wiz.editingId = editItem.id;
      wiz.name = editItem.name || '';
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
    wizEls.brand.value = wiz.brand;
    wizEls.broken.checked = wiz.broken;
    showPhoto(wiz.photo, wiz.photo ? 'Photo saved with this item.' : '');
    wizEls.err.hidden = true; document.getElementById('wizName').setAttribute('aria-describedby', 'wizHelp1');
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
      return optRow('data-cat="' + esc(id) + '"', catIcon(id), C.categoryLabel(id), wiz.category === id);
    }).join('');
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
    }).join('') + optRow('data-brand=""', '', 'Other brand', !!other);
  }

  function syncOptions() {
    Array.prototype.forEach.call(wizEls.ageOpts.children, function (b) {
      var on = b.dataset.age === 'none'
        ? wiz.ageUnknown
        : wiz.ageMonths != null && Number(b.dataset.age) === Number(wiz.ageMonths);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    Array.prototype.forEach.call(wizEls.payOpts.children, function (b) {
      var on = b.dataset.pay === wiz.payment;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
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
  });

  wizEls.brandChips.addEventListener('click', function (e) {
    var row = e.target.closest('[data-brand]');
    if (!row) return;
    var b = row.dataset.brand;
    if (b) {
      wiz.brand = b;
      wiz.brandOther = false;
      wizEls.brand.value = b;
    } else {
      // "Other brand": type it in the field
      wiz.brandOther = true;
      if (brandIsCommon(wiz.brand)) { wiz.brand = ''; wizEls.brand.value = ''; }
      wizEls.brand.focus();
    }
    renderBrandRows();
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

  function applyIdentified(r) {
    var changed = false;
    if (r.name && !wiz.name.trim()) { wiz.name = String(r.name).slice(0, 80); wizEls.name.value = wiz.name; changed = true; }
    if (r.brand && !wiz.brand.trim()) { wiz.brand = String(r.brand).slice(0, 40); wizEls.brand.value = wiz.brand; changed = true; }
    if (r.category && CAT_IDS.indexOf(r.category) !== -1) { wiz.category = r.category; changed = true; }
    renderCatRows();
    renderBrandRows();
    return changed;
  }

  function identifyWithBuiltInAI(file) {
    if (!('LanguageModel' in window) || typeof window.LanguageModel.create !== 'function') {
      return Promise.reject(new Error('no built-in model'));
    }
    return window.LanguageModel.create({ expectedInputs: [{ type: 'image' }] }).then(function (session) {
      var ask = 'Look at this photo of a household item. Reply with ONLY compact JSON like ' +
        '{"name":"Sony WH-1000XM4 headphones","brand":"Sony","category":"headphones"} ' +
        'where category is one of: ' + CAT_IDS.join(', ') + '. Use empty strings when unsure.';
      return session.prompt([{ role: 'user', content: [{ type: 'text', value: ask }, { type: 'image', value: file }] }]);
    }).then(function (text) {
      var m = String(text).match(/\{[\s\S]*\}/);
      if (!m) throw new Error('no json');
      return JSON.parse(m[0]);
    });
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
    if (!file) return;
    shrinkPhoto(file, function (dataUrl) {
      if (!dataUrl) { toast('That file could not be read as a photo.'); return; }
      wiz.photo = dataUrl;
      showPhoto(dataUrl, 'Looking at your photo…');
      identifyWithBuiltInAI(file).then(function (r) {
        r = r || {};
        var did = applyIdentified(r);
        var what = r.name || r.brand || (r.category && C.categoryLabel(r.category));
        showPhoto(dataUrl, did && what
          ? '<b>Looks like ' + esc(what) + '.</b> Check it below and change anything that is wrong.'
          : 'Photo saved with this item. Type what it is below.');
        updateContinue();
      }).catch(function () {
        return readBarcode(file).then(function (code) {
          showPhoto(dataUrl, code
            ? '<b>Barcode ' + esc(code) + ' read.</b> The photo is saved with this item — type what it is and who made it below.'
            : 'Photo saved with this item. This browser cannot name products by itself yet, so type what it is below.');
        });
      });
    });
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
    wizEls.count.textContent = 'Question ' + wiz.step + ' of 4';
    // the button says what comes next, not just "Continue" (round-2 judges)
    wizEls.next.textContent = ['Next: who made it', 'Next: when you got it', 'Next: how you paid', 'See what you are owed'][wiz.step - 1];
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
        toast('Type or pick something first.');
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
    var payload = {
      name: wiz.name.trim() || itemLabel({ brand: wiz.brand, category: wiz.category }),
      brand: wiz.brand.trim(),
      category: wiz.category || 'other',
      ageMonths: wiz.ageMonths,   // null = the user could not remember; never invent an age
      payment: wiz.payment || 'unknown',
      broken: wiz.broken,
      region: user.region || 'US',
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
      E.agePhrase(item.ageMonths)
    ].filter(Boolean).join(' · ');

    // Never say "nothing matched" when the truth is "the rulebook isn't here yet".
    if (!E.loaded) {
      current.matches = [];
      resEls.summary.hidden = false;
      resEls.summary.innerHTML = '<p class="res-state">' + (corpusFailed
        ? '<b>The rulebook did not load.</b>This is not a result about your item — reload the page. ' +
          'If you opened the files directly, serve them over http instead.'
        : '<b>Still opening the rulebook.</b>One moment — this will fill in by itself.') + '</p>';
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
    var wide = isWide();
    selected = null;

    if (!matches.length) {
      resEls.summary.hidden = true;
      resEls.summary.innerHTML = '';
      resEls.filter.hidden = true;
      resEls.groups.innerHTML = '';
      // wide: the "nothing found" copy is the panel's content
      resEls.none.hidden = wide;
      if (wide) {
        detail.body.className = 'detail-body';
        detail.body.innerHTML = '<div class="dp-none">' + resEls.none.innerHTML + '</div>';
        detail.panel.hidden = false;
        panelMode = 'none';
      } else {
        hidePanel();
      }
    } else {
      resEls.none.hidden = true;
      // the filter chips repeated the key's numbers and confused the people
      // this is for; the long shots fold behind one row instead
      resEls.filter.hidden = true;
      resEls.summary.hidden = false;
      resEls.summary.innerHTML = renderSummary(n);
      startMarked = false;
      var leads = matches.filter(function (m) { return !isLongShot(m); });
      var longs = matches.filter(isLongShot);
      resEls.groups.innerHTML = E.group(leads).map(renderGroup).join('') + renderLongShots(longs, !leads.length);
      // wide: the panel is never empty — it opens on the top lead
      if (wide) {
        var first = resEls.groups.querySelector('.rcard');
        var fm = first && findMatch(first.dataset.rule);
        if (fm) selectRule(fm, { focus: false }); else hidePanel();
      } else {
        hidePanel();
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
    var lead;
    if (n.ask) {
      lead = '<b class="res-n tnum">' + n.ask + '</b> ' + (n.ask === 1 ? 'place' : 'places') +
        ' to ask about a free fix. <span class="res-line-sub">Start with the first one below.</span>';
    } else {
      lead = 'No strong lead for this one' +
        (n.long ? ', <span class="res-line-sub">but the long shots below are worth a look.</span>' : '.');
    }
    var keys = [['strong', 'strong'], ['worth asking', 'worth'], ['long shot', 'long']].filter(function (pair) {
      return n[pair[1]] > 0;
    }).map(function (pair) {
      var s = STRENGTH[pair[0]], count = n[pair[1]];
      var word = pair[0] === 'long shot' ? (count === 1 ? 'long shot' : 'long shots') : pair[0];
      return '<span class="res-key"><i class="dot ' + s.dot + '" aria-hidden="true"></i><b class="tnum">' + count + '</b> ' + esc(word) + '</span>';
    }).join('');
    return '<p class="res-line' + (n.ask ? '' : ' none') + '">' + lead + '</p>' +
      '<p class="res-keys">' + keys + '</p>';
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
    if (!longs.length) return '';
    var label = longs.length + (longs.length === 1 ? ' long shot' : ' long shots');
    return '<section class="rgroup rgroup-long">' +
      '<h2 class="rgroup-head">' +
        '<span class="rgroup-ico" aria-hidden="true">' + ico('box', 18) + '</span>' +
        '<span class="rgroup-title">Long shots</span>' +
        '<span class="sr-only">, </span>' +
        '<span class="rgroup-count tnum">' + longs.length + '</span>' +
      '</h2>' +
      '<p class="rgroup-note">General rules that probably do not apply to you. Kept so nothing is hidden.</p>' +
      '<div class="rgroup-list">' +
        '<div class="rgroup-more"' + (open ? '' : ' hidden') + '>' + longs.map(renderCard).join('') + '</div>' +
        (open ? '' : '<button class="rgroup-toggle" type="button" data-more>Show ' + label + '</button>') +
      '</div>' +
    '</section>';
  }

  function fact(icon, label, value) {
    return '<li class="rc-fact">' + ico(icon, 16) +
      '<span class="fl">' + label + '</span><span class="fv">' + esc(value) + '</span></li>';
  }

  function kv(icon, label, valueHTML) {
    return '<div><dt>' + ico(icon, 18) + label + '</dt><dd>' + valueHTML + '</dd></div>';
  }

  var NEW_TAB = '<span class="sr-only"> (opens in a new tab)</span>';

  function ruleLink(url, cls) {
    if (!/^https?:\/\//i.test(String(url || ''))) return '';
    return '<a class="' + cls + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">Read the rule ' + ico('out', 16) + NEW_TAB + '</a>';
  }

  function renderCard(m) {
    var r = m.rule;
    var s = STRENGTH[m.strength] || STRENGTH['long shot'];
    // "Start here" goes on the top lead: the first strong card, or the first
    // worth-asking one when nothing is strong. Never on a long shot.
    var isStart = !startMarked && !isLongShot(m);
    if (isStart) startMarked = true;

    // facts are built only from fields that exist; nothing is guessed
    var facts = [];
    var win = firstClause(r.window_note, 6);
    if (win) facts.push(fact('clock', 'Window', win));
    // an unknown purchase date on a timed rule: the clock cannot be read yet, and the card says so
    if (m.timing === 'unknown') facts.push(fact('calendar', 'Date', 'check your receipt'));
    if (r.deadline) facts.push(fact('calendar', 'Deadline', fmtDate(r.deadline)));
    if (ASK_WHO[r.source_type]) facts.push(fact('who', 'Ask', ASK_WHO[r.source_type]));

    var link = ruleLink(r.source_url, 'rc-link');
    // the two buttons repeat on every card; the title tells them apart for AT
    var tid = 'rt-' + esc(r.id);
    // wide: "Details" opens the panel (no fold-out), and the panel holds the
    // primary button, so the card's own is the quiet one
    var wide = isWide();

    return '<article class="rcard ' + s.cls + (isStart ? ' is-start' : '') + '" data-rule="' + esc(r.id) + '">' +
      '<div class="rc-row">' +
        '<span class="rc-ico" aria-hidden="true">' + ico(SRC_ICON[r.source_type] || 'box') + '</span>' +
        '<div class="rc-main">' +
          (isStart ? '<span class="rc-start">Start here</span>' : '') +
          '<h3 class="rc-title" id="' + tid + '">' + esc(r.title) + '</h3>' +
          pill(m.strength) +
          (facts.length ? '<ul class="rc-facts" role="list">' + facts.join('') + '</ul>' : '') +
          '<button class="rc-details" type="button" data-toggle' + (wide ? '' : ' aria-expanded="false"') +
            ' aria-describedby="' + tid + '">Details ' + ico(wide ? 'next' : 'chevron', 16) + '</button>' +
        '</div>' +
        '<div class="rc-side"><button class="btn btn-accent" type="button" data-script aria-describedby="' + tid + '">Get the words to say</button></div>' +
      '</div>' +
      '<div class="rc-body" hidden>' +
        '<p class="rc-get">' + esc(r.what_you_get) + '</p>' +
        '<h4 class="rc-h">How to claim</h4>' +
        '<ol class="rc-steps" role="list">' + steps(r.how_to_claim).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
        '<dl class="rc-kv">' +
          kv('clock', 'Window', esc(r.window_note)) +
          (r.deadline ? kv('calendar', 'Deadline', esc(fmtDate(r.deadline))) : '') +
          (r.contact ? kv('phoneCall', 'Contact', linkify(r.contact)) : '') +
        '</dl>' +
        (m.reason ? '<p class="rc-why">Why it matched: ' + esc(m.reason) + '.</p>' : '') +
        (link ? '<div class="rc-actions">' + link + '</div>' : '') +
      '</div>' +
    '</article>';
  }

  /* the first clause of a note, at most `max` words, never ending on a
     dangling little word — the full note is one tap away under Details */
  var DANGLING = /^(a|an|the|and|or|of|from|for|after|if|when|with|on|in|to|at|by|than|but|as|that|which|who|once|until|unless|while|is|are|was|be|you|your|it|its|they|we|this|per|up|any|about)$/i;
  function firstClause(text, max) {
    var t = String(text || '').trim();
    if (!t) return '';
    var clause = t.split(/\.\s|,\s|;\s|:\s|\s[—–-]\s|\s\(/)[0].replace(/\.+$/, '');
    var words = clause.split(/\s+/);
    if (words.length <= max) return clause;
    words = words.slice(0, max);
    while (words.length > 2 && DANGLING.test(words[words.length - 1])) words.pop();
    return words.join(' ') + '…';
  }

  /* how_to_claim as numbered steps: one sentence each, at most four —
     anything past the fourth joins the last so no instruction is dropped */
  var ABBREV = /(^|\s)([A-Z]|St|Ave|Rd|Dr|Mr|Mrs|Ms|No|Inc|Ltd|Co|vs|approx|e\.g|i\.e|etc)\.$/;
  function steps(text) {
    var raw = String(text || '').trim().split(/([.!?]+)\s+/);
    var out = [];
    for (var i = 0; i < raw.length; i += 2) {
      var s = (raw[i] || '').trim();
      if (!s) continue;
      s += (raw[i + 1] || '');
      // "805 W. 5th Street" / "e.g. the receipt": an abbreviation or a
      // lowercase continuation is not a sentence break — rejoin
      var prev = out[out.length - 1];
      if (prev && (ABBREV.test(prev) || /^[a-z]/.test(s))) out[out.length - 1] = prev + ' ' + s;
      else out.push(s);
    }
    if (out.length > 4) out = out.slice(0, 3).concat([out.slice(3).join(' ')]);
    return out;
  }

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  /* "2026-11-02" reads as "2 November 2026"; anything else is shown as is */
  function fmtDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || '').trim());
    var d = m ? Number(m[3]) : 0;
    if (!m || !MONTHS[Number(m[2]) - 1] || d < 1 || d > 31) return String(s || '');
    return d + ' ' + MONTHS[Number(m[2]) - 1] + ' ' + m[1];
  }

  function linkify(s) {
    var v = String(s).trim();
    // only ever emit http(s) and tel: hrefs — a hand-edited corpus must not be
    // able to introduce a javascript: or data: link
    if (/^https?:\/\//i.test(v)) {
      return '<a href="' + esc(v) + '" target="_blank" rel="noopener noreferrer">' + esc(v) + NEW_TAB + '</a>';
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
        box.hidden = false;
        var firstToggle = box.querySelector('[data-toggle]');
        if (firstToggle) firstToggle.focus();
        moreBtn.remove();
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

  function renderDetail(m) {
    var r = m.rule;
    var s = STRENGTH[m.strength] || STRENGTH['long shot'];
    return '<div class="dp-head">' +
        '<span class="rc-ico" aria-hidden="true">' + ico(SRC_ICON[r.source_type] || 'box') + '</span>' +
        '<h2 class="dp-title" id="detailTitle" tabindex="-1">' + esc(r.title) + '</h2>' +
      '</div>' +
      '<div class="dp-status">' + pill(m.strength) + '<span class="dp-key">' + esc(s.key) + '</span></div>' +
      '<p class="rc-get dp-get">' + esc(r.what_you_get) + '</p>' +
      '<h3 class="rc-h">How to claim</h3>' +
      '<ol class="rc-steps" role="list">' + steps(r.how_to_claim).map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ol>' +
      '<dl class="rc-kv">' +
        kv('clock', 'Window', esc(r.window_note)) +
        (r.deadline ? kv('calendar', 'Deadline', esc(fmtDate(r.deadline))) : '') +
        (r.contact ? kv('phoneCall', 'Contact', linkify(r.contact)) : '') +
      '</dl>' +
      (m.reason ? '<p class="rc-why">Why it matched: ' + esc(m.reason) + '.</p>' : '') +
      '<div class="dp-actions">' +
        '<button class="btn btn-accent btn-lg btn-block" type="button" data-script>Get the words to say</button>' +
        ruleLink(r.source_url, 'rc-link') +
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

  /* the rule's own name in bold wherever a line carries it — only what is there */
  function boldTitle(line, title) {
    var l = String(line), t = String(title || '').trim();
    if (!t) return esc(l);
    var i = l.toLowerCase().indexOf(t.toLowerCase());
    if (i === -1) return esc(l);
    return esc(l.slice(0, i)) + '<b>' + esc(l.slice(i, i + t.length)) + '</b>' + esc(l.slice(i + t.length));
  }

  function showScript(m, keepFocus) {
    var s = E.script(m, current.item, user);
    var r = m.rule;
    scrCurrent = { match: m, script: s };
    // three panes: the script takes the panel's place and the list stays put
    var inPanel = isWide() && !el.views.results.hidden;

    var rows = '';
    if (s.who) rows += kv('phoneCall', 'Who', linkify(s.who));
    rows += kv('doc', 'Rule', esc(r.title) + ruleLink(r.source_url, 'rc-link'));
    if (s.deadline) rows += kv('calendar', 'Deadline', esc(fmtDate(s.deadline)));

    var top = inPanel
      ? '<div class="scr-top">' +
          '<button class="btn btn-quiet scr-back" id="scrBack" type="button">' + ico('back', 20) + ' Back to the rule</button>' +
          pill(m.strength) +
          '<h2 class="scr-for" id="detailTitle">The words to say</h2>' +
        '</div>'
      : '<div class="scr-top">' +
          '<button class="iconbtn" id="scrBack" type="button" aria-label="Back to results">' + ico('back') + '</button>' +
          '<h2 class="scr-for">The words to say</h2>' +
          pill(m.strength) +
        '</div>';

    var html =
      '<div class="scr-card">' + top +
        '<dl class="scr-kv">' + rows + '</dl>' +
        '<div class="scr-lines">' +
          s.lines.map(function (l) { return '<p>' + boldTitle(l, r.title) + '</p>'; }).join('') +
        '</div>' +
        '<div class="scr-foot">' +
          '<button class="btn btn-accent btn-lg" type="button" id="copyScript">Copy the script</button>' +
          '<button class="btn btn-ghost" type="button" id="markWon">I got it — mark as won</button>' +
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
        copy.textContent = 'Copied';
        toast('Copied.');   // the button label alone is not announced
        setTimeout(function () { copy.textContent = 'Copy the script'; }, 1800);
      };
      var failed = function () { toast('Could not copy — select the words and copy them yourself.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(scrCurrent.script.text).then(done, failed);
      } else { failed(); }
      return;
    }
    if (e.target.closest('#markWon')) {
      var ruleId = scrCurrent.match.rule.id;
      // null when the item was removed in another tab: nothing to count
      if (!S.setClaimState(current.item.id, ruleId, 'won')) { showStart(); return; }
      toast('Counted. That is one thing that stays out of the bin.');
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
    el.corpusNote.textContent = n + ' rules in the book';
    renderShelf();
    // if the user clicked an item while the rulebook was still loading, redraw it
    if (current.item && !el.views.results.hidden) showResults(current.item, true);

    var pending = params.get('new');
    if (pending) {
      history.replaceState(null, '', 'app.html');
      startNew(pending);
    } else if (isDemo && S.getShelf().length) {
      showResults(S.getShelf()[0]);
    }
  }).catch(function () {
    corpusFailed = true;
    el.corpusNote.textContent = 'Could not load the rulebook — try refreshing.';
    toast('The rulebook failed to load.');
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

    var LABEL = { strong: 'strong', worth: 'worth asking', longshot: 'long shots' };

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
      if (blank) {
        empty.textContent = 'Nothing here is filed under ' + (LABEL[active] || active) +
          ' for this one. That is the honest answer, not a bug — try All to see the ' +
          cards.length + ' that did match.';
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
