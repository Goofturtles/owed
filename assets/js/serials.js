/* ============================================================
   Owed — what a serial number actually says

   Most serial numbers are a maker's own stock numbers: they say nothing
   about the model to anyone outside the company, and guessing one would
   be inventing it. So this reads only what a maker has published about
   its own serials, and every format carries the page that says so:

   - a model:   Nintendo Switch serials start with a model prefix
   - a date:    GE Appliances, LG and Samsung print the month and year
                made (the code repeats, so two dates can fit)
   - a lookup:  Apple, HP, Lenovo and Dell name the model on their own
                site from the serial; Owed cannot ask them, you can
   - an IMEI:   15 digits with a valid check digit is a phone or other
                device with a SIM, not a serial

   Anything else is "this serial does not say", never a guess.
   ============================================================ */
(function (global) {
  'use strict';

  var NOW = new Date();
  var NOW_Y = NOW.getFullYear(), NOW_M = NOW.getMonth() + 1;

  function made(y, m) { return y < NOW_Y || (y === NOW_Y && m <= NOW_M); }

  /* every year a repeating code can stand for, newest first, never in the future,
     and never outside the years the maker's own chart covers */
  function years(base, cycle, month, first, last) {
    var y = base;
    while (y + cycle <= NOW_Y) y += cycle;
    while (y > NOW_Y || !made(y, month)) y -= cycle;
    return [y, y - cycle].filter(function (v) { return v >= (first || 1970) && v <= (last || NOW_Y); });
  }

  // ---------- models: Nintendo lists each Switch by its serial's first letters ----------
  var NINTENDO = {
    sourceLabel: 'Nintendo',
    source: 'https://en-americas-support.nintendo.com/app/answers/detail/a_id/46835/~/',
    prefixes: {
      XAW: { model: 'Nintendo Switch', code: 'HAC-001' },
      XKW: { model: 'Nintendo Switch', code: 'HAC-001(-01)' },
      XTW: { model: 'Nintendo Switch – OLED Model', code: 'HEG-001' }
    }
  };

  // ---------- dates ----------
  // GE Appliances' own chart: first letter the month, second the year (repeats every 12 years)
  var GE = {
    maker: 'GE Appliances', short: 'GE', sourceLabel: 'GE Appliances',
    brands: ['ge', 'ge appliances', 'ge profile', 'cafe', 'café', 'monogram'],
    source: 'https://products.geappliances.com/appliance/gea-support-search-content?contentId=16195',
    month: { A: 1, D: 2, F: 3, G: 4, H: 5, L: 6, M: 7, R: 8, S: 9, T: 10, V: 11, Z: 12 },
    year: { A: 2025, D: 2026, F: 2015, G: 2016, H: 2017, L: 2018, M: 2019, R: 2020, S: 2021, T: 2022, V: 2023, Z: 2024 },
    read: function (s) {
      // two letters, six digits, a letter
      var m = /^([A-Z])([A-Z])\d{6}[A-Z]$/.exec(s);
      if (!m || !this.month[m[1]] || !this.year[m[2]]) return null;
      var month = this.month[m[1]];
      return { month: month, years: years(this.year[m[2]], 12, month, 1990) };
    }
  };

  // LG: "the serial number starts with 3 numbers (first one indicating year of
  // manufacturing followed by 2-digits identifying the month)" — the year is its last digit
  var LG = {
    maker: 'LG', sourceLabel: 'LG',
    brands: ['lg', 'lg electronics'],
    source: 'https://www.lg.com/us/support/help-library/how-to-find-my-lg-model-and-serial-number--20152254906058',
    read: function (s) {
      var m = /^(\d)(\d{2})[A-Z0-9]{5,}$/.exec(s);
      if (!m) return null;
      var month = Number(m[2]);
      if (month < 1 || month > 12) return null;
      return { month: month, years: years(2020 + Number(m[1]), 10, month, 2000) };
    }
  };

  // Samsung TVs and appliances (15 characters): the 8th is the year, the 9th the month
  // (1-9, then A, B, C). Written up on Samsung's own community forum, whose chart runs
  // 2001-2025; only 2006-2025 is read, where each letter means one year, and nothing
  // past the chart is guessed.
  var SAMSUNG = {
    maker: 'Samsung', sourceLabel: 'Samsung Community forum',
    brands: ['samsung', 'samsung home'],
    source: 'https://us.community.samsung.com/t5/QLED-and-The-Frame-TVs/How-old-is-my-TV/td-p/3112265',
    // A and L (2006) are left out: 2026 has come round, and the chart does not say whether they return
    year: { P: 2007, Q: 2008, S: 2009, Z: 2010, B: 2011, C: 2012, D: 2013, F: 2014, G: 2015,
            H: 2016, J: 2017, K: 2018, M: 2019, N: 2020, R: 2021, T: 2022, W: 2023, X: 2024, Y: 2025 },
    read: function (s) {
      if (!/^[A-Z0-9]{15}$/.test(s)) return null;
      var y = this.year[s.charAt(7)], mc = s.charAt(8);
      var month = /[1-9]/.test(mc) ? Number(mc) : { A: 10, B: 11, C: 12 }[mc];
      if (!y || !month) return null;
      return { month: month, years: years(y, 20, month, 2006, 2025) };
    }
  };

  var DATED = [GE, LG, SAMSUNG];

  // ---------- lookups: the maker's own page names the model from the serial ----------
  var LOOKUPS = [
    { maker: 'Apple', brands: ['apple'], words: /\b(iphone|ipad|macbook|imac|mac mini|airpods|apple watch|homepod|apple tv)\b/i,
      url: 'https://checkcoverage.apple.com/', source: 'https://support.apple.com/en-us/102767' },
    { maker: 'HP', brands: ['hp', 'hewlett-packard', 'hewlett packard'], url: 'https://support.hp.com/us-en/check-warranty' },
    { maker: 'Lenovo', brands: ['lenovo'], url: 'https://pcsupport.lenovo.com/us/en/warrantylookup' },
    { maker: 'Dell', brands: ['dell', 'alienware'], url: 'https://www.dell.com/support/home/' }
  ];

  function norm(b) { return String(b || '').trim().toLowerCase(); }

  function luhn(d) {
    var sum = 0;
    for (var i = 0; i < d.length; i++) {
      var n = Number(d.charAt(d.length - 1 - i));
      if (i % 2) { n *= 2; if (n > 9) n -= 9; }
      sum += n;
    }
    return sum % 10 === 0;
  }

  /**
   * decode(serial, brand, name) -> one of
   *   { kind: 'model',  maker, model, code, category, source, sourceLabel }
   *   { kind: 'date',   maker, month, years: [newest, older?], source, sourceLabel }
   *   { kind: 'lookup', maker, url }
   *   { kind: 'imei' }
   *   { kind: 'none',   datedMakers: ['GE', 'LG', 'Samsung'] }
   *   null (too short to say anything)
   */
  function decode(serial, brand, name, category) {
    var s = String(serial || '').toUpperCase().replace(/[\s-]+/g, '');
    if (s.length < 6) return null;
    var b = norm(brand);

    // a Nintendo prefix, unless the reader has already named another maker
    var p = NINTENDO.prefixes[s.slice(0, 3)];
    if (p && /^[A-Z]{3}\d{8,12}$/.test(s) && (!b || b === 'nintendo')) {
      return { kind: 'model', maker: 'Nintendo', model: p.model, code: p.code, category: 'console',
        source: NINTENDO.source, sourceLabel: NINTENDO.sourceLabel };
    }

    // one random 15-digit number in ten passes the check digit, so only where a SIM is likely
    var simLike = !category || ['phone', 'tablet', 'watch'].indexOf(category) !== -1;
    if (/^\d{15}$/.test(s) && luhn(s) && (!b || simLike) && simLike) return { kind: 'imei' };

    // dates only for the maker that uses that format: another maker's serial can look the same
    for (var i = 0; i < DATED.length; i++) {
      var f = DATED[i];
      if (f.brands.indexOf(b) === -1) continue;
      var r = f.read(s);
      if (r && r.years.length) return { kind: 'date', maker: f.maker, month: r.month, years: r.years, source: f.source, sourceLabel: f.sourceLabel };
    }

    for (var k = 0; k < LOOKUPS.length; k++) {
      var L = LOOKUPS[k];
      if (L.brands.indexOf(b) !== -1 || (!b && L.words && L.words.test(String(name || '')))) {
        return { kind: 'lookup', maker: L.maker, url: L.url };
      }
    }

    return { kind: 'none', datedMakers: DATED.map(function (f) { return f.short || f.maker; }) };
  }

  global.OwedSerials = { decode: decode, _luhn: luhn };
})(typeof window !== 'undefined' ? window : globalThis);
