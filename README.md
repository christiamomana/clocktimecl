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
public/img/        fotos (AVIF + WebP en varios anchos) y logo
src/
  data/pieces.ts   piezas de la vitrina (ficha, specs, qué incluye)
  data/site.ts     Instagram, DM, marcas
  lib/pic.ts       <picture> responsivo; registra aquí las fotos nuevas (anchos y dimensiones)
  styles/global.css
  components/      Header (+ menú), Hero, Stories, Collection (+ ficha), Sell, Included, Brands, Story, Faq, Valuation, Footer
  pages/index.astro
```

## Agregar una pieza

1. Exporta la foto como `public/img/<nombre>-<ancho>.avif` y `.webp` (p. ej. 400, 720 y 1100 px).
2. Registra `<nombre>` en `IMG` y `DIM` de `src/lib/pic.ts`.
3. Agrega la ficha en `src/data/pieces.ts`.

## Pendiente

- `site` en `astro.config.mjs` está como `https://clocktime.cl`; ajústalo al dominio real.
