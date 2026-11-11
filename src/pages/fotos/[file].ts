import type { APIRoute } from 'astro';
import { getFotoBytes } from '../../lib/server/relojes';
import { getImagenBytes } from '../../lib/server/portada';
import { hasDatabase } from '../../lib/server/db';
import type { Size } from '../../lib/server/fotos';

// /fotos/12-m.webp → foto 12 de un reloj, ancho mediano. /fotos/i3-l.webp → imagen 3 del sitio (portada).
// Cada id es inmutable: caché de un año.
export const GET: APIRoute = async ({ params }) => {
  const m = params.file?.match(/^(i?)(\d+)-([lms])\.webp$/);
  if (!m || !hasDatabase()) return new Response('No encontrada', { status: 404 });
  const id = Number(m[2]);
  const size = m[3] as Size;
  const data = m[1] ? await getImagenBytes(id, size) : await getFotoBytes(id, size);
  if (!data) return new Response('No encontrada', { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      'content-type': 'image/webp',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
};
