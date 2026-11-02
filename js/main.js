
'use strict';
const ADMIN_HASH = '3219d5d0cef1ccbe929092f051421595b3bd32e8a072b7241306e815a0ab749d';
const META_SLIME = {
  rating: 9.2, demographic: 'Shounen', tipo: 'MANGA', estado: 'PUBLICÁNDOSE', cover: 'cover.jpg',
  genres: ['Acción','Aventura','Magia','Reencarnación'],
  synopsis: 'Un hombre, que al tratar de salvar a su compañero de trabajo y su novia, fue apuñalado por un ladrón que escapaba. Mientras moría desangrado escuchó una voz extraña. Esta voz escuchó su lamento y le dio la Habilidad Única "Gran Sabio". Ahora ha reencarnado como un Slime en otro mundo. ¿Será este el inicio de una emocionante aventura?',
  sinonimos: 'Tensei Shitara Slime Datta Ken, 転生したらスライムだった件',
  autores: ['kawakami','fuse','taiki'], arte: ['fuse'], subidoPor: 'Blackdragonscan',
  counts: {leido:388, pendiente:844, siguiendo:5586, favorito:1790, tengo:126, abandonado:11}
};
const META_VIDA = {
  rating: 8.0, demographic: 'Seinen', tipo: 'MANGA', estado: 'PUBLICÁNDOSE', cover: 'cover2.jpg',
  genres: [], synopsis: 'Sinopsis disponible próximamente.',
  sinonimos: '', autores: [], arte: [], subidoPor: '',
  counts: {leido:0, pendiente:0, siguiendo:0, favorito:0, tengo:0, abandonado:0}
};
const META_OVER = {
  rating: 3.9, demographic: 'Seinen', tipo: 'MANGA', estado: 'Completado', cover: 'cover3.jpg',
  genres: ['Acción','Aventura','Comedia','Drama','Fantasía'],
  synopsis: '¿Qué haces cuando tu videojuego favorito cierra sus servidores? Momonga decidió quedarse conectado hasta el final. Pero cuando todo se apaga, se ve transportado al mundo del juego, convertido en su avatar esqueleto, con sus increíbles poderes mágicos incluidos. ¿Y si él es el villano de su propia historia?',
  sinonimos: 'Overlord, オーバーロード, El soberano supremo, Повелитель',
  autores: ['maruyama kugane'], arte: ['miyama fugin'], subidoPor: '',
  counts: {leido:0, pendiente:0, siguiendo:0, favorito:0, tengo:0, abandonado:0}
};
function baseChapters(mid){
  if (mid === 2) return (typeof CHAPTERS_OVERLORD !== 'undefined' ? CHAPTERS_OVERLORD : []);
  if (mid === 1) return (typeof CHAPTERS_VIDA !== 'undefined' ? CHAPTERS_VIDA : []);
  return CHAPTERS;
}
const $ = s => document.querySelector(s);
const sleep = ms => new Promise(r => setTimeout(r, ms));
function escapeHtml(s){ const d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
let toastTm = null;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTm);
  toastTm = setTimeout(()=>t.classList.remove('show'), 2600);
}
function adminOnly(){ toast('Solo el administrador en el lector original'); }

const state = {
  manga: 0, chap: null, pages: [], pageIndex: 0, lines: [], lineIndex: -1,
  playing: false, gen: 0, showBoxes: true, voiceMode: true,
  readMode: localStorage.getItem('sl-readmode') || 'pages',
  spread: (localStorage.getItem('sl-spread') || 'no') === 'si',
  zoom: parseFloat(localStorage.getItem('sl-zoom') || '1') || 1,
  sortAsc: (localStorage.getItem('sl-sort') || 'desc') === 'asc',
  mode: localStorage.getItem('sl-mode') || 'translation',
  rate: parseFloat(localStorage.getItem('sl-rate') || '1') || 1,
  voice: null,
  readWidth: localStorage.getItem('sl-width') || 'ancho',
  readBg: localStorage.getItem('sl-bg') || 'negro',
  autoDelay: parseFloat(localStorage.getItem('sl-delay') || '4') || 4,
  autoTurn: (localStorage.getItem('sl-autoturn') || 'si') === 'si',
};
const READ_WIDTHS = {estrecho:480, normal:640, ancho:900, completo:null};
const READ_BGS = {negro:'#0f1117', azul:'#1a2030', marron:'#221a12', crema:'#e8dcc8', blanco:'#ffffff'};
const SIDE_IMGS = [
  'https://user.uploads.dev/file/4091b111a9e40cc53ec320b4c1470ac0.jpg',
  'https://user.uploads.dev/file/ff83161452d1aa5b2a7ae1753ab69531.jpg',
  'https://user.uploads.dev/file/80ba634e5ce51d916f832267f49f66bd.jpg',
];
const SIDE_COLORS = ['#000000','#1a2030','#5b2a3a','#1e4d3a','#e8dcc8'];
function getSide(){ try { return JSON.parse(localStorage.getItem('sl-side') || '{"t":"none"}'); } catch(e){ return {t:'none'}; } }
function setSide(s){ try { localStorage.setItem('sl-side', JSON.stringify(s)); } catch(e){ toast('Imagen muy pesada: se usará solo esta sesión'); } }
function applySideBg(){
  const rv = $('#readerView');
  if (!rv) return;
  const s = getSide();
  rv.style.backgroundColor = '';
  rv.style.backgroundImage = '';
  rv.style.backgroundSize = '';
  rv.style.backgroundPosition = '';
  if (!s || s.t === 'none') return;
  if (s.t === 'color') rv.style.backgroundColor = s.v;
  else if (s.t === 'img' && s.v){
    rv.style.backgroundImage = 'url("' + s.v + '")';
    rv.style.backgroundSize = 'cover';
    rv.style.backgroundPosition = 'center top';
  }
  document.querySelectorAll('#rsSideImgs img').forEach(im=>{
    im.style.outline = (s.t === 'img' && s.v === im.dataset.u) ? '2px solid var(--accent)' : 'none';
  });
  document.querySelectorAll('#rsSideCols .bgDot').forEach(b=>{
    b.style.outline = (s.t === 'color' && s.v === b.dataset.c) ? '2px solid var(--accent)' : 'none';
  });
}
function applyReadPrefs(){
  const w = READ_WIDTHS[state.readWidth] || null;
  const st = $('#stage');
  st.style.maxWidth = w ? w + 'px' : '100%';
  st.style.display = 'inline-block';
  st.style.verticalAlign = 'top';
  st.style.background = READ_BGS[state.readBg] || '#05060a';
  document.querySelectorAll('#rsWidthRow button').forEach(b=>{
    b.classList.toggle('primary', b.dataset.w === state.readWidth);
  });
  document.querySelectorAll('#rsAutoRow button').forEach(b=>{
    b.classList.toggle('primary', (b.dataset.a === 'si') === state.autoTurn);
  });
  document.querySelectorAll('#rsBgRow .bgDot').forEach(b=>{
    b.style.outline = b.dataset.b === state.readBg ? '2px solid var(--accent)' : 'none';
  });
  document.querySelectorAll('#rsModeRow button').forEach(b=>{
    b.classList.toggle('primary', b.dataset.m === state.readMode);
  });
  document.querySelectorAll('#rsSpreadRow button').forEach(b=>{
    b.classList.toggle('primary', (b.dataset.s === 'si') === state.spread);
  });
  try { $('#rsGc').value = gcCode(); } catch(e){}
  applyZoom();
  $('#rsSpeed').value = String(state.autoDelay);
  $('#rsSpeedVal').textContent = state.autoDelay + ' s';
}
function mangaList(){
  const ov = getOv();
  const base = [
    {title: MANGA.title, meta: META_SLIME, chapters: CHAPTERS.slice()},
    {title: 'La Vida Después de la Muerte', meta: META_VIDA, chapters: (typeof CHAPTERS_VIDA !== 'undefined' ? CHAPTERS_VIDA.slice() : [])},
    {title: 'Overlord', meta: META_OVER, chapters: (typeof CHAPTERS_OVERLORD !== 'undefined' ? CHAPTERS_OVERLORD.slice() : [])},
  ];
  base.forEach((m, idx) => {
    const hid = (ov.hidden || {})[idx] || {};
    const tit = (ov.titles || {})[idx] || {};
    m.chapters = m.chapters
      .filter(c => !hid[c.num])
      .map(c => (tit[c.num] ? Object.assign({}, c, {title: tit[c.num]}) : c));
    for (const a of (ov.added || [])){
      if (a.manga === idx && !hid[a.num]) m.chapters.push({num:a.num, title:a.title, date:a.date, strips:a.strips, stripCount:a.strips.length, pages:null});
    }
  });
  return base;
}
function curManga(){ return mangaList()[state.manga]; }
function show(view){
  $('#homeView').hidden = view !== 'home';
  $('#detailView').hidden = view !== 'detail';
  $('#readerView').hidden = view !== 'reader';
  $('#listsView').hidden = view !== 'lists';
  $('#newsView').hidden = view !== 'news';
  $('#comView').hidden = view !== 'com';
  $('#tabLib').classList.toggle('active', view === 'home' || view === 'detail');
  $('#tabCom').classList.toggle('active', view === 'com');
  $('#tabLists').classList.toggle('active', view === 'lists');
  $('#tabNews').classList.toggle('active', view === 'news');
  window.scrollTo(0, 0);
}

