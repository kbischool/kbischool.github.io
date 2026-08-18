document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('nav.primary');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', nav.classList.contains('open'));
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
});
