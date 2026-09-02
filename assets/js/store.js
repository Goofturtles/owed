/* ============================================================
   Owed — local store
   Account + shelf live entirely in this browser. There is no
   server, so nothing here ever leaves the device.
   ============================================================ */
(function (global) {
  'use strict';

  var KEY_USER = 'owed:user';
  var KEY_SHELF = 'owed:shelf';
  var KEY_SEEN = 'owed:seen';

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  function uid() {
    return 'i' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  /* ---------------- account ---------------- */
  /* Passwords are never stored. This is a local demo account: the
     browser simply remembers a name, email and region. */
  function getUser() {
    var u = read(KEY_USER, null);
    if (!u || typeof u !== 'object' || Array.isArray(u)) return null;
    ['name', 'email', 'region'].forEach(function (k) { if (u[k] != null) u[k] = String(u[k]); });
    return u;
  }

  function signUp(name, email, region) {
    var user = {
      id: uid(),
      name: (name || '').trim() || 'You',
      email: (email || '').trim(),
      region: region || 'US',
      createdAt: Date.now()
    };
    write(KEY_USER, user);
    return user;
  }

  function signIn(email) {
    var existing = getUser();
    if (existing && existing.email &&
        existing.email.toLowerCase() === String(email || '').trim().toLowerCase()) {
      return existing;
    }
    // If this browser already holds a shelf under a different email, refusing is
    // the only honest answer: the UI promises "your shelf is waiting in this
    // browser", and silently minting a new id would orphan that shelf.
    if (existing && existing.email) return null;
    // Nothing stored yet — first sign-in on this browser adopts the address.
    var user = {
      id: uid(),
      name: (String(email || '').split('@')[0] || 'You').replace(/[._-]/g, ' '),
      email: String(email || '').trim(),
      region: (existing && existing.region) || 'US',
      createdAt: Date.now()
    };
    write(KEY_USER, user);
    return user;
  }

  function signOut() {
    try { localStorage.removeItem(KEY_USER); } catch (e) {}
  }

  function updateUser(patch) {
    var u = getUser();
    if (!u) return null;
    Object.keys(patch || {}).forEach(function (k) { u[k] = patch[k]; });
    write(KEY_USER, u);
    return u;
  }

  function isSignedIn() {
    return !!getUser();
  }

  /* ---------------- shelf ---------------- */
  function getShelf() {
    var shelf = read(KEY_SHELF, []);
    if (!Array.isArray(shelf)) return [];
    // one malformed entry should not take the whole app down
    return shelf.filter(function (it) {
      return it && typeof it === 'object' && !Array.isArray(it) && it.id;
    }).map(function (it) {
      // normalise the shape at the read boundary: everything downstream
      // builds markup from these fields
      it.id = String(it.id);
      if (it.name != null) it.name = String(it.name);
      if (it.brand != null) it.brand = String(it.brand);
      if (!it.claims || typeof it.claims !== 'object' || Array.isArray(it.claims)) it.claims = {};
      Object.keys(it.claims).forEach(function (k) {
        var cl = it.claims[k];
        if (!cl || typeof cl !== 'object' || typeof cl.state !== 'string') delete it.claims[k];
      });
      return it;
    });
  }

  function addItem(item) {
    var shelf = getShelf();
    item.id = item.id || uid();
    item.addedAt = item.addedAt || Date.now();
    item.claims = item.claims || {};
    shelf.unshift(item);
    write(KEY_SHELF, shelf);
    return item;
  }

  function updateItem(id, patch) {
    var shelf = getShelf();
    for (var i = 0; i < shelf.length; i++) {
      if (shelf[i].id === id) {
        Object.keys(patch || {}).forEach(function (k) { shelf[i][k] = patch[k]; });
        write(KEY_SHELF, shelf);
        return shelf[i];
      }
    }
    return null;
  }

  function removeItem(id) {
    var shelf = getShelf().filter(function (it) { return it.id !== id; });
    write(KEY_SHELF, shelf);
  }

  function getItem(id) {
    var shelf = getShelf();
    for (var i = 0; i < shelf.length; i++) {
      if (shelf[i].id === id) return shelf[i];
    }
    return null;
  }

  /** Mark a rule as won / attempted for an item. */
  function setClaimState(itemId, ruleId, state) {
    var item = getItem(itemId);
    if (!item) return null;
    item.claims = item.claims || {};
    if (state === null) {
      delete item.claims[ruleId];
    } else {
      item.claims[ruleId] = { state: state, at: Date.now() };
    }
    return updateItem(itemId, { claims: item.claims });
  }

  /** Items where at least one claim was marked won. */
  function rescuedCount() {
    return getShelf().filter(function (it) {
      var c = it.claims || {};
      return Object.keys(c).some(function (k) { return c[k].state === 'won'; });
    }).length;
  }

  /* ---------------- "new since you last looked" ---------------- */
  function getSeen() {
    return read(KEY_SEEN, {});
  }

  function markSeen(itemId, ruleIds) {
    var seen = getSeen();
    seen[itemId] = ruleIds;
    write(KEY_SEEN, seen);
  }

  function newRulesFor(itemId, ruleIds) {
    var seen = getSeen();
    var before = seen[itemId];
    if (!Array.isArray(before)) return [];
    return ruleIds.filter(function (id) { return before.indexOf(id) === -1; });
  }

  /* ---------------- demo shelf ---------------- */
  function seedDemo() {
    if (getShelf().length) return;
    var now = Date.now();
    var MONTH = 1000 * 60 * 60 * 24 * 30.4;
    [
      { name: 'Sony WH-1000XM4 headphones', brand: 'Sony', category: 'headphones',
        ageMonths: 14, payment: 'visa', region: 'US', broken: true,
        addedAt: now - 2 * MONTH },
      { name: 'Whirlpool dishwasher', brand: 'Whirlpool', category: 'appliance-large',
        ageMonths: 34, payment: 'mastercard', region: 'US', broken: true,
        addedAt: now - 5 * MONTH },
      { name: 'DeWalt cordless drill', brand: 'DeWalt', category: 'power-tool',
        ageMonths: 22, payment: 'visa', region: 'US', broken: false,
        addedAt: now - 1 * MONTH },
      { name: 'Lodge cast iron skillet', brand: 'Lodge', category: 'kitchen',
        ageMonths: 60, payment: 'cash', region: 'US', broken: true,
        addedAt: now - 10 * MONTH }
    ].forEach(function (it) { addItem(it); });
  }

  global.OwedStore = {
    getUser: getUser,
    signUp: signUp,
    signIn: signIn,
    signOut: signOut,
    updateUser: updateUser,
    isSignedIn: isSignedIn,
    getShelf: getShelf,
    addItem: addItem,
    updateItem: updateItem,
    removeItem: removeItem,
    getItem: getItem,
    setClaimState: setClaimState,
    rescuedCount: rescuedCount,
    markSeen: markSeen,
    newRulesFor: newRulesFor,
    seedDemo: seedDemo
  };
})(window);
