import type { APIRoute } from 'astro';
import { importarPublicacion } from '../../../lib/server/importar';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// Importa una publicación de Instagram como borrador.
// JSON: { instagram_url, caption, foto_urls: string[] }  ·  multipart: los mismos campos + archivos "fotos".
export const POST: APIRoute = async ({ request }) => {
  let input: { instagram_url: string; caption: string; fotoUrls: string[]; fotoFiles: Buffer[] };
  try {
    if ((request.headers.get('content-type') ?? '').includes('application/json')) {
      const b = await request.json();
      input = {
        instagram_url: String(b.instagram_url ?? ''),
        caption: String(b.caption ?? ''),
        fotoUrls: Array.isArray(b.foto_urls) ? b.foto_urls.map(String) : [],
        fotoFiles: [],
      };
    } else {
      const f = await request.formData();
      input = {
        instagram_url: String(f.get('instagram_url') ?? ''),
        caption: String(f.get('caption') ?? ''),
        fotoUrls: String(f.get('foto_urls') ?? '').split('\n'),
        fotoFiles: await Promise.all(
          f.getAll('fotos').filter((x): x is File => x instanceof File && x.size > 0).map(async (x) => Buffer.from(await x.arrayBuffer())),
        ),
      };
    }
  } catch {
    return json({ error: 'Petición inválida.' }, 400);
  }

  try {
    const result = await importarPublicacion(input);
    if (!result.ok) return json({ error: result.error, existing_id: result.existingId ?? null }, result.existingId ? 409 : 400);
    return json({ id: result.id, avisos: result.avisos, admin_url: `/admin/relojes/${result.id}` }, 201);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
};
