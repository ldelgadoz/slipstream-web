/* ==========================================================================
   MOTORSPORT GARAGE · v2 - Interacción y animaciones (JS puro, sin librerías)
   Respeta prefers-reduced-motion y solo usa efectos de puntero en pantallas
   con ratón.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------------------------------------------------------------
     1. Intro del hero (espera a las fuentes, máximo 700 ms)
     --------------------------------------------------------------------- */
  var hero = $('#inicio');
  function ready() { requestAnimationFrame(function () { hero.classList.add('is-ready'); }); }

  if (document.fonts && document.fonts.ready) {
    Promise.race([
      document.fonts.ready,
      new Promise(function (r) { setTimeout(r, 700); })
    ]).then(ready);
  } else {
    setTimeout(ready, 100);
  }

  /* ---------------------------------------------------------------------
     2. Header, parallax de la palabra fantasma y scroll-linked (un listener)
     --------------------------------------------------------------------- */
  var header = $('#header');
  var ghost = $('#ghost');
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    header.classList.toggle('is-scrolled', y > 40);
    if (ghost && !reduce && y < window.innerHeight * 1.5) {
      ghost.style.transform = 'translate3d(' + (-y * 0.2).toFixed(1) + 'px,0,0)';
    }
    updatePinned();
    updateProcess();
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------------------------------------------------------------------
     3. Servicios: scroll horizontal anclado (solo escritorio y sin
        movimiento reducido; en móvil es un carrusel con scroll-snap)
     --------------------------------------------------------------------- */
  var svcSection = $('#servicios');
  var track = $('#track');
  var svcCount = $('#svcCount');
  var svcBar = $('#svcBar');
  var cards = $$('.card', track);
  var pin = { on: false, travel: 0 };

  function measurePinned() {
    var want = !reduce && window.innerWidth > 900 && window.innerHeight >= 560;
    svcSection.classList.toggle('is-pinned', want);

    if (!want) {
      pin.on = false;
      svcSection.style.height = '';
      track.style.transform = '';
      return;
    }

    var last = cards[cards.length - 1];
    var padL = parseFloat(getComputedStyle(track).paddingLeft) || 0;
    pin.travel = Math.max(0, last.offsetLeft + last.offsetWidth + padL - window.innerWidth);
    svcSection.style.height = (pin.travel + window.innerHeight) + 'px';
    pin.on = true;
  }

  function updatePinned() {
    if (!pin.on || pin.travel <= 0) return;
    var r = svcSection.getBoundingClientRect();
    var p = clamp(-r.top / pin.travel, 0, 1);
    track.style.transform = 'translate3d(' + (-p * pin.travel).toFixed(1) + 'px,0,0)';
    svcBar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
    svcCount.textContent = pad(clamp(Math.floor(p * cards.length) + 1, 1, cards.length));
  }

  /* ---------------------------------------------------------------------
     4. Proceso: línea que se rellena y paso activo
     --------------------------------------------------------------------- */
  var stepsWrap = $('#steps');
  var steps = $$('.step', stepsWrap);
  var bigStep = $('#bigStep');

  function updateProcess() {
    var vh = window.innerHeight;
    var r = stepsWrap.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;

    var p = clamp((vh * 0.55 - r.top) / r.height, 0, 1);
    stepsWrap.style.setProperty('--p', p.toFixed(4));

    var active = 0;
    steps.forEach(function (s, i) {
      if (s.getBoundingClientRect().top < vh * 0.55) active = i;
    });
    steps.forEach(function (s, i) {
      s.classList.toggle('is-active', i === active);
      s.classList.toggle('is-done', i <= active && p > 0);
    });

    if (bigStep && bigStep.dataset.n !== String(active)) {
      bigStep.dataset.n = String(active);
      bigStep.textContent = pad(active + 1);
      bigStep.classList.remove('tick');
      void bigStep.offsetWidth;
      bigStep.classList.add('tick');
    }
  }

  /* ---------------------------------------------------------------------
     5. Revelado al hacer scroll y contadores
     --------------------------------------------------------------------- */
  var fmtCache = {};
  function format(value, dec) {
    if (!fmtCache[dec]) {
      fmtCache[dec] = new Intl.NumberFormat('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    return fmtCache[dec].format(value);
  }

  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.dec || '0', 10);
    if (reduce || target === 0) { el.textContent = format(target, dec); return; }

    var start = null;
    var dur = 1700;
    function frame(t) {
      if (start === null) start = t;
      var k = clamp((t - start) / dur, 0, 1);
      var eased = k === 1 ? 1 : 1 - Math.pow(2, -10 * k);
      el.textContent = format(target * eased, dec);
      if (k < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  var revealEls = $$('.reveal');
  var counters = $$('[data-count]');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        $$('[data-count]', e.target).forEach(runCounter);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    // Contadores a 0 antes de animar (solo con JS y movimiento permitido)
    if (!reduce) counters.forEach(function (el) { el.textContent = format(0, parseInt(el.dataset.dec || '0', 10)); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------------------
     6. Luz que sigue al ratón en el hero y botones magnéticos
     --------------------------------------------------------------------- */
  if (fine && !reduce) {
    var gx = window.innerWidth * 0.62, gy = window.innerHeight * 0.38, tx = gx, ty = gy, running = false;

    function glowLoop() {
      gx += (tx - gx) * 0.08;
      gy += (ty - gy) * 0.08;
      hero.style.setProperty('--gx', gx.toFixed(1) + 'px');
      hero.style.setProperty('--gy', gy.toFixed(1) + 'px');
      if (Math.abs(tx - gx) > 0.5 || Math.abs(ty - gy) > 0.5) {
        requestAnimationFrame(glowLoop);
      } else {
        running = false;
      }
    }

    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = e.clientX - r.left;
      ty = e.clientY - r.top;
      if (!running) { running = true; requestAnimationFrame(glowLoop); }
    });

    $$('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--tx', ((e.clientX - r.left - r.width / 2) * 0.25).toFixed(1) + 'px');
        el.style.setProperty('--ty', ((e.clientY - r.top - r.height / 2) * 0.35).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () {
        el.style.setProperty('--tx', '0px');
        el.style.setProperty('--ty', '0px');
      });
    });
  }

  /* ---------------------------------------------------------------------
     7. Menú móvil
     --------------------------------------------------------------------- */
  var burger = $('#burger');
  var menu = $('#mobileMenu');

  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  burger.addEventListener('click', function () { setMenu(!body.classList.contains('menu-open')); });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ---------------------------------------------------------------------
     8. Formulario de cita (demo)
        Solo muestra la confirmación. Para recibir los envíos por email en
        un cliente real: action="https://api.web3forms.com/submit",
        method="POST" y los campos ocultos access_key / botcheck, igual que
        en la landing principal.
     --------------------------------------------------------------------- */
  var form = $('#citaForm');
  var card = $('#formCard');
  var success = $('#success');
  var dateInput = $('#fecha');

  var d = new Date();
  dateInput.min = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  dateInput.addEventListener('input', function () { dateInput.setCustomValidity(''); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (dateInput.value) {
      var p = dateInput.value.split('-');
      if (new Date(p[0], p[1] - 1, p[2]).getDay() === 0) {
        dateInput.setCustomValidity('Los domingos estamos cerrados. Elige otro día, por favor.');
      }
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    card.classList.add('is-sent');
    success.classList.add('is-visible');
    form.reset();
    card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  });

  $('#again').addEventListener('click', function () {
    success.classList.remove('is-visible');
    card.classList.remove('is-sent');
  });

  /* ---------------------------------------------------------------------
     9. Inicialización y recálculo al redimensionar
     --------------------------------------------------------------------- */
  var resizeTimer;
  function refresh() { measurePinned(); onScroll(); }

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 150);
  });
  window.addEventListener('load', refresh);
  refresh();
})();
