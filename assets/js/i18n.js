/* ============================================================
   Owed — languages

   English, French and Spanish. The markup is written in English, so an
   English visitor never waits on anything here. A French or Spanish
   visitor's page is held invisible until the words are swapped, so they
   never see English flash first.

   Which language:
     1. ?lang=fr in the address (a shared link wins, and is remembered)
     2. the language the visitor chose before
     3. the browser's own languages, in order
     4. English

   Loading:
     <head>       i18n.js                    decides the language, sets <html lang>
     end of body  en.js, fr.js, es.js        each calls OwedI18n.add(); when the
                                             visitor's language is in, the markup
                                             is translated
     after that   the page's own scripts     can call t() straight away
     DOMContentLoaded + a frame              the page is revealed

   Every visitor downloads all three dictionaries (roughly 30KB gzipped,
   cached after the first visit). That is the price of loading in a fixed
   order with no document.write and no flash, and it was chosen on purpose.

   The dictionaries are flat: "app.shelf.showMore": "Show more". A plural is
   an object of CLDR forms: { "one": "{n} rule", "other": "{n} rules" }.
   Values are plain text unless used through data-i18n-html or th().

   Rules in data/coverage.json stay English. A rule shows in another language
   only where data/coverage.<lang>.json carries a translation that was checked
   against an official text in that language. English shown on a French or
   Spanish page is marked lang="en", so screen readers pronounce it as English.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'owed:lang';
  // ready: offered to visitors. Set it to true only once tools/i18n_check.py passes for that
  // language and the translation has been reviewed. On localhost every language is offered,
  // so a translation can be previewed before it ships.
  var LANGS = [
    { code: 'en', name: 'English', locale: 'en-GB', ready: true },   // en-GB: "14 October 2026", as the site has always written dates
    { code: 'fr', name: 'Français', locale: 'fr-CA', ready: false },
    { code: 'es', name: 'Español', locale: 'es-US', ready: false }
  ];
  var LOCAL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  // attributes a dictionary may set; nothing that can run code
  var ATTRS = ['aria-label', 'aria-description', 'title', 'placeholder', 'alt', 'content', 'value', 'label'];

  function find(code) {
    for (var i = 0; i < LANGS.length; i++) if (LANGS[i].code === code) return LANGS[i];
    return null;
  }

  /** A language a visitor may be switched to. */
  function usable(code) {
    var l = find(code);
    return !!l && (l.ready || LOCAL);
  }

  function fromParam() {
    try {
      var v = new URLSearchParams(location.search).get('lang');
      v = v && v.toLowerCase();
      return usable(v) ? v : null;
    } catch (e) { return null; }
  }

  function stored() {
    try { var v = localStorage.getItem(KEY); return usable(v) ? v : null; } catch (e) { return null; }
  }

  function fromBrowser() {
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language || ''];
    for (var i = 0; i < list.length; i++) {
      var c = String(list[i] || '').slice(0, 2).toLowerCase();
      if (usable(c)) return c;
    }
    return null;
  }

  var param = fromParam();
  if (param) { try { localStorage.setItem(KEY, param); } catch (e) {} }
  var lang = param || stored() || fromBrowser() || 'en';

  var root = document.documentElement;
  root.setAttribute('lang', lang);

  var dicts = {};
  var applied = false;
  var warned = {};

  function warn(msg) {
    if (LOCAL && !warned[msg]) { warned[msg] = true; console.warn('[i18n] ' + msg); }
  }

  function reveal() { root.classList.remove('i18n-pending'); }

  function revealWhenReady() {
    var go = function () { requestAnimationFrame(reveal); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', go);
    else go();
  }

  if (lang !== 'en') {
    root.classList.add('i18n-pending');
    // a dictionary that never arrives must not leave a blank page, or a page labelled French that reads English.
    // A 404 is known by DOMContentLoaded (the dictionaries are body scripts); the timer covers a request that stalls.
    var fallBack = function () {
      if (!applied) root.setAttribute('lang', 'en');
      reveal();
    };
    document.addEventListener('DOMContentLoaded', function () { if (!applied) requestAnimationFrame(fallBack); });
    setTimeout(fallBack, 4000);
  }

  function own(o, k) { return !!o && Object.prototype.hasOwnProperty.call(o, k); }

  function rawIn(code, key) {
    if (own(dicts[code], key)) return dicts[code][key];
    if (own(dicts.en, key)) return dicts.en[key];
    warn('missing key: ' + key);
    return undefined;
  }

  function raw(key) { return rawIn(lang, key); }

  /** The language a key's text will actually come out in: code (default: this page's), or 'en' when it falls back. */
  function langOf(key, code) {
    code = code || lang;
    return own(dicts[code], key) ? code : 'en';
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function interp(s, vars, escapeVars) {
    return String(s).replace(/\{(\w+)\}/g, function (m, name) {
      if (!own(vars, name)) { warn('no value for {' + name + '} in "' + s + '"'); return m; }
      var v = vars[name] == null ? '' : String(vars[name]);
      return escapeVars ? escapeHtml(v) : v;
    });
  }

  function localeOf(code) { return (find(code) || find('en')).locale; }

  // Intl objects are costly to build and these run inside loops over every matched rule, so each is built once
  var cache = {};
  function intl(Kind, loc, opts) {
    var id = Kind.name + '|' + loc + '|' + (opts ? JSON.stringify(opts) : '');
    return cache[id] || (cache[id] = new Kind(loc, opts));
  }
  function locale() { return localeOf(lang); }

  function pluralFormIn(code, forms, n) {
    var cat = 'other';
    try { cat = intl(Intl.PluralRules, localeOf(code)).select(Number(n)); }
    catch (e) { cat = Number(n) === 1 ? 'one' : 'other'; }
    if (forms[cat] != null) return forms[cat];
    if (forms.other != null) return forms.other;
    return forms.one != null ? forms.one : null;
  }

  function pluralForm(forms, n) { return pluralFormIn(lang, forms, n); }

  function resolve(key, n) {
    var v = raw(key);
    if (v == null) return null;
    if (typeof v === 'object') v = pluralForm(v, n);
    return v == null ? null : v;
  }

  function numIn(code, n, opts) {
    try { return intl(Intl.NumberFormat, localeOf(code), opts).format(n); } catch (e) { return String(n); }
  }

  function num(n, opts) { return numIn(lang, n, opts); }

  /**
   * Plain text for textContent / setAttribute. Never glue the result onto innerHTML; use th().
   * fallback: English text to show if the key is missing everywhere. Use it for keys built at
   * runtime, like 'catalog.' + id, which the dictionary check cannot see. Without it a missing
   * key shows as the key itself.
   */
  function t(key, vars, fallback) { return tIn(lang, key, vars, fallback); }

  /**
   * t() in a named language, for text that belongs to something other than the page: a rule's
   * script hint is filled with slot values in the RULE's language, and prompts to the on-device
   * model are built in English. Falls back to English like t().
   */
  function tIn(code, key, vars, fallback) {
    var r = rawIn(code, key);
    if (r == null) return fallback != null ? interp(fallback, vars || {}, false) : key;
    if (typeof r === 'object') {
      if (!vars || typeof vars.n !== 'number') warn('plural ' + key + ' read through t() without a numeric {n}: the "other" form was used');
      return pluralIn(code, key, vars && vars.n, vars);
    }
    return interp(r, vars, false);
  }

  /** For innerHTML: the dictionary text is trusted markup, every interpolated value is escaped. */
  function th(key, vars, fallback) {
    var r = raw(key);
    if (r == null) return fallback != null ? interp(escapeHtml(fallback), vars || {}, true) : escapeHtml(key);
    if (typeof r === 'object') {
      if (!vars || typeof vars.n !== 'number') warn('plural ' + key + ' read through th() without a numeric {n}: the "other" form was used');
      return plural(key, vars && vars.n, vars, true);
    }
    return interp(r, vars, true);
  }

  /** A counted phrase. The form is picked from the raw number; {n} shows it formatted for the language. */
  function plural(key, n, vars, asHtml) { return pluralIn(lang, key, n, vars, asHtml); }

  function pluralIn(code, key, n, vars, asHtml) {
    var r = rawIn(code, key);
    var v = r != null && typeof r === 'object' ? pluralFormIn(code, r, n) : r;
    if (v == null) return asHtml ? escapeHtml(key) : key;
    var all = {};
    for (var k in vars) if (own(vars, k)) all[k] = vars[k];
    all.n = numIn(code, n);
    return interp(v, all, !!asHtml);
  }

  /** "2026-10-14" or a Date. A bare date is a calendar day, never shifted by timezone; an impossible one is returned as written. */
  function date(value, opts) {
    var d = value;
    if (!(value instanceof Date)) {
      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
      if (!m) return String(value || '');
      d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      if (d.getMonth() !== Number(m[2]) - 1 || d.getDate() !== Number(m[3])) return String(value);
    }
    try {
      var f = intl(Intl.DateTimeFormat, locale(), opts || { day: 'numeric', month: 'long', year: 'numeric' });
      // French writes the first of the month "1er octobre"; Intl writes "1 octobre"
      if (lang === 'fr' && d.getDate() === 1 && f.formatToParts) {
        return f.formatToParts(d).map(function (p) { return p.type === 'day' && p.value === '1' ? '1er' : p.value; }).join('');
      }
      return f.format(d);
    } catch (e) { return String(value); }
  }

  /** ["a","b","c"] -> "a, b and c" / "a, b et c" / "a, b y c". type: 'conjunction' | 'disjunction'. */
  function list(items, type) {
    items = (items || []).filter(function (x) { return x != null && x !== ''; }).map(String);
    try {
      return intl(Intl.ListFormat, locale(), { style: 'long', type: type || 'conjunction' }).format(items);
    } catch (e) {
      if (items.length < 2) return items.join('');
      return items.slice(0, -1).join(', ') + ' ' + t(type === 'disjunction' ? 'common.or' : 'common.and') + ' ' + items[items.length - 1];
    }
  }

  function each(scope, sel, fn) {
    if (scope.nodeType === 1 && scope.matches(sel)) fn(scope);
    var els = scope.querySelectorAll(sel);
    for (var i = 0; i < els.length; i++) fn(els[i]);
  }

  // English left on a French or Spanish page is labelled as English; the label comes off once it is translated
  function markLang(el, key) {
    if (langOf(key) !== lang) {
      el.setAttribute('lang', 'en');
      el.setAttribute('data-i18n-fallback', '');
    } else if (el.hasAttribute('data-i18n-fallback')) {
      el.removeAttribute('lang');
      el.removeAttribute('data-i18n-fallback');
    }
  }

  /**
   * Translate marked-up elements under scope (default: the whole document).
   *   data-i18n="key"                     textContent (the element must hold only text)
   *   data-i18n-html="key"                innerHTML, for strings that carry markup
   *   data-i18n-attr="aria-label:key; title:key2"   (attributes in ATTRS only)
   *
   * How to use it: static markup is handled when the page loads. Anything a script renders
   * later should be built with t()/th() directly. Call apply(container) only on nodes just
   * inserted that carry data-i18n attributes. In English this does nothing, because English
   * lives in the markup, so never leave a data-i18n element empty for apply() to fill.
   * Nodes whose content already matches are left alone, so listeners inside them survive.
   */
  function apply(scope) {
    scope = scope || document;
    if (lang === 'en') return;   // the markup is already English
    each(scope, '[data-i18n]', function (el) {
      var key = el.getAttribute('data-i18n');
      var v = resolve(key);
      if (typeof v === 'string' && el.textContent !== v) {
        if (el.firstElementChild) warn('data-i18n on an element with child elements, which were wiped: ' + key + ' (use data-i18n-html)');
        el.textContent = v;
      }
      markLang(el, key);
    });
    each(scope, '[data-i18n-html]', function (el) {
      var key = el.getAttribute('data-i18n-html');
      var v = resolve(key);
      if (typeof v === 'string') {
        var tpl = document.createElement('template');
        tpl.innerHTML = v;
        if (tpl.innerHTML !== el.innerHTML) el.innerHTML = v;
      }
      markLang(el, key);
    });
    each(scope, '[data-i18n-attr]', function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
        var i = pair.indexOf(':');
        if (i < 0) return;
        var attr = pair.slice(0, i).trim().toLowerCase();
        if (ATTRS.indexOf(attr) < 0) { warn('attribute not allowed: ' + attr); return; }
        var v = resolve(pair.slice(i + 1).trim());
        if (typeof v === 'string') el.setAttribute(attr, v);
      });
    });
  }

  function textOf(html) {
    var tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent;
  }
  function squash(s) { return String(s).replace(/\s+/g, ' ').trim(); }

  // localhost only: the English markup and en.js must say the same thing, or they drift apart unseen
  function checkEnglishDrift() {
    each(document, '[data-i18n]', function (el) {
      var key = el.getAttribute('data-i18n');
      if (own(dicts.en, key) && typeof dicts.en[key] === 'string' && squash(el.textContent) !== squash(dicts.en[key])) {
        warn('markup and en.js differ for ' + key + ': "' + squash(el.textContent) + '" vs "' + squash(dicts.en[key]) + '"');
      }
    });
    each(document, '[data-i18n-html]', function (el) {
      var key = el.getAttribute('data-i18n-html');
      if (own(dicts.en, key) && squash(el.textContent) !== squash(textOf(dicts.en[key]))) {
        warn('markup and en.js differ for ' + key);
      }
    });
  }

  /** Called by each dictionary file. */
  function add(code, dict) {
    if (!find(code) || !dict) return;
    dicts[code] = dicts[code] || {};
    for (var k in dict) if (own(dict, k)) dicts[code][k] = dict[k];
    if (document.body && dicts[lang]) mount();   // not before this language is in, or the labels come out English
    if (code !== lang) return;
    if (!applied) {
      applied = true;
      root.setAttribute('lang', lang);        // in case the failsafe fell back first
      try { apply(document); } finally { revealWhenReady(); }
      if (lang === 'en' && LOCAL) {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', checkEnglishDrift);
        else checkEnglishDrift();
      }
    } else {
      apply(document);                        // a later chunk of the same language
    }
  }

  function has(key) { return own(dicts[lang], key) || own(dicts.en, key); }

  /** True when this language has its own wording for key rather than the English fallback. */
  function translated(key) { return own(dicts[lang], key); }

  function hrefFor(code) {
    var p = new URLSearchParams(location.search);
    p.delete('lang');
    p.set('lang', code);
    return location.pathname + '?' + p.toString() + location.hash;
  }

  function setLang(code) {
    if (!usable(code)) return;
    try { localStorage.setItem(KEY, code); } catch (e) {}
    location.assign(hrefFor(code));
  }

  /* ---------------- the switcher ----------------

     Each language is a real link to this same page with ?lang= set, so it
     works as a link does: no reload on an arrow key, middle-click opens it in
     a new tab, and each link says which language it leads to.

     A page opts in by marking where it goes:
       <div data-lang-host></div>          a language button that opens the list
       <div data-lang-host="row"></div>    the same, as a full-width "Language  English" row
       <div data-lang-host="inline"></div> the three links, always visible
  */

  // the "A and a character" translate glyph (Lucide "languages", ISC licence): not a globe, because the app's
  // region picker ("Where you live") already uses a globe and the two must not be confused
  var ICON = '<svg class="lang-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>';

  function label(key, english) {
    var v = resolve(key);
    return typeof v === 'string' ? v : english;
  }

  // "Language: English" / "Langue : Français": punctuation belongs to the language, so it is one template
  function currentLabel(name) {
    var v = resolve('lang.current');
    return typeof v === 'string' ? interp(v, { name: name }, false) : 'Language: ' + name;
  }

  function links(className) {
    var ul = document.createElement('ul');
    ul.className = className;
    LANGS.filter(function (l) { return usable(l.code); }).forEach(function (l) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = hrefFor(l.code);
      a.lang = l.code;
      a.hreflang = l.code;
      a.textContent = l.name;
      if (l.code === lang) a.setAttribute('aria-current', 'true');
      // the page may have changed its address since this was built (app.js drops ?new=), so point at the address as it is now
      var refresh = function () { a.href = hrefFor(l.code); };
      a.addEventListener('pointerdown', refresh);
      a.addEventListener('focus', refresh);
      a.addEventListener('click', function () { refresh(); try { localStorage.setItem(KEY, l.code); } catch (e) {} });
      li.appendChild(a);
      ul.appendChild(li);
    });
    return ul;
  }

  var uid = 0;

  function menu(variant, host) {
    var current = find(lang);
    var wrap = document.createElement('div');
    wrap.className = 'lang-switch' + (variant === 'row' ? ' lang-switch-row' : '');

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'lang-btn';
    btn.setAttribute('aria-expanded', 'false');
    var id = 'langMenu' + (++uid);
    btn.setAttribute('aria-controls', id);

    if (variant === 'row') {
      // visible text is the accessible name: "Language: English"
      btn.innerHTML = ICON + '<span class="lang-row-label"></span>';
      btn.querySelector('.lang-row-label').textContent = currentLabel(current.name);
    } else {
      // the visible code starts the accessible name, then the spoken version: "EN Language: English"
      btn.innerHTML = ICON + '<span class="lang-code" translate="no"></span><span class="sr-only"></span>';
      btn.querySelector('.lang-code').textContent = current.code.toUpperCase();
      btn.querySelector('.sr-only').textContent = ' ' + currentLabel(current.name);
      btn.title = label('lang.change', 'Change language');
    }

    if (!btn.title) btn.title = label('lang.change', 'Change language');

    var ul = links('lang-menu');
    ul.id = id;
    ul.hidden = true;

    function setOpen(open) {
      ul.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { setOpen(ul.hidden); });
    wrap.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !ul.hidden) { e.stopPropagation(); setOpen(false); btn.focus(); }
    });
    wrap.addEventListener('focusout', function (e) {
      // only when focus demonstrably moved elsewhere; Safari fires this with no relatedTarget on a click inside
      if (!ul.hidden && e.relatedTarget && !wrap.contains(e.relatedTarget)) setOpen(false);
    });
    document.addEventListener('click', function (e) {
      if (!ul.hidden && !wrap.contains(e.target)) setOpen(false);
    });

    // a host can dress the button like its neighbours: data-lang-btn-class, data-lang-icon-class, data-lang-label-class
    addClasses(btn, host.getAttribute('data-lang-btn-class'));
    addClasses(btn.querySelector('.lang-icon'), host.getAttribute('data-lang-icon-class'));
    addClasses(btn.querySelector('.lang-row-label'), host.getAttribute('data-lang-label-class'));

    wrap.appendChild(btn);
    wrap.appendChild(ul);
    return wrap;
  }

  function inline() {
    var nav = document.createElement('nav');
    nav.className = 'lang-inline';
    nav.setAttribute('aria-label', label('lang.label', 'Language'));
    nav.appendChild(links('lang-inline-list'));
    return nav;
  }

  function addClasses(el, list) {
    if (!el || !list) return;
    list.split(/\s+/).forEach(function (c) { if (c) el.classList.add(c); });
  }

  function mount() {
    // one usable language means there is nothing to switch to
    if (LANGS.filter(function (l) { return usable(l.code); }).length < 2) return;
    each(document, '[data-lang-host]', function (host) {
      if (host.firstElementChild) return;
      var v = host.getAttribute('data-lang-host');
      host.appendChild(v === 'inline' ? inline() : menu(v, host));
    });
  }

  // the hosts sit above the dictionary tags, so the first dictionary can mount before the page paints;
  // DOMContentLoaded catches any host added later in the markup
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.OwedI18n = {
    lang: lang,
    langs: LANGS.filter(function (l) { return usable(l.code); }).map(function (l) { return { code: l.code, name: l.name }; }),
    locale: locale,
    t: t,
    th: th,
    plural: plural,
    tIn: tIn,
    pluralIn: pluralIn,
    num: num,
    date: date,
    list: list,
    apply: apply,
    add: add,
    has: has,
    translated: translated,
    langOf: langOf,
    hrefFor: hrefFor,
    setLang: setLang,
    escapeHtml: escapeHtml
  };
})();
