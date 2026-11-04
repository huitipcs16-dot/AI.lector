# Solo Leveling — Carátula (PWA)

Reconstrucción web de la carátula de **Solo Leveling** a partir del `png 2`:
tarjeta de portada + ficha (datos del png 1). Instalable como app y funciona offline.

## Estructura pedida

| Archivo | Qué es |
|---|---|
| `index.html` | Página: carátula (PNG 2) + ficha, stats y botones |
| `css/style.css` | Todo el estilo (fondo verde, tarjeta, chips, responsive) |
| `js/app.js` | Votos 👍/👎 con `localStorage`, ver más, compartir, instalación PWA, registro del SW |
| `img/cover.png` | Portada limpia 756×912 (badge 9.00 original borrado; el badge ahora lo dibuja el HTML) |
| `img/icon-512.png` / `img/icon-192.png` | Iconos PWA |
| `manifest.webmanifest` | Manifiesto PWA (nombre, colores, iconos, `standalone`) |
| `sw.js` | Service worker: app-shell offline (cache-first + red) |
| `README.md` | Este archivo |

## Probar local

```bash
cd solo-leveling-caratula
python3 -m http.server 8000
# abrir http://localhost:8000
```

> El service worker exige `http(s)`; con `file://` la página funciona pero sin offline.

## Desplegar

- **GitHub Pages / Netlify / Vercel**: sube la carpeta tal cual.
- **Perchance**: los archivos viven en `src/solo/` y se referencian por ruta relativa
  (`css/style.css`, `img/cover.png`…), así que el mismo código sirve en ambos sitios.

## Datos mostrados (del png 1)

- Título **Solo Leveling** · MANHWA · 204 capítulos · 249,488 visitas · Shounen · ★ 9.00
- Géneros: Acción, Aventura, Drama, Fantasía, Sobrenatural, Magia, Reencarnación, Artes Marciales, Apocalíptico, Ejército, Sistema de Niveles
- Estado: 🔴 FINALIZADO · Sinónimos + autores (Chugong · DUBU/REDICE)
- Votos base: 👍 961 / 👎 19 = **980 votos** (tu voto se suma y se guarda en el navegador)

## Nota de imagen

`img/cover.png` se extrajo del pantallazo aportado por el usuario (se recortó la
interfaz y se reconstruyó la esquina del badge). Calidad de origen: 252 px de ancho
ampliada ×3 con suavizado. Si consigues la portada oficial en alta resolución,
sustituye el archivo manteniendo el nombre y todo sigue funcionando.
