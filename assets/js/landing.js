/* ============================================================
   Owed — landing page behaviour
   ============================================================ */
(function () {
  'use strict';

  var C = window.OwedCatalog;

  /* ---------- sticky nav ---------- */
  var nav = document.getElementById('nav');
  var onScroll = function () {
    if (!nav) return;
    nav.classList.toggle('is-stuck', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- smooth anchor scroll ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    // the skip link must actually move focus, not just scroll
    if (a.classList.contains('skip-link')) return;
    var id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    var target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    // scrolling alone leaves keyboard focus behind in the nav, so the next Tab
    // carries on from the wrong place (WCAG 2.4.3)
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* ---------- hero try-it teaser ---------- */
  var form = document.getElementById('tryForm');
  var input = document.getElementById('tryItem');
  var result = document.getElementById('tryResult');

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function teaserFor(text) {
    var cat = C.guessCategory(text);
    var brand = C.guessBrand(text);
    var label = cat ? C.categoryLabel(cat) : null;

    var lines = [];
    lines.push({ tone: 'ok', text: "The maker's own warranty — most start at a year, some run for life" });
    lines.push({ tone: 'ok', text: 'Extra cover from the card you paid with, often a whole extra year' });
    lines.push({ tone: 'maybe', text: 'Open payouts and free repair programmes for known faults' });
    lines.push({ tone: 'ok', text: 'Your legal cover, which usually outlasts the printed warranty' });

    var heading;
    if (brand && label) {
      heading = 'A ' + esc(label).toLowerCase() + ' from ' + esc(brand) + " — here's what we'd check";
    } else if (label) {
      heading = 'A ' + esc(label).toLowerCase() + " — here's what we'd check";
    } else if (brand) {
      heading = esc(brand) + " — here's what we'd check";
    } else {
      heading = "Here's what we'd check for that";
    }

    return { heading: heading, lines: lines, known: !!(brand || cat) };
  }

  if (form && input && result) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var text = input.value.trim();
      if (!text) {
        input.focus();
        return;
      }
      var t;
      try {
        t = teaserFor(text);
      } catch (err) {
        // let the form submit for real rather than dying silently
        form.submit();
        return;
      }
      var items = t.lines.map(function (l) {
        return '<li><span class="dot ' + l.tone + '" aria-hidden="true"></span>' + l.text + '</li>';
      }).join('');

      result.hidden = false;
      result.innerHTML =
        '<h4>' + t.heading + '</h4>' +
        '<p class="muted" style="font-size:.82rem">Four questions in the app narrows this to the ones that actually apply to you.</p>' +
        '<ul>' + items + '</ul>' +
        '<a class="btn btn-accent go" href="auth.html?mode=signup&amp;item=' + encodeURIComponent(text) + '">Check my ' +
        (C.guessCategory(text) ? esc(C.categoryLabel(C.guessCategory(text))).toLowerCase() : 'item') + '</a>';
    });
  }

  /* ---------- copy button ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy]');
    if (!btn) return;
    var card = btn.closest('.script-card');
    var body = card && card.querySelector('.script-body');
    if (!body) return;
    var text = body.innerText.trim();
    var done = function () {
      var old = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function () { btn.textContent = old; }, 1600);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
    } else {
      done();
    }
  });

  /* ---------- reveal on scroll ----------
     Content must never be left invisible: the observer is a progressive
     enhancement, and a failsafe reveals everything shortly after load. */
  var revealables = document.querySelectorAll(
    '.showcase-panel, .section-head, .figure, .step, .tile, .script-card, .earth-meter, .faq-item, .cta-inner, .stat-cell, .finder-doc, .finder-note-out'
  );

  function revealAll() {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('in'); });
  }

  if ('IntersectionObserver' in window && revealables.length) {
    // Stagger by position WITHIN the parent, not by index across the page:
    // a flat counter gave the fourth card in one row the same delay as the
    // first card in the next, so rows landed out of order.
    Array.prototype.forEach.call(revealables, function (el) {
      el.classList.add('reveal');
      var sibs = el.parentElement ? el.parentElement.children : [el];
      var n = Array.prototype.indexOf.call(sibs, el);
      el.style.transitionDelay = Math.min(n, 5) * 70 + 'ms';
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px 0px 0px 0px', threshold: 0.01 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });

    // Failsafe: if anything is still hidden a moment after load, show it.
    window.addEventListener('load', function () {
      setTimeout(revealAll, 900);
    });
    setTimeout(revealAll, 2500);
  }

  /* ---------- one FAQ open at a time ---------- */
  var faqs = document.querySelectorAll('.faq-item');
  Array.prototype.forEach.call(faqs, function (d) {
    d.addEventListener('toggle', function () {
      if (!d.open) return;
      Array.prototype.forEach.call(faqs, function (other) {
        if (other !== d) other.open = false;
      });
    });
  });
})();
