/* ============================================================
   Owed — sign in (name only)
   One field. The name is stored in this browser as owed:user and
   nothing is sent anywhere. ?mode=signup|signin and ?item= are
   still accepted so old links keep working.
   ============================================================ */
(function () {
  'use strict';

  var S = window.OwedStore;
  var params = new URLSearchParams(location.search);
  var pendingItem = params.get('item') || '';

  var form = document.getElementById('authForm');
  var field = document.getElementById('fieldName');
  var nameInput = document.getElementById('name');
  var help = document.getElementById('authHelp');
  var submitLabel = document.getElementById('authSubmitLabel');

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var HELP_DEFAULT = 'Just a first name is fine.';

  /* ---------- returning user ---------- */
  var existing = S.getUser();
  if (existing && existing.name && existing.name !== 'You') {
    nameInput.value = existing.name;
    submitLabel.textContent = 'Continue as ' + existing.name;
    help.textContent = 'Not you? Just change the name.';
  }

  function setError(msg) {
    field.classList.add('is-error');
    help.classList.add('is-error');
    help.textContent = msg;
    nameInput.setAttribute('aria-invalid', 'true');
    if (!reduce) {
      field.classList.remove('is-shaking');
      void field.offsetWidth; // restart the animation
      field.classList.add('is-shaking');
    }
  }
  function clearError() {
    if (!field.classList.contains('is-error')) return;
    field.classList.remove('is-error', 'is-shaking');
    help.classList.remove('is-error');
    help.textContent = HELP_DEFAULT;
    nameInput.removeAttribute('aria-invalid');
  }
  nameInput.addEventListener('input', clearError);

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = nameInput.value.trim();
    if (!name) {
      setError('Type a name so we can label your shelf.');
      nameInput.focus();
      return;
    }
    if (existing) S.updateUser({ name: name });
    else S.signUp(name, '', 'US');

    var url = 'app.html';
    if (pendingItem) url += '?new=' + encodeURIComponent(pendingItem);
    location.href = url;
  });

  /* ---------- the icon ring: one pause control (WCAG 2.2.2) ---------- */
  var ring = document.getElementById('ring'), ringBtn = document.getElementById('ringPause');
  if (ring && ringBtn) {
    ringBtn.addEventListener('click', function () {
      var p = ring.classList.toggle('is-paused');
      ringBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
      ringBtn.setAttribute('aria-label', p ? 'Resume the spinning icons' : 'Pause the spinning icons');
    });
  }

  /* ---------- photo carousel (gone; guarded below) ---------- */
  var carousel = document.getElementById('carousel');
  if (!carousel) return;
  var slides = Array.prototype.slice.call(carousel.querySelectorAll('.auth-slide'));
  var dots = Array.prototype.slice.call(carousel.querySelectorAll('.auth-dot'));
  var caption = document.getElementById('carouselCaption');
  var index = 0;
  var timer = null;

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach(function (s, k) { s.classList.toggle('is-on', k === index); });
    dots.forEach(function (d, k) {
      d.classList.toggle('is-on', k === index);
      if (k === index) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    caption.textContent = slides[index].getAttribute('data-caption') || '';
  }

  // the caption is only announced while the user is driving the carousel;
  // an auto-rotating live region would speak every six seconds
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    caption.setAttribute('aria-live', 'polite');
  }
  function start() {
    if (reduce || timer) return;
    caption.setAttribute('aria-live', 'off');
    timer = setInterval(function () { show(index + 1); }, 6000);
  }

  document.getElementById('carouselPrev').addEventListener('click', function () { show(index - 1); });
  document.getElementById('carouselNext').addEventListener('click', function () { show(index + 1); });
  dots.forEach(function (d) {
    d.addEventListener('click', function () { show(Number(d.getAttribute('data-index')) || 0); });
  });
  carousel.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(index - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); show(index + 1); }
  });

  carousel.addEventListener('mouseenter', stop);
  carousel.addEventListener('mouseleave', start);
  carousel.addEventListener('focusin', stop);
  carousel.addEventListener('focusout', function () {
    if (!carousel.contains(document.activeElement)) start();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  show(0);
  start();
})();
