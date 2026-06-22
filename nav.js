/* Mobiles Klappmenü (Hamburger) */
(function () {
  var toggle = document.querySelector('.nav-toggle');
  if (!toggle) return;
  var header = toggle.closest('header') || document.querySelector('.site-header');
  var nav = document.getElementById('primary-nav') || document.querySelector('.nav-links');
  if (!header) return;

  function setOpen(open) {
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  }

  toggle.addEventListener('click', function () {
    setOpen(!header.classList.contains('nav-open'));
  });

  if (nav) {
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setOpen(false);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();