/* ---------- catálogo ---------- */
function initHome(){
  buildGenre();
  renderCards('');
  renderCont();
  renderHist();
  $('#catSearch').oninput = e => renderCards(e.target.value);
  $('#genreSel').onchange = () => renderCards($('#catSearch').value);
  $('#newMangaBtn').onclick = adminOnly;
  $('#modeSel').value = state.mode;
  $('#rateSel').value = String(state.rate);
}
function buildGenre(){
  const sel = $('#genreSel'), cur = sel.value;
  const set = {};
  mangaList().forEach(m => (m.meta.genres || []).forEach(g => set[g] = 1));
  sel.innerHTML = '<option value="">Todos los géneros</option>' +
    Object.keys(set).sort().map(g => '<option value="' + escapeHtml(g) + '">' + escapeHtml(g) + '</option>').join('');
  sel.value = cur;
}
function cardMatch(m, q){
  q = (q || '').toLowerCase().trim();
  if (!q) return true;
  if (m.title.toLowerCase().indexOf(q) !== -1) return true;
  if ((m.meta.sinonimos || '').toLowerCase().indexOf(q) !== -1) return true;
  if ((m.meta.demographic || '').toLowerCase().indexOf(q) !== -1) return true;
  if ((m.meta.genres || []).some(g => g.toLowerCase().indexOf(q) !== -1)) return true;
  if (String(parseInt(q, 10)) === q && m.chapters.some(c => c.num === parseInt(q, 10))) return true;
  return false;
}
function getFavs(){ try { return JSON.parse(localStorage.getItem('sl-favs') || '[]') || []; } catch(e){ return []; } }
function setFavs(f){ try { localStorage.setItem('sl-favs', JSON.stringify(f)); } catch(e){} }
function demoClass(d){
  d = (d || '').toLowerCase();
  if (d.indexOf('shounen') !== -1) return 'demo-shounen';
  if (d.indexOf('shojo') !== -1 || d.indexOf('shoujo') !== -1) return 'demo-shojo';
  if (d.indexOf('seinen') !== -1) return 'demo-seinen';
  if (d.indexOf('josei') !== -1) return 'demo-josei';
  return 'demo-def';
}
function mangaCard(m, idx, favs){
  const card = document.createElement('div');
  card.className = 'mCard';
  card.innerHTML =
    '<div class="mTitle">' + escapeHtml(m.title) + '</div>' +
    '<div class="mCoverWrap"><img src="' + m.meta.cover + '" alt="Portada" loading="lazy">' +
    '<span class="mType">' + escapeHtml(m.meta.tipo || 'MANGA') + '<br><span class="sc">★ ' + m.meta.rating.toFixed(2) + '</span></span>' +
    (favs.includes(idx) ? '<span class="mFav">⭐</span>' : '') + '</div>' +
    '<div class="mDemo ' + demoClass(m.meta.demographic) + '">' + escapeHtml(m.meta.demographic || '') + '</div>';
  card.onclick = () => { state.manga = idx; openDetail(); };
  return card;
}
function renderCards(q){
  const secs = $('#catSections'); if (!secs) return;
  secs.innerHTML = '';
  const gz = $('#genreSel').value;
  const favs = getFavs();
  const list = [];
  mangaList().forEach((m, idx) => {
    if (!cardMatch(m, q)) return;
    if (gz && !(m.meta.genres || []).includes(gz)) return;
    list.push({m, idx});
  });
  if (!list.length){ secs.innerHTML = '<p style="color:var(--dim)">Sin resultados.</p>'; renderTop(); return; }
  const pop = list.slice().sort((a,b)=>b.m.meta.rating - a.m.meta.rating);
  const h0 = document.createElement('div');
  h0.className = 'secHead'; h0.textContent = '🔥 Populares';
  secs.appendChild(h0);
  const g0 = document.createElement('div');
  g0.className = 'catGrid';
  pop.forEach(e => g0.appendChild(mangaCard(e.m, e.idx, favs)));
  secs.appendChild(g0);
  const groups = {};
  list.forEach(e => { const d = e.m.meta.demographic || 'Otros'; (groups[d] = groups[d] || []).push(e); });
  Object.keys(groups).sort().forEach(d => {
    const h = document.createElement('div');
    h.className = 'secHead'; h.textContent = '❤ P: ' + d;
    secs.appendChild(h);
    const g = document.createElement('div');
    g.className = 'catGrid';
    groups[d].forEach(e => g.appendChild(mangaCard(e.m, e.idx, favs)));
    secs.appendChild(g);
  });
  renderTop();
}
function renderTop(){
  const box = $('#topRead'); if (!box) return;
  let s = {opens:{}};
  try { s = JSON.parse(localStorage.getItem('sl-stats') || '{"opens":{}}'); } catch(e){}
  const ml = mangaList();
  const agg = {};
  Object.keys(s.opens || {}).forEach(k => {
    const m = +k.split(':')[0];
    if (ml[m]) agg[m] = (agg[m]||0) + s.opens[k];
  });
  const top = Object.keys(agg).sort((a,b)=>agg[b]-agg[a]).slice(0,5);
  box.innerHTML = top.length ? top.map((m, i) =>
    '<div class="topRow"><span class="n">' + (i+1) + '.</span><span>' + escapeHtml(ml[m].title) + '</span><span class="c">' + agg[m] + '</span></div>'
  ).join('') : '<div style="font-size:12px;color:var(--dim)">Lee algo y aparecerá aquí.</div>';
}
function getProgMap(){ try { return JSON.parse(localStorage.getItem('sl-progmap') || '{}') || {}; } catch(e){ return {}; } }
function renderCont(){
  const sec = $('#contSec');
  let last = null;
  try { last = JSON.parse(localStorage.getItem('sl-proglast') || 'null'); } catch(e){}
  if (!last || typeof last.c !== 'number'){ sec.hidden = true; return; }
  const ml = mangaList();
  if (!ml[last.m] || !ml[last.m].chapters.some(c => c.num === last.c)){ sec.hidden = true; return; }
  sec.hidden = false;
  $('#contBtn').textContent = '▶ Continuar: ' + ml[last.m].title + ' · Cap. ' + last.c + ' · pág. ' + ((last.p || 0) + 1);
  $('#contBtn').onclick = () => { state.manga = last.m; openChapter(last.c, {startPage: last.p || 0}); };
}
$('#contDismiss').onclick = () => { try { localStorage.removeItem('sl-proglast'); } catch(_){} renderCont(); };
function getHist(){ try { return JSON.parse(localStorage.getItem('sl-hist') || '[]') || []; } catch(e){ return []; } }
function pushHist(){
  if (!state.chap) return;
  const e = {m: state.manga, c: state.chap.num, t: Date.now()};
  const h = getHist().filter(x => !(x.m === e.m && x.c === e.c));
  h.unshift(e);
  try { localStorage.setItem('sl-hist', JSON.stringify(h.slice(0, 30))); } catch(_){}
}
function timeAgo(t){
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'ahora';
  if (s < 3600) return 'hace ' + Math.floor(s/60) + ' min';
  if (s < 86400) return 'hace ' + Math.floor(s/3600) + ' h';
  return 'hace ' + Math.floor(s/86400) + ' d';
}
function renderHist(){
  const box = $('#histList'); box.innerHTML = '';
  const h = getHist().slice(0, 8);
  $('#histHead').hidden = !h.length;
  $('#histClear').hidden = !h.length;
  if (!h.length) return;
  const ml = mangaList(), pm = getProgMap();
  for (const e of h){
    if (!ml[e.m]) continue;
    const row = document.createElement('div');
    row.className = 'histRow';
    const pg = pm[e.m + ':' + e.c];
    row.innerHTML = '<div class="t"><b>' + escapeHtml(ml[e.m].title) + '</b> · Cap. ' + e.c +
      (typeof pg === 'number' ? ' · pág. ' + (pg+1) : '') + '</div><div class="d">' + timeAgo(e.t) + '</div>' +
      '<button class="smallBtn histDel" title="Borrar">✕</button>';
    row.onclick = ((m, c) => () => { state.manga = m; const p = getProgMap()[m + ':' + c]; openChapter(c, {startPage: typeof p === 'number' ? p : 0}); })(e.m, e.c);
    row.querySelector('.histDel').onclick = ((m, c) => ev => {
      ev.stopPropagation();
      try { localStorage.setItem('sl-hist', JSON.stringify(getHist().filter(x => !(x.m === m && x.c === c)))); } catch(_){}
      renderHist();
    })(e.m, e.c);
    box.appendChild(row);
  }
}
$('#histClear').onclick = () => { try { localStorage.removeItem('sl-hist'); } catch(_){} renderHist(); toast('Historial borrado'); };
function getReads(){ try { return JSON.parse(localStorage.getItem('sl-reads') || '{}') || {}; } catch(e){ return {}; } }
function setReads(r){ try { localStorage.setItem('sl-reads', JSON.stringify(r)); } catch(e){} }
function openDetail(){
  stopAll();
  const m = curManga(), meta = m.meta, chaps = m.chapters;
  $('#dCover').setAttribute('src', meta.cover);
  $('#dTitle').textContent = m.title;
  $('#dMeta').innerHTML = '<span class="pill estadoDot">● ' + escapeHtml(meta.estado) + '</span> <span class="pill">' + escapeHtml(meta.demographic) + '</span> <span class="pill">★ ' + meta.rating.toFixed(2) + '</span>';
  $('#dSyn').textContent = meta.synopsis;
  $('#dGenres').innerHTML = meta.genres.map(x=>'<span class="chip">'+escapeHtml(x)+'</span>').join('');
  let extra = '';
  if (meta.sinonimos) extra += '<b>Sinónimos</b><div>' + escapeHtml(meta.sinonimos) + '</div>';
  if (meta.autores.length) extra += '<b>Autores</b><div>' + meta.autores.map(a=>'<span class="pill">✎ ' + escapeHtml(a) + '</span>').join('') + '</div>';
  if (meta.arte.length) extra += '<b>Arte</b><div>' + meta.arte.map(a=>'<span class="pill">✎ ' + escapeHtml(a) + '</span>').join('') + '</div>';
  if (meta.subidoPor) extra += '<b>Subido por</b><div>' + escapeHtml(meta.subidoPor) + '</div>';
  $('#dExtra').innerHTML = extra;
  const cc = meta.counts;
  $('#dStats').innerHTML =
    '<div class="stat"><b>' + cc.leido + '</b>✅ Leído</div>' +
    '<div class="stat"><b>' + cc.pendiente + '</b>🕐 Pendiente</div>' +
    '<div class="stat"><b>' + cc.siguiendo + '</b>▶ Siguiendo</div>' +
    '<div class="stat"><b>' + cc.favorito + '</b>🤍 Favorito</div>' +
    '<div class="stat"><b>' + cc.tengo + '</b>📦 Lo tengo</div>' +
    '<div class="stat"><b>' + cc.abandonado + '</b>🚩 Abandonado</div>';
  renderChapList();
  $('#favBtn').textContent = getFavs().includes(state.manga) ? '❤️' : '🤍';
  $('#sortBtn').textContent = state.sortAsc ? '↑ Antiguos' : '↓ Nuevos';
  let total = 0;
  for (const c of chaps) total += (c.pages || []).length;
  $('#chapHeadT').textContent = 'Capítulos ' + chaps.length + ' · ' + total + ' pág.';
  show('detail');
}
function readKey(num){ return state.manga + ':' + num; }
function renderChapList(){
  const list = $('#chapList'); list.innerHTML = '';
  const reads = getReads();
  const chaps = curManga().chapters;
  if (!chaps.length){
    list.innerHTML = '<p style="color:var(--dim)">Aún no hay capítulos publicados.</p>';
    return;
  }
  const sorted = chaps.slice().sort((a,b)=> state.sortAsc ? a.num - b.num : b.num - a.num);
  const showAdm = isAdmin();
  const pm = getProgMap();
  for (const c of sorted){
    const row = document.createElement('div');
    row.className = 'chapRow';
    const done = !!reads[readKey(c.num)];
    const pg = pm[readKey(c.num)];
    const total = ((c.pages||[]).length || c.stripCount || 0);
    row.innerHTML = '<button class="readToggle' + (done ? ' done' : '') + '" title="Marcar leído">' + (done ? '✅' : '⬜') + '</button>' +
      '<div class="t"><b>Capítulo ' + c.num + '</b>' + (c.title ? ' — ' + escapeHtml(c.title) : '') + '</div>' +
      '<div class="d">' + escapeHtml(c.date || '') + ' · ' + total + ' pág.' + (typeof pg === 'number' ? ' · ▶' + (pg+1) : '') + '</div>' +
      '<div class="rowBtns"><button class="smallBtn hearBtn">🔊 Escuchar</button><button class="smallBtn openBtn">Leer online</button>' +
      (showAdm ? '<button class="smallBtn editBtn">Editar</button><button class="smallBtn delBtn">✕</button>' : '') + '</div>';
    row.querySelector('.readToggle').onclick = ev => {
      ev.stopPropagation();
      const r = getReads(), k = readKey(c.num);
      if (r[k]) delete r[k]; else r[k] = 1;
      setReads(r);
      renderChapList();
    };
    row.querySelector('.openBtn').onclick = ev => { ev.stopPropagation(); openChapter(c.num); };
    row.querySelector('.hearBtn').onclick = ev => { ev.stopPropagation(); openChapter(c.num, {autoplay:true}); };
    const eb = row.querySelector('.editBtn');
    if (eb) eb.onclick = ev => { ev.stopPropagation(); renameChapter(state.manga, c.num); };
    const db = row.querySelector('.delBtn');
    if (db) db.onclick = ev => { ev.stopPropagation(); hideChapter(state.manga, c.num, true); };
    row.onclick = () => openChapter(c.num);
    list.appendChild(row);
  }
}

/* ---------- red ---------- */
async function fetchBlob(u){
  try {
    const r = await fetch(u, {referrerPolicy:'no-referrer'});
    if (r.ok){ const b = await r.blob(); if (b && b.size > 1000) return b; }
  } catch(e){}
  const r2 = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(u));
  if (!r2.ok) throw new Error('No se pudo descargar la imagen');
  const b2 = await r2.blob();
  if (!b2 || b2.size < 1000) throw new Error('Imagen vacía');
  return b2;
}

