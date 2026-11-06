// Lee la ficha de una publicación de @clocktimechile y la convierte en un reloj (borrador).
// Formato de la cuenta:
//   ⌚ MARCA MODELO – REFERENCIA
//   Párrafos narrativos…
//   ▪️ Calibre …   ▪️ Diámetro … mm   ▪️ Cristal zafiro
//   ✔️ Reloj   ✔️ Caja original   ✔️ Garantía 3 meses

import type { Estado, RelojInput, Spec } from './relojes';

const BRANDS = [
  'A. Lange & Söhne', 'Audemars Piguet', 'Baume & Mercier', 'Bell & Ross', 'Blancpain', 'Breguet', 'Breitling', 'Bulgari',
  'Cartier', 'Chopard', 'Frederique Constant', 'Girard-Perregaux', 'Grand Seiko', 'Hamilton', 'Hublot', 'IWC', 'Jaeger-LeCoultre',
  'Longines', 'Montblanc', 'Movado', 'Nomos', 'Omega', 'Oris', 'Panerai', 'Patek Philippe', 'Rado', 'Raymond Weil', 'Rolex',
  'Seiko', 'TAG Heuer', 'Tissot', 'Tudor', 'Ulysse Nardin', 'Vacheron Constantin', 'Zenith',
];

const BULLET = /^\s*(?:▪️?|▫️?|◾️?|■|•|-|–)\s*/u;
const CHECK = /^\s*(?:✔️?|✅|☑️?|✓)\s*/u;
const WATCH = /^\s*⌚️?\s*/u;

const clean = (s: string) => s.replace(/️/g, '').replace(/\s+/g, ' ').trim();

/** "RADIOMIR S.L.C." → "Radiomir S.L.C."; respeta siglas, referencias y palabras ya en minúscula. */
export function smartCase(s: string): string {
  if (s !== s.toUpperCase()) return s;
  return s
    .split(' ')
    .map((w) => {
      if (/[\d.]/.test(w) || w.length <= 2) return w; // PAM00425, S.L.C., GMT de 2 letras
      if (/^(GMT|UTC|PVD|DLC|IWC|II|III|IV|XL)$/.test(w)) return w;
      const lower = w.toLowerCase();
      if (['de', 'del', 'la', 'el', 'y', 'en', 'oro'].includes(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ')
    .replace(/^./, (c) => c.toUpperCase());
}

function splitBrand(title: string): { marca: string; modelo: string } {
  const t = title.toLowerCase();
  const brand = BRANDS.find((b) => t.startsWith(b.toLowerCase() + ' ') || t === b.toLowerCase());
  if (brand) return { marca: brand, modelo: smartCase(title.slice(brand.length).trim()) };
  const [first, ...rest] = title.split(' ');
  return { marca: smartCase(first), modelo: smartCase(rest.join(' ')) };
}

function toSpec(line: string): Spec | null {
  const s = clean(line.replace(BULLET, ''));
  if (!s) return null;
  const colon = s.indexOf(':');
  if (colon > 0) return { nombre: s.slice(0, colon).trim(), valor: s.slice(colon + 1).trim() };
  const [nombre, ...rest] = s.split(' ');
  return rest.length ? { nombre: smartCase(nombre), valor: rest.join(' ') } : null;
}

export function detectEstado(caption: string): Estado {
  const t = caption.toUpperCase();
  if (/VENDIDO|NUEVO DUEÑO|NO DISPONIBLE|⛔/u.test(t)) return 'vendido';
  if (/RESERVADO/.test(t)) return 'reservado';
  return 'disponible';
}

/** true si el texto parece una ficha de reloj (y no una promo o una efeméride). */
export const looksLikeFicha = (caption: string) =>
  caption.split('\n').some((l) => WATCH.test(l)) || caption.split('\n').filter((l) => BULLET.test(l)).length >= 2;

export interface ParsedFicha {
  data: RelojInput;
  /** Datos que no se pudieron leer y conviene revisar a mano. */
  avisos: string[];
}

export function parseFicha(caption: string, instagramUrl: string | null = null): ParsedFicha {
  const avisos: string[] = [];
  const lines = caption.replace(/\r/g, '').split('\n');

  const titleIdx = lines.findIndex((l) => WATCH.test(l));
  const titleLine = clean((titleIdx >= 0 ? lines[titleIdx] : lines.find((l) => l.trim()) ?? '').replace(WATCH, ''));
  const [namePart, refPart] = titleLine.split(/\s+[–—-]\s+/);
  const { marca, modelo } = splitBrand(clean(namePart ?? ''));
  if (titleIdx < 0) avisos.push('No encontré la línea con ⌚; revisa marca y modelo.');

  const specs: Spec[] = [];
  const incluye: string[] = [];
  const parrafos: string[] = [];
  let current: string[] = [];
  const flush = () => {
    if (current.length) parrafos.push(current.join(' '));
    current = [];
  };

  lines.forEach((raw, i) => {
    if (i === titleIdx) return;
    const line = raw.trim();
    if (CHECK.test(line)) {
      flush();
      const item = clean(line.replace(CHECK, ''));
      if (item) incluye.push(smartCase(item).replace(/^./, (c) => c.toUpperCase()));
    } else if (BULLET.test(line)) {
      flush();
      const spec = toSpec(line);
      // La primera viñeta suele repetir "MARCA MODELO"; se omite.
      const repeats = spec && clean(`${spec.nombre} ${spec.valor}`).toLowerCase() === clean(namePart ?? '').toLowerCase();
      if (spec && !repeats) specs.push(spec);
    } else if (!line || line.startsWith('#')) {
      flush();
    } else if (!specs.length && !incluye.length) {
      current.push(clean(line));
    }
  });
  flush();

  // Quita del texto narrativo los cierres comerciales ("Tus consultas por DM", hashtags, etc.).
  const descripcion = parrafos
    .filter((p) => !/consultas|por dm|precio por|escr[ií]benos|📩/i.test(p))
    .join('\n\n')
    .trim();

  const ref = clean(refPart ?? '') || specs.find((s) => /^ref/i.test(s.nombre))?.valor || '';
  const diam = specs.find((s) => /di[aá]metro|tama[nñ]o|caja/i.test(s.nombre))?.valor ?? '';
  const medida = (diam.match(/\d+(?:[.,]\d+)?\s*mm/i)?.[0] ?? diam).replace(/\s*mm/i, ' mm');

  if (!marca) avisos.push('Falta la marca.');
  if (!modelo) avisos.push('Falta el modelo.');
  if (!ref) avisos.push('No encontré la referencia.');
  if (!specs.length) avisos.push('No encontré especificaciones (líneas con ▪️).');

  return {
    data: {
      marca,
      modelo: modelo || marca,
      referencia: ref,
      medida,
      estado: detectEstado(caption),
      publicado: false,
      orden: 100,
      etiqueta: null,
      precio: null,
      encuadre: '50% 50%',
      descripcion,
      especificaciones: specs.slice(0, 8),
      incluye: incluye.slice(0, 10),
      instagram_url: instagramUrl,
    },
    avisos,
  };
}
