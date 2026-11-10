/* KBI Schools — progressive enhancement. The site works without this file. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  var base = root.getAttribute('data-base') || '/';
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } }
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktop = window.matchMedia('(min-width: 64rem)');

  /* Year in footer */
  $$('[data-year]').forEach(function (n) { n.textContent = new Date().getFullYear(); });

  /* ---- Theme toggle ---------------------------------------------------- */
  var themeBtn = $('[data-theme-toggle]');
  function currentTheme() {
    return root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  }
  function syncThemeUi() {
    var dark = currentTheme() === 'dark';
    if (themeBtn) {
      themeBtn.setAttribute('aria-pressed', String(dark));
      themeBtn.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    }
    var c = dark ? '#070e1d' : '#f6fbfd';
    $$('meta[name="theme-color"]').forEach(function (m) { m.setAttribute('content', c); });
  }
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = currentTheme() === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      store.set('kbi-theme', next);
      syncThemeUi();
    });
  }
  syncThemeUi();

  /* ---- Header state, back to top -------------------------------------- */
  var header = $('.site-header'), toTop = $('[data-to-top]'), ticking = false;
  function onScroll() {
    var y = window.scrollY || 0;
    if (header) header.classList.toggle('is-scrolled', y > 8);
    if (toTop) toTop.classList.toggle('is-visible', y > 700);
    updatePathway();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScroll); }
  }, { passive: true });
  if (toTop) toTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    var s = $('.skip-link'); if (s) { s.focus({ preventScroll: true }); s.blur(); }
  });

  /* ---- Mobile menu and dropdowns -------------------------------------- */
  var burger = $('[data-menu-toggle]'), nav = $('#site-nav');
  function menuFocusables() { return $$('a[href], summary', nav).filter(function (e) { return e.offsetParent !== null; }); }
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) { var f = menuFocusables()[0]; if (f) f.focus(); } else { burger.focus(); }
  }
  if (burger && nav) {
    burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a'); if (a && root.classList.contains('menu-open')) { root.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); burger.setAttribute('aria-label', 'Open menu'); }
    });
    doc.addEventListener('keydown', function (e) {
      if (!root.classList.contains('menu-open')) return;
      if (e.key === 'Escape') { setMenu(false); return; }
      if (e.key === 'Tab') {
        var f = menuFocusables().concat([burger]); var first = burger, last = f[f.length - 2];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    desktop.addEventListener('change', function (e) { if (e.matches) { root.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); } });
  }
  var groups = $$('.nav-group');
  groups.forEach(function (g) {
    g.addEventListener('toggle', function () {
      if (g.open && desktop.matches) groups.forEach(function (o) { if (o !== g) o.open = false; });
    });
  });
  doc.addEventListener('click', function (e) {
    if (desktop.matches && !e.target.closest('.nav-group')) groups.forEach(function (g) { g.open = false; });
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && desktop.matches) groups.forEach(function (g) { if (g.open) { g.open = false; $('summary', g).focus(); } });
  });

  /* ---- Reveal on scroll ------------------------------------------------ */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else { reveals.forEach(function (el) { el.classList.add('is-in'); }); }

  /* ---- Pathway progress (homepage signature) -------------------------- */
  var pathway = $('[data-pathway]');
  var stages = pathway ? $$('.stage', pathway) : [];
  function updatePathway() {
    if (!pathway) return;
    var r = pathway.getBoundingClientRect(), vh = window.innerHeight, mid = vh * 0.55;
    var p = Math.max(0, Math.min(1, (mid - r.top) / r.height));
    pathway.style.setProperty('--p', p.toFixed(3));
    stages.forEach(function (s) {
      var n = $('.stage-node', s).getBoundingClientRect();
      s.classList.toggle('is-passed', n.top < mid);
    });
  }
  updatePathway();
  window.addEventListener('resize', updatePathway, { passive: true });

  /* ---- Click-to-load map (no third-party request until asked) --------- */
  var MAP_URL = 'https://www.google.com/maps?q=15+Okikiolu+Haven+Moniya+Ibadan&output=embed';
  $$('[data-map-load]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var box = btn.closest('.map-box'), f = doc.createElement('iframe');
      f.title = 'Map showing KBI Schools in Moniya, Ibadan';
      f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
      f.src = MAP_URL;
      box.textContent = ''; box.classList.add('is-loaded'); box.appendChild(f);
    });
  });

  /* ---- Share ----------------------------------------------------------- */
  if (navigator.share) {
    $$('[data-share]').forEach(function (b) {
      b.hidden = false;
      b.addEventListener('click', function () {
        navigator.share({ title: b.getAttribute('data-share-title'), text: b.getAttribute('data-share-text'), url: b.getAttribute('data-share-url') }).catch(function () { /* cancelled */ });
      });
    });
  }

  /* ---- Forms ----------------------------------------------------------- */
  function fieldOf(el) { return el.closest('.field'); }
  function setError(el, msg) {
    var f = fieldOf(el); if (!f) return;
    var out = $('.error', f);
    f.classList.toggle('has-error', !!msg);
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (out) out.textContent = msg || '';
  }
  function messageFor(el) {
    var v = el.validity, label = (el.labels && el.labels[0] ? el.labels[0].textContent : 'This field').replace(/\(optional\)/i, '').trim();
    if (v.valueMissing) return 'Please enter ' + label.toLowerCase() + '.';
    if (v.typeMismatch && el.type === 'email') return 'Please enter a valid email address, like name@example.com.';
    if (v.patternMismatch && el.type === 'tel') return 'Please enter a phone number using digits only, for example 08012345678.';
    return el.validationMessage;
  }
  $$('form[data-form]').forEach(function (form) {
    var ok = $('[data-status-ok]', form), err = $('[data-status-err]', form), btn = $('button[type="submit"]', form), label = btn.textContent;
    $$('input,select,textarea', form).forEach(function (el) {
      el.addEventListener('blur', function () { if (el.value || el.classList.contains('touched')) { el.classList.add('touched'); setError(el, el.checkValidity() ? '' : messageFor(el)); } });
      el.addEventListener('input', function () { if (fieldOf(el) && fieldOf(el).classList.contains('has-error') && el.checkValidity()) setError(el, ''); });
    });
    form.addEventListener('submit', function (e) {
      if (form.dataset.noajax) return;
      e.preventDefault();
      ok.hidden = true; err.hidden = true;
      var first = null;
      $$('input,select,textarea', form).forEach(function (el) {
        if (el.type === 'hidden' || el.closest('.hp')) return;
        var valid = el.checkValidity(); setError(el, valid ? '' : messageFor(el)); if (!valid && !first) first = el;
      });
      if (first) { first.focus(); return; }
      var hp = $('.hp input', form); if (hp && hp.value) { ok.hidden = false; form.reset(); return; }
      if (navigator.onLine === false) { err.hidden = false; err.focus(); return; }
      btn.disabled = true; btn.textContent = '';
      var sp = doc.createElement('span'); sp.className = 'spinner'; sp.setAttribute('aria-hidden', 'true');
      btn.appendChild(sp); btn.appendChild(doc.createTextNode(' Sending…'));
      var ctrl = 'AbortController' in window ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 15000);
      var data = new FormData(form);
      fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), { method: 'POST', body: data, headers: { Accept: 'application/json' }, signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
        .then(function (j) { if (j && (j.success === 'false' || j.success === false)) throw new Error('rejected'); ok.hidden = false; form.reset(); $$('.touched', form).forEach(function (n) { n.classList.remove('touched'); }); ok.focus(); })
        .catch(function () { err.hidden = false; err.focus(); })
        .then(function () { clearTimeout(timer); btn.disabled = false; btn.textContent = label; });
    });
    if (/[?&]sent=true/.test(location.search)) { ok.hidden = false; }
  });

  /* ---- Online / offline state ----------------------------------------- */
  var banner = $('[data-offline-banner]');
  function syncOnline() { if (banner) banner.hidden = navigator.onLine !== false; }
  window.addEventListener('online', syncOnline); window.addEventListener('offline', syncOnline); syncOnline();

  /* ---- PWA: service worker, update toast, install --------------------- */
  function el(tag, cls, text) { var n = doc.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; }
  function showUpdateToast(worker) {
    if ($('[data-update-toast]')) return;
    var t = el('div', 'toast'); t.setAttribute('role', 'status'); t.setAttribute('data-update-toast', '');
    t.appendChild(el('p', '', 'A new version of the site is ready.'));
    var go = el('button', 'btn btn-primary', 'Refresh'); go.type = 'button';
    var later = el('button', 'btn btn-ghost', 'Later'); later.type = 'button';
    go.addEventListener('click', function () { worker.postMessage({ type: 'SKIP_WAITING' }); go.disabled = true; });
    later.addEventListener('click', function () { t.remove(); });
    t.appendChild(go); t.appendChild(later); doc.body.appendChild(t);
  }
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    var refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (refreshing) return; refreshing = true; location.reload(); });
    window.addEventListener('load', function () {
      navigator.serviceWorker.register(base + 'sw.js', { scope: base }).then(function (reg) {
        if (reg.waiting && navigator.serviceWorker.controller) showUpdateToast(reg.waiting);
        reg.addEventListener('updatefound', function () {
          var w = reg.installing; if (!w) return;
          w.addEventListener('statechange', function () { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdateToast(w); });
        });
        doc.addEventListener('visibilitychange', function () { if (!doc.hidden) reg.update().catch(function () { /* offline */ }); });
      }).catch(function () { /* the site still works without a service worker */ });
    });
  }

  var standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  var isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var deferred = null, installBtns = $$('[data-install]'), iosDialog = $('#ios-guide');
  function showInstallButtons(on) { installBtns.forEach(function (b) { b.hidden = !on; }); }
  function dismissedRecently() { var t = parseInt(store.get('kbi-install-dismissed') || '0', 10); return t && Date.now() - t < 14 * 864e5; }
  function offerInstallCard() {
    if (standalone || dismissedRecently() || $('[data-install-card]')) return;
    var views = parseInt(store.get('kbi-views') || '0', 10);
    if (views < 2) return;
    setTimeout(function () {
      if ($('[data-install-card]') || (!deferred && !isIOS)) return;
      var c = el('div', 'install-card'); c.setAttribute('role', 'dialog'); c.setAttribute('aria-label', 'Install the KBI Schools app'); c.setAttribute('data-install-card', '');
      c.appendChild(el('h2', '', 'Install KBI Schools'));
      c.appendChild(el('p', '', 'Add the school website to your home screen for quick access to admissions, results and contacts, even with a weak connection.'));
      var r = el('div', 'row'), yes = el('button', 'btn btn-primary btn-sm', isIOS ? 'Show me how' : 'Install'), no = el('button', 'btn btn-ghost btn-sm', 'Not now');
      yes.type = 'button'; no.type = 'button';
      yes.addEventListener('click', function () { c.remove(); startInstall(); });
      no.addEventListener('click', function () { store.set('kbi-install-dismissed', String(Date.now())); c.remove(); });
      r.appendChild(yes); r.appendChild(no); c.appendChild(r); doc.body.appendChild(c);
    }, 20000);
  }
  function startInstall() {
    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then(function (c) { if (c.outcome !== 'accepted') store.set('kbi-install-dismissed', String(Date.now())); deferred = null; });
    } else if (isIOS && iosDialog && iosDialog.showModal) { iosDialog.showModal(); }
  }
  store.set('kbi-views', String(parseInt(store.get('kbi-views') || '0', 10) + 1));
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); deferred = e; showInstallButtons(!standalone); offerInstallCard(); });
  window.addEventListener('appinstalled', function () { deferred = null; showInstallButtons(false); var c = $('[data-install-card]'); if (c) c.remove(); });
  installBtns.forEach(function (b) { b.addEventListener('click', startInstall); });
  if (isIOS && !standalone) { showInstallButtons(true); offerInstallCard(); }
  if (iosDialog) $$('[data-close-dialog]', iosDialog).forEach(function (b) { b.addEventListener('click', function () { iosDialog.close(); }); });

  onScroll();
})();
