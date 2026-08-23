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
      if (window.innerWidth <= 960) {
        e.preventDefault();
        var isOpen = li.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen);
      }
    });
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && nav) {
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
    var revealTargets = document.querySelectorAll('.card, .stat, .news-card, .faq-item, .section-head');
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
  }

  /* ---------- LOCAL FORMS: accessible confirmation instead of alert() ---------- */
  document.querySelectorAll('form[data-local-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.reportValidity === 'function' && !form.reportValidity()) {
        return; // native, accessible validation messages handle the invalid case
      }
      var status = form.querySelector('.form-status');
      form.reset();
      if (status) {
        status.hidden = false;
        status.focus();
      }
    });
  });
});
