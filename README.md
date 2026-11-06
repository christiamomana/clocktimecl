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
src/
  pages/index.astro            vitrina (lee los relojes de la base en cada visita, caché de 1 minuto)
  pages/admin/                 admin: login, lista, edición, importar de Instagram
  pages/api/admin/             API del admin (fotos, importar, lista para comparar con Instagram)
  pages/fotos/[file].ts        sirve las fotos guardadas en la base (/fotos/12-m.webp)
  lib/relojes.ts               tipos y validación de un reloj
  lib/instagram.ts             lee la ficha de una publicación (⌚ ▪️ ✔️)
  lib/seed.ts                  vitrina inicial (7 relojes, fotos en public/img)
  lib/server/                  base de datos, fotos (sharp → WebP), login, importación
  data/claude-sync.ts          instrucciones para sincronizar con Claude in Chrome
  components/, styles/         secciones y estilos de la página
public/img/                    fotos fijas de la página y de la vitrina inicial
tests/                         pruebas del lector de fichas (npm test)
```

## Administrador (`/admin`)

- Entra con la contraseña de `ADMIN_PASSWORD`.
- **Relojes:** crear, editar, ocultar o publicar, marcar disponible / reservado / vendido, precio (vacío = "Consultar precio"), orden, etiqueta, especificaciones y qué incluye.
- **Fotos:** varias por reloj, se suben desde el celular o el computador (se achican en el navegador y se guardan como WebP en tres tamaños). La primera es la portada; en la página se ven como galería en la ficha.
- **Importar de Instagram:** pega el link y el texto de una publicación, más sus fotos. Se lee la ficha y se crea un reloj **sin publicar** para revisar.
- **Sincronizar con Claude:** en *Importar de Instagram* hay instrucciones para copiar en la extensión **Claude in Chrome**. Con tu Instagram abierto, Claude compara tus publicaciones con el admin e importa como borrador las que falten.
- Los cambios se ven en la página en cerca de un minuto, sin redeploy.

### Configuración en Vercel

1. **Base de datos:** *Storage → Neon* y conéctala al proyecto. Crea `DATABASE_URL`; las tablas se crean solas.
2. **Variables** (*Settings → Environment Variables*): `ADMIN_PASSWORD` y, opcional, `ADMIN_API_TOKEN` (ver `.env.example`).
3. **Redeploy.** Entra a `/admin`: con la base vacía aparece el botón *Cargar los 7 relojes actuales*.

Sin `DATABASE_URL` la página muestra la vitrina inicial y el admin avisa que falta la base.

### API para scripts o Claude Code

Con `Authorization: Bearer $ADMIN_API_TOKEN`:

- `GET /api/admin/relojes`: lista con `instagram_url` de cada reloj.
- `POST /api/admin/importar` con JSON `{ "instagram_url", "caption", "foto_urls": [] }`: crea un borrador. Responde 409 si ya existe.

### En local

```bash
cp .env.example .env   # completa DATABASE_URL (cualquier Postgres) y ADMIN_PASSWORD
npm run dev            # http://localhost:4321 y /admin
npm test               # pruebas del lector de fichas
```

## Pendiente

- Cambiar `site` en `astro.config.mjs` si se usa un dominio propio.