/* ---------- corte de tiras largas (determinista) ---------- */
async function stripRowFeats(bmp){
  const H = bmp.height, SW = 90;
  const c = document.createElement('canvas'); c.width = SW; c.height = H;
  const ctx = c.getContext('2d', {willReadFrequently:true});
  ctx.drawImage(bmp, 0, 0, SW, H);
  const px = ctx.getImageData(0, 0, SW, H).data;
  const rows = [];
  for (let y = 0; y < H; y++){
    let w = 0, d = 0;
    for (let x = 0; x < SW; x++){
      const i = (y * SW + x) * 4, j = (Math.min(H - 1, y + 2) * SW + x) * 4;
      if (px[i] > 242 && px[i+1] > 242 && px[i+2] > 242) w++;
      d += Math.abs(px[i]-px[j]) + Math.abs(px[i+1]-px[j+1]) + Math.abs(px[i+2]-px[j+2]);
    }
    rows.push({w:w/SW, d:d/SW});
  }
  return rows;
}
function solveStripDP(rows, H, P, LO, HI){
  const sm = rows.map((r, y)=>{
    let s = 0, n = 0;
    for (let k = -3; k <= 3; k++){ const yy = y+k; if (yy >= 0 && yy < rows.length){ s += rows[yy].d; n++; } }
    return s/n;
  });
  const cands = [];
  for (let y = 4; y < H-4; y++){
    const isPeak = sm[y] >= sm[y-1] && sm[y] >= sm[y+1] && sm[y] > sm[y-4]*1.12 && sm[y] > sm[y+4]*1.12;
    if (rows[y].w >= 0.8 || (isPeak && sm[y] > 40)) cands.push(y);
  }
  const thin = [];
  for (let y = 0; y < H; y += 30){
    let bi = -1, bv = -1;
    for (let k = y; k < Math.min(y+30, H); k++){
      if (cands.indexOf(k) === -1) continue;
      const v = rows[k].w >= 0.8 ? 1000 + rows[k].w : sm[k];
      if (v > bv){ bv = v; bi = k; }
    }
    if (bi >= 0) thin.push(bi);
  }
  const N = thin.length, INF = 1e12;
  const pos = i => i === -1 ? 0 : (i === N ? H : thin[i]);
  const dp = new Array(N+1).fill(INF), par = new Array(N+1).fill(-2);
  const get = i => i === -1 ? 0 : dp[i];
  for (let i = 0; i <= N; i++){
    let best = INF, bj = -2;
    for (let j = -1; j < i; j++){
      const len = pos(i) - pos(j);
      if (len < LO || len > HI) continue;
      const v = get(j) + Math.abs(len - P) * 0.4;
      if (v < best){ best = v; bj = j; }
    }
    dp[i] = best; par[i] = bj;
  }
  if (dp[N] >= INF/2) return null;
  const cuts = [];
  let cur = N;
  while (cur !== -1 && cur !== -2){ if (cur !== N) cuts.unshift(thin[cur]); cur = par[cur]; }
  return {cuts, cost:dp[N]};
}
async function splitStripBlob(blobs){
  const infos = [];
  for (const b of blobs){
    let bmp = null;
    try { bmp = await createImageBitmap(b); } catch(e){}
    let rows = null;
    try { rows = bmp ? await stripRowFeats(bmp) : null; } catch(e){}
    infos.push({b, bmp, rows});
  }
  const strips = infos.filter(x => x.bmp && x.rows && x.bmp.height > x.bmp.width * 2.2);
  if (!strips.length){
    for (const x of infos){ try { x.bmp && x.bmp.close(); } catch(e){} }
    return blobs;
  }
  let bestP = 1450, best = Infinity;
  for (let P = 1000; P <= 1650; P += 50){
    let tot = 0, ok = true;
    for (const s of strips){
      const r = solveStripDP(s.rows, s.bmp.height, P, 700, 2000);
      if (!r){ ok = false; break; }
      tot += r.cost;
    }
    if (ok && tot < best){ best = tot; bestP = P; }
  }
  const pages = [];
  for (const x of infos){
    if (!x.bmp){ pages.push(x.b); continue; }
    if (!x.rows || x.bmp.height <= x.bmp.width * 2.2){ pages.push(x.b); try { x.bmp.close(); } catch(e){} continue; }
    const r = solveStripDP(x.rows, x.bmp.height, bestP, 700, 2000);
    if (!r){ pages.push(x.b); try { x.bmp.close(); } catch(e){} continue; }
    const bounds = [0].concat(r.cuts).concat([x.bmp.height]);
    let okCut = bounds.length >= 3;
    for (let k = 1; okCut && k < bounds.length; k++){
      const len = bounds[k] - bounds[k-1];
      if (len < 600 || len > 2100) okCut = false;
    }
    if (!okCut){ pages.push(x.b); try { x.bmp.close(); } catch(e){} continue; }
    for (let k = 1; k < bounds.length; k++){
      const y0 = bounds[k-1], hh = bounds[k] - y0;
      const cc = document.createElement('canvas'); cc.width = x.bmp.width; cc.height = hh;
      cc.getContext('2d').drawImage(x.bmp, 0, y0, x.bmp.width, hh, 0, 0, x.bmp.width, hh);
      const pb = await new Promise(res => cc.toBlob(res, 'image/jpeg', 0.88));
      if (!pb){ okCut = false; break; }
      pages.push(pb);
    }
    if (!okCut) pages.push(x.b);
    try { x.bmp.close(); } catch(e){}
  }
  return pages;
}

/* ---------- capítulo ---------- */
async function openChapter(num, opts){
  opts = opts || {};
  const ch = curManga().chapters.find(c => c.num === num);
  if (!ch) return;
  stopAll();
  state.chap = ch; state.pages = []; state.pageIndex = 0;
  state.voiceMode = !!(opts.autoplay || opts.voice);
  show('reader');
  $('#trans').innerHTML = '';
  $('#sheets').innerHTML = '';
  $('#thumbs').innerHTML = '';
  $('#stage').classList.toggle('spread', state.readMode === 'pages' && state.spread);
  $('#stage').classList.toggle('pages', state.readMode === 'pages');
  $('#loader').hidden = false;
  try {
    const n = ch.strips.length;
    const blobs = [];
    for (let i = 0; i < n; i++){
      $('#loadTxt').textContent = 'Descargando imágenes ' + (i+1) + '/' + n + '…';
      blobs.push(await fetchBlob(ch.strips[i]));
    }
    $('#loadTxt').textContent = 'Preparando páginas…';
    await sleep(30);
    const parts = await splitStripBlob(blobs);
    state.pages = parts.map((b, i) => ({
      url: URL.createObjectURL(b),
      lines: ((ch.pages && ch.pages[i]) || []).map(l => Object.assign({}, l)),
    }));
    $('#loader').hidden = true;
    $('#playBtn').hidden = !state.voiceMode;
    if (state.readMode === 'cascade') buildCascade();
    renderThumbs();
    setPage(opts.startPage || 0);
    try { localStorage.setItem('sl-last', String(num)); } catch(e){}
    const r = getReads(); r[readKey(num)] = 1; setReads(r);
    pushHist(); bumpStat(); updateDlBtn();
    if (opts.autoplay) speakFrom(0);
  } catch(e){
    $('#loader').hidden = true;
    $('#status').textContent = 'Error: ' + (e && e.message || e);
  }
}
function goToPage(i){ stopAll(); setPage(i); }
function setPage(i){
  if (!state.pages.length) return;
  if (i < 0) i = 0;
  if (i >= state.pages.length) i = state.pages.length - 1;
  state.pageIndex = i;
  state.lines = state.pages[i].lines || [];
  state.lineIndex = -1;
  $('#pageTag').textContent = (state.chap ? ('Cap. ' + state.chap.num + (state.chap.title ? ' — ' + state.chap.title : '')) : '') +
    ' · Página ' + (i+1) + '/' + state.pages.length;
  if (state.readMode === 'cascade') scrollToSheet(i);
  else { renderStage(); window.scrollTo(0, 0); }
  renderTranscript();
  renderThumbs();
  saveProg();
  syncUrl();
}
function sheetCount(){ return (state.readMode === 'pages' && state.spread) ? 2 : 1; }
function makeSheet(idx, active){
  const p = state.pages[idx];
  const d = document.createElement('div');
  d.className = 'sheet'; d.dataset.i = idx;
  const img = document.createElement('img');
  img.alt = 'Página ' + (idx+1);
  try { img.referrerPolicy = 'no-referrer'; } catch(e){}
  img.draggable = false;
  if (p && p.url) img.src = p.url;
  d.appendChild(img);
  const bx = document.createElement('div');
  bx.className = 'boxes';
  if (state.showBoxes){
    (p.lines || []).forEach((l, i) => {
      if (!l.box || l.box.length !== 4) return;
      const b = document.createElement('div');
      b.className = 'bubble' + (active && i === state.lineIndex ? ' active' : '');
      b.style.left = (l.box[0]*100) + '%';
      b.style.top = (l.box[1]*100) + '%';
      b.style.width = (l.box[2]*100) + '%';
      b.style.height = (l.box[3]*100) + '%';
      bx.appendChild(b);
    });
  }
  d.appendChild(bx);
  return d;
}
function renderStage(){
  const wrap = $('#sheets'); wrap.innerHTML = '';
  const n = sheetCount();
  for (let k = 0; k < n; k++){
    const idx = state.pageIndex + k;
    if (idx >= state.pages.length) break;
    wrap.appendChild(makeSheet(idx, idx === state.pageIndex));
  }
  applyZoom();
}
function buildCascade(){
  const wrap = $('#sheets'); wrap.innerHTML = '';
  state.pages.forEach((p, idx) => wrap.appendChild(makeSheet(idx, idx === state.pageIndex)));
  applyZoom();
}
function scrollToSheet(i){
  renderCascadeActive();
  const el = $('#sheets').children[i];
  if (el && el.scrollIntoView) el.scrollIntoView({block:'start'});
}
function renderCascadeActive(){
  const kids = $('#sheets').children;
  for (let k = 0; k < kids.length; k++){
    const bb = kids[k].querySelectorAll('.bubble');
    const lines = (state.pages[k] && state.pages[k].lines) || [];
    let bi = 0;
    lines.forEach((l, i) => {
      if (!l.box || l.box.length !== 4) return;
      if (bb[bi]) bb[bi].classList.toggle('active', k === state.pageIndex && i === state.lineIndex);
      bi++;
    });
  }
}
function refreshReaderView(){
  if (!state.pages.length) return;
  $('#stage').classList.toggle('spread', state.readMode === 'pages' && state.spread);
  $('#stage').classList.toggle('pages', state.readMode === 'pages');
  if (state.readMode === 'cascade') buildCascade(); else renderStage();
  renderTranscript();
  renderThumbs();
  setPage(state.pageIndex);
}
function applyZoom(){
  const n = sheetCount();
  document.querySelectorAll('#sheets .sheet').forEach(sh => { sh.style.width = (state.zoom*100/n) + '%'; });
  const zv = $('#zoomVal');
  if (zv) zv.textContent = Math.round(state.zoom*100) + '%';
}
function setZoom(z){
  state.zoom = Math.min(3, Math.max(.5, z));
  try { localStorage.setItem('sl-zoom', String(state.zoom)); } catch(e){}
  applyZoom();
}
function saveProg(){
  if (!state.chap) return;
  try {
    const k = readKey(state.chap.num);
    const map = getProgMap();
    map[k] = state.pageIndex;
    localStorage.setItem('sl-progmap', JSON.stringify(map));
    localStorage.setItem('sl-proglast', JSON.stringify({m: state.manga, c: state.chap.num, p: state.pageIndex, t: Date.now()}));
  } catch(e){}
}
function syncUrl(){
  if (!state.chap) return;
  try { history.replaceState(null, '', '?manga=' + state.manga + '&chap=' + state.chap.num + '&page=' + state.pageIndex); } catch(e){}
}
function renderThumbs(){
  const t = $('#thumbs'); t.innerHTML = '';
  state.pages.forEach((p, i) => {
    const im = document.createElement('img');
    im.src = p.url;
    im.className = i === state.pageIndex ? 'active' : '';
    im.onclick = () => goToPage(i);
    t.appendChild(im);
  });
}
function lineText(l){
  if (state.mode === 'original') return l.text || l.translation || '';
  return l.translation || l.text || '';
}
function transLine(l, p, i){
  const d = document.createElement('div');
  d.className = 'line' + (p === state.pageIndex && i === state.lineIndex ? ' active' : '');
  d.dataset.p = p; d.dataset.k = i;
  d.innerHTML = (l.speaker ? '<span class="spk">' + escapeHtml(l.speaker) + '</span>' : '') + escapeHtml(lineText(l));
  d.onclick = () => {
    if (state.readMode === 'cascade' && p !== state.pageIndex) setPage(p);
    if (state.voiceMode) speakFrom(i);
  };
  return d;
}
function renderTranscript(){
  const t = $('#trans'); t.innerHTML = '';
  if (!isAdmin()){ t.hidden = true; $('#status').textContent = ''; return; }
  t.hidden = false;
  if (state.readMode === 'cascade'){
    let total = 0;
    state.pages.forEach((pg, p) => {
      if (!pg.lines || !pg.lines.length) return;
      const h = document.createElement('div');
      h.className = 'pgTag'; h.textContent = 'Página ' + (p+1);
      t.appendChild(h);
      pg.lines.forEach((l, i) => { t.appendChild(transLine(l, p, i)); total++; });
    });
    $('#status').textContent = total ? (total + ' líneas') : 'Este capítulo no tiene diálogo.';
  } else {
    state.lines.forEach((l, i) => t.appendChild(transLine(l, state.pageIndex, i)));
    $('#status').textContent = state.lines.length ? (state.lines.length + ' líneas') : 'Esta página no tiene diálogo.';
  }
}
function setActive(i){
  state.lineIndex = i;
  document.querySelectorAll('#trans .line').forEach(el => {
    el.classList.toggle('active', +el.dataset.p === state.pageIndex && +el.dataset.k === i);
  });
  if (state.readMode === 'cascade'){
    renderCascadeActive();
  } else {
    const sh = $('#sheets').children[0];
    if (sh){
      const bb = sh.querySelectorAll('.bubble');
      let bi = 0;
      state.lines.forEach((l, idx) => {
        if (!l.box || l.box.length !== 4) return;
        if (bb[bi]) bb[bi].classList.toggle('active', idx === i);
        bi++;
      });
    }
  }
  const act = document.querySelector('#trans .line.active');
  if (act && act.scrollIntoView) act.scrollIntoView({block:'nearest', behavior:'smooth'});
}

