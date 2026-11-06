// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

// Sitio servido por Vercel: la vitrina y el admin (/admin) leen de Postgres en cada visita,
// así los cambios se ven sin volver a desplegar. Las imágenes fijas siguen en /public/img.
export default defineConfig({
  site: 'https://clocktimecl.vercel.app',
  output: 'server',
  adapter: vercel(),
  build: { inlineStylesheets: 'always' },
});
