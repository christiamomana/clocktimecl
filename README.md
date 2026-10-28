# Clock Time Chile — sitio web

Landing de Clock Time Chile (compra, venta y consignación de relojes de alta gama en Concepción) hecha con [Astro](https://astro.build), siguiendo el sistema de diseño de la marca: tema **Noche** (principal) y **Marfil**, dorado metálico, Cinzel + Montserrat.

## Scripts

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # astro check + build estático en dist/
npm run preview
```

## Estructura

```
src/
  data/       site.ts (marca, nav, Instagram), watches.ts (catálogo), icons.ts
  styles/     tokens.css (tokens del sistema), components.css (Button, ServiceBadge, WatchCard, StatusBanner), global.css
  components/ Header, Footer, Button, ServiceBadge, WatchCard, StatusBanner, Dial, Icon
  pages/      index.astro
```

## Pendiente

- **Catálogo:** las fichas de `src/data/watches.ts` son ejemplos. Reemplázalas por el inventario real (con fotos en `public/`).
- **Logo:** el sistema de diseño aún no tiene el archivo original; se usa la firma tipográfica. Cuando esté, agrégalo en `public/` y úsalo en `Header.astro`.
- **WhatsApp / correo:** solo se enlaza Instagram (`@clocktimechile`). Añade otros canales en `src/data/site.ts`.
- **Dominio:** `site` en `astro.config.mjs` está como `https://clocktime.cl`; ajústalo al dominio real.
