/* ============================================================
   Owed — sign in / sign up
   ============================================================ */
(function () {
  'use strict';

  var S = window.OwedStore;
  var params = new URLSearchParams(location.search);
  // the boxed card wrapper is gone; the panel itself carries the mode
  var card = document.getElementById('panel');
  var sw = document.querySelector('.auth-switch');
  var tabSignup = document.getElementById('tabSignup');
  var tabSignin = document.getElementById('tabSignin');
  var title = document.getElementById('authTitle');
  var sub = document.getElementById('authSub');
  var form = document.getElementById('authForm');
  var submit = document.getElementById('authSubmit');
  var errorBox = document.getElementById('authError');
  var nameInput = document.getElementById('name');
  var emailInput = document.getElementById('email');
  var regionSelect = document.getElementById('region');
  var emailHint = document.getElementById('emailHint');

  var mode = params.get('mode') === 'signin' ? 'signin' : 'signup';
  var pendingItem = params.get('item') || '';

  /* ---------- mode switching ---------- */
  function setMode(next) {
    mode = next;
    card.setAttribute('data-mode', mode);
    sw.setAttribute('data-on', mode);
    tabSignup.classList.toggle('is-on', mode === 'signup');
    tabSignin.classList.toggle('is-on', mode === 'signin');
    tabSignup.setAttribute('aria-selected', String(mode === 'signup'));
    tabSignin.setAttribute('aria-selected', String(mode === 'signin'));

    if (mode === 'signup') {
      title.textContent = 'Start your shelf';
      sub.textContent = 'Free, and it takes about fifteen seconds.';
      submit.querySelector('span').textContent = 'Create account';
      emailHint.textContent = 'Used only as the name on your shelf — nothing is sent to it.';
      nameInput.removeAttribute('disabled');
      regionSelect.removeAttribute('disabled');
    } else {
      title.textContent = 'Welcome back';
      sub.textContent = 'Your shelf is waiting in this browser.';
      submit.querySelector('span').textContent = 'Sign in';
      emailHint.textContent = 'The email you used when you started your shelf.';
      nameInput.setAttribute('disabled', '');
      regionSelect.setAttribute('disabled', '');
    }
    hideError();
    var url = new URL(location.href);
    url.searchParams.set('mode', mode);
    history.replaceState(null, '', url);
  }

  tabSignup.addEventListener('click', function () { setMode('signup'); });
  tabSignin.addEventListener('click', function () { setMode('signin'); });

  /* ---------- prefill from an existing local account ---------- */
  var existing = S.getUser();
  if (existing) {
    if (existing.email) emailInput.value = existing.email;
    if (existing.name) nameInput.value = existing.name;
    if (existing.region) regionSelect.value = existing.region;
    if (!params.get('mode')) mode = 'signin';
  }
  setMode(mode);

  /* ---------- validation ---------- */
  function showError(msg) {
    // unhide first, then write: a hidden alert is never announced
    errorBox.hidden = false;
    errorBox.textContent = msg;
  }
  function hideError() {
    errorBox.textContent = '';
    errorBox.hidden = true;
  }

  function validEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim());
  }

  /* ---------- submit ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideError();

    var email = emailInput.value.trim();
    if (!email) {
      showError('Pop in an email so your shelf has a name.');
      emailInput.focus();
      return;
    }
    if (!validEmail(email)) {
      showError("That doesn't look like an email address.");
      emailInput.focus();
      return;
    }

    submit.classList.add('is-busy');

    var user;
    if (mode === 'signup') {
      user = S.signUp(nameInput.value, email, regionSelect.value);
    } else {
      user = S.signIn(email);
    }

    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var go = function () {
      var url = 'app.html';
      if (pendingItem) url += '?new=' + encodeURIComponent(pendingItem);
      location.href = url;
    };

    if (reduce) { go(); return; }
    card.classList.add('is-done');
    setTimeout(go, 380);
  });

  /* ---------- enter key moves through fields ---------- */
  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); emailInput.focus(); }
  });
})();
