# Clock Time Chile — sitio web

Sitio de Clock Time Chile (compra, venta y consignación de relojes de alta gama en Concepción) hecho con [Astro](https://astro.build). Es la versión Astro del diseño del artefacto "Clock Time Chile", con las fotos de la vitrina.

## Scripts

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # astro check + build estático en dist/
npm run preview
```

## Estructura

```
keystatic.config.ts      campos del administrador de relojes
public/img/              fotos fijas de la página (portada, servicios, historia) y logo
src/
  content/relojes/*.json un archivo por reloj (lo escribe el administrador)
  assets/relojes/        foto de cada reloj (Astro genera AVIF/WebP al construir)
  content.config.ts      esquema de la colección de relojes
  lib/relojes.ts         relojes publicados en orden
  data/site.ts           Instagram, DM, marcas
  lib/pic.ts             <picture> responsivo de las fotos fijas
  styles/global.css
  components/      Header (+ menú), Hero, Stories, Collection (+ ficha), Sell, Included, Brands, Story, Faq, Valuation, Footer
  pages/index.astro
```

## Administrador de relojes

Los relojes se gestionan en **`/keystatic`** (Keystatic): agregar, editar, ordenar, ocultar, marcar como reservado o vendido, y subir la foto. Cada reloj queda como un archivo en `src/content/relojes/` y su foto en `src/assets/relojes/<id>/`; Astro la optimiza al construir el sitio.

Campos: marca, modelo, referencia, medida o material, estado (disponible / reservado / vendido), mostrar en la página, orden en el carrusel, etiqueta, foto, encuadre de la foto, descripción, especificaciones (hasta 6; la ficha muestra 4) y qué incluye.

### En local

```bash
npm run dev
# abre http://127.0.0.1:4321/keystatic
```

Los cambios se escriben directo en los archivos del repo; haz commit y push como de costumbre.

### En producción (modo GitHub)

En producción el administrador guarda cada cambio como un commit en GitHub, y solo pueden entrar personas con permiso de escritura en el repositorio. Al hacer push, el hosting vuelve a construir el sitio y el cambio queda publicado en uno o dos minutos.

1. Crea la rama `main` (el repo hoy solo tiene la rama de desarrollo) y apunta el hosting a ella.
2. Corre `PUBLIC_KEYSTATIC_STORAGE=github npm run dev`, abre `/keystatic` y sigue el asistente: crea la GitHub App y guarda las claves en `.env` (no se sube al repo). Instala la app en `christiamomana/clocktimecl`.
3. En el hosting, define las variables de `.env.example` con esos valores, y en la GitHub App agrega la URL de callback de tu dominio: `https://TU-DOMINIO/api/keystatic/github/oauth/callback`.
4. Con `PUBLIC_KEYSTATIC_STORAGE=github` el build incluye el administrador y usa el adaptador `@astrojs/node` (servidor Node: `node dist/server/entry.mjs`). Si despliegas en Vercel o Netlify, cambia el adaptador en `astro.config.mjs` por `@astrojs/vercel` o `@astrojs/netlify`.

Sin esa variable, `npm run build` genera un sitio 100 % estático y sin administrador: el modo local nunca se publica.

## Pendiente

- `site` en `astro.config.mjs` está como `https://clocktime.cl`; ajústalo al dominio real.
