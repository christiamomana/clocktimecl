import type { APIRoute } from 'astro';
import { listRelojes } from '../../../../lib/server/relojes';

// Lista resumida, para comparar con Instagram qué publicaciones faltan.
export const GET: APIRoute = async () => {
  const relojes = await listRelojes();
  return new Response(
    JSON.stringify(
      relojes.map((r) => ({
        id: r.id,
        marca: r.marca,
        modelo: r.modelo,
        referencia: r.referencia,
        estado: r.estado,
        publicado: r.publicado,
        fotos: r.fotos.length,
        instagram_url: r.instagram_url,
      })),
    ),
    { headers: { 'content-type': 'application/json' } },
  );
};
