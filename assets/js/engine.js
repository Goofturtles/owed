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

  /** Load the corpus. Returns a promise resolving to the rule count. */
  function load(url) {
    return fetch(url || 'data/coverage.json', { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('corpus ' + r.status);
        return r.json();
      })
      .then(function (data) {
        RULES = (data && data.rules) || [];
        loaded = true;
        return RULES.length;
      });
  }

  function setRules(rules) {
    RULES = rules || [];
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

    var bm = brandMatches(rule, item.brand);
    if (bm === false) return null;

    var pay = paymentMatches(rule, item.payment);
    if (pay === false) return null;

    // timing
    var age = Number(item.ageMonths);
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
    if (timing === 'closed') score -= 1;      // only floors get here
    if (rule.source_type === 'settlement') score += 1;   // real money, time-limited
    if (rule.source_type === 'program') score += 0.5;

    // strength label the user actually sees
    var strength;
    if (score >= 5) strength = 'strong';
    else if (score >= 3.2) strength = 'worth asking';
    else strength = 'long shot';

    // plain-words reason
    var reason = [];
    if (bm === 'exact' || bm === 'loose') reason.push('it is a ' + (item.brand || 'that brand') + ' item');
    if (pay === true && at.payment_methods && at.payment_methods.length &&
        at.payment_methods.indexOf('*') === -1) {
      reason.push('you paid with ' + paymentWord(item.payment));
    }
    if (pay === 'maybe') reason.push('it depends on how you paid — worth checking your statement');

    var timed = isFinite(win) && win < 900;
    if (timed && timing === 'open') reason.push('you are still inside the window');
    if (timed && timing === 'closing') reason.push('the window is nearly up');
    if (timing === 'closed') {
      reason.push('the legal minimum has passed, but some places give longer \u2014 worth asking');
    }
    if (!timed && rule.source_type === 'statutory') {
      reason.push('this is the law where you live, whatever the warranty card says');
    }
    if (!reason.length) reason.push('it covers this kind of item where you live');

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
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0];
    return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1];
  }

  function paymentWord(id) {
    var map = {
      visa: 'a Visa card', mastercard: 'a Mastercard', amex: 'an Amex',
      discover: 'a Discover card', debit: 'a debit card', cash: 'cash'
    };
    return map[id] || 'that method';
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
      settlement: 'Money set aside for this fault',
      program: 'Free repair programme',
      card: 'Cover from the card you paid with',
      manufacturer: "The maker's own warranty",
      statutory: 'Your legal cover',
      retailer: 'The shop that sold it'
    };
    var buckets = {};
    matches.forEach(function (m) {
      var t = m.rule.source_type;
      if (!buckets[t]) buckets[t] = { type: t, label: labels[t] || t, items: [] };
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
    var thing = item.name || (item.brand ? item.brand + ' ' + item.category : 'the item');
    var when = agePhrase(item.ageMonths);   // already contains "about"
    var lines = [];

    lines.push('Hi — I’d like to open a claim under ' + aOrThe(r.title) + '.');
    lines.push('I bought ' + thing + ' ' + when + ' and paid with ' +
               paymentWord(item.payment) + '. ' + brokeLine(item));

    var hint = fillHint(r.script_hint, item, when);
    if (hint) lines.push(hint);

    lines.push('Could you tell me what you need from me, and confirm the deadline for this claim?');

    return {
      lines: lines,
      text: lines.join('\n\n'),
      who: r.contact || '',
      deadline: r.deadline || '',
      by: name
    };
  }

  /** "the Chase extended warranty" — keeps proper nouns capitalised. */
  function aOrThe(title) {
    var t = String(title || 'this cover').trim();
    return /^(the|my|your)\b/i.test(t) ? t : 'the ' + t;
  }

  /**
   * Corpus script hints may carry bracketed placeholders such as [item] or
   * [date]. Fill what we can and drop the hint entirely if anything is left
   * over, so raw template text can never reach the user.
   */
  function fillHint(hint, item, when) {
    if (!hint) return '';
    var thing = item.name || (item.brand ? item.brand + ' ' + item.category : 'the item');
    // "about a year ago" already reads as a time phrase, so drop any preposition
    // in front of it — otherwise you get "failed on about a year ago".
    var out = String(hint)
      .replace(/\b(on|in)\s+\[(date|purchase date)\]/gi, when)
      .replace(/\[(date|purchase date)\]/gi, when)
      .replace(/\[(item|product|model|product and model number)\]/gi, thing)
      .replace(/\[brand\]/gi, item.brand || thing)
      .replace(/\[amount\]/gi, 'the amount on my statement');
    return /\[[^\]]+\]/.test(out) ? '' : out;
  }

  function brokeLine(item) {
    if (item.faultNote) return String(item.faultNote);
    return item.broken ? 'It has stopped working properly.' : 'I want to check what cover it still has.';
  }

  function agePhrase(months) {
    var m = Number(months);
    if (!isFinite(m)) return 'a while ago';
    if (m < 4) return 'a couple of months ago';
    if (m < 13) return 'under a year ago';
    if (m < 18) return 'about a year ago';
    var years = Math.round(m / 12);
    return 'about ' + years + (years === 1 ? ' year' : ' years') + ' ago';
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
