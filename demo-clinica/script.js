/* Clínica Goaldental · interacción (JS puro, sin librerías) */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || document).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }

  /* Cabecera y botones flotantes según scroll */
  var navbar = $('#navbar'), fab = $('#floatCta'), ticking = false;
  function onScroll() {
    var y = window.scrollY || 0;
    if (navbar) navbar.classList.toggle('is-scrolled', y > 10);
    if (fab) fab.classList.toggle('is-visible', y > 420);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  onScroll();

  /* Menú móvil */
  var toggle = $('#navToggle'), panel = $('#mobilePanel');
  function setMenu(open) {
    if (!toggle || !panel) return;
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }
  if (toggle) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1020) setMenu(false); });
  }

  /* Revelado al hacer scroll */
  var els = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* Fotos opcionales (img/hero.jpg, img/equipo-1.jpg…): solo se muestran si existen */
  $$('[data-photo]').forEach(function (el) {
    var im = new Image();
    im.onload = function () {
      el.style.backgroundImage = 'url("' + el.getAttribute('data-photo') + '")';
      el.classList.add('has-photo');
    };
    im.src = el.getAttribute('data-photo');
  });

  /* Imágenes remotas que fallen: se muestra un degradado con icono */
  function broken(img) {
    img.classList.add('is-broken');
    if (img.parentNode) img.parentNode.classList.add('img-fallback');
  }
  $$('.card-img-container img, .sedation-img').forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) broken(img);
    img.addEventListener('error', function () { broken(img); });
  });

  /* Filtros de tratamientos */
  var filters = $$('.filter-btn[data-filter]');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var cat = btn.getAttribute('data-filter');
      filters.forEach(function (b) { b.classList.toggle('active', b === btn); });
      $$('.detail-treatment-card').forEach(function (card) {
        var show = cat === 'all' || card.getAttribute('data-category') === cat;
        card.style.display = show ? '' : 'none';
        if (show) card.classList.add('is-in');
      });
    });
  });

  /* Si se llega con #ancla a una tarjeta oculta por filtro, no pasa: los filtros empiezan en "todas" */

  /* Formularios de demostración (no envían nada) */
  var date = $('input[type="date"]');
  if (date) {
    var d = new Date(), p = function (n) { return (n < 10 ? '0' : '') + n; };
    date.min = d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  $$('form[data-demo-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var box = document.getElementById(form.getAttribute('data-alert'));
      if (box) {
        box.style.display = 'block';
        box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
        setTimeout(function () { box.style.display = 'none'; }, 9000);
      }
      form.reset();
    });
  });
})();
