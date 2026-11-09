/* Slipstream Web's · portada (JS puro, sin librerías) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var touch = window.matchMedia('(hover: none)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* Barra de navegación */
  var nav = $('#navbar'), links = $('#navLinks'), toggle = $('#navToggle');
  window.addEventListener('scroll', function () { nav.classList.toggle('is-scrolled', window.scrollY > 10); }, { passive: true });
  function setMenu(open) {
    links.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
  $$('a', links).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Revelado al hacer scroll */
  var els = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Vista previa que "baja" la página de la demo.
     Escritorio: al pasar el ratón o enfocar la tarjeta.
     Móvil: cuando la tarjeta está bien visible en pantalla. */
  function playScroll(card, on) {
    var shot = $('.demo-media .shot', card), img = $('img.preview', shot);
    if (!shot || !img) return;
    var dist = Math.max(0, img.offsetHeight - shot.clientHeight);
    if (on && dist > 0) {
      var secs = Math.min(10, Math.max(3, dist / 110));
      img.style.transition = 'transform ' + secs.toFixed(1) + 's cubic-bezier(0.45, 0, 0.55, 1)';
      img.style.transform = 'translate3d(0,' + (-dist) + 'px,0)';
    } else {
      img.style.transition = 'transform 0.7s ease';
      img.style.transform = 'translate3d(0,0,0)';
    }
  }

  if (!reduce) {
    var cards = $$('.demo-card');
    if (!touch) {
      cards.forEach(function (c) {
        c.addEventListener('pointerenter', function () { playScroll(c, true); });
        c.addEventListener('pointerleave', function () { playScroll(c, false); });
        c.addEventListener('focusin', function () { playScroll(c, true); });
        c.addEventListener('focusout', function () { playScroll(c, false); });
      });
    } else if ('IntersectionObserver' in window) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { playScroll(e.target, e.isIntersecting && e.intersectionRatio >= 0.7); });
      }, { threshold: [0, 0.7, 1] });
      cards.forEach(function (c) { tio.observe(c); });
    }
  }
})();
