/* ============================================================
   Owed — app controller
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

  var el = {
    userName: document.getElementById('userName'),
    avatar: document.getElementById('avatar'),
    regionPick: document.getElementById('regionPick'),
    signOut: document.getElementById('signOutBtn'),
    shelfList: document.getElementById('shelfList'),
    shelfEmpty: document.getElementById('shelfEmpty'),
    statItems: document.getElementById('statItems'),
    statOpen: document.getElementById('statOpen'),
    statWon: document.getElementById('statWon'),
    addBtn: document.getElementById('addBtn'),
    corpusNote: document.getElementById('corpusNote'),
    welcomeStart: document.getElementById('welcomeStart'),
    toast: document.getElementById('toast'),
    views: {
      welcome: document.getElementById('viewWelcome'),
      wizard: document.getElementById('viewWizard'),
      results: document.getElementById('viewResults'),
      script: document.getElementById('viewScript')
    }
  };

  el.userName.textContent = user.name || 'You';
  el.avatar.textContent = (user.name || 'Y').trim().charAt(0).toUpperCase();
  el.regionPick.value = user.region || 'US';

  el.regionPick.addEventListener('change', function () {
    S.updateUser({ region: el.regionPick.value });
    user = S.getUser();
    toast('Region set to ' + el.regionPick.options[el.regionPick.selectedIndex].text);
    if (current.item) showResults(current.item, true);
  });

  el.signOut.addEventListener('click', function () {
    S.signOut();
    location.href = 'index.html';
  });

  /* ---------------- helpers ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var toastTimer = null;
  function toast(msg) {
    // the node stays in the accessibility tree at all times — writing into a
    // `hidden` live region is never announced
    el.toast.hidden = false;
    el.toast.textContent = msg;
    requestAnimationFrame(function () { el.toast.classList.add('show'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.toast.classList.remove('show');
      setTimeout(function () { el.toast.textContent = ''; }, 400);
    }, 2400);
  }

  function show(name) {
    Object.keys(el.views).forEach(function (k) {
      el.views[k].hidden = (k !== name);
    });
  }

  /* Re-rendering the shelf replaces the button the user was standing on, so
     focus has to be placed deliberately or it falls back to <body>. */
  function focusView(name) {
    var target = ({
      results: document.getElementById('resTitle'),
      welcome: document.getElementById('welcomeTitle'),
      script: document.getElementById('scrBack'),
      wizard: document.querySelector('.wiz-step.is-on .wiz-q')
    })[name];
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    try { target.focus({ preventScroll: true }); } catch (e) { target.focus(); }
  }

  var current = { item: null, matches: [] };
  var corpusFailed = false;

  /* ---------------- shelf ---------------- */
  function renderShelf() {
    var shelf = S.getShelf();
    el.shelfList.innerHTML = '';
    el.shelfEmpty.hidden = shelf.length > 0;

    var openClaims = 0;
    var totalNew = 0;

    shelf.forEach(function (item) {
      var matches = E.loaded ? E.match(withRegion(item)) : [];
      openClaims += matches.length;

      // anything matched now that this item had not been shown before
      var fresh = E.loaded
        ? S.newRulesFor(item.id, matches.map(function (m) { return m.rule.id; }))
        : [];
      totalNew += fresh.length;

      var li = document.createElement('li');
      li.className = 'shelf-row';
      var won = hasWin(item);
      var label = esc(item.name || itemLabel(item));
      // the remove button is a SIBLING of the card button: interactive
      // elements may not nest inside a <button>
      li.innerHTML =
        '<button class="shelf-card' + (current.item && current.item.id === item.id ? ' is-on' : '') +
        (fresh.length ? ' has-new' : '') +
        '" type="button"' + (current.item && current.item.id === item.id ? ' aria-current="true"' : '') +
        ' data-id="' + esc(item.id) + '">' +
          '<span class="sc-name">' + label + '</span>' +
          '<span class="sc-meta">' + esc(C.categoryLabel(item.category)) + ' · ' +
            esc(E.agePhrase(item.ageMonths)) + '</span>' +
          '<span class="sc-tags">' +
            (fresh.length ? '<span class="tag tag-strong">' + fresh.length + ' new</span>' : '') +
            (won ? '<span class="tag tag-strong">Claimed</span>' : '') +
            (matches.length
              ? '<span class="tag tag-long">' + matches.length + ' to try</span>'
              : '<span class="tag tag-long">nothing yet</span>') +
          '</span>' +
        '</button>' +
        '<button class="sc-x" type="button" data-remove="' + esc(item.id) + '" ' +
          'aria-label="Remove ' + label + ' from your shelf" title="Remove">×</button>';
      el.shelfList.appendChild(li);
    });

    if (totalNew && !renderShelf.announced) {
      renderShelf.announced = true;
      toast(totalNew + ' new ' + (totalNew === 1 ? 'rule' : 'rules') + ' matched things on your shelf.');
    }

    el.statItems.textContent = shelf.length;
    el.statOpen.textContent = openClaims;
    el.statWon.textContent = S.rescuedCount();
  }

  function hasWin(item) {
    var c = item.claims || {};
    return Object.keys(c).some(function (k) { return c[k].state === 'won'; });
  }

  function itemLabel(item) {
    return [item.brand, C.categoryLabel(item.category)].filter(Boolean).join(' ');
  }

  function withRegion(item) {
    var copy = {};
    Object.keys(item).forEach(function (k) { copy[k] = item[k]; });
    copy.region = user.region || item.region || 'US';
    return copy;
  }

  function removeFromShelf(id) {
    var item = S.getItem(id);
    if (!item) return;
    var row = el.shelfList.querySelector('[data-remove="' + CSS.escape(String(id)) + '"]');
    var idx = row ? Array.prototype.indexOf.call(el.shelfList.children, row.closest('.shelf-row')) : -1;

    S.removeItem(id);
    if (current.item && current.item.id === id) {
      current.item = null;
      show('welcome');
      focusView('welcome');
    }
    renderShelf();

    // don't strand focus on the button we just deleted
    var rows = el.shelfList.children;
    var next = rows[Math.min(idx, rows.length - 1)];
    var nextCard = next && next.querySelector('.shelf-card');
    (nextCard || el.addBtn).focus();

    toast('Removed ' + (item.name || 'that') + ' from your shelf.');
  }

  el.shelfList.addEventListener('click', function (e) {
    var x = e.target.closest('[data-remove]');
    if (x) {
      e.stopPropagation();
      removeFromShelf(x.dataset.remove);
      return;
    }
    var btn = e.target.closest('.shelf-card');
    if (!btn) return;
    var item = S.getItem(btn.dataset.id);
    if (item) showResults(item);
  });


  /* ---------------- wizard ---------------- */
  var wiz = {
    step: 1,
    name: '', category: null, brand: '', ageMonths: null, payment: null, broken: true,
    editingId: null
  };

  var wizEls = {
    back: document.getElementById('wizBack'),
    bar: document.getElementById('wizBar'),
    count: document.getElementById('wizCount'),
    next: document.getElementById('wizNext'),
    skip: document.getElementById('wizSkip'),
    name: document.getElementById('wizName'),
    brand: document.getElementById('wizBrand'),
    brandList: document.getElementById('brandList'),
    catChips: document.getElementById('catChips'),
    catDetected: document.getElementById('catDetected'),
    brandChips: document.getElementById('brandChips'),
    ageOpts: document.getElementById('ageOpts'),
    payOpts: document.getElementById('payOpts'),
    broken: document.getElementById('wizBroken')
  };

  // populate static option lists once
  C.BRANDS.forEach(function (b) {
    var o = document.createElement('option');
    o.value = b;
    wizEls.brandList.appendChild(o);
  });

  wizEls.ageOpts.innerHTML = C.AGES.map(function (a) {
    return '<button class="opt" type="button" aria-pressed="false" data-age="' + a.id + '">' +
      '<span class="opt-radio" aria-hidden="true"></span>' + esc(a.label) + '</button>';
  }).join('');

  wizEls.payOpts.innerHTML = C.PAYMENTS.map(function (p) {
    return '<button class="opt" type="button" aria-pressed="false" data-pay="' + esc(p.id) + '">' +
      '<span class="opt-radio" aria-hidden="true"></span>' + esc(p.label) + '</button>';
  }).join('');

  function startWizard(prefill, editItem) {
    wiz = { step: 1, name: '', category: null, brand: '', ageMonths: null,
            payment: null, broken: true, editingId: null };

    if (editItem) {
      wiz.editingId = editItem.id;
      wiz.name = editItem.name || '';
      wiz.category = editItem.category;
      wiz.brand = editItem.brand || '';
      wiz.ageMonths = editItem.ageMonths;
      wiz.payment = editItem.payment;
      wiz.broken = editItem.broken !== false;
    } else if (prefill) {
      wiz.name = prefill;
      wiz.category = C.guessCategory(prefill);
      wiz.brand = C.guessBrand(prefill) || '';
    }

    wizEls.name.value = wiz.name;
    wizEls.brand.value = wiz.brand;
    wizEls.broken.checked = wiz.broken;
    renderCatChips();
    renderBrandChips();
    syncOptions();
    goStep(1);
    show('wizard');
    setTimeout(function () { wizEls.name.focus(); }, 120);
  }

  function renderCatChips() {
    var popular = ['headphones', 'phone', 'laptop', 'appliance-large', 'appliance-small', 'power-tool', 'footwear', 'kitchen'];
    var list = wiz.category && popular.indexOf(wiz.category) === -1
      ? [wiz.category].concat(popular) : popular;
    wizEls.catChips.innerHTML = list.map(function (id) {
      var on = wiz.category === id;
      return '<button class="chip' + (on ? ' is-on' : '') +
        '" aria-pressed="' + on + '" type="button" data-cat="' + esc(id) + '">' + esc(C.categoryLabel(id)) + '</button>';
    }).join('');
    if (wiz.category) {
      wizEls.catDetected.hidden = false;
      wizEls.catDetected.textContent = 'Reading that as: ' + C.categoryLabel(wiz.category) +
        '. Tap another if that is wrong.';
    } else {
      wizEls.catDetected.hidden = true;
    }
  }

  function renderBrandChips() {
    var common = ['Apple', 'Samsung', 'Sony', 'Bose', 'Dyson', 'Whirlpool', 'DeWalt', 'Nike'];
    var list = wiz.brand && common.indexOf(wiz.brand) === -1 ? [wiz.brand].concat(common) : common;
    wizEls.brandChips.innerHTML = list.slice(0, 9).map(function (b) {
      var on = wiz.brand.toLowerCase() === b.toLowerCase();
      return '<button class="chip' + (on ? ' is-on' : '') +
        '" aria-pressed="' + on + '" type="button" data-brand="' + esc(b) + '">' + esc(b) + '</button>';
    }).join('');
  }

  function syncOptions() {
    Array.prototype.forEach.call(wizEls.ageOpts.children, function (b) {
      var on = Number(b.dataset.age) === Number(wiz.ageMonths);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    Array.prototype.forEach.call(wizEls.payOpts.children, function (b) {
      var on = b.dataset.pay === wiz.payment;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
  }

  wizEls.catChips.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-cat]');
    if (!chip) return;
    wiz.category = chip.dataset.cat;
    renderCatChips();
  });

  wizEls.brandChips.addEventListener('click', function (e) {
    var chip = e.target.closest('[data-brand]');
    if (!chip) return;
    wiz.brand = chip.dataset.brand;
    wizEls.brand.value = wiz.brand;
    renderBrandChips();
  });

  wizEls.name.addEventListener('input', function () {
    wiz.name = wizEls.name.value;
    var guess = C.guessCategory(wiz.name);
    if (guess) wiz.category = guess;
    var gb = C.guessBrand(wiz.name);
    if (gb && !wiz.brand) { wiz.brand = gb; wizEls.brand.value = gb; renderBrandChips(); }
    renderCatChips();
  });

  wizEls.brand.addEventListener('input', function () {
    wiz.brand = wizEls.brand.value;
    renderBrandChips();
  });

  wizEls.ageOpts.addEventListener('click', function (e) {
    var b = e.target.closest('[data-age]');
    if (!b) return;
    wiz.ageMonths = Number(b.dataset.age);
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

  function goStep(n) {
    wiz.step = Math.max(1, Math.min(4, n));
    Array.prototype.forEach.call(document.querySelectorAll('.wiz-step'), function (s) {
      s.classList.toggle('is-on', Number(s.dataset.step) === wiz.step);
    });
    wizEls.bar.style.width = (wiz.step / 4 * 100) + '%';
    wizEls.count.textContent = wiz.step + ' of 4';
    wizEls.next.textContent = wiz.step === 4 ? 'See what you are owed' : 'Continue';
    wizEls.skip.hidden = (wiz.step === 1 || wiz.step === 4);
    focusView('wizard');
  }

  wizEls.next.addEventListener('click', function () {
    if (wiz.step === 1) {
      if (!wiz.name.trim() && !wiz.category) {
        toast('Tell me what it is first');
        wizEls.name.focus();
        return;
      }
      if (!wiz.category) wiz.category = 'other';
    }
    if (wiz.step === 4) { finishWizard(); return; }
    goStep(wiz.step + 1);
  });

  wizEls.skip.addEventListener('click', function () { goStep(wiz.step + 1); });

  wizEls.back.addEventListener('click', function () {
    if (wiz.step === 1) {
      show('welcome');
      renderShelf();
      focusView('welcome');
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
      ageMonths: wiz.ageMonths == null ? 14 : wiz.ageMonths,
      payment: wiz.payment || 'unknown',
      broken: wiz.broken,
      region: user.region || 'US'
    };

    var item;
    if (wiz.editingId) {
      item = S.updateItem(wiz.editingId, payload);
    } else {
      item = S.addItem(payload);
    }
    renderShelf();
    showResults(item);
  }

  el.addBtn.addEventListener('click', function () { startWizard(''); });
  el.welcomeStart.addEventListener('click', function () { startWizard(''); });

  /* ---------------- results ---------------- */
  var resEls = {
    title: document.getElementById('resTitle'),
    sub: document.getElementById('resSub'),
    summary: document.getElementById('resSummary'),
    groups: document.getElementById('resGroups'),
    none: document.getElementById('resNone'),
    back: document.getElementById('resBack'),
    recheck: document.getElementById('resRecheck')
  };

  resEls.back.addEventListener('click', function () {
    current.item = null;
    renderShelf();
    show('welcome');
    focusView('welcome');
  });

  resEls.recheck.addEventListener('click', function () {
    if (current.item) startWizard(null, current.item);
  });

  var STRENGTH_CLASS = { 'strong': 'strong', 'worth asking': 'worth', 'long shot': 'longshot' };
  var STRENGTH_PILL = { 'strong': 'tag-strong', 'worth asking': 'tag-maybe', 'long shot': 'tag-long' };

  function showResults(item, keepFocus) {
    current.item = item;

    // Never say "nothing matched" when the truth is "the rulebook isn't here yet".
    if (!E.loaded) {
      current.matches = [];
      resEls.title.textContent = item.name || itemLabel(item);
      resEls.sub.textContent = '';
      resEls.summary.className = 'res-summary none';
      resEls.summary.innerHTML = corpusFailed
        ? '<span class="res-sum-num">!</span>' +
          '<span class="res-sum-text"><b>The rulebook did not load.</b>' +
          '<small>This is not a result about your item — reload the page. ' +
          'If you opened the files directly, serve them over http instead.</small></span>'
        : '<span class="res-sum-num">…</span>' +
          '<span class="res-sum-text"><b>Still opening the rulebook.</b>' +
          '<small>One moment — this will fill in by itself.</small></span>';
      resEls.groups.innerHTML = '';
      resEls.none.hidden = true;
      show('results');
      if (!keepFocus) focusView('results');
      return;
    }

    var matches = E.match(withRegion(item));
    current.matches = matches;

    resEls.title.textContent = item.name || itemLabel(item);
    resEls.sub.textContent = [
      C.categoryLabel(item.category),
      item.brand || 'brand unknown',
      E.agePhrase(item.ageMonths),
      C.paymentLabel(item.payment)
    ].join(' · ');

    var strong = matches.filter(function (m) { return m.strength === 'strong'; }).length;

    if (!matches.length) {
      resEls.summary.className = 'res-summary none';
      resEls.summary.innerHTML =
        '<span class="res-sum-num">0</span>' +
        '<span class="res-sum-text"><b>Nothing matched this one.</b>' +
        '<small>It stays on your shelf and gets re-checked whenever the rulebook grows.</small></span>';
      resEls.groups.innerHTML = '';
      resEls.none.hidden = false;
    } else {
      resEls.none.hidden = true;
      // Be precise about the split: calling 30 leads "worth asking" when most
      // are long shots is the promise-vs-lead conflation this product avoids.
      var longShots = matches.filter(function (m) { return m.strength === 'long shot'; }).length;
      var realLeads = matches.length - longShots;
      var headline;
      if (realLeads > 0) {
        // the numeral beside this already prints the count
        headline = realLeads === 1 ? 'place worth asking' : 'places worth asking';
        if (strong && realLeads > 1) {
          headline += strong === realLeads ? ', all of them strong' : ', ' + strong + ' of them strong';
        }
        headline += '.';
      } else {
        headline = (longShots === 1 ? 'long shot' : 'long shots') + ' below, none of them strong.';
      }
      var tail = realLeads > 0 && longShots
        ? 'Start at the top. There ' + (longShots === 1 ? 'is also one weaker one' : 'are also ' + longShots + ' weaker ones') +
          ' further down, worth a look only if the first few fail.'
        : 'Start at the top — they are ordered by how likely they are to say yes.';

      resEls.summary.className = realLeads > 0 ? 'res-summary' : 'res-summary none';
      resEls.summary.innerHTML =
        '<span class="res-sum-num tnum">' + (realLeads > 0 ? realLeads : longShots) + '</span>' +
        '<span class="res-sum-text"><b>' + esc(headline) + '</b>' +
        '<small>' + esc(tail) + '</small></span>';

      resEls.groups.innerHTML = E.group(matches).map(renderGroup).join('');
    }

    // remember which rules we have shown, so new ones can be flagged later
    S.markSeen(item.id, matches.map(function (m) { return m.rule.id; }));

    show('results');
    renderShelf();
    if (!keepFocus) focusView('results');
  }

  var GROUP_VISIBLE = 3;

  function renderGroup(g) {
    var lead = g.items.slice(0, GROUP_VISIBLE);
    var rest = g.items.slice(GROUP_VISIBLE);

    return '<section class="rgroup">' +
      '<div class="rgroup-head">' +
        '<h2 class="rgroup-title">' + esc(g.label) + '</h2>' +
        '<span class="rgroup-count">' + g.items.length + '</span>' +
      '</div>' +
      lead.map(renderCard).join('') +
      (rest.length
        ? '<div class="rgroup-more" hidden>' + rest.map(renderCard).join('') + '</div>' +
          '<button class="btn btn-ghost rgroup-toggle" type="button" data-more>' +
          'Show ' + rest.length + ' weaker ' + (rest.length === 1 ? 'one' : 'ones') + '</button>'
        : '') +
    '</section>';
  }

  function renderCard(m) {
    var r = m.rule;
    var cls = STRENGTH_CLASS[m.strength] || 'longshot';
    var pill = STRENGTH_PILL[m.strength] || 'tag-long';
    var deadline = r.deadline
      ? '<div class="rc-row"><dt>Claim by</dt><dd><b>' + esc(r.deadline) + '</b></dd></div>' : '';
    var contact = r.contact
      ? '<div class="rc-row"><dt>Who to contact</dt><dd>' + linkify(r.contact) + '</dd></div>' : '';

    return '<article class="rcard ' + cls + '" data-rule="' + esc(r.id) + '">' +
      '<button class="rc-top" type="button" data-toggle aria-expanded="false">' +
        '<div class="rc-main">' +
          '<div class="rc-title">' + esc(r.title) + '</div>' +
          '<div class="rc-get">' + esc(r.what_you_get) + '</div>' +
          (m.reason ? '<div class="rc-why">Matched because ' + esc(m.reason) + '</div>' : '') +
        '</div>' +
        '<div class="rc-side">' +
          '<span class="tag ' + pill + '">' + esc(m.strength) + '</span>' +
          '<svg class="rc-chev" viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 8 5 5 5-5"/></svg>' +
        '</div>' +
      '</button>' +
      '<div class="rc-body">' +
        '<dl>' +
          '<div class="rc-row"><dt>Timing</dt><dd>' + esc(r.window_note) + '</dd></div>' +
          '<div class="rc-row"><dt>How to claim</dt><dd>' + esc(r.how_to_claim) + '</dd></div>' +
          contact + deadline +
        '</dl>' +
        '<div class="rc-actions">' +
          '<button class="btn btn-accent" type="button" data-script>Get the words to say</button>' +
          '<button class="btn btn-ghost" type="button" data-won>Mark as won</button>' +
        '</div>' +
        (r.source_url ? '<p class="rc-src">Source: ' + linkify(r.source_url) + '</p>' : '') +
      '</div>' +
    '</article>';
  }

  function linkify(s) {
    var v = String(s).trim();
    // only ever emit http(s) and tel: hrefs — a hand-edited corpus must not be
    // able to introduce a javascript: or data: link
    if (/^https?:\/\//i.test(v)) {
      return '<a href="' + esc(v) + '" target="_blank" rel="noopener noreferrer">' + esc(v) + '</a>';
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
    if (!card) return;

    var toggle = e.target.closest('[data-toggle]');
    if (toggle) {
      var open = card.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      return;
    }
    var m = findMatch(card.dataset.rule);
    if (!m) return;

    if (e.target.closest('[data-script]')) {
      showScript(m);
    } else if (e.target.closest('[data-won]')) {
      S.setClaimState(current.item.id, m.rule.id, 'won');
      toast('Nice — counted as one kept out of landfill.');
      renderShelf();
    }
  });

  function findMatch(ruleId) {
    for (var i = 0; i < current.matches.length; i++) {
      if (current.matches[i].rule.id === ruleId) return current.matches[i];
    }
    return null;
  }

  /* ---------------- script view ---------------- */
  var scrBody = document.getElementById('scrBody');
  document.getElementById('scrBack').addEventListener('click', function () {
    show('results');
    focusView('results');
  });

  function showScript(m) {
    var s = E.script(m, current.item, user);
    var r = m.rule;

    scrBody.innerHTML =
      '<div class="scr-card">' +
        '<div class="scr-top">' +
          '<h2 class="scr-for">' + esc(r.title) + '</h2>' +
          '<span class="tag ' + (STRENGTH_PILL[m.strength] || 'tag-long') + '">' + esc(m.strength) + '</span>' +
        '</div>' +
        '<div class="scr-lines">' +
          s.lines.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') +
        '</div>' +
        '<div class="scr-foot">' +
          '<button class="btn btn-accent" type="button" id="copyScript">Copy the script</button>' +
          '<button class="btn btn-ghost" type="button" id="markWon">I got it — mark as won</button>' +
        '</div>' +
      '</div>' +
      '<div class="scr-meta">' +
        (s.who ? '<div class="scr-block"><h3>Who to contact</h3><p>' + linkify(s.who) + '</p></div>' : '') +
        (s.deadline ? '<div class="scr-block"><h3>Deadline</h3><p>Claim by <b>' + esc(s.deadline) + '</b>. After that this one closes for good.</p></div>' : '') +
        '<div class="scr-block"><h3>Before you call</h3><p>' + esc(r.how_to_claim) + '</p></div>' +
        '<div class="scr-block"><h3>Read it yourself</h3><p>' +
          (r.source_url ? linkify(r.source_url) : 'No public link recorded for this one — treat it as a lead to check, not a promise.') +
        '</p></div>' +
      '</div>';

    document.getElementById('copyScript').addEventListener('click', function () {
      var btn = this;
      var done = function () {
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = 'Copy the script'; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(s.text).then(done, done);
      } else { done(); }
    });

    document.getElementById('markWon').addEventListener('click', function () {
      S.setClaimState(current.item.id, r.id, 'won');
      toast('Counted. That is one thing that stays out of the bin.');
      renderShelf();
      show('results');
      focusView('results');
      showResults(current.item);
    });

    show('script');
    focusView('script');
  }

  /* ---------------- keyboard ---------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!el.views.script.hidden) { show('results'); focusView('results'); }
    else if (!el.views.results.hidden) { resEls.back.click(); }
    else if (!el.views.wizard.hidden) { wizEls.back.click(); }
  });

  /* ---------------- load corpus, then go ---------------- */
  renderShelf();
  show('welcome');

  E.load('data/coverage.json').then(function (n) {
    el.corpusNote.textContent = n + ' rules loaded — warranties, card benefits, payouts and consumer law.';
    renderShelf();
    // if the user clicked an item while the rulebook was still loading, redraw it
    if (current.item) showResults(current.item, true);

    var pending = params.get('new');
    if (pending) {
      history.replaceState(null, '', 'app.html');
      startWizard(pending);
    } else if (isDemo && S.getShelf().length) {
      showResults(S.getShelf()[0]);
    }
  }).catch(function () {
    corpusFailed = true;
    el.corpusNote.textContent = 'Could not load the rulebook — try refreshing.';
    toast('The rulebook failed to load.');
  });

  /* ---------------- result filter chips ----------------
     Operates on whatever app.js has already rendered, so it does not need to
     know how results are built. Also re-hides on every fresh render. */
  (function resultFilter() {
    var bar = document.getElementById('resFilter');
    var groups = document.getElementById('resGroups');
    if (!bar || !groups) return;
    var active = 'all';

    /* A filter that matches nothing used to collapse the whole results area
       to zero height with no message at all - the reader is left staring at
       a blank panel wondering whether it broke. */
    var empty = document.createElement('p');
    empty.className = 'res-filter-empty muted';
    empty.hidden = true;
    empty.setAttribute('role', 'status');
    groups.parentNode.insertBefore(empty, groups.nextSibling);

    var LABEL = { strong: 'strong leads', worth: 'worth asking', longshot: 'long shots' };

    function apply() {
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

  /* ---------------- shelf filter ---------------- */
  (function shelfFilter() {
    var input = document.getElementById('shelfFilter');
    var list = document.getElementById('shelfList');
    if (!input || !list) return;
    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      Array.prototype.forEach.call(list.querySelectorAll('.shelf-row'), function (row) {
        row.hidden = !!q && row.textContent.toLowerCase().indexOf(q) === -1;
      });
    });
  })();

})();
