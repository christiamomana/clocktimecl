import { parseFicha } from '../instagram';
import { canonicalInstagramUrl } from '../relojes';
import { downloadFoto, processFoto } from './fotos';
import { addFoto, createReloj, findByInstagram } from './relojes';

export interface ImportInput {
  instagram_url: string;
  caption: string;
  fotoUrls?: string[];
  fotoFiles?: Buffer[];
}

export type ImportResult =
  | { ok: true; id: number; avisos: string[] }
  | { ok: false; error: string; existingId?: number };

/** Crea un borrador (no publicado) a partir de una publicación de Instagram. */
export async function importarPublicacion(input: ImportInput): Promise<ImportResult> {
  const url = canonicalInstagramUrl(input.instagram_url);
  if (!url) return { ok: false, error: 'El link debe ser de una publicación de Instagram (instagram.com/p/…).' };
  if (!input.caption.trim()) return { ok: false, error: 'Falta el texto de la publicación.' };

  const existingId = await findByInstagram(url);
  if (existingId) return { ok: false, error: 'Esa publicación ya está en el admin.', existingId };

  const fotoUrls = (input.fotoUrls ?? []).map((u) => u.trim()).filter(Boolean).slice(0, 10);
  const fotoFiles = (input.fotoFiles ?? []).slice(0, 10);
  if (!fotoUrls.length && !fotoFiles.length) return { ok: false, error: 'Agrega al menos una foto (archivo o URL).' };

  // Primero se procesan las fotos: si alguna falla, no queda un reloj a medias.
  const avisos: string[] = [];
  const processed = [];
  for (const buf of fotoFiles) processed.push(await processFoto(buf));
  for (const u of fotoUrls) {
    try {
      processed.push(await processFoto(await downloadFoto(u)));
    } catch (e) {
      avisos.push(`Una foto no se pudo descargar: ${(e as Error).message}`);
    }
  }
  if (!processed.length) return { ok: false, error: avisos.join(' ') || 'No se pudo procesar ninguna foto.' };

  const { data, avisos: fichaAvisos } = parseFicha(input.caption, url);
  const id = await createReloj(data);
  for (const p of processed) await addFoto(id, p);
  return { ok: true, id, avisos: [...fichaAvisos, ...avisos] };
}