/* ---------- voz (del propio dispositivo) ---------- */
function pickVoice(){
  try {
    const vs = speechSynthesis.getVoices() || [];
    const es = vs.filter(v => /^es/i.test(v.lang || ''));
    if (es.length) return es[0];
    return vs[0] || null;
  } catch(e){ return null; }
}
if ('speechSynthesis' in window){
  try {
    speechSynthesis.onvoiceschanged = () => { state.voice = pickVoice(); };
    state.voice = pickVoice();
  } catch(e){}
}
function speakText(text){
  return new Promise(resolve => {
    if (!('speechSynthesis' in window)){ resolve(); return; }
    try { speechSynthesis.cancel(); } catch(e){}
    const u = new SpeechSynthesisUtterance(text);
    if (state.voice) u.voice = state.voice;
    u.lang = (state.voice && state.voice.lang) || 'es-ES';
    u.rate = state.rate || 1;
    let done = false;
    const fin = () => { if (!done){ done = true; resolve(); } };
    u.onend = fin; u.onerror = fin;
    setTimeout(fin, Math.max(4000, text.length * 350));
    try { speechSynthesis.resume(); } catch(e){}
    try { speechSynthesis.speak(u); } catch(e){ fin(); }
  });
}
function stopAll(){
  state.gen++;
  state.playing = false;
  try { if ('speechSynthesis' in window) speechSynthesis.cancel(); } catch(e){}
  $('#playBtn').textContent = '▶ Escuchar';
}
async function speakFrom(i){
  if (!state.voiceMode) return;
  const gen = ++state.gen;
  stopAll(); state.gen = gen;
  if (!('speechSynthesis' in window)){
    $('#status').textContent = 'Tu navegador no tiene voz incorporada. Prueba con Chrome o Edge.';
    return;
  }
  try { speechSynthesis.cancel(); } catch(e){}
  try { speechSynthesis.resume(); } catch(e){}
  state.voice = pickVoice();
  if (!state.voice){
    try {
      await new Promise(r=>{
        let done = false;
        const fin = ()=>{ if(!done){ done=true; r(); } };
        speechSynthesis.onvoiceschanged = ()=>{ state.voice = pickVoice(); fin(); };
        setTimeout(fin, 1500);
      });
    } catch(e){}
  }
  state.playing = true;
  $('#playBtn').textContent = '⏸ Detener';
  let k = (typeof i === 'number' && i >= 0) ? i : 0;
  while (state.gen === gen && state.playing){
    const lines = state.lines;
    if (k >= lines.length){
      if (state.autoTurn && state.pageIndex < state.pages.length - 1){
        const waitMs = Math.max(0, state.autoDelay * 1000);
        for (let t = 0; t*100 < waitMs; t++){
          await sleep(100);
          if (state.gen !== gen || !state.playing) break;
        }
        if (state.gen !== gen || !state.playing) break;
        setPage(state.pageIndex + 1);
        k = 0;
        continue;
      }
      $('#status').textContent = state.autoTurn ? 'Fin del capítulo.' : 'Fin de la página.';
      break;
    }
    setActive(k);
    const t = lineText(lines[k]);
    if (t && t.trim()) await speakText(t);
    if (state.gen !== gen || !state.playing) break;
    k++;
    await sleep(250);
  }
  if (state.gen === gen){
    state.playing = false;
    $('#playBtn').textContent = '▶ Escuchar';
  }
}

