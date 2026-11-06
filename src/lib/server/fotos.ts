import sharp from 'sharp';

// Anchos que se guardan de cada foto (WebP). La ficha usa l/m, el carrusel m/s.
export const SIZES = { l: 1600, m: 900, s: 480 } as const;
export type Size = keyof typeof SIZES;

export const MAX_BYTES = 12 * 1024 * 1024;
const MAX_SOURCE_PIXELS = 50_000_000;

export interface ProcessedFoto {
  ancho: number;
  alto: number;
  l: Buffer;
  m: Buffer;
  s: Buffer;
}

/** Normaliza una foto subida (o descargada de Instagram) a tres anchos WebP. */
export async function processFoto(input: Buffer): Promise<ProcessedFoto> {
  if (input.byteLength > MAX_BYTES) throw new Error('La foto pesa más de 12 MB.');
  const base = sharp(input, { limitInputPixels: MAX_SOURCE_PIXELS }).rotate();
  const meta = await base.metadata();
  if (!meta.width || !meta.height) throw new Error('El archivo no es una imagen válida.');

  const render = (w: number) =>
    base.clone().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });

  const [l, m, s] = await Promise.all([render(SIZES.l), render(SIZES.m), render(SIZES.s)]);
  return { ancho: l.info.width, alto: l.info.height, l: l.data, m: m.data, s: s.data };
}

/** Descarga una imagen por URL https (p. ej. el CDN de Instagram) con límite de tamaño. */
export async function downloadFoto(url: string): Promise<Buffer> {
  const u = new URL(url);
  if (u.protocol !== 'https:') throw new Error('La URL de la foto debe ser https.');
  const res = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(20_000) });
  if (!res.ok) throw new Error(`No se pudo descargar la foto (${res.status}).`);
  const type = res.headers.get('content-type') ?? '';
  if (!type.startsWith('image/')) throw new Error('La URL no apunta a una imagen.');
  const len = Number(res.headers.get('content-length') ?? 0);
  if (len > MAX_BYTES) throw new Error('La foto pesa más de 12 MB.');
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.byteLength > MAX_BYTES) throw new Error('La foto pesa más de 12 MB.');
  return buf;
}
