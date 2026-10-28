// Fotos responsivas: AVIF primero, WebP de respaldo, lazy por defecto.
// Cada foto existe en /public/img como `<nombre>-<ancho>.{avif,webp}`.

export const IMG: Record<string, number[]> = {
  'radiomir-slc': [400, 720, 1100],
  'radiomir-gmt': [400, 720, 1100],
  'longines-moonphase': [400, 720, 1100],
  'tag-formula1': [400, 720, 1100],
  'omega-cosmic': [400, 720],
  'movado-50s': [400, 720],
  'rolex-reservado': [400, 720],
  'longines-wrist': [480, 720],
  correa: [400, 720],
};

const DIM: Record<string, [number, number]> = {
  'radiomir-slc': [1296, 1788],
  'radiomir-gmt': [1440, 1267],
  'longines-moonphase': [1440, 1922],
  'tag-formula1': [1440, 1882],
  'omega-cosmic': [720, 717],
  'movado-50s': [720, 947],
  'rolex-reservado': [922, 1140],
  'longines-wrist': [720, 1126],
  correa: [1440, 1728],
};

export interface PicOptions {
  eager?: boolean;
  pos?: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

export function pic(name: string, sizes: string, alt = '', opt: PicOptions = {}): string {
  const ws = IMG[name];
  if (!ws) throw new Error(`Foto desconocida: ${name}`);
  const set = (ext: string) => ws.map((w) => `/img/${name}-${w}.${ext} ${w}w`).join(', ');
  const mid = ws[Math.min(1, ws.length - 1)];
  const [w, h] = DIM[name] ?? [1200, 1500];
  return (
    `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">` +
    `<img src="/img/${name}-${mid}.webp" srcset="${set('webp')}" sizes="${sizes}" width="${w}" height="${h}" alt="${esc(alt)}" ` +
    `${opt.eager ? '' : 'loading="lazy" '}decoding="async"${opt.pos ? ` style="object-position:${opt.pos}"` : ''}></picture>`
  );
}
