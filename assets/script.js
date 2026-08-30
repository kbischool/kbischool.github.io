document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('nav.primary');

  function closeDrawer() {
    if (!nav) return;
    nav.classList.remove('open');
    if (burger) { burger.setAttribute('aria-expanded', 'false'); }
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
      if (isOpen) {
        var firstLink = nav.querySelector('a, button');
        if (firstLink) firstLink.focus();
      }
    });
  }

  // Mobile: tap a dropdown parent to expand instead of hover
  document.querySelectorAll('nav.primary > ul > li').forEach(function (li) {
    var trigger = li.querySelector('button, a');
    var dropdown = li.querySelector('.dropdown');
    if (!dropdown || !trigger) return;
    trigger.addEventListener('click', function (e) {
      if (window.innerWidth <= 1300) {
        e.preventDefault();
        var isOpen = li.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen);
      }
    });
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1300 && nav) {
      closeDrawer();
    }
  });

  // Escape closes the mobile drawer and returns focus to the toggle button
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav && nav.classList.contains('open')) {
      closeDrawer();
      if (burger) burger.focus();
    }
  });

  /* ---------- SCROLL PROGRESS BAR ---------- */
  var bar = document.getElementById('scrollProgress');
  if (bar) {
    var updateBar = function () {
      var h = document.documentElement;
      var pct = (h.scrollTop) / ((h.scrollHeight - h.clientHeight) || 1) * 100;
      bar.style.width = pct + '%';
    };
    document.addEventListener('scroll', updateBar, { passive: true });
    updateBar();
  }

  /* ---------- BACK TO TOP ---------- */
  var toTop = document.getElementById('toTop');
  if (toTop) {
    document.addEventListener('scroll', function () {
      toTop.classList.toggle('show', window.scrollY > 600);
    }, { passive: true });
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- FOOTER YEAR ---------- */
  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();

  /* ---------- REVEAL ON SCROLL (progressive enhancement) ---------- */
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var revealTargets = document.querySelectorAll('.card, .stat, .news-card, .faq-item, .section-head, .photo-frame');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealTargets.forEach(function (el, i) {
      el.classList.add('reveal-ready');
      el.style.transitionDelay = Math.min(i % 4, 3) * 60 + 'ms';
      io.observe(el);
    });
  } else {
    // No IntersectionObserver support (or reduced motion): show content immediately,
    // never add the opacity:0 starting state in the first place.
    document.querySelectorAll('.card, .stat, .news-card, .faq-item, .section-head, .photo-frame').forEach(function (el) {
      el.classList.add('in-view');
    });
  }

  /* ---------- ANIMATED STAT COUNTERS ---------- */
  if (!reduceMotion && 'IntersectionObserver' in window) {
    var counters = document.querySelectorAll('[data-counter]');
    var countIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-counter'), 10);
        var start = null;
        var duration = 1100;
        function step(ts) {
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(eased * target);
          if (progress < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        countIO.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { countIO.observe(el); });
  } else {
    document.querySelectorAll('[data-counter]').forEach(function (el) {
      el.textContent = el.getAttribute('data-counter');
    });
  }

  /* ---------- SMOOTH FAQ ACCORDION (progressive enhancement over native <details>) ---------- */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var body = item.querySelector('.faq-body');
    if (!body || reduceMotion) return; // native <details> behaviour is already fully accessible
    var summary = item.querySelector('summary');
    item.style.overflow = 'hidden';
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (item.hasAttribute('open')) {
        var h = body.offsetHeight;
        body.style.height = h + 'px';
        requestAnimationFrame(function () {
          body.style.transition = 'height .25s ease, opacity .25s ease';
          body.style.height = '0px';
          body.style.opacity = '0';
        });
        body.addEventListener('transitionend', function te() {
          item.removeAttribute('open');
          body.style.transition = '';
          body.removeEventListener('transitionend', te);
        });
      } else {
        item.setAttribute('open', '');
        var full = body.scrollHeight;
        body.style.height = '0px';
        body.style.opacity = '0';
        requestAnimationFrame(function () {
          body.style.transition = 'height .3s ease, opacity .3s ease';
          body.style.height = full + 'px';
          body.style.opacity = '1';
        });
        body.addEventListener('transitionend', function te2() {
          body.style.height = 'auto';
          body.style.transition = '';
          body.removeEventListener('transitionend', te2);
        });
      }
    });
  });

  /* ---------- FORMS: real submission via FormSubmit, with graceful fallbacks ----------
     Primary path: the <form> has a real action="https://formsubmit.co/..." and method="POST",
     so it genuinely sends email even if JavaScript never runs. When JS *is* available, we
     intercept submit and send the same data via fetch() to FormSubmit's AJAX endpoint instead,
     so the person sees an inline confirmation without leaving the page. If that fetch fails
     for any reason (offline, FormSubmit down, CORS blocked by a restrictive network), we fall
     back to letting the browser submit the form normally rather than silently losing the
     message. */
  document.querySelectorAll('form[data-local-form]').forEach(function (form) {
    var successEl = form.querySelector('.form-status:not(.form-status-error)');
    var errorEl = form.querySelector('.form-status-error');
    var submitBtn = form.querySelector('button[type="submit"]');
    var submitLabel = submitBtn ? submitBtn.textContent : '';

    function showStatus(el) {
      [successEl, errorEl].forEach(function (s) { if (s) s.hidden = true; });
      if (el) { el.hidden = false; el.focus(); }
    }

    form.addEventListener('submit', function (e) {
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) {
        e.preventDefault(); // native, accessible validation messages handle the invalid case
        return;
      }
      var action = form.getAttribute('action');
      if (!action || !window.fetch) return; // no JS-enhanced path available: let the real POST happen

      e.preventDefault();
      var ajaxAction = action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
      var data = new FormData(form);

      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

      fetch(ajaxAction, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      })
        .then(function (res) { if (!res.ok) throw new Error('Request failed'); return res.json(); })
        .then(function () {
          form.reset();
          showStatus(successEl);
        })
        .catch(function () {
          // Fetch failed — fall back to a real, full-page form submission so the
          // message still has a chance to send rather than just disappearing.
          // (HTMLFormElement.submit() does not re-fire the 'submit' event, so this
          // is safe and won't loop back into this same handler.)
          form.submit();
        })
        .finally(function () {
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
        });
    });
  });

  /* If we've just come back from a real (non-JS) FormSubmit redirect, show the confirmation */
  if (/[?&]sent=true/.test(window.location.search)) {
    var justSubmittedForm = document.querySelector('form[data-local-form]');
    if (justSubmittedForm) {
      var ok = justSubmittedForm.querySelector('.form-status:not(.form-status-error)');
      if (ok) { ok.hidden = false; ok.focus(); }
    }
  }
});
