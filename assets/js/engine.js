/* ============================================================
   Owed — matching engine
   Takes an item (brand, category, age, payment, region) and the
   coverage corpus, and returns the rules that plausibly apply,
   ranked, each with a plain-words reason and a claim script.
   ============================================================ */
(function (global) {
  'use strict';

  var RULES = [];
  var loaded = false;
  var i18n = global.OwedI18n;

  // the words of a rule a translation may replace; nothing that decides a match
  var OVERLAY_FIELDS = ['title', 'what_you_get', 'window_note', 'how_to_claim', 'script_hint', 'verified_against'];

  /** Load the corpus. Returns a promise resolving to the rule count. */
  function load(url) {
    var src = url || 'data/coverage.json';
    var lang = i18n.lang;
    var corpus = fetch(src, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('corpus ' + r.status);
        return r.json();
      });
    // a French or Spanish visitor also gets data/coverage.<lang>.json; a missing or
    // broken file is the same as no translations, and every rule stays English
    var overlay = lang === 'en' ? null
      : fetch(src.replace(/\.json$/, '.' + lang + '.json'), { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; });
    return Promise.all([corpus, overlay])
      .then(function (got) {
        var data = got[0];
        RULES = (data && data.rules) || [];
        translateRules(RULES, got[1], lang);
        loaded = true;
        return RULES.length;
      });
  }

  /* rule._lang is the language a rule's words are in: 'en', or the visitor's
     language where the overlay carries that rule. Anything that reads rule text
     (hint placeholders, sentence splitting) goes by it, not by the page. */
  function translateRules(rules, overlay, lang) {
    var byId = overlay && overlay.rules;
    if (!byId || typeof byId !== 'object' || Array.isArray(byId)) byId = null;
    rules.forEach(function (rule) {
      rule._lang = 'en';
      var o = byId && Object.prototype.hasOwnProperty.call(byId, rule.id) ? byId[rule.id] : null;
      if (!o || typeof o !== 'object') return;
      var copied = false;
      OVERLAY_FIELDS.forEach(function (f) {
        if (typeof o[f] === 'string' && o[f]) { rule[f] = o[f]; copied = true; }
      });
      if (copied) rule._lang = lang;
    });
  }

  function setRules(rules) {
    RULES = rules || [];
    RULES.forEach(function (rule) { if (rule && !rule._lang) rule._lang = 'en'; });
    loaded = true;
  }

  function has(list, value) {
    if (!list || !list.length) return true;      // unconstrained
    if (list.indexOf('*') !== -1) return true;
    return list.indexOf(value) !== -1;
  }

  function brandMatches(rule, brand) {
    var brands = rule.applies_to && rule.applies_to.brands;
    if (!brands || !brands.length || brands.indexOf('*') !== -1) return 'any';
    if (!brand) return false;
    var b = String(brand).toLowerCase();
    for (var i = 0; i < brands.length; i++) {
      var rb = String(brands[i]).toLowerCase();
      if (rb === b) return 'exact';
      // "bosch tools" should still match an item branded "bosch"
      if (b.indexOf(rb) !== -1 || rb.indexOf(b) !== -1) return 'loose';
    }
    return false;
  }

  function paymentMatches(rule, payment) {
    var pm = rule.applies_to && rule.applies_to.payment_methods;
    if (!pm || !pm.length || pm.indexOf('*') !== -1) return true;
    if (!payment || payment === 'unknown') return 'maybe';
    if (pm.indexOf(payment) !== -1) return true;
    if (pm.indexOf('any-credit') !== -1 &&
        ['visa', 'mastercard', 'amex', 'discover'].indexOf(payment) !== -1) return true;
    return false;
  }

  var CONFIDENCE_WEIGHT = { certain: 3, likely: 2, possible: 1 };

  /**
   * Score and explain one rule against one item.
   * Returns null when the rule cannot apply at all.
   */
  function evaluate(rule, item) {
    var at = rule.applies_to || {};

    if (!has(at.categories, item.category)) return null;
    if (!has(at.regions, item.region)) return null;
    // a rule tied to a province or state applies only there; with no province chosen it stays (region-wide view)
    if (at.subregions && at.subregions.length && item.subregion && at.subregions.indexOf(item.subregion) < 0) return null;

    var bm = brandMatches(rule, item.brand);
    if (bm === false) return null;

    var pay = paymentMatches(rule, item.payment);
    if (pay === false) return null;

    // timing
    // unknown age (null / '') must not coerce to 0 and pass every clock
    var age = (item.ageMonths == null || item.ageMonths === '') ? NaN : Number(item.ageMonths);
    // null/'' would coerce to 0 and silently close the rule for everything
    var win = (rule.window_months == null || rule.window_months === '')
      ? NaN : Number(rule.window_months);
    var timing = 'open';
    if (isFinite(age) && isFinite(win) && win < 900) {
      if (age > win) {
        timing = 'closed';
      } else if (age > win * 0.8) {
        timing = 'closing';
      }
    } else if (!isFinite(age) && isFinite(win) && win < 900) {
      // the user could not remember when they bought it: a timed rule can't be
      // called open, so it is kept, marked down, and the script says to check
      timing = 'unknown';
    }

    // hard deadline (settlements)
    var deadlinePassed = false;
    if (rule.deadline) {
      var d = Date.parse(rule.deadline);
      if (isFinite(d) && d < Date.now()) deadlinePassed = true;
    }

    // A closed clock closes the rule, whatever its source. The one exception is a
    // statutory FLOOR (window_kind 'floor' in the data): a legal minimum that
    // national law may extend, kept past its window as a long shot.
    if (timing === 'closed' && rule.window_kind !== 'floor') return null;
    if (deadlinePassed) return null;

    // score
    var score = CONFIDENCE_WEIGHT[rule.confidence] || 1;
    if (bm === 'exact') score += 2;
    else if (bm === 'loose') score += 1;
    if (pay === true && at.payment_methods && at.payment_methods.length &&
        at.payment_methods.indexOf('*') === -1) score += 1.5;
    if (pay === 'maybe') score -= 0.5;
    if (timing === 'closing') score -= 0.5;
    if (timing === 'unknown') score -= 1;      // a clock nobody can read yet
    if (timing === 'closed') score -= 1;      // only floors get here
    if (rule.source_type === 'settlement') score += 1;   // real money, time-limited
    if (rule.source_type === 'program') score += 0.5;

    // strength label the user actually sees
    var strength;
    if (score >= 5) strength = 'strong';
    else if (score >= 3.2) strength = 'worth asking';
    else strength = 'long shot';

    // plain-words reason: each clause stands on its own, and the clauses are joined as a list
    var reason = [];
    if (bm === 'exact' || bm === 'loose') {
      reason.push(item.brand ? i18n.t('engine.reason.brand', { brand: item.brand }) : i18n.t('engine.reason.brandUnnamed'));
    }
    if (pay === true && at.payment_methods && at.payment_methods.length &&
        at.payment_methods.indexOf('*') === -1) {
      reason.push(i18n.t('engine.reason.paid', { pay: paymentWord(item.payment) }));
    }
    if (pay === 'maybe') reason.push(i18n.t('engine.reason.payUnknown'));

    var timed = isFinite(win) && win < 900;
    if (timed && timing === 'open') reason.push(i18n.t('engine.reason.windowOpen'));
    if (timed && timing === 'closing') reason.push(i18n.t('engine.reason.windowClosing'));
    if (timed && timing === 'unknown') reason.push(i18n.t('engine.reason.ageUnknown'));
    if (timing === 'closed') {
      reason.push(i18n.t('engine.reason.floorPassed'));
    }
    if (!timed && rule.source_type === 'statutory') {
      reason.push(i18n.t('engine.reason.law'));
    }
    if (!reason.length) reason.push(i18n.t('engine.reason.covers'));

    return {
      rule: rule,
      score: score,
      strength: strength,
      timing: timing,
      reason: joinNicely(reason)
    };
  }

  /** "a, b and c" — reads like a sentence instead of a list. */
  function joinNicely(parts) {
    if (i18n.lang !== 'en') return i18n.list(parts, 'conjunction');   // "a, b et c"; "a, b y c" ("e" before an i sound)
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }

  /* How the item was paid for, with its preposition: "with a Visa card", "with cash".
     The preposition travels with the payment because it changes with it in other
     languages ("avec une carte Visa" but "en espèces"). */
  function paymentWord(id) {
    var map = {
      visa: 'engine.pay.visa', mastercard: 'engine.pay.mastercard', amex: 'engine.pay.amex',
      discover: 'engine.pay.discover', debit: 'engine.pay.debit', cash: 'engine.pay.cash'
    };
    return map[id] ? i18n.t(map[id]) : '';   // unknown: the sentence leaves the payment out entirely
  }

  /** Run the whole corpus against an item. */
  function match(item) {
    var out = [];
    for (var i = 0; i < RULES.length; i++) {
      var hit = evaluate(RULES[i], item);
      if (hit) out.push(hit);
    }
    out.sort(function (a, b) { return b.score - a.score; });
    return out;
  }

  /** Group matches by where the cover comes from. */
  function group(matches) {
    var order = ['settlement', 'program', 'card', 'manufacturer', 'statutory', 'retailer'];
    var labels = {
      settlement: 'engine.group.settlement',
      program: 'engine.group.program',
      card: 'engine.group.card',
      manufacturer: 'engine.group.manufacturer',
      statutory: 'engine.group.statutory',
      retailer: 'engine.group.retailer'
    };
    var buckets = {};
    matches.forEach(function (m) {
      var t = m.rule.source_type;
      if (!buckets[t]) buckets[t] = { type: t, label: labels[t] ? i18n.t(labels[t]) : t, items: [] };
      buckets[t].items.push(m);
    });
    // "Start at the top" is only true if the strongest group is on top; the
    // fixed source order is the tie-break, not the order.
    var rank = { 'strong': 0, 'worth asking': 1, 'long shot': 2 };
    function best(g) {
      return Math.min.apply(null, g.items.map(function (m) { return rank[m.strength]; }));
    }
    return order.filter(function (t) { return buckets[t]; })
      .map(function (t) { return buckets[t]; })
      .sort(function (a, b) { return best(a) - best(b) || order.indexOf(a.type) - order.indexOf(b.type); });
  }

  /**
   * Build the words to say. Kept deliberately short — a long script
   * does not get read out.
   */
  function script(match, item, user) {
    var r = match.rule;
    var name = (user && user.name) || 'I';
    var said = forSentence(item);
    var thing = thingName(said);
    // a name the visitor typed is quoted as written ("cet article (Casque Sony WH-1000XM4)"); English
    // has always put the name straight in, so it keeps its own sentence
    var quoted = i18n.lang !== 'en' && !!said.name;
    var when = agePhrase(item.ageMonths);   // already contains "about"
    var pay = paymentWord(item.payment);
    var broke = brokeLine(item);
    var lines = [];

    // the words a polite person would actually use on the phone: ask, don't demand.
    // The frame is in the visitor's language; the rule's title and hint are in the rule's.
    lines.push(i18n.t('engine.script.hello'));
    lines.push(quoted
      ? (pay
        ? i18n.t('engine.script.boughtNamedPaid', { thing: thing, when: when, pay: pay, broke: broke })
        : i18n.t('engine.script.boughtNamed', { thing: thing, when: when, broke: broke }))
      : (pay
        ? i18n.t('engine.script.boughtPaid', { thing: thing, when: when, pay: pay, broke: broke })
        : i18n.t('engine.script.bought', { thing: thing, when: when, broke: broke })));
    lines.push(i18n.t('engine.script.rule', { title: r.title }));

    // 52 rules in the book turn on a serial number: say it when we have one
    if (item.serial) lines.push(i18n.t('engine.script.serial', { serial: String(item.serial).trim() }));

    // the hint is the rule's own sentence, so its slots are filled in the rule's language, not the page's
    var hintLang = r._lang || 'en';
    var hint = fillHint(r.script_hint, item, hintLang === i18n.lang ? when : agePhrase(item.ageMonths, hintLang), hintLang);
    var hintIndex = -1;
    if (hint) { hintIndex = lines.length; lines.push(hint); }

    lines.push(i18n.t('engine.script.close'));

    return {
      lines: lines,
      text: lines.join('\n\n'),
      hintIndex: hintIndex,   // which line is the rule's own hint (in the rule's language), or -1
      who: r.contact || '',
      deadline: r.deadline || '',
      by: name
    };
  }

  /* What each category is called in the script, as a whole noun phrase with its
     article and the brand in its place: key "a {brand} laptop", key + '.noBrand'
     "a laptop". */
  var THING = {
    phone: 'engine.thing.phone', laptop: 'engine.thing.laptop', tablet: 'engine.thing.tablet',
    headphones: 'engine.thing.headphones', tv: 'engine.thing.tv', console: 'engine.thing.console',
    camera: 'engine.thing.camera', watch: 'engine.thing.watch',
    'appliance-large': 'engine.thing.applianceLarge', 'appliance-small': 'engine.thing.applianceSmall',
    vacuum: 'engine.thing.vacuum', kitchen: 'engine.thing.kitchen', 'power-tool': 'engine.thing.powerTool',
    furniture: 'engine.thing.furniture', mattress: 'engine.thing.mattress', footwear: 'engine.thing.footwear',
    apparel: 'engine.thing.apparel', bag: 'engine.thing.bag', bike: 'engine.thing.bike',
    outdoor: 'engine.thing.outdoor', printer: 'engine.thing.printer', toy: 'engine.thing.toy',
    other: 'engine.thing.other',
    // ids the wizard does not save, still named as they always were
    appliance_large: 'engine.thing.oldApplianceLarge', appliance_small: 'engine.thing.oldApplianceSmall',
    tool: 'engine.thing.oldTool', shoes: 'engine.thing.oldShoes'
  };

  /**
   * What to call the thing on the phone. A typed name wins; otherwise the brand
   * and the category, lower-cased so "Samsung Laptop or computer" (two menu
   * labels stuck together) reads as "a Samsung laptop".
   */
  /**
   * The item as a sentence should name it. A name the app generated from the brand and category
   * ("Téléphone Samsung", item.autoName) is a label, not something you say, so outside English it is
   * dropped and the sentence says "un téléphone Samsung" instead. English is left exactly as it was.
   */
  function forSentence(item) {
    if (i18n.lang === 'en' || !item.autoName) return item;
    var copy = {};
    for (var k in item) if (Object.prototype.hasOwnProperty.call(item, k)) copy[k] = item[k];
    copy.name = '';
    return copy;
  }

  function thingName(item, code) {
    code = code || i18n.lang;
    if (item.name) return item.name;
    var key = THING[item.category];
    var word = '';
    if (!key) {
      // a category Owed has no words for is named by its id
      word = String(item.category || '').replace(/_/g, ' ').split(' or ')[0].toLowerCase();
      key = word ? 'engine.thing.unlisted' : 'engine.thing.other';
    }
    if (!item.brand) return i18n.tIn(code, key + '.noBrand', { word: word });
    var out = i18n.tIn(code, key, { brand: item.brand, word: word });
    // English says "an" before a brand that starts with a vowel letter; other languages write their own article
    if (i18n.langOf(key, code) === 'en' && /^[aeiou]/i.test(item.brand)) out = out.replace(/^a /, 'an ');
    return out;
  }

  /** "the Chase extended warranty" — keeps proper nouns capitalised. */
  function aOrThe(title) {
    var t = String(title || 'this cover').trim();
    return /^(the|my|your)\b/i.test(t) ? t : 'the ' + t;
  }

  // i18n-data: prepositions a French or Spanish hint may put before [date] (English's are in
  // fillHint), picked by the language of the RULE's text. Placeholders stay English tokens
  // ([date], [item] ...) in every language. No lookbehind: older Safari cannot parse it, and
  // this file must load for everyone.
  var DATE_PREPOSITION = {
    fr: /(^|[^\p{L}])(?:depuis le|depuis|dès le|à partir du|à compter du|le|en|au|du)\s+\[(?:date|purchase date)\]/giu,
    es: /(^|[^\p{L}])(?:a partir del|el|en|del)\s+\[(?:date|purchase date)\]/giu
  };

  /**
   * Corpus script hints may carry bracketed placeholders such as [item] or
   * [date]. Fill what we can and drop the hint entirely if anything is left
   * over, so raw template text can never reach the user.
   */
  function fillHint(hint, item, when, lang) {
    if (!hint) return '';
    var said = forSentence(item);
    var thing = thingName(said, lang);
    // an English hint may say "My [item] failed". When the thing is a generated noun phrase that brings its own
    // article ("a Garmin watch"), that would read "My a Garmin watch", so after a determiner the article goes.
    // Only on a French or Spanish page: English pages keep the words they always had.
    if (i18n.lang !== 'en' && (lang || 'en') === 'en' && !said.name) {
      // corpus hints also put the brand between: "My JBL [product]". The phrase already names the brand, so it goes too.
      hint = String(hint).replace(/\b([Mm]y|[Tt]he|[Yy]our|[Tt]his|[Oo]ur)\s+(?:([A-Z][\w&'-]*)\s+)?\[(item|product|model|product and model number)\]/g, function (m, det, brandWord) {
        var bare = thing.replace(/^(a|an)\s+/i, '');
        var keep = brandWord && bare.toLowerCase().indexOf(brandWord.toLowerCase()) === -1 ? brandWord + ' ' : '';
        return det + ' ' + keep + bare;
      });
    }
    // "about a year ago" already reads as a time phrase, so drop any preposition
    // in front of it — otherwise you get "failed on about a year ago".
    var out = DATE_PREPOSITION[lang]
      ? String(hint).replace(DATE_PREPOSITION[lang], function (m, before) { return before + when; })
      : String(hint).replace(/\b(on|in)\s+\[(date|purchase date)\]/gi, when);
    out = out
      .replace(/\[(date|purchase date)\]/gi, when)
      .replace(/\[(item|product|model|product and model number)\]/gi, thing)
      .replace(/\[brand\]/gi, item.brand || thing)
      .replace(/\[(serial|serial number|serial no)\]/gi, item.serial || '')
      .replace(/\[amount\]/gi, i18n.tIn(lang || 'en', 'engine.hint.amount'));
    return /\[[^\]]+\]/.test(out) ? '' : out;
  }

  function brokeLine(item) {
    if (item.faultNote) return String(item.faultNote);
    return item.broken
      ? i18n.t('engine.script.broken')
      : i18n.t('engine.script.notBroken');
  }

  /** "about 2 years ago". code: the language to say it in (default: the page's). */
  function agePhrase(months, code) {
    code = code || i18n.lang;
    if (months == null || months === '') return i18n.tIn(code, 'engine.age.aWhileAgo');
    var m = Number(months);
    if (!isFinite(m)) return i18n.tIn(code, 'engine.age.aWhileAgo');
    if (m < 4) return i18n.tIn(code, 'engine.age.fewMonths');
    if (m < 13) return i18n.tIn(code, 'engine.age.underAYear');
    if (m < 18) return i18n.tIn(code, 'engine.age.aboutAYear');
    return i18n.pluralIn(code, 'engine.age.aboutYears', Math.round(m / 12));
  }

  global.OwedEngine = {
    load: load,
    setRules: setRules,
    match: match,
    group: group,
    script: script,
    agePhrase: agePhrase,
    get ruleCount() { return RULES.length; },
    get loaded() { return loaded; }
  };
})(window);
