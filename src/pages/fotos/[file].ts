import type { APIRoute } from 'astro';
import { getFotoBytes } from '../../lib/server/relojes';
import { hasDatabase } from '../../lib/server/db';
import type { Size } from '../../lib/server/fotos';

// /fotos/12-m.webp → foto 12 en ancho mediano. Cada id es inmutable: caché de un año.
export const GET: APIRoute = async ({ params }) => {
  const m = params.file?.match(/^(\d+)-([lms])\.webp$/);
  if (!m || !hasDatabase()) return new Response('No encontrada', { status: 404 });
  const data = await getFotoBytes(Number(m[1]), m[2] as Size);
  if (!data) return new Response('No encontrada', { status: 404 });
  return new Response(new Uint8Array(data), {
    headers: {
      'content-type': 'image/webp',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  });
};
