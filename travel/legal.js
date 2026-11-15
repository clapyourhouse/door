(function () {
  var p = (new URLSearchParams(location.search).get('lang') || '').toLowerCase();
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem('door.lang.v1')); } catch (e) {}
  var lang = (p === 'ja' || p === 'en') ? p : (saved === 'ja' || saved === 'en') ? saved : ((navigator.language || 'en').toLowerCase().indexOf('ja') === 0 ? 'ja' : 'en');
  function apply() {
    document.documentElement.lang = lang;
    var t = document.querySelector('[data-title-' + lang + ']');
    if (t) document.title = t.getAttribute('data-title-' + lang);
    var b = document.getElementById('langBtn'); if (b) b.textContent = lang === 'ja' ? 'EN' : '日本語';
    document.querySelectorAll('a[data-keep]').forEach(function (a) { a.href = a.getAttribute('data-keep') + '?lang=' + lang; });
  }
  window.toggleLang = function () {
    lang = lang === 'ja' ? 'en' : 'ja';
    try { localStorage.setItem('door.lang.v1', JSON.stringify(lang)); } catch (e) {}
    apply();
  };
  apply();
})();
