/* AILector service worker: app shell + capítulos offline */
const SHELL_CACHE = 'ailector-shell-v1';
const CHAP_CACHE = 'ailector-ch';
const SHELL = ['./', 'index.html', 'data.js', 'cover.jpg', 'cover2.jpg', 'logo.jpg', 'manifest.webmanifest', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    try {
      const c = await caches.open(SHELL_CACHE);
      for (const u of SHELL){
        try { await c.add(u); } catch(err){}
      }
    } catch(err){}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    for (const k of keys){
      if (k !== SHELL_CACHE && k !== CHAP_CACHE) await caches.delete(k);
    }
    await self.clients.claim();
  })());
});

function isImage(u){
  return /\.(webp|jpg|jpeg|png|gif|avif)(\?|$)/i.test(u) || u.includes('zonatmo.org');
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  e.respondWith((async () => {
    if (isImage(url)){
      // imágenes: caché primero (offline), luego red
      try {
        const hit = await caches.match(req, {cacheName: CHAP_CACHE});
        if (hit) return hit;
        const shell = await caches.match(req, {cacheName: SHELL_CACHE});
        if (shell) return shell;
      } catch(err){}
      try {
        const r = await fetch(req);
        if (r && r.ok){
          try { const c = await caches.open(CHAP_CACHE); c.put(req, r.clone()); } catch(err){}
        }
        return r;
      } catch(err){
        try {
          const hit = await caches.match(req);
          if (hit) return hit;
        } catch(err2){}
        return new Response('', {status: 504});
      }
    }
    // app shell: red primero, luego caché
    try {
      const r = await fetch(req);
      return r;
    } catch(err){
      const hit = await caches.match(req);
      if (hit) return hit;
      if (req.mode === 'navigate'){
        const idx = await caches.match('index.html');
        if (idx) return idx;
      }
      return new Response('', {status: 504});
    }
  })());
});
