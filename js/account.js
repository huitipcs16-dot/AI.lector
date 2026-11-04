'use strict';
/* AILector — Cuentas y perfil (todo vive en este dispositivo) */
function accGetUsers(){ try { return JSON.parse(localStorage.getItem('sl-users') || '{}') || {}; } catch(e){ return {}; } }
function accCurrentUser(){ try { return localStorage.getItem('sl-session') || null; } catch(e){ return null; } }
function accProfile(u){
  if (!u) return null;
  try { return JSON.parse(localStorage.getItem('sl-profile-' + u) || 'null'); } catch(e){ return null; }
}
function accSaveProfile(u, p){ try { localStorage.setItem('sl-profile-' + u, JSON.stringify(p)); } catch(e){ if (typeof toast === 'function') toast('No se pudo guardar el perfil'); } }
var ACC_DEF = {
  dir:'ltr', mode:'pages', width:'ancho', bright:100, gap:0, remember:1, autoCont:1, showComments:1,
  theme:'dark', accent:'', bg:'wall', particles:1, anim:1, frame:'none', cards:'normal',
  nNew:1, nFav:1, nFol:1, nMsg:1, nNews:1,
  priv:'public', hideLib:0, hideHist:0, blocked:[],
  libSort:'default', hideFinished:0,
  lang:'es', tz:'local', dateFmt:'iso', contentFilter:[], bigReader:0
};
function accSettings(u){
  var s = {};
  for (var k in ACC_DEF) s[k] = ACC_DEF[k];
  if (!u) return s;
  try {
    var stored = JSON.parse(localStorage.getItem('sl-settings-' + u) || '{}') || {};
    for (var k2 in stored) if (k2 in s) s[k2] = stored[k2];
  } catch(e){}
  if (!Array.isArray(s.blocked)) s.blocked = [];
  if (!Array.isArray(s.contentFilter)) s.contentFilter = [];
  return s;
}
function accSaveSettings(u, s){ try { localStorage.setItem('sl-settings-' + u, JSON.stringify(s)); } catch(e){ if (typeof toast === 'function') toast('No se pudo guardar ajustes'); } }
function accGet(){ return accSettings(accCurrentUser()); }
/* ---------- i18n (chrome) ---------- */
var ACC_I18N = {
  es:{lib:'Biblioteca',com:'Comunidad',lists:'Listas',news:'Noticias',login:'Acceder',reg:'Registrar',search:'Buscar manga…',newManga:'+ Nuevo manga',notif:'Notificaciones',profile:'Mi perfil',admin:'Modo administrador',theme:'Tema claro / oscuro'},
  en:{lib:'Library',com:'Community',lists:'Lists',news:'News',login:'Log in',reg:'Sign up',search:'Search manga…',newManga:'+ New manga',notif:'Notifications',profile:'My profile',admin:'Admin mode',theme:'Light / dark theme'}
};
function accLang(){ try { var u = accCurrentUser(); if (u) return accSettings(u).lang || 'es'; } catch(e){} return 'es'; }
function accT(k){ var l = ACC_I18N[accLang()] || ACC_I18N.es; return l[k] || ACC_I18N.es[k] || k; }
function accApplyI18n(){
  var map = {tabLib:'lib',tabCom:'com',tabLists:'lists',tabNews:'news',authInBtn:'login',authUpBtn:'reg',newMangaBtn:'newManga',adminBtn:null,themeBtn:null,notifBtn:'notif',userChip:null};
  for (var id in map){
    var el = document.getElementById(id);
    if (!el || !map[id]) continue;
    el.textContent = accT(map[id]);
  }
  var cs = document.getElementById('catSearch'); if (cs) cs.placeholder = accT('search');
  var ab = document.getElementById('adminBtn'); if (ab) ab.title = accT('admin');
  var tb = document.getElementById('themeBtn'); if (tb) tb.title = accT('theme');
  var nb = document.getElementById('notifBtn'); if (nb) nb.title = accT('notif');
  try { document.documentElement.lang = accLang(); } catch(e){}
}
/* ---------- avatar/cover upload ---------- */
function accDownscale(file, maxSide, square){
  return new Promise(function(resolve){
    try {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function(){
        var sw = img.naturalWidth, sh = img.naturalHeight, sx = 0, sy = 0;
        if (square){ var m = Math.min(sw, sh); sx = (sw - m) / 2; sy = (sh - m) / 2; sw = m; sh = m; }
        var s = Math.min(1, maxSide / Math.max(sw, sh));
        var c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(sw * s)); c.height = Math.max(1, Math.round(sh * s));
        c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = function(){ URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    } catch(e){ resolve(null); }
  });
}
/* ---------- apariencia ---------- */
var ACC_ACCENTS = [
  {n:'Predeterminado', c:''}, {n:'Rojo', c:'#ff3b5c'}, {n:'Morado', c:'#a64df0'},
  {n:'Azul', c:'#2f6df6'}, {n:'Rosa', c:'#ff6fa5'}, {n:'Vino', c:'#c1121f'}
];
var ACC_BGS = [
  {id:'wall', n:'Anime (castillo)'}, {id:'side0', n:'Anime 1'}, {id:'side1', n:'Anime 2'},
  {id:'side2', n:'Anime 3'}, {id:'none', n:'Sin fondo'}
];
function accApplyTheme(){
  var s = accGet();
  var t = s.theme || 'dark';
  try {
    if (t === 'light') document.documentElement.dataset.theme = 'light';
    else if (t === 'amoled') document.documentElement.dataset.theme = 'amoled';
    else document.documentElement.removeAttribute('data-theme');
  } catch(e){}
  try {
    if (s.accent) document.documentElement.style.setProperty('--accent', s.accent);
    else document.documentElement.style.removeProperty('--accent');
  } catch(e){}
  document.body.classList.toggle('no-anim', !s.anim);
  document.body.classList.toggle('cards-round', s.cards === 'round');
  document.body.classList.toggle('cards-compact', s.cards === 'compact');
  document.body.classList.toggle('acc-font', !!s.bigReader);
  try {
    var tb = document.getElementById('themeBtn');
    if (tb) tb.textContent = t === 'light' ? '🌙' : '☀';
  } catch(e){}
  accPetals(s.particles && s.anim);
}
var accPetalTimer = null;
function accPetals(on){
  var cv = document.getElementById('petals');
  if (!on){ if (cv) cv.hidden = true; if (accPetalTimer){ clearInterval(accPetalTimer); accPetalTimer = null; } return; }
  if (!cv){
    cv = document.createElement('canvas'); cv.id = 'petals'; cv.hidden = true;
    document.body.appendChild(cv);
  }
  cv.hidden = false;
  try {
    var ctx = cv.getContext('2d'), W, H, ps = [];
    var size = function(){ W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    size();
    for (var i = 0; i < 26; i++) ps.push({x:Math.random()*2000, y:Math.random()*1200, r:3+Math.random()*5, s:.4+Math.random()*.9, o:Math.random()*6.28});
    if (accPetalTimer) clearInterval(accPetalTimer);
    accPetalTimer = setInterval(function(){
      if (cv.hidden) return;
      if (cv.width !== window.innerWidth) size();
      ctx.clearRect(0, 0, W, H);
      for (var j = 0; j < ps.length; j++){
        var p = ps[j];
        p.y += p.s; p.x += Math.sin((p.y + p.o * 100) / 60) * .5;
        if (p.y > H + 10){ p.y = -10; p.x = Math.random() * W; }
        ctx.globalAlpha = .5;
        ctx.fillStyle = j % 3 ? '#f7a8d8' : '#c9b3ff';
        ctx.beginPath(); ctx.ellipse(p.x % W, p.y, p.r, p.r * .6, p.o + p.y / 40, 0, 6.29); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }, 50);
  } catch(e){}
}
/* ---------- lector ---------- */
function accApplyReader(){
  var s = accGet();
  try { document.documentElement.style.setProperty('--reader-bright', (s.bright / 100)); } catch(e){}
  try { document.documentElement.style.setProperty('--pagegap', (s.gap || 0) + 'px'); } catch(e){}
  var swapped = s.dir === 'rtl';
  try {
    var pb = document.getElementById('prevBtn'), nb = document.getElementById('nextBtn');
    if (pb) pb.onclick = function(){ goToPage(state.pageIndex + (swapped ? 1 : -1)); };
    if (nb) nb.onclick = function(){ goToPage(state.pageIndex + (swapped ? -1 : 1)); };
    if (pb) pb.title = swapped ? 'Página siguiente' : 'Página anterior';
    if (nb) nb.title = swapped ? 'Página anterior' : 'Página siguiente';
  } catch(e){}
  try {
    if (typeof state !== 'undefined' && (state.readMode !== s.mode || state.readWidth !== s.width)){
      state.readMode = s.mode; state.readWidth = s.width;
      try {
        localStorage.setItem('sl-readmode', s.mode);
        localStorage.setItem('sl-width', s.width);
      } catch(e){}
      if (typeof applyReadPrefs === 'function') applyReadPrefs();
      if (state.pages && state.pages.length && typeof refreshReaderView === 'function') refreshReaderView();
    }
  } catch(e){}
}
document.addEventListener('keydown', function(e){
  try {
    if (accGet().dir !== 'rtl') return;
    if (document.getElementById('readerView').hidden) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (e.key === 'ArrowLeft'){ e.stopPropagation(); goToPage(state.pageIndex + 1); }
    else if (e.key === 'ArrowRight'){ e.stopPropagation(); goToPage(state.pageIndex - 1); }
    else if (e.key === 'PageUp'){ e.preventDefault(); e.stopPropagation(); goToPage(state.pageIndex + 1); }
    else if (e.key === 'PageDown'){ e.preventDefault(); e.stopPropagation(); goToPage(state.pageIndex - 1); }
  } catch(err){}
}, true);
/* ---------- modal de perfil ---------- */
var accTab = 'cuenta';
var ACC_TABS = [
  ['cuenta','👤'], ['lectura','📖'], ['apariencia','🎨'], ['alertas','🔔'],
  ['privacidad','🔒'], ['biblio','📚'], ['general','⚙']
];
var ACC_TAB_NAMES = {
  es:{cuenta:'Cuenta',lectura:'Lectura',apariencia:'Apariencia',alertas:'Notificaciones',privacidad:'Privacidad',biblio:'Biblioteca',general:'General'},
  en:{cuenta:'Account',lectura:'Reading',apariencia:'Look',alertas:'Alerts',privacidad:'Privacy',biblio:'Library',general:'General'}
};
function accTabName(id){ var l = ACC_TAB_NAMES[accLang()] || ACC_TAB_NAMES.es; return l[id] || id; }
function accBuildModal(){
  if (document.getElementById('accModal')) return;
  var d = document.createElement('div');
  d.className = 'modal'; d.id = 'accModal'; d.hidden = true;
  d.innerHTML =
    '<div class="modalCard accCard">' +
    '<div class="accCover"><img id="accCoverImg" alt="">' +
    '<button class="accCoverBtn" id="accCoverBtn" title="Cambiar portada">📷 Portada</button></div>' +
    '<div class="accHead"><div class="accAvWrap"><img class="accAv" id="accAvImg" alt="">' +
    '<button class="accAvBtn" id="accAvBtn" title="Cambiar avatar">📷</button></div>' +
    '<div style="min-width:0"><h3 class="accName" id="accName"></h3><div class="accSub" id="accSub"></div>' +
    '<div class="accStats" id="accStats"></div></div></div>' +
    '<div class="accTabs" id="accTabs"></div><div class="accPane" id="accBody"></div>' +
    '<div class="mBtns"><button id="accLogout">Salir</button><span style="flex:1"></span>' +
    '<button id="accClose" class="primary">Cerrar</button></div></div>' +
    '<input type="file" id="accAvFile" accept="image/*" hidden>' +
    '<input type="file" id="accCoverFile" accept="image/*" hidden>';
  document.body.appendChild(d);
  document.getElementById('accClose').onclick = function(){ d.hidden = true; };
  d.addEventListener('click', function(e){ if (e.target === d) d.hidden = true; });
  document.getElementById('accLogout').onclick = function(){
    try { localStorage.removeItem('sl-session'); } catch(e){}
    d.hidden = true; updateAuthUI(); renderLists();
    if (typeof toast === 'function') toast('Sesión cerrada');
  };
  document.getElementById('accAvBtn').onclick = function(){ document.getElementById('accAvFile').click(); };
  document.getElementById('accCoverBtn').onclick = function(){ document.getElementById('accCoverFile').click(); };
  document.getElementById('accAvFile').onchange = function(e){
    var f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    accDownscale(f, 256, true).then(function(du){
      if (!du){ toast('No se pudo leer la imagen'); return; }
      var u = accCurrentUser(), p = accProfile(u) || {};
      p.avatar = du; accSaveProfile(u, p); accPaintHead(); accRenderPane(); updateAuthUI();
      toast('Avatar actualizado');
    });
  };
  document.getElementById('accCoverFile').onchange = function(e){
    var f = e.target.files && e.target.files[0]; e.target.value = '';
    if (!f) return;
    accDownscale(f, 900, false).then(function(du){
      if (!du){ toast('No se pudo leer la imagen'); return; }
      var u = accCurrentUser(), p = accProfile(u) || {};
      p.cover = du; accSaveProfile(u, p); accPaintHead(); accRenderPane();
      toast('Portada actualizada');
    });
  };
}
function accFrameClass(){ var f = accGet().frame || 'none'; return f === 'none' ? '' : 'av-fr-' + f; }
function accPaintHead(){
  var u = accCurrentUser(); if (!u) return;
  var p = accProfile(u) || {};
  var av = document.getElementById('accAvImg'), cv = document.getElementById('accCoverImg');
  if (av){ av.src = p.avatar || ''; av.alt = p.name || u; av.className = 'accAv ' + accFrameClass(); }
  if (cv){ cv.src = p.cover || ''; }
  var nm = document.getElementById('accName'); if (nm) nm.textContent = p.name || u;
  var sub = document.getElementById('accSub');
  if (sub) sub.textContent = '@' + u + (p.email ? ' · ' + p.email : '') + ' · ' + (accGet().priv === 'private' ? '🔒 ' + (accLang() === 'en' ? 'Private' : 'Privado') : '🌐 ' + (accLang() === 'en' ? 'Public' : 'Público'));
  var st = document.getElementById('accStats');
  if (st){
    var f = accFollowData(u);
    st.innerHTML = '<span><b>' + f.followers + '</b> ' + (accLang() === 'en' ? 'followers' : 'seguidores') + '</span>' +
      '<span><b>' + f.following.length + '</b> ' + (accLang() === 'en' ? 'following' : 'seguidos') + '</span>' +
      '<span><b>' + accUnread(u) + '</b> ' + (accLang() === 'en' ? 'unread' : 'sin leer') + '</span>';
  }
  var tabs = document.getElementById('accTabs');
  if (tabs){
    tabs.innerHTML = '';
    ACC_TABS.forEach(function(t){
      var b = document.createElement('button');
      b.textContent = t[1] + ' ' + accTabName(t[0]);
      if (t[0] === accTab) b.className = 'on';
      b.onclick = function(){ accTab = t[0]; accPaintHead(); accRenderPane(); };
      tabs.appendChild(b);
    });
  }
}
function openProfile(tab){
  var u = accCurrentUser();
  if (!u){ if (typeof openAuth === 'function') openAuth('login'); return; }
  if (tab) accTab = tab;
  accBuildModal();
  accPaintHead(); accRenderPane();
  document.getElementById('accModal').hidden = false;
}
function accTglRow(label, sub, key, cb){
  var s = accGet();
  var id = 'acc_' + key + '_' + Math.floor(Math.random() * 1e6);
  return '<label class="tglRow"><span class="t">' + label + (sub ? '<small>' + sub + '</small>' : '') + '</span>' +
    '<span class="switch"><input type="checkbox" data-acc-key="' + key + '"' + (s[key] ? ' checked' : '') + '><span class="swTrack"></span></span></label>';
}
function accSelRow(label, sub, key, opts){
  var s = accGet();
  var h = '<label class="tglRow"><span class="t">' + label + (sub ? '<small>' + sub + '</small>' : '') + '</span><select data-acc-key="' + key + '">';
  opts.forEach(function(o){ h += '<option value="' + o[0] + '"' + (String(s[key]) === String(o[0]) ? ' selected' : '') + '>' + o[1] + '</option>'; });
  return h + '</select></label>';
}
/* ---------- render del panel ---------- */
function accRenderPane(){
  var box = document.getElementById('accBody'); if (!box) return;
  var u = accCurrentUser(), s = accGet(), p = accProfile(u) || {};
  var h = '';
  if (accTab === 'cuenta'){
    h = '<div class="fRow">Nombre para mostrar<input id="accNameIn" maxlength="40" value="' + escapeHtml(p.name || u) + '"></div>' +
    '<div class="fRow">Correo electrónico<input id="accEmailIn" inputmode="email" maxlength="80" value="' + escapeHtml(p.email || '') + '" placeholder="tu@correo.com"></div>' +
    '<div class="fRow">Biografía<textarea id="accBioIn" rows="3" maxlength="300" placeholder="Cuéntanos qué te gusta leer…">' + escapeHtml(p.bio || '') + '</textarea></div>' +
    '<div class="mBtns"><button class="primary" id="accSaveBtn">Guardar</button></div>' +
    '<h4 style="margin:14px 0 6px">🔑 Cambiar contraseña</h4>' +
    '<div class="fRow">Contraseña actual<input type="password" id="accOldPass"></div>' +
    '<div class="fRow">Contraseña nueva<input type="password" id="accNewPass"></div>' +
    '<div class="mBtns"><button id="accPassBtn">Cambiar contraseña</button></div>' +
    '<h4 style="margin:14px 0 6px">⚠ Zona de peligro</h4>' +
    '<div class="mBtns"><button id="accDelBtn" class="tab danger">Eliminar cuenta</button></div>' +
    '<div style="font-size:11px;color:var(--dim)">Borra tu cuenta, perfil, listas y mensajes de este dispositivo. No se puede deshacer.</div>';
  } else if (accTab === 'lectura'){
    h = accSelRow('Dirección de lectura', 'Derecha a izquierda = estilo manga', 'dir', [['ltr','⬅ Izquierda a derecha'],['rtl','➡ Derecha a izquierda (manga)']]) +
    accSelRow('Modo de lectura', '', 'mode', [['pages','📄 Página'],['cascade','📜 Desplazamiento vertical']]) +
    accSelRow('Ancho de página', '', 'width', [['estrecho','Estrecho'],['normal','Normal'],['ancho','Ancho'],['completo','Completo']]) +
    '<label class="tglRow"><span class="t">Brillo<small>' + s.bright + '%</small></span><input type="range" min="40" max="130" value="' + s.bright + '" data-acc-key="bright" style="max-width:150px"></label>' +
    '<label class="tglRow"><span class="t">Separación entre páginas<small>' + s.gap + 'px (modo vertical)</small></span><input type="range" min="0" max="48" value="' + s.gap + '" data-acc-key="gap" style="max-width:150px"></label>' +
    accTglRow('Recordar último capítulo', 'Guarda tu progreso de lectura', 'remember') +
    accTglRow('Continuar automáticamente', 'Al abrir un capítulo empieza donde lo dejaste', 'autoCont') +
    accTglRow('Mostrar comentarios', 'Ver la sección de comentarios de la comunidad', 'showComments');
  } else if (accTab === 'apariencia'){
    var accs = ACC_ACCENTS.map(function(a){ return [a.c, a.n]; });
    var bgs = ACC_BGS.map(function(a){ return [a.id, a.n]; });
    h = accSelRow('Tema', '', 'theme', [['dark','🌙 Oscuro'],['light','☀ Claro'],['amoled','⬛ AMOLED']]) +
    accSelRow('Color principal', '', 'accent', accs) +
    '<label class="tglRow"><span class="t">Color personalizado</span><input type="color" value="' + (s.accent || '#ff3b5c') + '" data-acc-key="accent"></label>' +
    accSelRow('Fondo anime', '', 'bg', bgs) +
    '<div class="mBtns"><button id="accBgUp">Subir fondo propio</button></div>' +
    accTglRow('Efectos de partículas', 'Pétalos flotando en el fondo', 'particles') +
    accTglRow('Animaciones de interfaz', 'Transiciones y movimientos', 'anim') +
    accSelRow('Marco de avatar', '', 'frame', [['none','Sin marco'],['gold','🏆 Dorado'],['rainbow','🌈 Arcoíris'],['anime','✨ Anime']]) +
    accSelRow('Tarjetas de manga', '', 'cards', [['normal','Normales'],['round','Redondeadas'],['compact','Compactas']]);
  } else if (accTab === 'alertas'){
    h = accTglRow('Nuevos capítulos', 'Avisa cuando un manga sume capítulos', 'nNew') +
    accTglRow('Favoritos', 'Avisa de novedades en tus favoritos', 'nFav') +
    accTglRow('Nuevos seguidores', 'Avisa cuando alguien te siga', 'nFol') +
    accTglRow('Mensajes privados', 'Avisa al recibir un mensaje', 'nMsg') +
    accTglRow('Noticias y novedades', 'Resumen de novedades del sitio', 'nNews') +
    '<h4 style="margin:14px 0 6px">📨 Mensajes privados</h4><div id="accInbox"></div>' +
    '<div class="fRow">Para<select id="accMsgTo"></select></div>' +
    '<div class="fRow">Mensaje<textarea id="accMsgTxt" rows="2" maxlength="500"></textarea></div>' +
    '<div class="mBtns"><button class="primary" id="accMsgSend">Enviar</button></div>' +
    '<h4 style="margin:14px 0 6px">🔔 Recientes</h4><div id="accNotifList"></div>' +
    '<div class="mBtns"><button id="accNotifRead">Marcar leídas</button></div>';
  } else if (accTab === 'privacidad'){
    h = accSelRow('Perfil', 'Quién puede ver tu perfil', 'priv', [['public','🌐 Público'],['private','🔒 Privado']]) +
    accTglRow('Ocultar biblioteca', 'No mostrar Listas en este dispositivo', 'hideLib') +
    accTglRow('Ocultar historial', 'No mostrar tu historial en inicio', 'hideHist') +
    '<h4 style="margin:14px 0 6px">🚫 Usuarios bloqueados</h4><div id="accBlockList"></div>' +
    '<div class="fRow">Bloquear usuario<select id="accBlockSel"></select></div>' +
    '<div class="mBtns"><button id="accBlockBtn">Bloquear</button></div>' +
    '<div style="font-size:11px;color:var(--dim)">Los comentarios usan GitHub y no se pueden moderar desde aquí. El bloqueo oculta sus mensajes y evita que te sigan.</div>' +
    '<h4 style="margin:14px 0 6px">👥 Personas en este dispositivo</h4><div id="accUsers"></div>' +
    '<h4 style="margin:14px 0 6px">📱 Sesiones</h4><div id="accSessions"></div>' +
    '<div class="mBtns"><button id="accCloseAll">Cerrar todas las sesiones</button></div>';
  } else if (accTab === 'biblio'){
    h = accSelRow('Ordenar listas', '', 'libSort', [['default','Predeterminado'],['title','Por título (A-Z)']]) +
    accTglRow('Mostrar obras terminadas', 'Si lo apagas se ocultan las finalizadas', 'hideFinished') +
    '<h4 style="margin:14px 0 6px">💾 Sincronizar / respaldo</h4>' +
    '<div class="mBtns"><button id="accExport">⬇ Exportar mi biblioteca</button><button id="accImportBtn">⬆ Importar</button></div>' +
    '<input type="file" id="accImportFile" accept="application/json" hidden>' +
    '<div style="font-size:11px;color:var(--dim)">Guarda favoritos, listas, progreso y lecturas en un archivo para llevarlos a otro dispositivo.</div>';
  } else if (accTab === 'general'){
    h = accSelRow('Idioma', 'Traduce los menús principales', 'lang', [['es','Español'],['en','English']]) +
    accSelRow('Zona horaria', 'Para horas y fechas', 'tz', [['local','Automática'],['Europe/Madrid','Europa/Madrid'],['America/Mexico_City','América/México'],['America/Argentina/Buenos_Aires','América/Argentina'],['America/Bogota','América/Bogotá'],['America/Lima','América/Lima'],['America/Santiago','América/Santiago'],['UTC','UTC']]) +
    accSelRow('Formato de fecha', '', 'dateFmt', [['iso','2026-11-04'],['es','04/11/2026'],['us','11/04/2026'],['rel','Relativa (hace 3 días)']]) +
    '<div class="tglRow"><span class="t">Filtros de contenido<small>Oculta estos géneros del catálogo</small></span></div><div id="accContentF"></div>' +
    accTglRow('Texto grande en lectura', 'Subtítulos y transcripción más grandes', 'bigReader') +
    '<h4 style="margin:14px 0 6px">❓ Ayuda y soporte</h4>' +
    '<div style="font-size:12px;line-height:1.7;color:var(--dim)">Todo se guarda solo en este dispositivo.<br>¿Olvidaste tu contraseña? No se puede recuperar: crea otra cuenta.<br>Para publicar capítulos usa el modo administrador (🔒).<br>Los comentarios se publican con tu cuenta de GitHub.</div>';
  }
  box.innerHTML = h;
  accWirePane();
  if (accTab === 'alertas'){ accPaintInbox(); accPaintNotifList(); }
  if (accTab === 'privacidad'){ accPaintBlocks(); accPaintUsers(); accPaintSessions(); }
  if (accTab === 'general'){ accPaintContentF(); }
}
function accWirePane(){
  var u = accCurrentUser(); if (!u) return;
  var box = document.getElementById('accBody');
  box.querySelectorAll('[data-acc-key]').forEach(function(el){
    var key = el.getAttribute('data-acc-key');
    var ev = (el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'color' || el.type === 'range') ? 'change' : 'change';
    el.addEventListener(ev, function(){
      var s = accSettings(u), v;
      if (el.type === 'checkbox') v = el.checked ? 1 : 0;
      else if (el.type === 'range' || key === 'bright' || key === 'gap') v = parseInt(el.value, 10);
      else v = el.value;
      s[key] = v; accSaveSettings(u, s);
      accApplyAll(false);
      if (key === 'lang'){ accApplyI18n(); accPaintHead(); accRenderPane(); }
      if (key === 'theme' || key === 'accent' || key === 'particles' || key === 'anim' || key === 'cards' || key === 'bigReader' || key === 'frame') accPaintHead();
      if (key === 'bright' || key === 'gap'){
        var sm = el.closest('.tglRow').querySelector('small');
        if (sm) sm.textContent = el.value + (key === 'bright' ? '%' : 'px (modo vertical)');
      }
    });
  });
  var save = document.getElementById('accSaveBtn');
  if (save) save.onclick = function(){
    var p = accProfile(u) || {};
    p.name = (document.getElementById('accNameIn').value || '').trim().slice(0, 40) || u;
    var em = (document.getElementById('accEmailIn').value || '').trim().slice(0, 80);
    if (em && !/.+@.+\..+/.test(em)){ toast('Correo no válido'); return; }
    p.email = em;
    try {
      var users = accGetUsers();
      if (users[u]){ users[u].email = em; localStorage.setItem('sl-users', JSON.stringify(users)); }
    } catch(e){}
    p.bio = (document.getElementById('accBioIn').value || '').slice(0, 300);
    accSaveProfile(u, p); accPaintHead(); updateAuthUI(); toast('Perfil guardado');
  };
  var passBtn = document.getElementById('accPassBtn');
  if (passBtn) passBtn.onclick = async function(){
    var oldP = document.getElementById('accOldPass').value || '';
    var newP = document.getElementById('accNewPass').value || '';
    if (newP.length < 4){ toast('Mínimo 4 caracteres'); return; }
    var users = accGetUsers();
    var oldH = '';
    try { oldH = await sha256hex(u + '|' + oldP); } catch(e){}
    if (!users[u] || users[u].h !== oldH){ toast('Contraseña actual incorrecta'); return; }
    try { users[u].h = await sha256hex(u + '|' + newP); } catch(e){ toast('No se pudo procesar'); return; }
    try { localStorage.setItem('sl-users', JSON.stringify(users)); } catch(e){ toast('No se pudo guardar'); return; }
    document.getElementById('accOldPass').value = ''; document.getElementById('accNewPass').value = '';
    toast('Contraseña cambiada');
  };
  var del = document.getElementById('accDelBtn');
  if (del) del.onclick = function(){
    if (!confirm('¿Eliminar tu cuenta "' + u + '" y todos sus datos de este dispositivo?')) return;
    if (!confirm('Seguro seguro? No se puede deshacer.')) return;
    try {
      var users = accGetUsers(); delete users[u];
      localStorage.setItem('sl-users', JSON.stringify(users));
      ['sl-profile-', 'sl-settings-', 'sl-lists-', 'sl-msgs-', 'sl-follow-', 'sl-notif-', 'sl-chapcount-'].forEach(function(k){
        try { localStorage.removeItem(k + u); } catch(e){}
      });
      if (accCurrentUser() === u) localStorage.removeItem('sl-session');
    } catch(e){}
    document.getElementById('accModal').hidden = true;
    updateAuthUI(); renderLists(); applyAccountTheme(); accApplyI18n();
    toast('Cuenta eliminada');
  };
  var bgUp = document.getElementById('accBgUp');
  if (bgUp) bgUp.onclick = function(){
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = function(){
      var f = inp.files && inp.files[0]; if (!f) return;
      if (typeof downscaleSide !== 'function'){ toast('No disponible'); return; }
      downscaleSide(f).then(function(du){
        if (!du){ toast('No se pudo leer la imagen'); return; }
        try { setSide({t:'img', v:du}); applySideBg(); } catch(e){}
        var s2 = accSettings(u); s2.bg = 'custom'; accSaveSettings(u, s2);
        toast('Fondo aplicado');
      });
    };
    inp.click();
  };
  var exp = document.getElementById('accExport');
  if (exp) exp.onclick = function(){
    var data = {app:'AILector', user:u, at:new Date().toISOString(), favs:[], lists:null, prog:{}, reads:{}};
    try { data.favs = JSON.parse(localStorage.getItem('sl-favs') || '[]'); } catch(e){}
    try { data.lists = JSON.parse(localStorage.getItem('sl-lists-' + u) || 'null'); } catch(e){}
    try { data.prog = JSON.parse(localStorage.getItem('sl-progmap') || '{}'); } catch(e){}
    try { data.reads = JSON.parse(localStorage.getItem('sl-reads') || '{}'); } catch(e){}
    var blob = new Blob([JSON.stringify(data)], {type:'application/json'});
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'ailector-' + u + '-biblioteca.json';
    document.body.appendChild(a); a.click();
    setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('Biblioteca exportada');
  };
  var impB = document.getElementById('accImportBtn');
  var impF = document.getElementById('accImportFile');
  if (impB && impF){
    impB.onclick = function(){ impF.click(); };
    impF.onchange = function(){
      var f = impF.files && impF.files[0]; impF.value = ''; if (!f) return;
      var r = new FileReader();
      r.onload = function(){
        try {
          var d = JSON.parse(r.result);
          if (!d || d.app !== 'AILector') throw 0;
          if (Array.isArray(d.favs)) localStorage.setItem('sl-favs', JSON.stringify(d.favs));
          if (d.lists) localStorage.setItem('sl-lists-' + u, JSON.stringify(d.lists));
          if (d.prog) localStorage.setItem('sl-progmap', JSON.stringify(d.prog));
          if (d.reads) localStorage.setItem('sl-reads', JSON.stringify(d.reads));
          renderLists(); if (typeof renderCont === 'function') renderCont(); if (typeof renderHist === 'function') renderHist();
          toast('Biblioteca importada');
        } catch(e){ toast('Archivo no válido'); }
      };
      r.readAsText(f);
    };
  }
  var msgSend = document.getElementById('accMsgSend');
  if (msgSend) msgSend.onclick = function(){
    var to = document.getElementById('accMsgTo').value;
    var txt = (document.getElementById('accMsgTxt').value || '').trim().slice(0, 500);
    if (!to || !txt){ toast('Elige usuario y escribe algo'); return; }
    accSendMsg(u, to, txt);
    document.getElementById('accMsgTxt').value = '';
    accPaintInbox(); accPaintHead();
  };
  var blkBtn = document.getElementById('accBlockBtn');
  if (blkBtn) blkBtn.onclick = function(){
    var t = document.getElementById('accBlockSel').value;
    if (!t || t === u) return;
    var s = accSettings(u);
    if (s.blocked.indexOf(t) === -1) s.blocked.push(t);
    accSaveSettings(u, s); accPaintBlocks(); toast('Usuario bloqueado');
  };
  var nRead = document.getElementById('accNotifRead');
  if (nRead) nRead.onclick = function(){ accMarkRead(u); accPaintNotifList(); accPaintHead(); updateAuthUI(); };
  var cAll = document.getElementById('accCloseAll');
  if (cAll) cAll.onclick = function(){
    try { localStorage.removeItem('sl-session'); } catch(e){}
    updateAuthUI(); renderLists(); toast('Todas las sesiones cerradas');
  };
}
/* ---------- notificaciones ---------- */
function accNotifKey(u){ return 'sl-notif-' + u; }
function accGetNotif(u){
  try { var a = JSON.parse(localStorage.getItem(accNotifKey(u)) || '[]'); return Array.isArray(a) ? a : []; } catch(e){ return []; }
}
function accUnread(u){ return accGetNotif(u).filter(function(n){ return !n.read; }).length; }
function accNotify(u, txt){
  if (!u) return;
  try {
    var a = accGetNotif(u);
    a.unshift({t:Date.now(), txt:String(txt).slice(0, 220), read:0});
    localStorage.setItem(accNotifKey(u), JSON.stringify(a.slice(0, 50)));
  } catch(e){}
  try { updateAuthUI(); } catch(err){}
  if (accTab === 'alertas' && !document.getElementById('accModal').hidden){ accPaintNotifList(); accPaintHead(); }
}
function accMarkRead(u){
  try {
    var a = accGetNotif(u).map(function(n){ n.read = 1; return n; });
    localStorage.setItem(accNotifKey(u), JSON.stringify(a));
  } catch(e){}
}
function accCheckNews(){
  try {
    var u = accCurrentUser(); if (!u) return;
    var s = accSettings(u);
    if (!s.nNew && !s.nFav && !s.nNews) return;
    var ml = mangaList(), favs = [];
    try { favs = JSON.parse(localStorage.getItem('sl-favs') || '[]'); } catch(e){}
    var prev = {};
    try { prev = JSON.parse(localStorage.getItem('sl-chapcount-' + u) || '{}'); } catch(e){}
    var now = {}, fresh = 'sl-chapcount' in localStorage ? false : true;
    try { fresh = !localStorage.getItem('sl-chapcount-' + u); } catch(e){}
    ml.forEach(function(m, i){
      var n = (m.chapters || []).length;
      now[i] = n;
      if (!fresh && prev[i] != null && n > prev[i]){
        var diff = n - prev[i], isFav = favs.indexOf(i) !== -1;
        if (isFav && s.nFav) accNotify(u, '⭐ ' + m.title + ': ' + diff + ' capítulo(s) nuevo(s) en tus favoritos');
        else if (!isFav && s.nNew) accNotify(u, '📚 ' + m.title + ': ' + diff + ' capítulo(s) nuevo(s)');
      }
    });
    try { localStorage.setItem('sl-chapcount-' + u, JSON.stringify(now)); } catch(e){}
    if (!fresh){
      var total = Object.keys(now).reduce(function(a, k){ return a + (now[k] - (prev[k] || 0) > 0 ? now[k] - (prev[k] || 0) : 0); }, 0);
      if (total > 0 && s.nNews) accNotify(u, '🔥 Novedades: ' + total + ' capítulo(s) nuevo(s) en el sitio');
    }
  } catch(e){}
}
function accPaintNotifList(){
  var box = document.getElementById('accNotifList'); if (!box) return;
  var u = accCurrentUser(), a = accGetNotif(u).slice(0, 12);
  if (!a.length){ box.innerHTML = '<div style="font-size:12px;color:var(--dim)">Sin notificaciones.</div>'; return; }
  box.innerHTML = a.map(function(n){
    var d = '';
    try { d = new Date(n.t).toLocaleString(accLang() === 'en' ? 'en' : 'es', accTzOpt()); } catch(e){}
    return '<div class="notifRow' + (n.read ? '' : ' unread') + '"><span style="flex:1">' + escapeHtml(n.txt) + '</span><span class="t">' + escapeHtml(d) + '</span></div>';
  }).join('');
}
function accTzOpt(){ var tz = accGet().tz; return tz && tz !== 'local' ? {timeZone: tz} : {}; }
/* ---------- social local ---------- */
function accFollowKey(u){ return 'sl-follow-' + u; }
function accFollowing(u){
  try { var a = JSON.parse(localStorage.getItem(accFollowKey(u)) || '[]'); return Array.isArray(a) ? a : []; } catch(e){ return []; }
}
function accFollowData(u){
  var following = accFollowing(u), followers = 0;
  try {
    var users = accGetUsers();
    Object.keys(users).forEach(function(x){
      if (x === u) return;
      if (accFollowing(x).indexOf(u) !== -1) followers++;
    });
  } catch(e){}
  return {following: following, followers: followers};
}
function accToggleFollow(me, target){
  if (me === target) return;
  var f = accFollowing(me), i = f.indexOf(target);
  if (i === -1){
    var ts = accSettings(target);
    if ((ts.blocked || []).indexOf(me) !== -1){ toast('No puedes seguir a ese usuario'); return; }
    f.push(target);
    try { localStorage.setItem(accFollowKey(me), JSON.stringify(f)); } catch(e){}
    if (accSettings(target).nFol) accNotify(target, '👥 ' + me + ' empezó a seguirte');
    toast('Siguiendo a ' + target);
  } else {
    f.splice(i, 1);
    try { localStorage.setItem(accFollowKey(me), JSON.stringify(f)); } catch(e){}
    toast('Dejaste de seguir a ' + target);
  }
  accPaintUsers(); accPaintHead();
}
function accSendMsg(from, to, txt){
  var ts = accSettings(to);
  if ((ts.blocked || []).indexOf(from) !== -1){ toast('No se pudo entregar'); return; }
  try {
    var k = 'sl-msgs-' + to, a = [];
    try { a = JSON.parse(localStorage.getItem(k) || '[]'); } catch(e){}
    a.unshift({from:from, txt:txt, t:Date.now(), read:0});
    localStorage.setItem(k, JSON.stringify(a.slice(0, 100)));
  } catch(e){ toast('No se pudo enviar'); return; }
  if (ts.nMsg) accNotify(to, '📨 Mensaje nuevo de ' + from);
  toast('Mensaje enviado');
}
function accInbox(u){
  try { var a = JSON.parse(localStorage.getItem('sl-msgs-' + u) || '[]'); return Array.isArray(a) ? a : []; } catch(e){ return []; }
}
function accPaintInbox(){
  var box = document.getElementById('accInbox'); if (!box) return;
  var u = accCurrentUser(), s = accSettings(u);
  var sel = document.getElementById('accMsgTo');
  if (sel){
    var users = Object.keys(accGetUsers()).filter(function(x){ return x !== u && s.blocked.indexOf(x) === -1; });
    sel.innerHTML = users.length ? users.map(function(x){ return '<option>' + escapeHtml(x) + '</option>'; }).join('') : '<option value="">(nadie más registrado)</option>';
  }
  var msgs = accInbox(u).filter(function(m){ return s.blocked.indexOf(m.from) === -1; }).slice(0, 10);
  box.innerHTML = msgs.length ? msgs.map(function(m){
    var d = '';
    try { d = new Date(m.t).toLocaleString(accLang() === 'en' ? 'en' : 'es', accTzOpt()); } catch(e){}
    return '<div class="msgBox"><b>' + escapeHtml(m.from) + '</b> <span class="t">' + escapeHtml(d) + '</span><br>' + escapeHtml(m.txt) + '</div>';
  }).join('') : '<div style="font-size:12px;color:var(--dim)">Bandeja vacía.</div>';
  try {
    var k = 'sl-msgs-' + u, a = accInbox(u).map(function(m){ m.read = 1; return m; });
    localStorage.setItem(k, JSON.stringify(a));
  } catch(e){}
}
function accPaintBlocks(){
  var box = document.getElementById('accBlockList'); if (!box) return;
  var u = accCurrentUser(), s = accSettings(u);
  box.innerHTML = s.blocked.length ? s.blocked.map(function(x){
    return '<span class="pill">' + escapeHtml(x) + ' <a href="#" data-unblock="' + escapeHtml(x) + '" style="color:var(--accent)">✕</a></span>';
  }).join(' ') : '<div style="font-size:12px;color:var(--dim)">Nadie bloqueado.</div>';
  box.querySelectorAll('[data-unblock]').forEach(function(a){
    a.onclick = function(ev){
      ev.preventDefault();
      var s2 = accSettings(u);
      s2.blocked = s2.blocked.filter(function(x){ return x !== a.getAttribute('data-unblock'); });
      accSaveSettings(u, s2); accPaintBlocks();
    };
  });
  var sel = document.getElementById('accBlockSel');
  if (sel){
    var users = Object.keys(accGetUsers()).filter(function(x){ return x !== u && s.blocked.indexOf(x) === -1; });
    sel.innerHTML = users.length ? users.map(function(x){ return '<option>' + escapeHtml(x) + '</option>'; }).join('') : '<option value="">—</option>';
  }
}
function accPaintUsers(){
  var box = document.getElementById('accUsers'); if (!box) return;
  var u = accCurrentUser(), mine = accFollowing(u);
  var users = Object.keys(accGetUsers()).filter(function(x){ return x !== u; });
  if (!users.length){ box.innerHTML = '<div style="font-size:12px;color:var(--dim)">Eres la única cuenta en este dispositivo.</div>'; return; }
  box.innerHTML = users.map(function(x){
    var p = accProfile(x) || {};
    var f = accFollowData(x);
    var me = mine.indexOf(x) !== -1;
    return '<div class="admRow"><div class="t"><b>' + escapeHtml(p.name || x) + '</b> @' + escapeHtml(x) +
      ' <span style="color:var(--dim)">· ' + f.followers + ' seguidores</span></div>' +
      '<button class="smallBtn" data-follow="' + escapeHtml(x) + '">' + (me ? 'Dejar' : 'Seguir') + '</button></div>';
  }).join('');
  box.querySelectorAll('[data-follow]').forEach(function(b){
    b.onclick = function(){ accToggleFollow(u, b.getAttribute('data-follow')); };
  });
}
function accPaintSessions(){
  var box = document.getElementById('accSessions'); if (!box) return;
  var ua = '';
  try { ua = (navigator.userAgent || '').slice(0, 90); } catch(e){}
  var d = '';
  try { d = new Date().toLocaleString(accLang() === 'en' ? 'en' : 'es', accTzOpt()); } catch(e){}
  box.innerHTML = '<div class="msgBox">📱 <b>' + (accLang() === 'en' ? 'This device' : 'Este dispositivo') + '</b><br><span class="t">' + escapeHtml(ua) + '<br>' + escapeHtml(d) + '</span></div>';
}
function accPaintContentF(){
  var box = document.getElementById('accContentF'); if (!box) return;
  var s = accGet();
  var gs = ['Ecchi', 'Harem'];
  box.innerHTML = gs.map(function(g){
    var on = s.contentFilter.indexOf(g) !== -1;
    return '<label class="tglRow"><span class="t">' + g + '</span><span class="switch"><input type="checkbox" data-acc-cf="' + g + '"' + (on ? ' checked' : '') + '><span class="swTrack"></span></span></label>';
  }).join('');
  box.querySelectorAll('[data-acc-cf]').forEach(function(el){
    el.onchange = function(){
      var u = accCurrentUser(), s2 = accSettings(u);
      var g = el.getAttribute('data-acc-cf'), i = s2.contentFilter.indexOf(g);
      if (el.checked && i === -1) s2.contentFilter.push(g);
      if (!el.checked && i !== -1) s2.contentFilter.splice(i, 1);
      accSaveSettings(u, s2); accApplyAll(false);
      toast('Filtro actualizado');
    };
  });
}
/* ---------- enganches al lector ---------- */
function accIsFinished(estado){
  var e = String(estado || '').toLowerCase();
  return e.indexOf('final') !== -1 || e.indexOf('complet') !== -1 || e.indexOf('termin') !== -1 || e.indexOf('finish') !== -1;
}
function accApplyAll(fromBoot){
  var s = accGet();
  accApplyTheme();
  accApplyReader();
  try { if (typeof updateAuthUI === 'function') updateAuthUI(); } catch(e){}
  try { accApplyI18n(); } catch(e){}
  if (!fromBoot){
    try { if (typeof renderCards === 'function' && !document.getElementById('homeView').hidden) renderCards((document.getElementById('catSearch').value || '')); } catch(e){}
  }
}
if (typeof renderCards === 'function'){
  var _accRC = renderCards;
  renderCards = function(q){
    _accRC(q);
    try {
      var s = accGet(), admin = (typeof isAdmin === 'function') && isAdmin();
      document.querySelectorAll('#catSections .catGrid').forEach(function(g){
        var cards = Array.prototype.slice.call(g.querySelectorAll('.mCard'));
        cards.forEach(function(c){
          var hide = false;
          if (s.hideFinished && !admin && accIsFinished(c.dataset.estado)) hide = true;
          if (!hide && !admin && (s.contentFilter || []).length){
            var gs = (c.dataset.genres || '').split(',').filter(function(x){ return x; });
            if (gs.some(function(g2){ return s.contentFilter.indexOf(g2) !== -1; })) hide = true;
          }
          c.style.display = hide ? 'none' : '';
        });
        if (s.libSort === 'title' && !admin){
          cards.filter(function(c){ return c.style.display !== 'none'; })
            .sort(function(a, b){
              var ta = (a.querySelector('.mTitle') || {}).textContent || '', tb = (b.querySelector('.mTitle') || {}).textContent || '';
              return ta.localeCompare(tb, 'es');
            }).forEach(function(c){ g.appendChild(c); });
        }
      });
    } catch(e){}
  };
}
if (typeof mangaCard === 'function'){
  var _accMC = mangaCard;
  mangaCard = function(m, idx, favs){
    var el = _accMC(m, idx, favs);
    try {
      el.dataset.estado = (m.meta && m.meta.estado) || '';
      el.dataset.genres = ((m.meta && m.meta.genres) || []).join(',');
    } catch(e){}
    return el;
  };
}
if (typeof renderHist === 'function'){
  var _accRH = renderHist;
  renderHist = function(){
    try { if (accGet().hideHist && !((typeof isAdmin === 'function') && isAdmin())){ var b = document.getElementById('histList'); if (b) b.innerHTML = ''; var hh = document.getElementById('histHead'); if (hh) hh.hidden = true; var hc = document.getElementById('histClear'); if (hc) hc.hidden = true; return; } } catch(e){}
    return _accRH();
  };
}
if (typeof renderLists === 'function'){
  var _accRL = renderLists;
  renderLists = function(){
    try {
      var s = accGet();
      if (s.hideLib && !((typeof isAdmin === 'function') && isAdmin())){
        var box = document.getElementById('listsBox');
        if (box) box.innerHTML = '<div class="listCard"><h4>🔒 ' + (accLang() === 'en' ? 'Private library' : 'Biblioteca privada') + '</h4><div style="font-size:12px;color:var(--dim)">' + (accLang() === 'en' ? 'Hidden by your privacy settings.' : 'Oculta por tu ajuste de privacidad.') + '</div></div>';
        return;
      }
      if (s.libSort === 'title'){
        var r = _accRL();
        try {
          document.querySelectorAll('#listsBox .listCard').forEach(function(card){
            var rows = Array.prototype.slice.call(card.querySelectorAll('.histRow'));
            rows.sort(function(a, b){
              var ta = ((a.querySelector('.t') || {}).textContent || ''), tb = ((b.querySelector('.t') || {}).textContent || '');
              return ta.localeCompare(tb, 'es');
            }).forEach(function(rw){ card.insertBefore(rw, card.querySelector('[data-addsel]') ? card.querySelector('[data-addsel]').closest('div') : null); });
          });
        } catch(e){}
        return r;
      }
    } catch(e){}
    return _accRL();
  };
}
if (typeof renderCom === 'function'){
  var _accRCo = renderCom;
  renderCom = function(){
    _accRCo();
    try {
      if (!accGet().showComments){
        var ub = document.getElementById('utterBox');
        if (ub && ub.closest('.listCard')) ub.closest('.listCard').style.display = 'none';
      }
    } catch(e){}
  };
}
if (typeof saveProg === 'function'){
  var _accSP = saveProg;
  saveProg = function(){ try { if (!accGet().remember) return; } catch(e){} return _accSP(); };
}
if (typeof openChapter === 'function'){
  var _accOC = openChapter;
  openChapter = function(num, opts){
    opts = opts || {};
    try {
      var s = accGet();
      if (opts.startPage == null && s.remember && s.autoCont && typeof getProgMap === 'function' && typeof state !== 'undefined'){
        var p = getProgMap()[state.manga + ':' + num];
        if (typeof p === 'number') opts.startPage = p;
      }
    } catch(e){}
    return _accOC(num, opts);
  };
}
if (typeof renderChapList === 'function'){
  var _accRCL = renderChapList;
  renderChapList = function(){
    var r = _accRCL();
    try {
      var fmt = accGet().dateFmt || 'iso';
      if (fmt === 'iso') return r;
      document.querySelectorAll('#chapList .chapRow .d').forEach(function(d){
        var m = (d.textContent || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (!m) return;
        var out = m[0];
        if (fmt === 'es') out = m[3] + '/' + m[2] + '/' + m[1];
        else if (fmt === 'us') out = m[2] + '/' + m[3] + '/' + m[1];
        else if (fmt === 'rel'){
          var dt = new Date(+m[1], +m[2] - 1, +m[3]), diff = Math.floor((Date.now() - dt.getTime()) / 86400000);
          out = diff <= 0 ? (accLang() === 'en' ? 'today' : 'hoy') : diff === 1 ? (accLang() === 'en' ? 'yesterday' : 'ayer') : (accLang() === 'en' ? diff + ' days ago' : 'hace ' + diff + ' días');
        }
        d.textContent = d.textContent.replace(m[0], out);
      });
    } catch(e){}
    return r;
  };
}
/* ---------- cabecera: avatar + campana ---------- */
function accBuildHeader(){
  try {
    var hr = document.querySelector('.hRight'); if (!hr || document.getElementById('notifBtn')) return;
    var b = document.createElement('button');
    b.className = 'tab'; b.id = 'notifBtn'; b.title = accT('notif');
    b.innerHTML = '🔔<span class="nBadge" id="notifBadge" hidden></span>';
    b.onclick = function(){ accOpenNotif(); };
    var chip = document.getElementById('userChip');
    hr.insertBefore(b, chip);
  } catch(e){}
}
function accOpenNotif(){
  var u = accCurrentUser(); if (!u) return;
  var m = document.getElementById('notifModal');
  if (!m){
    m = document.createElement('div');
    m.className = 'modal'; m.id = 'notifModal'; m.hidden = true;
    m.innerHTML = '<div class="modalCard"><h3>🔔 ' + accT('notif') + '</h3><div id="notifList"></div>' +
      '<div class="mBtns"><button id="notifReadBtn">✓ ' + (accLang() === 'en' ? 'Mark read' : 'Marcar leídas') + '</button><span style="flex:1"></span><button id="notifClose" class="primary">' + (accLang() === 'en' ? 'Close' : 'Cerrar') + '</button></div></div>';
    document.body.appendChild(m);
    m.addEventListener('click', function(e){ if (e.target === m) m.hidden = true; });
    document.getElementById('notifClose').onclick = function(){ m.hidden = true; };
    document.getElementById('notifReadBtn').onclick = function(){ accMarkRead(u); accPaintBell(); accPaintNotifModal(); };
  }
  accPaintNotifModal();
  m.hidden = false;
}
function accPaintNotifModal(){
  var box = document.getElementById('notifList'); if (!box) return;
  var u = accCurrentUser(), a = accGetNotif(u).slice(0, 20);
  box.innerHTML = a.length ? a.map(function(n){
    var d = '';
    try { d = new Date(n.t).toLocaleString(accLang() === 'en' ? 'en' : 'es', accTzOpt()); } catch(e){}
    return '<div class="notifRow' + (n.read ? '' : ' unread') + '"><span style="flex:1">' + escapeHtml(n.txt) + '</span><span class="t">' + escapeHtml(d) + '</span></div>';
  }).join('') : '<div style="font-size:12px;color:var(--dim)">—</div>';
  accMarkRead(u); accPaintBell();
}
function accPaintBell(){
  try {
    var u = accCurrentUser(), b = document.getElementById('notifBtn'), g = document.getElementById('notifBadge');
    if (!b || !g) return;
    b.hidden = !u;
    var n = u ? accUnread(u) : 0;
    g.hidden = !n; g.textContent = n > 99 ? '99+' : String(n);
  } catch(e){}
}
/* ---------- auth ---------- */
function accInjectEmail(){
  try {
    if (document.getElementById('accEmailRow')) return;
    var pass = document.getElementById('authPass');
    if (!pass) return;
    var row = pass.closest('.fRow'); if (!row) return;
    var d = document.createElement('div');
    d.className = 'fRow'; d.id = 'accEmailRow';
    d.innerHTML = 'Correo electrónico (opcional)<input id="accEmail" inputmode="email" autocomplete="email" maxlength="80" placeholder="tu@correo.com">';
    row.parentNode.insertBefore(d, row.nextSibling);
  } catch(e){}
}
if (typeof openAuth === 'function'){
  var _accOA = openAuth;
  openAuth = function(mode){
    _accOA(mode);
    try { document.getElementById('accEmailRow').hidden = mode !== 'register'; } catch(e){}
  };
}
if (typeof updateAuthUI === 'function'){
  updateAuthUI = function(){
    var u = null;
    try { u = accCurrentUser(); } catch(e){}
    try {
      document.getElementById('authInBtn').hidden = !!u;
      document.getElementById('authUpBtn').hidden = !!u;
    } catch(e){}
    try {
      var chip = document.getElementById('userChip');
      if (chip){
        chip.hidden = !u;
        if (u){
          var p = null;
          try { p = accProfile(u); } catch(e){}
          var av = p && p.avatar ? '<img class="avImg ' + accFrameClass() + '" src="' + p.avatar + '" alt="">' : '👤 ';
          chip.innerHTML = av + escapeHtml((p && p.name) || u);
          chip.onclick = function(){ openProfile('cuenta'); };
        }
      }
    } catch(e){}
    try { accPaintBell(); } catch(e){}
  };
}
if (typeof applyTheme === 'function'){ applyTheme = function(){ accApplyTheme(); }; }
(function accWrapAuthGo(){
  try {
    var btn = document.getElementById('authGo');
    if (!btn || !btn.onclick) return;
    var orig = btn.onclick;
    btn.onclick = async function(ev){
      var usersBefore = {};
      try { usersBefore = accGetUsers(); } catch(e){}
      await orig.call(this, ev);
      try {
        var u = accCurrentUser(); if (!u) return;
        var isNew = !usersBefore[u];
        var p = accProfile(u);
        if (!p){ p = {name:u, avatar:'', cover:'', bio:'', email:''}; accSaveProfile(u, p); }
        if (isNew){
          var em = '';
          try { em = (document.getElementById('accEmail').value || '').trim().slice(0, 80); } catch(e){}
          if (em && /.+@.+\..+/.test(em)){
            p.email = em; accSaveProfile(u, p);
            try {
              var users = accGetUsers();
              if (users[u]){ users[u].email = em; localStorage.setItem('sl-users', JSON.stringify(users)); }
            } catch(e){}
          }
          if (!accGetNotif(u).length) accNotify(u, accLang() === 'en' ? '🎉 Welcome to AILector! Set up your profile.' : '🎉 ¡Bienvenido a AILector! Configura tu perfil.');
        }
        accApplyAll(false);
        if (isNew) openProfile('cuenta');
      } catch(e){}
    };
  } catch(e){}
})();
/* ---------- arranque ---------- */
accBuildHeader();
accInjectEmail();
accApplyAll(true);
try { accCheckNews(); } catch(e){}
try { accPaintBell(); } catch(e){}




