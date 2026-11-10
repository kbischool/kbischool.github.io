/* Runs before first paint: marks JS as available and applies the saved theme. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  try {
    var t = localStorage.getItem('kbi-theme');
    if (t === 'light' || t === 'dark') {
      d.setAttribute('data-theme', t);
      var c = t === 'dark' ? '#070e1d' : '#f6fbfd';
      var m = document.querySelectorAll('meta[name="theme-color"]');
      for (var i = 0; i < m.length; i++) m[i].setAttribute('content', c);
    }
  } catch (e) { /* storage unavailable: follow the system setting */ }
})();
