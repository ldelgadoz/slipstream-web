/* ==========================================================================
   MOTORSPORT GARAGE - Interacción y animaciones (JS puro, sin librerías)
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* ---------------------------------------------------------------------
     1. Header, barra de progreso y parallax (un solo listener de scroll)
     --------------------------------------------------------------------- */
  var header = $('#siteHeader');
  var progress = $('#progressBar');
  var ticking = false;
  var scrollProgress = 0;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress = max > 0 ? clamp(y / max, 0, 1) : 0;

    header.classList.toggle('is-scrolled', y > 24);
    progress.style.transform = 'scaleX(' + scrollProgress + ')';
    root.style.setProperty('--sy', y);
    updateSteps();
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });

  /* ---------------------------------------------------------------------
     2. Menú móvil
     --------------------------------------------------------------------- */
  var toggle = $('#menuToggle');
  var mobileMenu = $('#mobileMenu');

  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  }

  toggle.addEventListener('click', function () {
    setMenu(!root.classList.contains('menu-open'));
  });

  $$('a', mobileMenu).forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 960) setMenu(false);
  });

  /* ---------------------------------------------------------------------
     3. Foco del cursor en el hero
     --------------------------------------------------------------------- */
  var hero = $('.hero');
  if (hero && finePointer && !reduceMotion) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      hero.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  }

  /* ---------------------------------------------------------------------
     4. Revelado al hacer scroll
     --------------------------------------------------------------------- */
  var reveals = $$('.reveal');

  if ('IntersectionObserver' in window && !reduceMotion) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

    reveals.forEach(function (el) { revealObs.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------------------
     5. Contadores
     --------------------------------------------------------------------- */
  var counters = $$('[data-count]');

  function formatCount(el, value) {
    el.textContent = (el.dataset.prefix || '') + Math.round(value) + (el.dataset.suffix || '');
  }

  function runCounter(el) {
    var target = parseFloat(el.dataset.count);
    var duration = 1600;
    var start = null;

    function frame(ts) {
      if (start === null) start = ts;
      var t = clamp((ts - start) / duration, 0, 1);
      var eased = 1 - Math.pow(1 - t, 4);
      formatCount(el, target * eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  if ('IntersectionObserver' in window && !reduceMotion) {
    counters.forEach(function (el) { formatCount(el, 0); });
    var countObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          countObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { countObs.observe(el); });
  }

  /* ---------------------------------------------------------------------
     6. Acordeón de servicios (uno abierto cada vez)
     --------------------------------------------------------------------- */
  var services = $$('.service');

  services.forEach(function (service) {
    var btn = $('.service-head', service);
    btn.addEventListener('click', function () {
      var willOpen = !service.classList.contains('is-open');
      services.forEach(function (s) {
        s.classList.remove('is-open');
        $('.service-head', s).setAttribute('aria-expanded', 'false');
      });
      if (willOpen) {
        service.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ---------------------------------------------------------------------
     7. Proceso: línea que se rellena y paso activo según el scroll
     --------------------------------------------------------------------- */
  var stepsWrap = $('#steps');
  var steps = $$('.step', stepsWrap);

  function updateSteps() {
    if (!stepsWrap) return;
    var rect = stepsWrap.getBoundingClientRect();
    var vh = window.innerHeight;
    var focus = vh * 0.55;

    var fill = clamp((focus - rect.top) / rect.height, 0, 1);
    stepsWrap.style.setProperty('--fill', fill.toFixed(3));

    steps.forEach(function (step) {
      var r = step.getBoundingClientRect();
      step.classList.toggle('is-active', r.top < focus);
    });
  }

  /* ---------------------------------------------------------------------
     8. Tarjetas con inclinación 3D y brillo que sigue al cursor
     --------------------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$('.tilt').forEach(function (card) {
      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.transform = 'rotateX(' + ((0.5 - py) * 8).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 10).toFixed(2) + 'deg) translateZ(0)';
        card.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', function () {
        card.style.transform = '';
      });
    });
  }

  /* ---------------------------------------------------------------------
     9. Cuentarrevoluciones: arranque + sigue el scroll de la página
     --------------------------------------------------------------------- */
  var needle = $('#needle');
  var arc = $('#gaugeArc');
  var rpmText = $('#rpmValue');
  var ticksG = $('#gaugeTicks');

  if (needle && arc && rpmText && ticksG) {
    var NS = 'http://www.w3.org/2000/svg';
    var MAX_RPM = 8;
    var A_MIN = -135;
    var A_MAX = 135;
    var ARC_LEN = 754;

    // Marcas y números de la esfera
    for (var i = 0; i <= 16; i++) {
      var major = i % 2 === 0;
      var ang = (A_MIN + ((A_MAX - A_MIN) * i) / 16) * Math.PI / 180;
      var r1 = major ? 130 : 138;
      var r2 = 150;
      var line = document.createElementNS(NS, 'line');
      line.setAttribute('class', 'g-tick' + (major ? ' major' : ''));
      line.setAttribute('x1', (200 + r1 * Math.sin(ang)).toFixed(2));
      line.setAttribute('y1', (200 - r1 * Math.cos(ang)).toFixed(2));
      line.setAttribute('x2', (200 + r2 * Math.sin(ang)).toFixed(2));
      line.setAttribute('y2', (200 - r2 * Math.cos(ang)).toFixed(2));
      ticksG.appendChild(line);

      if (major) {
        var label = document.createElementNS(NS, 'text');
        label.setAttribute('class', 'g-label');
        label.setAttribute('x', (200 + 108 * Math.sin(ang)).toFixed(2));
        label.setAttribute('y', (200 - 108 * Math.cos(ang)).toFixed(2));
        label.textContent = String(i / 2);
        ticksG.appendChild(label);
      }
    }

    var current = 0;
    var target = 0;
    var phase = 'intro'; // intro (barrido de arranque) -> follow (scroll)
    var introStart = null;
    var rafId = null;

    function render(rpm) {
      var frac = clamp(rpm / MAX_RPM, 0, 1);
      var angle = A_MIN + (A_MAX - A_MIN) * frac;
      needle.setAttribute('transform', 'rotate(' + angle.toFixed(2) + ' 200 200)');
      arc.style.strokeDashoffset = (ARC_LEN * (1 - frac)).toFixed(1);
      rpmText.textContent = rpm.toFixed(1);
    }

    function idleTarget() {
      return 1 + scrollProgress * 6.2;
    }

    function loop(ts) {
      if (phase === 'intro') {
        if (introStart === null) introStart = ts;
        var t = (ts - introStart) / 2600;
        // Sube a 8 y vuelve al ralentí (curva suave)
        var wave = t < 0.5 ? easeOutCubic(t / 0.5) : 1 - easeInOutCubic((t - 0.5) / 0.5) * (1 - idleTarget() / MAX_RPM);
        current = MAX_RPM * clamp(wave, 0, 1);
        if (t >= 1) {
          phase = 'follow';
          current = idleTarget();
        }
      } else {
        target = idleTarget();
        current += (target - current) * 0.08;
      }
      render(current);
      rafId = requestAnimationFrame(loop);
    }

    function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
    function easeInOutCubic(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

    if (reduceMotion) {
      render(1);
    } else {
      // No gastar CPU si el cuentarrevoluciones no se ve
      var gaugeEl = $('#gauge');
      var visible = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible && !rafId) rafId = requestAnimationFrame(loop);
          if (!visible && rafId) { cancelAnimationFrame(rafId); rafId = null; }
        }).observe(gaugeEl);
      }
      render(0);
      rafId = requestAnimationFrame(loop);
    }
  }

  /* ---------------------------------------------------------------------
     10. Formulario de cita (demo)
     Solo muestra la confirmación. Para recibir las solicitudes por email en
     un cliente real: usar Web3Forms como en la landing principal
     (action="https://api.web3forms.com/submit", method="POST" y los campos
     ocultos access_key y botcheck).
     --------------------------------------------------------------------- */
  var form = $('#tallerForm');
  var card = $('#formCard');
  var success = $('#formSuccess');
  var again = $('#formAgain');

  if (form && card && success) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      card.classList.add('is-sent');
      form.reset();
      success.focus({ preventScroll: true });
      card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });

    again.addEventListener('click', function () {
      card.classList.remove('is-sent');
      $('#nombre').focus();
    });
  }

  /* ---------------------------------------------------------------------
     11. Enlace activo del menú según la sección visible
     --------------------------------------------------------------------- */
  var navLinks = $$('.main-nav a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          navLinks.forEach(function (a) {
            a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { navObs.observe(s); });
  }

  onScroll();
})();
