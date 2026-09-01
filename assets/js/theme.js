/* ============================================================
   Owed — theme

   Light is the default for everyone, on every visit, regardless of
   what the operating system prefers. Dark is a deliberate choice the
   visitor makes here, and it sticks.

   Runs before paint so the page never flashes the wrong theme.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'owed:theme';

  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function apply(mode) {
    var root = document.documentElement;
    if (mode === 'dark') root.setAttribute('data-theme', 'dark');
    else root.setAttribute('data-theme', 'light');
  }

  /** Anything that isn't an explicit 'dark' resolves to light. */
  function current() {
    return stored() === 'dark' ? 'dark' : 'light';
  }

  // apply immediately, before the body paints
  apply(current());

  function set(mode) {
    try {
      if (mode === 'dark') localStorage.setItem(KEY, 'dark');
      else localStorage.setItem(KEY, 'light');
    } catch (e) {}
    apply(mode);
    render();
    return mode;
  }

  function toggle() { return set(current() === 'dark' ? 'light' : 'dark'); }

  var ICONS = {
    light: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4"/></svg>',
    dark: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/></svg>'
  };

  var btn = null;

  function render() {
    if (!btn) return;
    var c = current();
    // show the icon for the mode you'd switch TO
    btn.innerHTML = c === 'dark' ? ICONS.light : ICONS.dark;
    var label = c === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
    btn.setAttribute('aria-pressed', c === 'dark' ? 'true' : 'false');
  }

  function mount() {
    // slot it into whichever bar this page has
    var host = document.querySelector('.nav-actions') ||
               document.querySelector('.appbar-right') ||
               document.querySelector('.auth-main');
    if (!host) return;

    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-btn';
    btn.addEventListener('click', toggle);

    if (host.classList.contains('auth-main')) {
      btn.classList.add('theme-btn-float');
      host.appendChild(btn);
    } else {
      host.insertBefore(btn, host.firstChild);
    }
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }

  window.OwedTheme = { current: current, set: set, toggle: toggle };
})();
