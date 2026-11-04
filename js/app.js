// Solo Leveling — Carátula PWA | js/app.js
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  /* ----- Votación 👍/👎 (base del PNG 2: 961 / 19 = 980 votos) ----- */
  var BASE_LIKES = 961, BASE_DIS = 19;
  var store = {
    get: function () { try { return localStorage.getItem('sl-voto') || ''; } catch (e) { return ''; } },
    set: function (v) { try { localStorage.setItem('sl-voto', v); } catch (e) {} }
  };
  function render() {
    var v = store.get();
    var likes = BASE_LIKES + (v === 'like' ? 1 : 0);
    var dis = BASE_DIS + (v === 'dis' ? 1 : 0);
    $('#likeN').textContent = likes.toLocaleString('es');
    $('#disN').textContent = dis.toLocaleString('es');
    $('#votosN').textContent = (likes + dis).toLocaleString('es') + ' votos';
    $('#likeBtn').classList.toggle('on', v === 'like');
    $('#disBtn').classList.toggle('on', v === 'dis');
  }
  $('#likeBtn').addEventListener('click', function () {
    store.set(store.get() === 'like' ? '' : 'like');
    render();
    toast(store.get() ? '¡Voto guardado! 👍' : 'Voto retirado');
  });
  $('#disBtn').addEventListener('click', function () {
    store.set(store.get() === 'dis' ? '' : 'dis');
    render();
    toast(store.get() ? 'Voto guardado 👎' : 'Voto retirado');
  });
  render();

  /* ----- Ver más / ver menos ----- */
  var desc = $('#desc'), verMas = $('#verMas');
  verMas.addEventListener('click', function () {
    var open = desc.classList.toggle('open');
    verMas.textContent = open ? '▲ Ver menos' : '▼ Ver más';
  });

  /* ----- Compartir ----- */
  $('#shareBtn').addEventListener('click', function () {
    var data = { title: 'Solo Leveling', text: 'Solo Leveling — carátula ★ 9.00', url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); }
    else if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(function () { toast('Enlace copiado 🔗'); });
    } else { toast(location.href); }
  });

  /* ----- Instalar (PWA) ----- */
  var deferred = null, instBtn = $('#instBtn');
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); deferred = e; instBtn.hidden = false;
  });
  instBtn.addEventListener('click', function () {
    if (!deferred) { toast('Usa "Añadir a pantalla de inicio" del navegador 📲'); return; }
    deferred.prompt();
    deferred.userChoice.then(function () { deferred = null; instBtn.hidden = true; });
  });

  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._tm);
    t._tm = setTimeout(function () { t.classList.remove('show'); }, 2400);
  }

  /* ----- Service worker (offline) ----- */
  if ('serviceWorker' in navigator && !/perchance\.org$/.test(location.hostname) && location.protocol.indexOf('http') === 0) {
    // En el iframe de Perchance el SW se omite (lo gestiona la plataforma).
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    });
  }
})();
