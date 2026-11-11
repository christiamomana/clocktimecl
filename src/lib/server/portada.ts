import { ensureSchema, hasDatabase, sql } from './db';
import type { ProcessedFoto, Size } from './fotos';

// Portada de la página principal: foto y los dos textos que van bajo ella. Se guarda en `ajustes`
// (clave "portada") y la foto en `imagenes`. Sin nada guardado se usa la portada original.

export const PORTADA_ORIGINAL = {
  pie1: 'Panerai Radiomir S.L.C. · PAM00425',
  pie2: 'Fotografía de nuestra vitrina',
  alt: 'Panerai Radiomir S.L.C. en su estuche, con correa de cuero envejecido',
};

export interface Portada {
  /** null = foto original de /public/img. */
  imagen: { id: number; ancho: number; alto: number } | null;
  /** null = encuadre original (definido en los estilos). */
  encuadre: string | null;
  pie1: string;
  pie2: string;
  alt: string;
}

interface Guardado {
  imagen_id?: number | null;
  encuadre?: string | null;
  pie1?: string;
  pie2?: string;
  alt?: string;
}

const original = (): Portada => ({ imagen: null, encuadre: null, ...PORTADA_ORIGINAL });

export async function getPortada(): Promise<Portada> {
  if (!hasDatabase()) return original();
  await ensureSchema();
  const db = sql();
  const [row] = await db<{ valor: Guardado }[]>`select valor from ajustes where clave = 'portada'`;
  const v = row?.valor ?? {};
  let imagen: Portada['imagen'] = null;
  if (v.imagen_id) {
    const [img] = await db<{ id: number; ancho: number; alto: number }[]>`select id, ancho, alto from imagenes where id = ${v.imagen_id}`;
    imagen = img ?? null;
  }
  return {
    imagen,
    encuadre: imagen ? (v.encuadre ?? '50% 50%') : null,
    pie1: v.pie1 ?? PORTADA_ORIGINAL.pie1,
    pie2: v.pie2 ?? PORTADA_ORIGINAL.pie2,
    alt: v.alt || (imagen ? v.pie1 || 'Foto de portada de Clock Time Chile' : PORTADA_ORIGINAL.alt),
  };
}

async function guardar(cambios: Guardado): Promise<void> {
  await ensureSchema();
  const db = sql();
  const [row] = await db<{ valor: Guardado }[]>`select valor from ajustes where clave = 'portada'`;
  const valor = { ...(row?.valor ?? {}), ...cambios };
  await db`
    insert into ajustes (clave, valor) values ('portada', ${db.json(valor as never)})
    on conflict (clave) do update set valor = excluded.valor, actualizado = now()`;
}

/** Guarda una foto nueva como portada y borra la anterior. */
export async function setPortadaFoto(f: ProcessedFoto): Promise<void> {
  await ensureSchema();
  const db = sql();
  const [row] = await db<{ valor: Guardado }[]>`select valor from ajustes where clave = 'portada'`;
  const anterior = row?.valor?.imagen_id;
  const [img] = await db<{ id: number }[]>`
    insert into imagenes (ancho, alto, l, m, s) values (${f.ancho}, ${f.alto}, ${f.l}, ${f.m}, ${f.s}) returning id`;
  await guardar({ imagen_id: img.id, encuadre: '50% 50%' });
  if (anterior) await db`delete from imagenes where id = ${anterior}`;
}

export async function setPortadaTextos(t: { pie1: string; pie2: string; encuadre: string | null; alt: string }): Promise<void> {
  await guardar({ pie1: t.pie1, pie2: t.pie2, alt: t.alt, ...(t.encuadre ? { encuadre: t.encuadre } : {}) });
}

/** Vuelve a la foto y los textos originales. */
export async function restaurarPortada(): Promise<void> {
  await ensureSchema();
  const db = sql();
  const [row] = await db<{ valor: Guardado }[]>`select valor from ajustes where clave = 'portada'`;
  await db`delete from ajustes where clave = 'portada'`;
  if (row?.valor?.imagen_id) await db`delete from imagenes where id = ${row.valor.imagen_id}`;
}

export async function getImagenBytes(id: number, size: Size): Promise<Buffer | null> {
  await ensureSchema();
  const db = sql();
  const col = { l: db`l`, m: db`m`, s: db`s` }[size];
  const [row] = await db<{ data: Buffer }[]>`select ${col} as data from imagenes where id = ${id}`;
  return row?.data ?? null;
}
