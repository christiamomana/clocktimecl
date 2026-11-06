import type { APIRoute } from 'astro';
import { processFoto } from '../../../../../lib/server/fotos';
import { addFoto, getReloj } from '../../../../../lib/server/relojes';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

// Sube una foto a un reloj: multipart con el campo "foto".
export const POST: APIRoute = async ({ params, request }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || !(await getReloj(id))) return json({ error: 'Reloj no encontrado.' }, 404);
  const form = await request.formData().catch(() => null);
  const file = form?.get('foto');
  if (!(file instanceof File) || !file.size) return json({ error: 'Falta la foto.' }, 400);
  try {
    const fotoId = await addFoto(id, await processFoto(Buffer.from(await file.arrayBuffer())));
    return json({ id: fotoId }, 201);
  } catch (e) {
    return json({ error: (e as Error).message }, 400);
  }
};
