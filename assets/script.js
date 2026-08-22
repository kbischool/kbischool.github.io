document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('nav.primary');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', isOpen);
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
        li.classList.toggle('open');
      }
    });
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 960 && nav) {
      nav.classList.remove('open');
      if (burger) burger.setAttribute('aria-expanded', 'false');
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
});
