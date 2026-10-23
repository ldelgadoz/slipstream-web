/* ==========================================================================
   RESTAURANTE & ASADOR DON JUAN - Script compartido
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Menú móvil ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var menu = document.getElementById('nav-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
  }

  /* ---------- Carta: filtro por categorías ---------- */
  var tabs = document.querySelectorAll('.menu-tab');
  var categories = document.querySelectorAll('.menu-category');

  function showCategory(filter) {
    tabs.forEach(function (tab) {
      var active = tab.dataset.filter === filter;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    categories.forEach(function (cat) {
      cat.hidden = !(filter === 'todo' || cat.dataset.cat === filter);
    });
  }

  if (tabs.length && categories.length) {
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        showCategory(tab.dataset.filter);
        if (tab.dataset.filter === 'todo') {
          history.replaceState(null, '', window.location.pathname);
        } else {
          history.replaceState(null, '', '#' + tab.dataset.filter);
        }
      });
    });

    // Abrir directamente una categoría desde un enlace (carta.html#postres)
    var hash = window.location.hash.replace('#', '');
    var valid = Array.prototype.some.call(categories, function (cat) {
      return cat.dataset.cat === hash;
    });
    showCategory(valid ? hash : 'todo');
  }

  /* ---------- Fecha mínima = hoy en los formularios ---------- */
  var today = new Date();
  var iso = today.getFullYear() + '-' +
    String(today.getMonth() + 1).padStart(2, '0') + '-' +
    String(today.getDate()).padStart(2, '0');

  document.querySelectorAll('input[type="date"]').forEach(function (input) {
    input.min = iso;
  });

  /* ---------- Formularios (demo) ----------
     Ahora mismo solo muestran el aviso de éxito y limpian el formulario.
     Para recibir los envíos por email en un cliente real, igual que en la
     landing principal: añadir action="https://api.web3forms.com/submit",
     method="POST" y los campos ocultos access_key / botcheck. */
  function bindForm(formId, alertId, closedDay) {
    var form = document.getElementById(formId);
    var alertBox = document.getElementById(alertId);
    if (!form || !alertBox) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      // El restaurante cierra los lunes (solo se comprueba en reservas)
      if (closedDay !== undefined) {
        var dateInput = form.querySelector('input[type="date"]');
        if (dateInput && dateInput.value) {
          var parts = dateInput.value.split('-');
          var chosen = new Date(parts[0], parts[1] - 1, parts[2]);
          if (chosen.getDay() === closedDay) {
            dateInput.setCustomValidity('Cerramos los lunes. Elige otro día, por favor.');
            dateInput.reportValidity();
            dateInput.addEventListener('input', function reset() {
              dateInput.setCustomValidity('');
              dateInput.removeEventListener('input', reset);
            });
            return;
          }
        }
      }

      alertBox.style.display = 'block';
      alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      form.reset();

      setTimeout(function () {
        alertBox.style.display = 'none';
      }, 10000);
    });
  }

  bindForm('reservaForm', 'reservaAlert', 1);   // 1 = lunes
  bindForm('contactoForm', 'contactoAlert');
});