/* ---------- modo administrador (solo este dispositivo) ---------- */
function getOv(){ try { return JSON.parse(localStorage.getItem('sl-admin-ov') || '{}') || {}; } catch(e){ return {}; } }
function saveOv(o){ try { localStorage.setItem('sl-admin-ov', JSON.stringify(o)); } catch(e){ toast('No se pudo guardar'); } }
function isAdmin(){ try { return sessionStorage.getItem('sl-admin') === '1'; } catch(e){ return false; } }
async function sha256hex(s){
  const h = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function lockLeft(){
  try {
    const t = parseInt(localStorage.getItem('sl-admin-lock') || '0', 10);
    return Math.max(0, t - Date.now());
  } catch(e){ return 0; }
}
async function tryLogin(){
  const left = lockLeft();
  if (left > 0){ toast('Bloqueado. Espera ' + Math.ceil(left/1000) + ' s'); return; }
  const pw = $('#adminPass').value || '';
  const user = ($('#adminUser').value || '').trim();
  let n = 0;
  try { n = parseInt(sessionStorage.getItem('sl-admin-n') || '0', 10); } catch(e){}
  let hex = '';
  try { hex = await sha256hex(pw); } catch(e){}
  if (hex && user === 'admin' && hex === ADMIN_HASH){
    try { sessionStorage.setItem('sl-admin', '1'); sessionStorage.setItem('sl-admin-n', '0'); } catch(e){}
    $('#adminPass').value = '';
    $('#loginModal').hidden = true;
    updateAdminBtn();
    openAdminPanel();
    if (state.pages.length) renderTranscript();
    toast('Sesión de administrador');
  } else {
    n++;
    try { sessionStorage.setItem('sl-admin-n', String(n)); } catch(e){}
    if (n >= 5){
      try { localStorage.setItem('sl-admin-lock', String(Date.now() + 60000)); sessionStorage.setItem('sl-admin-n', '0'); } catch(e){}
      toast('Demasiados intentos. Bloqueado 1 minuto.');
    } else toast('Contraseña incorrecta (' + n + '/5)');
  }
}
function updateAdminBtn(){ $('#adminBtn').textContent = isAdmin() ? '🔓' : '🔒'; $('#newMangaBtn').hidden = !isAdmin(); }
function openAdminPanel(){
  if (!isAdmin()){ $('#loginModal').hidden = false; setTimeout(()=>{ try{$('#adminPass').focus();}catch(e){} }, 50); return; }
  renderAdminList();
  renderAdminStats();
  $('#adminModal').hidden = false;
}
function renderAdminList(){
  const ov = getOv();
  const box = $('#admList'); box.innerHTML = '';
  const mid = parseInt($('#admManga').value || '0', 10);
  const nums = mangaList()[mid].chapters.map(c=>c.num);
  const allNums = {};
  for (const n of nums.concat((ov.added||[]).filter(a=>a.manga===mid).map(a=>a.num))) allNums[n] = true;
  Object.keys(allNums).map(Number).sort((a,b)=>b-a).forEach(num => {
    const hid = !!((ov.hidden||{})[mid] || {})[num];
    const baseList = baseChapters(mid);
    const base = baseList.find(c=>c.num===num);
    const add = (ov.added||[]).find(a=>a.manga===mid && a.num===num);
    const row = document.createElement('div');
    row.className = 'admRow';
    row.innerHTML = '<div class="t"><b>Cap. ' + num + '</b> ' + escapeHtml((add && add.title) || (((ov.titles||{})[mid]||{})[num]) || (base && base.title) || '') + (add ? ' <span class="pill">añadido aquí</span>' : '') + (hid ? ' <span class="pill">oculto</span>' : '') + '</div>';
    const mkBtn = (txt, fn) => { const b = document.createElement('button'); b.className = 'smallBtn'; b.textContent = txt; b.onclick = fn; row.appendChild(b); };
    mkBtn(hid ? 'Mostrar' : 'Ocultar', () => {
      const o = getOv(); o.hidden = o.hidden || {}; o.hidden[mid] = o.hidden[mid] || {};
      if (hid) delete o.hidden[mid][num]; else o.hidden[mid][num] = 1;
      saveOv(o); renderAdminList(); openDetailRefresh();
    });
    mkBtn('Título', () => renameChapter(mid, num));
    box.appendChild(row);
  });
}
function openDetailRefresh(){ if (!$('#detailView').hidden) openDetail(); else { renderCards(($('#catSearch') && $('#catSearch').value) || ''); } }
function renameChapter(mid, num){
  const ov = getOv();
  const baseList = baseChapters(mid);
  const base = baseList.find(c=>c.num===num);
  const add = (ov.added||[]).find(a=>a.manga===mid && a.num===num);
  const cur = (((ov.titles||{})[mid]||{})[num]) || (base && base.title) || (add && add.title) || '';
  const t = prompt('Título del capítulo ' + num + ':', cur || '');
  if (t === null) return;
  if (add){ add.title = t; }
  else { ov.titles = ov.titles || {}; ov.titles[mid] = ov.titles[mid] || {}; if (t) ov.titles[mid][num] = t; else delete ov.titles[mid][num]; }
  saveOv(ov);
  renderChapList();
  if (!$('#adminModal').hidden) renderAdminList();
  toast('Título actualizado');
}
function hideChapter(mid, num, hide){
  const o = getOv(); o.hidden = o.hidden || {}; o.hidden[mid] = o.hidden[mid] || {};
  if (hide) o.hidden[mid][num] = 1; else delete o.hidden[mid][num];
  saveOv(o);
  renderChapList();
  if (!$('#adminModal').hidden) renderAdminList();
  toast(hide ? 'Capítulo oculto' : 'Capítulo visible');
}
const PAGE_JUNK_RE2 = /logo|icon|avatar|banner|advert|\/ads[\/\.]|favicon|sprite|badge|emoji|\.svg(\?|$)/i;
async function stripsFromViewer(pageUrl){
  async function getText(u){
    try { const r = await fetch(u, {referrerPolicy:'no-referrer'}); if (r.ok) return await r.text(); } catch(e){}
    try { const r2 = await fetch('https://api.allorigins.win/raw?url=' + encodeURIComponent(u)); if (r2.ok) return await r2.text(); } catch(e){}
    return null;
  }
  let html = await getText(pageUrl);
  if (!html) html = await getText('https://api.allorigins.win/raw?url=' + encodeURIComponent(pageUrl));
  if (!html) throw new Error('No se pudo leer el enlace');
  const seen = new Set(), out = [];
  const push = u => {
    if (!u || out.length >= 80) return;
    u = u.trim();
    if (/^data:/i.test(u) || u.length > 2000) return;
    let abs;
    try { abs = new URL(u, pageUrl).href; } catch(e){ return; }
    if (!/^https?:\/\//i.test(abs)) return;
    const path = abs.split(/[?#]/)[0];
    if (!/\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(path)) return;
    if (PAGE_JUNK_RE2.test(path)) return;
    const k = abs.toLowerCase();
    if (seen.has(k)) return;
    seen.add(k);
    out.push(abs);
  };
  const imgRe = /<img\b[^>]*>/gi;
  let m;
  while ((m = imgRe.exec(html))){
    const tag = m[0];
    const ds = /(?:data-src|data-lazy|data-original)\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (ds){ push(ds[1]); continue; }
    const s = /src\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (s) push(s[1]);
  }
  if (!out.length) throw new Error('No se encontraron imágenes en ese enlace');
  return out;
}
async function adminAddChapter(){
  const mid = parseInt($('#admManga').value || '0', 10);
  const raw = ($('#admUrl').value || '').trim();
  const title = ($('#admTitle').value || '').trim();
  if (!raw){ toast('Pega el enlace o las imágenes'); return; }
  toast('Leyendo…');
  try {
    let strips = [];
    const direct = raw.match(/https?:\/\/[^\s<>"']+/gi) || [];
    const isViewer = direct.length === 1 && /zonatmo\.org\/view_uploads\//i.test(direct[0]);
    if (isViewer){
      try { strips = await stripsFromViewer(direct[0]); }
      catch(e){
        toast('Enlace protegido: añade ese capítulo desde tu lector original');
        return;
      }
    } else {
      strips = direct.filter(u => /\.(png|jpe?g|webp|gif|bmp|avif)(\?|#|$)/i.test(u.split(/[?#]/)[0]) || /zonatmo/i.test(u));
      if (!strips.length) throw new Error('No hay enlaces de imagen válidos');
    }
    const ov = getOv();
    const nums = mangaList()[mid].chapters.map(c=>c.num);
    const next = Math.max.apply(null, [0].concat(nums)) + 1;
    ov.added = ov.added || [];
    ov.added.push({manga:mid, num:next, title:title || ('Cap. ' + next), date:new Date().toISOString().slice(0,10), strips});
    saveOv(ov);
    $('#admUrl').value = ''; $('#admTitle').value = '';
    renderAdminList(); openDetailRefresh();
    toast('Capítulo ' + next + ' añadido (sin diálogo: se lee sin voz)');
  } catch(e){ toast('Error: ' + (e && e.message || e)); }
}
function adminExport(){
  const ov = getOv();
  const blob = new Blob([JSON.stringify(ov, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cambios-admin.json';
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  toast('Archivo descargado. Envíamelo para publicarlo para todos.');
}

/* ---------- controles ---------- */
const heroExplore = $('#heroExploreBtn');
if (heroExplore) heroExplore.onclick = () => { $('#catSearch').focus(); $('#catSearch').scrollIntoView({behavior:'smooth', block:'center'}); };
const heroCommunity = $('#heroCommunityBtn');
if (heroCommunity) heroCommunity.onclick = () => $('#tabCom').click();

$('#brandHome').onclick = $('#tabLib').onclick = () => {
  stopAll();
  for (const p of state.pages){ try { URL.revokeObjectURL(p.url); } catch(e){} }
  state.pages = []; state.chap = null;
  renderCont(); renderHist();
  show('home');
};
$('#tabLists').onclick = () => { stopAll(); renderLists(); show('lists'); };
$('#tabCom').onclick = () => { stopAll(); renderCom(); show('com'); loadUtter(); };
$('#tabNews').onclick = () => { stopAll(); show('news'); loadNews(); };
$('#backBtn').onclick = () => {
  stopAll();
  for (const p of state.pages){ try { URL.revokeObjectURL(p.url); } catch(e){} }
  state.pages = []; state.chap = null;
  openDetail();
};
$('#prevBtn').onclick = () => goToPage(state.pageIndex - 1);
$('#nextBtn').onclick = () => goToPage(state.pageIndex + 1);
$('#prevChapBtn').onclick = () => stepChapter(-1);
$('#nextChapBtn').onclick = () => stepChapter(1);
$('#playBtn').onclick = () => {
  if (!state.voiceMode) return;
  if (state.playing){ stopAll(); setActive(-1); renderTranscript(); return; }
  speakFrom(state.lineIndex >= 0 ? state.lineIndex : 0);
};
$('#modeSel').onchange = e => {
  state.mode = e.target.value;
  try { localStorage.setItem('sl-mode', state.mode); } catch(err){}
  renderTranscript();
};
$('#rateSel').onchange = e => {
  state.rate = parseFloat(e.target.value) || 1;
  try { localStorage.setItem('sl-rate', String(state.rate)); } catch(err){}
};
$('#boxBtn').onclick = () => { state.showBoxes = !state.showBoxes; refreshReaderView(); };
$('#favBtn').onclick = () => {
  const f = getFavs();
  const i = f.indexOf(state.manga);
  if (i >= 0) f.splice(i, 1); else f.push(state.manga);
  setFavs(f);
  $('#favBtn').textContent = i >= 0 ? '🤍' : '❤️';
  renderCards($('#catSearch').value);
};
$('#sortBtn').onclick = () => {
  state.sortAsc = !state.sortAsc;
  try { localStorage.setItem('sl-sort', state.sortAsc ? 'asc' : 'desc'); } catch(e){}
  $('#sortBtn').textContent = state.sortAsc ? '↑ Antiguos' : '↓ Nuevos';
  renderChapList();
};
$('#markAllBtn').onclick = () => {
  const r = getReads(), chaps = curManga().chapters;
  for (const c of chaps) r[state.manga + ':' + c.num] = 1;
  setReads(r);
  renderChapList();
};
$('#unmarkAllBtn').onclick = () => {
  const r = getReads(), chaps = curManga().chapters;
  for (const c of chaps) delete r[state.manga + ':' + c.num];
  setReads(r);
  renderChapList();
};
$('#fsBtn').onclick = async () => {
  try {
    if (document.fullscreenElement){ await document.exitFullscreen(); return; }
    const el = $('#readerView');
    if (el.requestFullscreen) await el.requestFullscreen();
  } catch(e){}
};
function stepChapter(d){
  if (!state.chap) return;
  const chaps = curManga().chapters.slice().sort((a,b)=>a.num - b.num);
  const i = chaps.findIndex(c=>c.num === state.chap.num);
  const n = chaps[i + d];
  if (n) openChapter(n.num, {autoplay: state.playing});
  else toast(d > 0 ? 'Último capítulo' : 'Primer capítulo');
}
document.addEventListener('keydown', e => {
  if (!$('#setModal').hidden){ if (e.key === 'Escape') $('#setModal').hidden = true; return; }
  if ($('#readerView').hidden) return;
  if (e.key === 'ArrowLeft') goToPage(state.pageIndex - 1);
  else if (e.key === 'ArrowRight') goToPage(state.pageIndex + 1);
  else if (e.key === 'PageUp'){ e.preventDefault(); goToPage(state.pageIndex - 1); }
  else if (e.key === 'PageDown'){ e.preventDefault(); goToPage(state.pageIndex + 1); }
  else if (e.key === ' '){ e.preventDefault(); $('#playBtn').click(); }
  else if (e.key === 'f' || e.key === 'F'){ $('#fsBtn').click(); }
  else if (e.key === 'a' || e.key === 'A'){ stepChapter(-1); }
  else if (e.key === 'd' || e.key === 'D'){ stepChapter(1); }
});

$('#adminBtn').onclick = () => { if (isAdmin()) openAdminPanel(); else { $('#loginModal').hidden = false; setTimeout(()=>{ try{$('#adminPass').focus();}catch(e){} }, 50); } };
$('#loginCancel').onclick = () => { $('#loginModal').hidden = true; $('#adminPass').value = ''; };
$('#loginGo').onclick = tryLogin;
$('#adminPass').onkeydown = e => { if (e.key === 'Enter') tryLogin(); };
$('#admAdd').onclick = adminAddChapter;
$('#admExport').onclick = adminExport;
$('#admClose').onclick = () => { $('#adminModal').hidden = true; openDetailRefresh(); };
$('#admLogout').onclick = () => { try { sessionStorage.removeItem('sl-admin'); } catch(e){} $('#adminModal').hidden = true; updateAdminBtn(); openDetailRefresh(); if (state.pages.length) renderTranscript(); toast('Sesión cerrada'); };
$('#admManga').onchange = renderAdminList;
function buildSidePicker(){
  const im = $('#rsSideImgs'); im.innerHTML = '';
  SIDE_IMGS.forEach(u => {
    const g = document.createElement('img');
    g.src = u; g.dataset.u = u;
    g.style.cssText = 'width:64px;height:96px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid var(--line)';
    g.onclick = () => { setSide({t:'img', v:u}); applySideBg(); };
    im.appendChild(g);
  });
  const co = $('#rsSideCols'); co.innerHTML = '';
  SIDE_COLORS.forEach(c => {
    const b = document.createElement('button');
    b.className = 'bgDot'; b.dataset.c = c; b.title = c;
    b.style.cssText = 'width:34px;height:34px;border-radius:50%;background:' + c + ';border:2px solid #555';
    b.onclick = () => { setSide({t:'color', v:c}); applySideBg(); };
    co.appendChild(b);
  });
}
function downscaleSide(file){
  return new Promise(resolve => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, 700 / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * s));
      c.height = Math.max(1, Math.round(img.naturalHeight * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.72));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}
$('#setBtn').onclick = () => { applyReadPrefs(); applySideBg(); $('#setModal').hidden = false; };
$('#setClose').onclick = () => { $('#setModal').hidden = true; };
document.querySelectorAll('#rsWidthRow button').forEach(b=>{ b.onclick = ()=>{
  state.readWidth = b.dataset.w;
  try { localStorage.setItem('sl-width', state.readWidth); } catch(e){}
  applyReadPrefs();
};});
document.querySelectorAll('#rsBgRow .bgDot').forEach(b=>{ b.onclick = ()=>{
  state.readBg = b.dataset.b;
  try { localStorage.setItem('sl-bg', state.readBg); } catch(e){}
  applyReadPrefs();
};});
$('#rsSpeed').oninput = ()=>{
  state.autoDelay = parseFloat($('#rsSpeed').value) || 4;
  try { localStorage.setItem('sl-delay', String(state.autoDelay)); } catch(e){}
  $('#rsSpeedVal').textContent = state.autoDelay + ' s';
};
document.querySelectorAll('#rsAutoRow button').forEach(b=>{ b.onclick = ()=>{
  state.autoTurn = b.dataset.a === 'si';
  try { localStorage.setItem('sl-autoturn', state.autoTurn ? 'si' : 'no'); } catch(e){}
  applyReadPrefs();
  toast(state.autoTurn ? 'Pasará páginas solo' : 'Se detendrá en cada página');
};});
  document.querySelectorAll('#rsModeRow button').forEach(b=>{ b.onclick = ()=>{
  state.readMode = b.dataset.m;
  try { localStorage.setItem('sl-readmode', state.readMode); } catch(e){}
  applyReadPrefs(); refreshReaderView();
};});
document.querySelectorAll('#rsSpreadRow button').forEach(b=>{ b.onclick = ()=>{
  state.spread = b.dataset.s === 'si';
  try { localStorage.setItem('sl-spread', state.spread ? 'si' : 'no'); } catch(e){}
  applyReadPrefs(); refreshReaderView();
};});
$('#zoomIn').onclick = () => setZoom(state.zoom + .25);
$('#zoomOut').onclick = () => setZoom(state.zoom - .25);
$('#rsGc').onchange = e => { try { localStorage.setItem('sl-gc', e.target.value.trim()); } catch(_){} loadGc(); toast('Contador actualizado'); };
$('#rsSideNone').onclick = () => { setSide({t:'none'}); applySideBg(); };
$('#rsSideUp').onclick = () => $('#rsSideFile').click();
$('#rsSideFile').onchange = async e => {
  const f = e.target.files && e.target.files[0];
  e.target.value = '';
  if (!f) return;
  const du = await downscaleSide(f);
  if (!du){ toast('No se pudo leer la imagen'); return; }
  try {
    setSide({t:'img', v:du});
  } catch(err){}
  applySideBg();
  toast('Fondo aplicado en este dispositivo');
};
/* ---------- lectura: gestos, compartir, offline ---------- */
(function initStageTouch(){
  const st = $('#stage');
  let pinchD0 = 0, pinchZ0 = 1, sx = null, sy = null;
  st.addEventListener('touchstart', e => {
    if (e.touches.length === 2){ const a=e.touches[0],b=e.touches[1]; pinchD0 = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); pinchZ0 = state.zoom; }
    else if (e.touches.length === 1){ sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
  }, {passive:true});
  st.addEventListener('touchmove', e => {
    if (e.touches.length === 2 && state.readMode === 'pages'){
      e.preventDefault();
      const a=e.touches[0],b=e.touches[1];
      const d = Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY);
      if (pinchD0 > 0) setZoom(pinchZ0 * d / pinchD0);
    }
  }, {passive:false});
  st.addEventListener('touchend', e => {
    if (sx !== null && e.changedTouches.length && state.readMode === 'pages'){
      const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)*1.5) goToPage(state.pageIndex + (dx < 0 ? 1 : -1));
    }
    sx = null;
    if (e.touches.length < 2) pinchD0 = 0;
  }, {passive:true});
})();
$('#shareBtn').onclick = async () => {
  const url = location.href;
  try { await navigator.clipboard.writeText(url); toast('Enlace copiado'); }
  catch(e){ try { prompt('Copia el enlace:', url); } catch(_){} }
};
async function updateDlBtn(){
  const b = $('#dlBtn');
  if (!b) return;
  b.textContent = '⬇';
  if (!state.chap || !('caches' in window)) return;
  try {
    const c = await caches.open('ailector-ch');
    const u = state.chap.strips && state.chap.strips[0];
    if (u && await c.match(u)) b.textContent = '✓';
  } catch(e){}
}
$('#dlBtn').onclick = async () => {
  if (!state.chap){ return; }
  if (!('caches' in window)){ toast('Tu navegador no soporta offline'); return; }
  const strips = state.chap.strips || [];
  if (!strips.length){ toast('Nada que descargar'); return; }
  toast('Descargando ' + strips.length + ' imágenes…');
  try {
    const c = await caches.open('ailector-ch');
    let ok = 0;
    for (const u of strips){
      try { const r = await fetch(u, {referrerPolicy:'no-referrer'}); if (r.ok){ await c.put(u, r); ok++; } } catch(e){}
    }
    updateDlBtn();
    toast(ok === strips.length ? 'Capítulo disponible sin conexión' : 'Guardadas ' + ok + '/' + strips.length);
  } catch(e){ toast('Error al descargar'); }
};
/* ---------- estadísticas ---------- */
function bumpVisit(){ try { const s = JSON.parse(localStorage.getItem('sl-stats') || '{"visits":0,"opens":{}}'); s.visits = (s.visits||0)+1; localStorage.setItem('sl-stats', JSON.stringify(s)); } catch(e){} }
function bumpStat(){
  if (!state.chap) return;
  try {
    const s = JSON.parse(localStorage.getItem('sl-stats') || '{"visits":0,"opens":{}}');
    s.opens = s.opens || {};
    const k = state.manga + ':' + state.chap.num;
    s.opens[k] = (s.opens[k]||0)+1;
    localStorage.setItem('sl-stats', JSON.stringify(s));
  } catch(e){}
  gcCount('/m' + state.manga + '/c' + state.chap.num);
}
function renderAdminStats(){
  const box = $('#admStats');
  if (!box) return;
  let s = {visits:0, opens:{}};
  try { s = JSON.parse(localStorage.getItem('sl-stats') || '{"visits":0,"opens":{}}'); } catch(e){}
  const ml = mangaList();
  const top = Object.keys(s.opens||{}).sort((a,b)=>s.opens[b]-s.opens[a]).slice(0,5);
  box.innerHTML = '<div>👁 Visitas: <b>' + (s.visits||0) + '</b></div>' +
    (top.length ? top.map(k => {
      const parts = k.split(':');
      const t = ml[+parts[0]] ? ml[+parts[0]].title : ('Manga ' + parts[0]);
      return '<div>📖 ' + escapeHtml(t) + ' Cap. ' + parts[1] + ': <b>' + s.opens[k] + '</b></div>';
    }).join('') : '<div style="color:var(--dim)">Aún sin lecturas.</div>');
}
/* ---------- goatcounter opcional ---------- */
function gcCode(){ try { return localStorage.getItem('sl-gc') || ''; } catch(e){ return ''; } }
function loadGc(){
  try { document.querySelectorAll('script[data-gc]').forEach(x=>x.remove()); } catch(e){}
  const code = gcCode();
  if (!code || !/^[\w-]+$/.test(code)) return;
  const sc = document.createElement('script');
  sc.dataset.gc = '1';
  sc.async = true;
  sc.setAttribute('data-goatcounter', 'https://' + code + '.goatcounter.com/count');
  sc.src = '//' + code + '.goatcounter.com/count.js';
  document.head.appendChild(sc);
}
function gcCount(path){
  try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({path: path}); } catch(e){}
}
/* ---------- publicar en github ---------- */
async function ghPut(path, text, msg){
  const repo = ($('#ghRepo').value || '').trim();
  const tok = ($('#ghToken').value || '').trim();
  if (!repo.includes('/') || !tok){ toast('Pon repo y token'); return; }
  toast('Publicando ' + path + '…');
  try {
    const api = 'https://api.github.com/repos/' + repo + '/contents/' + path;
    const head = {Authorization: 'Bearer ' + tok, Accept: 'application/vnd.github+json'};
    let sha = null;
    for (const br of ['main', 'master']){
      try {
        const g = await fetch(api + '?ref=' + br, {headers: head});
        if (g.ok){ sha = (await g.json()).sha; break; }
      } catch(e){}
    }
    const b64 = btoa(unescape(encodeURIComponent(text)));
    const body = {message: msg, content: b64, branch: 'main'};
    if (sha) body.sha = sha;
    const p = await fetch(api, {method:'PUT', headers: Object.assign({'Content-Type':'application/json'}, head), body: JSON.stringify(body)});
    if (!p.ok){ const t = await p.text(); throw new Error('HTTP ' + p.status + ' ' + t.slice(0,120)); }
    toast('✅ Publicado ' + path);
  } catch(e){ toast('Error: ' + (e.message || e)); }
}
function buildDataJs(){
  const ch = CHAPTERS.map(c => Object.assign({}, c));
  const chVida = (typeof CHAPTERS_VIDA !== 'undefined' ? CHAPTERS_VIDA : []).map(c => Object.assign({}, c));
  const chOver = (typeof CHAPTERS_OVERLORD !== 'undefined' ? CHAPTERS_OVERLORD : []).map(c => Object.assign({}, c));
  for (const a of (getOv().added || [])){
    if (a.manga === 0 && !ch.some(c => c.num === a.num))
      ch.push({num:a.num, title:a.title, date:a.date, strips:a.strips, stripCount:a.strips.length, pages:null});
    if (a.manga === 2 && !chOver.some(c => c.num === a.num))
      chOver.push({num:a.num, title:a.title, date:a.date, strips:a.strips, stripCount:a.strips.length, pages:null});
    if (a.manga === 1 && !chVida.some(c => c.num === a.num))
      chVida.push({num:a.num, title:a.title, date:a.date, strips:a.strips, stripCount:a.strips.length, pages:null});
  }
  ch.sort((a,b)=>a.num-b.num);
  chVida.sort((a,b)=>a.num-b.num);
  chOver.sort((a,b)=>a.num-b.num);
  return '// Generado por AILector (admin)\nconst MANGA = ' + JSON.stringify(MANGA) + ';\nconst CHAPTERS = ' + JSON.stringify(ch) + ';\nconst CHAPTERS_VIDA = ' + JSON.stringify(chVida) + ';\nconst CHAPTERS_OVERLORD = ' + JSON.stringify(chOver) + ';\n';
}
$('#ghPubData').onclick = () => ghPut('data.js', buildDataJs(), 'Actualizar capítulos desde AILector');
$('#ghPubIndex').onclick = async () => {
  try {
    const t = await fetch(location.href.split('?')[0]).then(r => { if (!r.ok) throw 0; return r.text(); });
    ghPut('index.html', t, 'Actualizar lector desde AILector');
  } catch(e){ toast('Abre la página por http(s) para publicar el index'); }
};
/* ---------- arranque: PWA, stats, enlace profundo ---------- */
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)){
  window.addEventListener('load', () => { try { navigator.serviceWorker.register('sw.js'); } catch(e){} });
}
bumpVisit();
loadGc();
try {
  const savedRepo = localStorage.getItem('sl-ghrepo');
  if (savedRepo) $('#ghRepo').value = savedRepo;
  const savedTok = localStorage.getItem('sl-ghtoken');
  if (savedTok) $('#ghToken').value = savedTok;
} catch(e){}
$('#ghToken').onchange = e => { try { localStorage.setItem('sl-ghtoken', e.target.value); } catch(_){} };
$('#ghRepo').onchange = e => { try { localStorage.setItem('sl-ghrepo', e.target.value.trim()); } catch(_){} };
(function bootDeepLink(){
  try {
    const q = new URLSearchParams(location.search);
    if (!q.has('chap')) return;
    const m = Math.max(0, parseInt(q.get('manga') || '0', 10) || 0);
    const ml = mangaList();
    if (!ml[m]) return;
    const num = parseInt(q.get('chap'), 10);
    if (!ml[m].chapters.some(c => c.num === num)) return;
    const pg = Math.max(0, parseInt(q.get('page') || '0', 10) || 0);
    state.manga = m;
    setTimeout(() => { try { openChapter(num, {startPage: pg}); } catch(e){} }, 300);
  } catch(e){}
})();
/* ---------- tema claro / oscuro ---------- */
function getTheme(){ try { return localStorage.getItem('sl-theme') || 'dark'; } catch(e){ return 'dark'; } }
function applyTheme(){
  const t = getTheme();
  if (t === 'light') document.documentElement.dataset.theme = 'light';
  else document.documentElement.removeAttribute('data-theme');
  $('#themeBtn').textContent = t === 'light' ? '🌙' : '☀';
}
$('#themeBtn').onclick = () => {
  try { localStorage.setItem('sl-theme', getTheme() === 'light' ? 'dark' : 'light'); } catch(e){}
  applyTheme();
};
/* ---------- cuentas (solo este dispositivo) ---------- */
function getUsers(){ try { return JSON.parse(localStorage.getItem('sl-users') || '{}') || {}; } catch(e){ return {}; } }
function currentUser(){ try { return localStorage.getItem('sl-session') || null; } catch(e){ return null; } }
function updateAuthUI(){
  const u = currentUser();
  $('#authInBtn').hidden = !!u;
  $('#authUpBtn').hidden = !!u;
  $('#userChip').hidden = !u;
  if (u) $('#userChip').textContent = '👤 ' + u;
}
let authMode = 'login';
function openAuth(mode){
  authMode = mode;
  $('#authTitle').textContent = mode === 'login' ? '👤 Acceder' : '📝 Crear cuenta';
  $('#authGo').textContent = mode === 'login' ? 'Entrar' : 'Registrar';
  $('#authUser').value = ''; $('#authPass').value = '';
  $('#authModal').hidden = false;
  setTimeout(()=>{ try{$('#authUser').focus();}catch(e){} }, 50);
}
$('#authInBtn').onclick = () => openAuth('login');
$('#authUpBtn').onclick = () => openAuth('register');
$('#authCancel').onclick = () => { $('#authModal').hidden = true; };
$('#userChip').onclick = () => { try { localStorage.removeItem('sl-session'); } catch(e){} updateAuthUI(); renderLists(); toast('Sesión cerrada'); };
$('#authGo').onclick = async () => {
  const u = ($('#authUser').value || '').trim().toLowerCase();
  const p = $('#authPass').value || '';
  if (!/^[a-z0-9_-]{3,24}$/.test(u)){ toast('Usuario: 3-24 letras/números'); return; }
  if (p.length < 4){ toast('Contraseña: mínimo 4'); return; }
  let hex = '';
  try { hex = await sha256hex(u + '|' + p); } catch(e){}
  if (!hex){ toast('No se pudo procesar'); return; }
  const users = getUsers();
  if (authMode === 'register'){
    if (users[u]){ toast('Ese usuario ya existe'); return; }
    users[u] = {h: hex, t: Date.now()};
    try { localStorage.setItem('sl-users', JSON.stringify(users)); } catch(e){ toast('No se pudo guardar'); return; }
    toast('Cuenta creada. ¡Hola, ' + u + '!');
  } else {
    if (!users[u] || users[u].h !== hex){ toast('Usuario o contraseña mal'); return; }
    toast('Hola de nuevo, ' + u);
  }
  try { localStorage.setItem('sl-session', u); } catch(e){}
  $('#authModal').hidden = true;
  updateAuthUI(); renderLists();
};
/* ---------- listas ---------- */
function listStore(){
  const u = currentUser() || 'guest';
  const k = 'sl-lists-' + u;
  let d = {custom: []};
  try { d = JSON.parse(localStorage.getItem(k) || '{"custom":[]}'); } catch(e){}
  if (!d.custom) d.custom = [];
  return {k, d};
}
function saveLists(k, d){ try { localStorage.setItem(k, JSON.stringify(d)); } catch(e){ toast('No se pudo guardar'); } }
function mangaByIdx(i){ return mangaList()[i]; }
function renderLists(){
  const box = $('#listsBox'); if (!box) return;
  box.innerHTML = '';
  const ml = mangaList(), favs = getFavs(), pm = getProgMap();
  const reading = [], pending = [];
  ml.forEach((m, i) => {
    const hasProg = Object.keys(pm).some(k => k.indexOf(i + ':') === 0);
    (hasProg ? reading : pending).push(i);
  });
  const smart = [
    {name: '⭐ Favoritos', items: favs.filter(i => ml[i])},
    {name: '📖 Leyendo', items: reading},
    {name: '🕘 Pendientes', items: pending},
  ];
  for (const s of smart) box.appendChild(listCard(s.name, s.items, null));
  const st = listStore();
  for (const c of st.d.custom) box.appendChild(listCard('📝 ' + c.name, c.items.filter(i => ml[i]), c.id));
  if (!st.d.custom.length){
    const p = document.createElement('p');
    p.style.color = 'var(--dim)';
    p.textContent = 'Crea tu primera lista arriba: por ejemplo "Para el finde".';
    box.appendChild(p);
  }
}
function listCard(name, items, cid){
  const ml = mangaList();
  const d = document.createElement('div');
  d.className = 'listCard';
  let h = '<h4>' + escapeHtml(name) + ' <span style="color:var(--dim)">(' + items.length + ')</span></h4>';
  if (!items.length) h += '<div style="color:var(--dim);font-size:13px">Vacía.</div>';
  else h += items.map(i => '<div class="histRow"><div class="t"><b>' + escapeHtml(ml[i].title) + '</b></div>' +
    (cid ? '<button class="smallBtn" data-unlist="' + i + '">✕</button>' : '<button class="smallBtn" data-open="' + i + '">Ver</button>') + '</div>').join('');
  if (cid){
    h += '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap"><select data-addsel>' +
      ml.map((m, i) => '<option value="' + i + '">' + escapeHtml(m.title) + '</option>').join('') +
      '</select><button class="smallBtn" data-addmanga>+ Añadir</button>' +
      '<span style="flex:1"></span><button class="smallBtn" data-dellist>Eliminar lista</button></div>';
  }
  d.innerHTML = h;
  d.querySelectorAll('[data-open]').forEach(b => { b.onclick = ev => { ev.stopPropagation(); state.manga = +b.dataset.open; openDetail(); }; });
  if (cid){
    const st = listStore();
    const lst = st.d.custom.find(x => x.id === cid);
    d.querySelector('[data-addmanga]').onclick = () => {
      const v = +d.querySelector('[data-addsel]').value;
      if (lst && !lst.items.includes(v)){ lst.items.push(v); saveLists(st.k, st.d); renderLists(); }
    };
    d.querySelectorAll('[data-unlist]').forEach(b => { b.onclick = () => {
      if (lst){ lst.items = lst.items.filter(x => x !== +b.dataset.unlist); saveLists(st.k, st.d); renderLists(); }
    }; });
    d.querySelector('[data-dellist]').onclick = () => {
      st.d.custom = st.d.custom.filter(x => x.id !== cid);
      saveLists(st.k, st.d); renderLists();
    };
  }
  return d;
}
$('#newListBtn').onclick = () => {
  const name = ($('#newListName').value || '').trim().slice(0, 40);
  if (!name){ toast('Ponle un nombre'); return; }
  const st = listStore();
  st.d.custom.push({id: 'l' + Date.now(), name: name, items: []});
  saveLists(st.k, st.d);
  $('#newListName').value = '';
  renderLists();
};
/* ---------- noticias (MyAnimeList vía Jikan) ---------- */
let newsCache = null, newsLoading = false;
function newsCardEl(x, kind){
  const title = (x.title && (x.title.english || x.title.romaji)) || x.title_english || x.title || '';
  const img = (x.coverImage && x.coverImage.large) || (x.images && x.images.jpg && x.images.jpg.image_url) || '';
  const url = x.siteUrl || x.url || '#';
  const score = x.averageScore != null ? (x.averageScore/10).toFixed(1) : (x.score != null ? x.score : '—');
  const d = document.createElement('div');
  d.className = 'newsCard';
  d.innerHTML = (img ? '<img src="' + img + '" alt="" loading="lazy" referrerpolicy="no-referrer">' : '') +
    '<div class="t">' + escapeHtml(title) + '</div>' +
    '<div class="s">★ ' + score + (kind === 'anime' && x.episodes ? ' · ' + x.episodes + ' ep.' : '') +
    (kind === 'manga' && x.chapters ? ' · ' + x.chapters + ' cap.' : '') + '</div>';
  d.onclick = () => { try { window.open(url, '_blank', 'noopener'); } catch(e){} };
  return d;
}
async function loadNews(){
  if (newsCache || newsLoading) return;
  newsLoading = true;
  const showErr = () => {
    newsLoading = false;
    $('#newsAnime').innerHTML = '<p style="color:var(--dim)">No se pudo cargar. Revisa tu conexión e inténtalo de nuevo.</p><button class="smallBtn" id="newsRetry">Reintentar</button>';
    $('#newsManga').innerHTML = '';
    const r = $('#newsRetry');
    if (r) r.onclick = () => { $('#newsAnime').innerHTML = '<p style="color:var(--dim)">Cargando…</p>'; $('#newsManga').innerHTML = '<p style="color:var(--dim)">Cargando…</p>'; loadNews(); };
  };
  try {
    const q = 'query($per:Int,$type:MediaType){ Page(page:1,perPage:$per){ media(type:$type,sort:TRENDING_DESC,isAdult:false){ title{romaji english} coverImage{large} averageScore episodes chapters siteUrl } } }';
    const post = (type) => fetch('https://graphql.anilist.co', {method:'POST', headers:{'Content-Type':'application/json', Accept:'application/json'}, body: JSON.stringify({query:q, variables:{per:8, type:type}})}).then(r => { if (!r.ok) throw 0; return r.json(); });
    const [a, m] = await Promise.all([post('ANIME'), post('MANGA')]);
    newsCache = {a: a, m: m};
    newsLoading = false;
    const ga = document.createElement('div'); ga.className = 'newsGrid';
    (((a.data||{}).Page||{}).media || []).forEach(x => ga.appendChild(newsCardEl(x, 'anime')));
    $('#newsAnime').innerHTML = ''; $('#newsAnime').appendChild(ga);
    const gm = document.createElement('div'); gm.className = 'newsGrid';
    (((m.data||{}).Page||{}).media || []).forEach(x => gm.appendChild(newsCardEl(x, 'manga')));
    $('#newsManga').innerHTML = ''; $('#newsManga').appendChild(gm);
    if (!ga.children.length && !gm.children.length) showErr();
  } catch(e){ showErr(); }
}
/* ---------- comunidad ---------- */
function renderCom(){
  const box = $('#comSubidas'); if (!box) return;
  box.innerHTML = '';
  const ml = mangaList(), all = [];
  ml.forEach((m, i) => m.chapters.forEach(c => all.push({i, c})));
  all.sort((a,b)=>b.c.num - a.c.num);
  all.slice(0, 8).forEach(e => {
    const row = document.createElement('div');
    row.className = 'histRow';
    row.innerHTML = '<div class="t"><b>' + escapeHtml(ml[e.i].title) + '</b> · Cap. ' + e.c.num +
      (e.c.title ? ' — ' + escapeHtml(e.c.title) : '') + '</div><div class="d">Leer →</div>';
    row.onclick = ((m, c) => () => { state.manga = m; const p = getProgMap()[m + ':' + c]; openChapter(c, {startPage: typeof p === 'number' ? p : 0}); })(e.i, e.c.num);
    box.appendChild(row);
  });
  if (!all.length) box.innerHTML = '<div style="color:var(--dim);font-size:13px">Aún no hay capítulos.</div>';
}
document.querySelectorAll('.comMenu button').forEach(b => { b.onclick = () => {
  document.querySelectorAll('.comMenu button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  const v = b.dataset.cm;
  if (v === 'biblio'){ renderLists(); show('lists'); }
  else { show('com'); if (v === 'subidas'){ const el = $('#comSubidas'); if (el && el.scrollIntoView) el.scrollIntoView({block:'start'}); } }
}; });
let utterLoaded = false;
function loadUtter(){
  if (utterLoaded) return; utterLoaded = true;
  try {
    const s = document.createElement('script');
    s.src = 'https://utteranc.es/client.js';
    s.setAttribute('repo', 'huitipcs16-dot/AI.lector');
    s.setAttribute('issue-term', 'pathname');
    s.setAttribute('theme', 'github-dark');
    s.setAttribute('crossorigin', 'anonymous');
    s.async = true;
    $('#utterBox').appendChild(s);
  } catch(e){}
}
/* ---------- fondo de la biblioteca ---------- */
const HOME_COLORS = [
  {n:'Rojo', c:'#e63946'}, {n:'Naranja', c:'#f4842c'}, {n:'Ámbar', c:'#ffae00'},
  {n:'Amarillo', c:'#ffdf3d'}, {n:'Lima', c:'#9be815'}, {n:'Verde', c:'#2ecc40'},
  {n:'Esmeralda', c:'#00b578'}, {n:'Turquesa', c:'#00d0b0'}, {n:'Cian', c:'#00c8ff'},
  {n:'Celeste', c:'#4aa8ff'}, {n:'Azul', c:'#2f6df6'}, {n:'Índigo', c:'#5a4ff2'},
  {n:'Violeta', c:'#7b2ff7'}, {n:'Púrpura', c:'#a64df0'}, {n:'Fucsia', c:'#ef3fb0'},
  {n:'Rosa', c:'#ff6fa5'}, {n:'Coral', c:'#ff7f5c'}, {n:'Carmesí', c:'#c1121f'},
  {n:'Vino', c:'#7a1e3f'}, {n:'Marrón', c:'#9c6644'}, {n:'Melocotón', c:'#ffb37a'},
  {n:'Lavanda', c:'#b9a7ff'}, {n:'Menta', c:'#7dfcd0'}, {n:'Grafito', c:'#23262e'},
];
const HOME_PATS = [
  {id:'liso', n:'Liso'}, {id:'confeti', n:'Confeti'}, {id:'puntos', n:'Puntos'},
  {id:'cuadros', n:'Cuadros'}, {id:'lineas', n:'Líneas'}, {id:'zigzag', n:'Zigzag'},
  {id:'diamantes', n:'Diamantes'}, {id:'hexag', n:'Hexágonos'}, {id:'olas', n:'Olas'},
  {id:'cruces', n:'Cruces'}, {id:'corazones', n:'Corazones'}, {id:'burbujas', n:'Burbujas'},
  {id:'comic', n:'Cómic'}, {id:'asterisco', n:'Asterisco'}, {id:'floral', n:'Floral'},
  {id:'manga', n:'Manga'}, {id:'estrellas', n:'Estrellas'}, {id:'ajedrez', n:'Ajedrez'},
  {id:'triangulos', n:'Triángulos'}, {id:'rayos', n:'Rayos'}, {id:'nubes', n:'Nubes'},
  {id:'hojas', n:'Hojas'}, {id:'lunares', n:'Lunares'}, {id:'mosaico', n:'Mosaico'},
];
function homePatSvg(id){
  const F = 'rgba(255,255,255,0.10)', S = 'stroke="' + F + '" stroke-width="1.5" fill="none"';
  const FF = 'fill="' + F + '"';
  const G = 'fill="rgba(255,215,94,0.14)"';
  const P = {
    confeti: '<circle cx="10" cy="12" r="2.5" ' + FF + '/><circle cx="33" cy="30" r="1.5" ' + G + '/><rect x="24" y="6" width="5" height="5" transform="rotate(20 26 8)" ' + FF + '/><rect x="7" y="25" width="4" height="4" transform="rotate(45 9 27)" ' + G + '/><circle cx="20" cy="34" r="1.5" ' + FF + '/>',
    puntos: '<circle cx="10" cy="10" r="3" ' + FF + '/><circle cx="30" cy="10" r="3" ' + FF + '/><circle cx="10" cy="30" r="3" ' + FF + '/><circle cx="30" cy="30" r="3" ' + FF + '/><circle cx="20" cy="20" r="1.5" ' + G + '/>',
    cuadros: '<path d="M40 0H0V40" ' + S + '/><circle cx="0" cy="0" r="2" ' + FF + '/><circle cx="20" cy="20" r="1.5" ' + G + '/>',
    lineas: '<path d="M0 40L40 0 M-10 30L30 -10 M10 50L50 10" ' + S + '/>',
    zigzag: '<path d="M0 26 L10 16 L20 26 L30 16 L40 26" ' + S + '/><path d="M0 34 L10 24 L20 34 L30 24 L40 34" ' + S + ' opacity="0.5"/>',
    diamantes: '<path d="M20 6 L34 20 L20 34 L6 20 Z" ' + S + '/><path d="M20 13 L27 20 L20 27 L13 20 Z" ' + S + '/><circle cx="20" cy="20" r="1.8" ' + G + '/>',
    hexag: '<path d="M20 4 L35 13 L35 27 L20 36 L5 27 L5 13 Z" ' + S + '/><circle cx="20" cy="20" r="2" ' + G + '/>',
    olas: '<circle cx="0" cy="8" r="10" ' + S + '/><circle cx="20" cy="8" r="10" ' + S + '/><circle cx="40" cy="8" r="10" ' + S + '/><circle cx="-10" cy="28" r="10" ' + S + '/><circle cx="10" cy="28" r="10" ' + S + '/><circle cx="30" cy="28" r="10" ' + S + '/><circle cx="50" cy="28" r="10" ' + S + '/>',
    cruces: '<path d="M10 6V14 M6 10H14 M30 6V14 M26 10H34 M10 26V34 M6 30H14 M30 26V34 M26 30H34" ' + S + '/><circle cx="20" cy="20" r="1.8" ' + G + '/>',
    corazones: '<path d="M20 31 C10 23 7 16 11 13 C14 11 17 13 20 16 C23 13 26 11 29 13 C33 16 30 23 20 31 Z" ' + FF + '/><circle cx="31" cy="31" r="1.5" ' + G + '/><circle cx="9" cy="8" r="1.5" ' + G + '/>',
    burbujas: '<circle cx="12" cy="14" r="5" ' + S + '/><circle cx="29" cy="26" r="7" ' + S + '/><circle cx="30" cy="9" r="2.5" ' + S + '/><circle cx="9" cy="31" r="2" ' + S + '/>',
    comic: '<circle cx="8" cy="8" r="3.5" ' + FF + '/><circle cx="24" cy="8" r="3.5" ' + FF + '/><circle cx="16" cy="16" r="2" ' + G + '/><circle cx="32" cy="16" r="2" ' + G + '/><circle cx="8" cy="24" r="3.5" ' + FF + '/><circle cx="24" cy="24" r="3.5" ' + FF + '/><circle cx="16" cy="32" r="2" ' + G + '/><circle cx="32" cy="32" r="2" ' + G + '/>',
    asterisco: '<path d="M20 8V32 M8 20H32 M11.5 11.5L28.5 28.5 M28.5 11.5L11.5 28.5" ' + S + '/><circle cx="20" cy="20" r="2" ' + G + '/>',
    floral: '<g ' + S + '><ellipse cx="20" cy="12" rx="4" ry="7"/><ellipse cx="20" cy="12" rx="4" ry="7" transform="rotate(72 20 20)"/><ellipse cx="20" cy="12" rx="4" ry="7" transform="rotate(144 20 20)"/><ellipse cx="20" cy="12" rx="4" ry="7" transform="rotate(216 20 20)"/><ellipse cx="20" cy="12" rx="4" ry="7" transform="rotate(288 20 20)"/></g><circle cx="20" cy="20" r="2.5" ' + G + '/>',
    manga: '<circle cx="8" cy="8" r="2" ' + FF + '/><circle cx="24" cy="8" r="2" ' + FF + '/><circle cx="16" cy="16" r="1.2" ' + G + '/><circle cx="32" cy="16" r="1.2" ' + G + '/><circle cx="8" cy="24" r="2" ' + FF + '/><circle cx="24" cy="24" r="2" ' + FF + '/><circle cx="16" cy="32" r="1.2" ' + G + '/><circle cx="32" cy="32" r="1.2" ' + G + '/>',
    estrellas: '<path d="M20 7 L22.6 14.5 L30.5 14.5 L24.2 19 L26.5 26.5 L20 22 L13.5 26.5 L15.8 19 L9.5 14.5 L17.4 14.5 Z" ' + FF + '/><path d="M32 6 C32.6 10 33.5 11 37 11.5 C33.5 12 32.6 13 32 17 C31.4 13 30.5 12 27 11.5 C30.5 11 31.4 10 32 6 Z" ' + G + '/><circle cx="9" cy="30" r="1.6" ' + G + '/>',
    ajedrez: '<rect x="0" y="0" width="20" height="20" ' + FF + '/><rect x="20" y="20" width="20" height="20" ' + FF + '/><circle cx="10" cy="10" r="1.5" ' + G + '/><circle cx="30" cy="30" r="1.5" ' + G + '/>',
    triangulos: '<path d="M20 8 L34 32 L6 32 Z" ' + S + '/><path d="M20 17 L27 29 L13 29 Z" ' + S + '/><circle cx="20" cy="33" r="1.5" ' + G + '/>',
    rayos: '<circle cx="20" cy="20" r="3.5" ' + FF + '/><path d="M20 20 L20 5 M20 20 L31 9 M20 20 L35 20 M20 20 L31 31 M20 20 L20 35 M20 20 L9 31 M20 20 L5 20 M20 20 L9 9" ' + S + '/>',
    nubes: '<ellipse cx="19" cy="23" rx="11" ry="6" ' + S + '/><circle cx="28" cy="17" r="4.5" ' + S + '/><circle cx="12" cy="33" r="1.5" ' + G + '/><circle cx="24" cy="34" r="1.5" ' + G + '/><circle cx="31" cy="33" r="1.5" ' + G + '/>',
    hojas: '<path d="M14 6 C20 12 20 22 14 28 C8 22 8 12 14 6 Z" ' + S + '/><path d="M26 12 C32 18 32 28 26 34 C20 28 20 18 26 12 Z" ' + S + '/><circle cx="20" cy="20" r="1.5" ' + G + '/>',
    lunares: '<circle cx="10" cy="10" r="6" ' + FF + '/><circle cx="30" cy="30" r="6" ' + FF + '/><circle cx="30" cy="10" r="3" ' + G + '/><circle cx="10" cy="30" r="3" ' + G + '/>',
    mosaico: '<rect x="12" y="12" width="16" height="16" transform="rotate(45 20 20)" ' + S + '/><circle cx="20" cy="20" r="2" ' + G + '/><circle cx="0" cy="0" r="1.5" ' + FF + '/><circle cx="40" cy="0" r="1.5" ' + FF + '/><circle cx="0" cy="40" r="1.5" ' + FF + '/><circle cx="40" cy="40" r="1.5" ' + FF + '/>',
  };
  return P[id] || '';
}
function getHomeBg(){
  try { const o = JSON.parse(localStorage.getItem('sl-homebg') || '{"c":"#23262e","p":"confeti"}'); if (o && o.c && o.p) return o; } catch(e){}
  return {c:'#23262e', p:'confeti'};
}
function applyHomeBg(){
  const hv = $('#homeView'); if (!hv) return;
  const bg = getHomeBg();
  const img = bg.p === 'liso' ? 'none' :
    'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40">' + homePatSvg(bg.p) + '</svg>') + '")';
  hv.style.backgroundColor = 'rgba(16,18,26,.72)';
  hv.style.backgroundImage = 'none';
  hv.style.backdropFilter = 'blur(3px)';
  applyWall();
  const cn = (HOME_COLORS.find(x=>x.c===bg.c)||{}).n || bg.c;
  const pn = ((HOME_PATS.find(x=>x.id===bg.p))||{}).n || bg.p;
  const cur = $('#bgCurrent');
  if (cur) cur.textContent = '🎨 Fondo: ' + cn + ' · ' + pn;
  document.querySelectorAll('#bgDots button').forEach(b => { b.style.outline = b.dataset.c === bg.c ? '2px solid var(--accent)' : 'none'; });
  document.querySelectorAll('#bgPats .smallBtn').forEach(b => { b.classList.toggle('primary', b.dataset.p === bg.p); });
}
const WALL_URL = 'img/anime-world-bg.webp';
function applyWall(){
  document.body.style.backgroundImage = 'url("' + WALL_URL + '")';
  document.body.style.backgroundSize = 'cover';
  document.body.style.backgroundPosition = 'center top';
  document.body.style.backgroundAttachment = 'fixed';
  document.body.style.backgroundColor = '#14101d';
}
updateAdminBtn();
applyReadPrefs();
applySideBg();
buildSidePicker();
applyHomeBg();
applyTheme();
updateAuthUI();
initHome();
