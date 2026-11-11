import type { APIRoute } from 'astro';
import { processFoto } from '../../../lib/server/fotos';
import { setPortadaFoto } from '../../../lib/server/portada';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// Sube una foto nueva para la portada: multipart con el campo "foto".
export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData().catch(() => null);
  const file = form?.get('foto');
  if (!(file instanceof File) || !file.size) return json({ error: 'Falta la foto.' }, 400);
  try {
    await setPortadaFoto(await processFoto(Buffer.from(await file.arrayBuffer())));
    return json({ ok: true }, 201);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
};
