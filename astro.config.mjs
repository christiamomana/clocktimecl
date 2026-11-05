// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';
import keystatic from '@keystatic/astro';

// El administrador (/keystatic) se activa en desarrollo, o en producción con PUBLIC_KEYSTATIC_STORAGE=github.
// Sin él, el sitio se construye 100 % estático y no necesita servidor (nunca se publica el modo local).
const isDev = process.argv.includes('dev');
const adminEnabled = isDev || process.env.PUBLIC_KEYSTATIC_STORAGE === 'github';

export default defineConfig({
  site: 'https://clocktime.cl',
  build: { inlineStylesheets: 'always' },
  integrations: adminEnabled ? [react(), keystatic()] : [],
  ...(adminEnabled && !isDev ? { adapter: node({ mode: 'standalone' }) } : {}),
});
