# AILector (port de https://github.com/huitipcs16-dot/AI.lector)

App portada tal cual del repo a Perchance. Aspecto y funciones idénticos;
solo cambian rutas de activos (`src/...`) y dos adaptaciones obligadas:

- **Service worker desactivado** en el `register` (sigue en `src/sw.js`
  para la versión GitHub/escritorio). En Perchance el SW con caché
  `cache-first` congelaría la vista previa con versiones viejas.
- **`index.html` es solo el `<body>`** (Perchance lo envuelve) + `main.pjs`
  con `$meta` (título, descripción, icono). Sin plugins: el lector no usa
  IA en vivo; los 30 capítulos de Slime vienen pre-escaneados en
  `src/data.js` (`CHAPTERS[i].pages[p] = [{text,lang,translation,speaker,
  gender,box}]`) y la voz es `speechSynthesis` del navegador.

## Archivos

- `index.html` — app completa (estilos + vistas + lógica), generada de
  `scratch/ai-lector/index.html` (port mecánico, ver `src/tools-port/`
  si se re-porta; los scripts de port vivieron en `scratch/` y no se
  conservan: repetir con `fetch_url` del zip + `execute_js` + `@zip.js/zip.js`).
- `src/data.js` — `MANGA` + `CHAPTERS` (Slime, 30 caps) y `CHAPTERS_VIDA`
  (La Vida Después de la Muerte, cap. 1: 47 tiras + 93 líneas
  pre-escaneadas). Imágenes remotas `user.uploads.dev` (Vida) y
  `storage.zonatmo.org` (Slime); textos pre-escaneados.
- `src/{cover,cover2,logo}.jpg`, `src/icon-512.png` — portadas e icono.
- `src/sw.js`, `src/manifest.webmanifest` — referencia/solo escritorio.

## Notas

- Imágenes remotas se cargan con `referrerPolicy="no-referrer"` +
  fallback `api.allorigins.win`, igual que el original.
- Noticias usan `https://graphql.anilist.co` directo (CORS público OK).
- Comentarios del feed usan utterances con repo
  `huitipcs16-dot/AI.lector` (issue-term `pathname`); funcionan cuando la
  página pública tiene URL estable.
- Publicar a GitHub (`ghPut`) pide repo + token en la propia UI (admin),
  igual que el original; en Perchance ese botón puede fallar por el
  iframe: edita los archivos desde el propio editor.
- Persistencia: `localStorage` (progreso, listas, lecturas, tema), igual
  que el original. Sin IndexedDB ni plugins.
