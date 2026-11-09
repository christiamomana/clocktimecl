// Tipos y formato de los relojes, compartidos por el sitio, el admin y la importación desde Instagram.

export const ESTADOS = ['disponible', 'reservado', 'vendido'] as const;
export type Estado = (typeof ESTADOS)[number];
export const estadoLabel: Record<Estado, string> = { disponible: 'Disponible', reservado: 'Reservado', vendido: 'Vendido' };

export const ENCUADRES = [
  { value: '50% 50%', label: 'Centro' },
  { value: '50% 40%', label: 'Un poco arriba' },
  { value: '50% 30%', label: 'Arriba' },
  { value: '50% 60%', label: 'Un poco abajo' },
  { value: '50% 72%', label: 'Abajo' },
] as const;

export interface Spec {
  nombre: string;
  valor: string;
}

/** Lo que se guarda de un reloj (sin fotos). */
export interface RelojInput {
  marca: string;
  modelo: string;
  referencia: string;
  medida: string;
  estado: Estado;
  publicado: boolean;
  orden: number;
  etiqueta: string | null;
  precio: number | null;
  encuadre: string;
  descripcion: string;
  especificaciones: Spec[];
  incluye: string[];
  instagram_url: string | null;
}

/** Una foto lista para mostrar: URLs por ancho. */
export interface FotoView {
  id: number | null;
  s: string;
  m: string;
  l: string;
  ancho: number;
  alto: number;
}

export interface Reloj extends RelojInput {
  id: number | null;
  fotos: FotoView[];
}

export const fotoSrcset = (f: FotoView) => `${f.s} 480w, ${f.m} 900w, ${f.l} 1600w`;

export const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);

/** Texto del botón principal de la ficha. */
export const askLabel = (r: Pick<Reloj, 'estado'>) => (r.estado === 'disponible' ? 'Consultar precio' : 'Buscar una pieza similar');

/** Mensaje de WhatsApp del botón principal de la ficha, sobre el reloj que se está viendo. */
export function askMessage(r: Pick<Reloj, 'estado' | 'marca' | 'modelo' | 'referencia'>): string {
  const nombre = r.modelo.toLowerCase().startsWith(r.marca.toLowerCase()) ? r.modelo : `${r.marca} ${r.modelo}`;
  // Solo se agrega la referencia si es un código (PAM00425), no un texto como "Vintage".
  const ref = /\d/.test(r.referencia) ? ` (ref. ${r.referencia})` : '';
  return r.estado === 'disponible'
    ? `Hola, quería consultar el precio del ${nombre}${ref} que vi en la página. Gracias`
    : `Hola, vi el ${nombre}${ref} en la página. ¿Tienen uno similar disponible? Gracias`;
}

/** Normaliza y valida datos que llegan del formulario o de la API. Devuelve errores legibles. */
export function parseRelojInput(raw: Record<string, unknown>): { data?: RelojInput; errors: string[] } {
  const errors: string[] = [];
  const str = (k: string, max = 200) => String(raw[k] ?? '').trim().slice(0, max);
  const marca = str('marca');
  const modelo = str('modelo');
  if (!marca) errors.push('Falta la marca.');
  if (!modelo) errors.push('Falta el modelo.');

  const estado = str('estado') as Estado;
  const precioRaw = String(raw.precio ?? '').replace(/[^\d]/g, '');
  const ordenRaw = Number(raw.orden);
  const encuadre = ENCUADRES.some((e) => e.value === raw.encuadre) ? String(raw.encuadre) : '50% 50%';

  const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : typeof v === 'string' && v.trim() ? [v] : []);
  const especificaciones = list(raw.especificaciones)
    .map((s) => {
      if (typeof s === 'string') {
        const [nombre, ...rest] = s.split(':');
        return { nombre: nombre.trim(), valor: rest.join(':').trim() };
      }
      const o = (s ?? {}) as Record<string, unknown>;
      return { nombre: String(o.nombre ?? '').trim(), valor: String(o.valor ?? '').trim() };
    })
    .filter((s) => s.nombre && s.valor)
    .slice(0, 8);
  const incluye = list(raw.incluye)
    .flatMap((s) => String(s).split('\n'))
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);

  let instagram_url: string | null = str('instagram_url', 300) || null;
  if (instagram_url) {
    const canon = canonicalInstagramUrl(instagram_url);
    if (!canon) errors.push('El link de Instagram no es válido (debe ser una publicación: instagram.com/p/…).');
    instagram_url = canon;
  }

  const data: RelojInput = {
    marca,
    modelo,
    referencia: str('referencia'),
    medida: str('medida'),
    estado: (ESTADOS as readonly string[]).includes(estado) ? estado : 'disponible',
    publicado: raw.publicado === true || raw.publicado === 'on' || raw.publicado === 'true',
    orden: Number.isFinite(ordenRaw) ? Math.round(ordenRaw) : 100,
    etiqueta: str('etiqueta', 60) || null,
    precio: precioRaw ? Math.min(Number(precioRaw), 2_000_000_000) : null,
    encuadre,
    descripcion: str('descripcion', 3000),
    especificaciones,
    incluye,
    instagram_url,
  };
  return errors.length ? { errors } : { data, errors };
}

/** https://www.instagram.com/p/ABC123/ para cualquier variante del link de una publicación o reel. */
export function canonicalInstagramUrl(input: string): string | null {
  try {
    const u = new URL(input.trim());
    if (!/(^|\.)instagram\.com$/.test(u.hostname)) return null;
    const m = u.pathname.match(/\/(p|reel|tv)\/([A-Za-z0-9_-]+)/);
    return m ? `https://www.instagram.com/${m[1]}/${m[2]}/` : null;
  } catch {
    return null;
  }
}
