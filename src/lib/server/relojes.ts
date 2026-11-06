import type postgres from 'postgres';
import { ensureSchema, hasDatabase, sql } from './db';
import { DIM, IMG } from '../pic';
import { processFoto, type ProcessedFoto, type Size } from './fotos';
import { seed } from '../seed';
import type { FotoView, Reloj, RelojInput } from '../relojes';

const fotoView = (id: number, ancho: number, alto: number): FotoView => ({
  id,
  s: `/fotos/${id}-s.webp`,
  m: `/fotos/${id}-m.webp`,
  l: `/fotos/${id}-l.webp`,
  ancho,
  alto,
});

const seedFoto = (name: string): FotoView => {
  const ws = IMG[name];
  const [ancho, alto] = DIM[name];
  return { id: null, s: `/img/${name}-${ws[0]}.webp`, m: `/img/${name}-${ws[1]}.webp`, l: `/img/${name}-${ws[ws.length - 1]}.webp`, ancho, alto };
};

export const seedRelojes = (): Reloj[] => seed.map(({ foto, ...r }) => ({ ...r, id: null, fotos: [seedFoto(foto)] }));

type Row = RelojInput & { id: number };

async function withFotos(rows: Row[]): Promise<Reloj[]> {
  if (!rows.length) return [];
  const db = sql();
  const fotos = await db<{ id: number; reloj_id: number; ancho: number; alto: number }[]>`
    select id, reloj_id, ancho, alto from fotos
    where reloj_id = any(${rows.map((r) => r.id)}) order by posicion, id`;
  return rows.map((r) => ({
    ...r,
    fotos: fotos.filter((f) => f.reloj_id === r.id).map((f) => fotoView(f.id, f.ancho, f.alto)),
  }));
}

const cols = (db: postgres.Sql) => db`id, marca, modelo, referencia, medida, estado, publicado, orden, etiqueta, precio, encuadre,
  descripcion, especificaciones, incluye, instagram_url`;

/** Relojes para la página pública. Sin base de datos, la vitrina inicial. */
export async function getVitrina(): Promise<Reloj[]> {
  if (!hasDatabase()) return seedRelojes();
  await ensureSchema();
  const db = sql();
  const rows = await db<Row[]>`select ${cols(db)} from relojes where publicado order by orden, id`;
  return (await withFotos(rows)).filter((r) => r.fotos.length > 0);
}

export async function listRelojes(): Promise<Reloj[]> {
  await ensureSchema();
  const db = sql();
  const rows = await db<Row[]>`select ${cols(db)} from relojes order by publicado desc, orden, id`;
  return withFotos(rows);
}

export async function getReloj(id: number): Promise<Reloj | null> {
  await ensureSchema();
  const db = sql();
  const rows = await db<Row[]>`select ${cols(db)} from relojes where id = ${id}`;
  return (await withFotos(rows))[0] ?? null;
}

export async function findByInstagram(url: string): Promise<number | null> {
  await ensureSchema();
  const [row] = await sql()<{ id: number }[]>`select id from relojes where instagram_url = ${url}`;
  return row?.id ?? null;
}

export async function createReloj(r: RelojInput): Promise<number> {
  await ensureSchema();
  const db = sql();
  const [row] = await db<{ id: number }[]>`
    insert into relojes (marca, modelo, referencia, medida, estado, publicado, orden, etiqueta, precio, encuadre,
      descripcion, especificaciones, incluye, instagram_url)
    values (${r.marca}, ${r.modelo}, ${r.referencia}, ${r.medida}, ${r.estado}, ${r.publicado}, ${r.orden}, ${r.etiqueta},
      ${r.precio}, ${r.encuadre}, ${r.descripcion}, ${db.json(r.especificaciones as never)}, ${db.json(r.incluye as never)},
      ${r.instagram_url})
    returning id`;
  return row.id;
}

export async function updateReloj(id: number, r: RelojInput): Promise<boolean> {
  await ensureSchema();
  const db = sql();
  const res = await db`
    update relojes set marca = ${r.marca}, modelo = ${r.modelo}, referencia = ${r.referencia}, medida = ${r.medida},
      estado = ${r.estado}, publicado = ${r.publicado}, orden = ${r.orden}, etiqueta = ${r.etiqueta}, precio = ${r.precio},
      encuadre = ${r.encuadre}, descripcion = ${r.descripcion}, especificaciones = ${db.json(r.especificaciones as never)},
      incluye = ${db.json(r.incluye as never)}, instagram_url = ${r.instagram_url}, actualizado = now()
    where id = ${id}`;
  return res.count > 0;
}

/** Cambios rápidos desde la lista del admin. */
export async function patchReloj(id: number, p: { publicado?: boolean; estado?: string }): Promise<void> {
  await ensureSchema();
  const db = sql();
  if (p.publicado !== undefined) await db`update relojes set publicado = ${p.publicado}, actualizado = now() where id = ${id}`;
  if (p.estado) await db`update relojes set estado = ${p.estado}, actualizado = now() where id = ${id}`;
}

export async function deleteReloj(id: number): Promise<void> {
  await ensureSchema();
  await sql()`delete from relojes where id = ${id}`;
}

export async function addFoto(relojId: number, f: ProcessedFoto): Promise<number> {
  await ensureSchema();
  const db = sql();
  const [row] = await db<{ id: number }[]>`
    insert into fotos (reloj_id, posicion, ancho, alto, l, m, s)
    values (${relojId}, (select coalesce(max(posicion), -1) + 1 from fotos where reloj_id = ${relojId}),
            ${f.ancho}, ${f.alto}, ${f.l}, ${f.m}, ${f.s})
    returning id`;
  return row.id;
}

export async function deleteFoto(relojId: number, fotoId: number): Promise<void> {
  await ensureSchema();
  await sql()`delete from fotos where id = ${fotoId} and reloj_id = ${relojId}`;
}

/** Deja la foto como portada (primera) manteniendo el orden del resto. */
export async function setPortada(relojId: number, fotoId: number): Promise<void> {
  await ensureSchema();
  const db = sql();
  const fotos = await db<{ id: number }[]>`select id from fotos where reloj_id = ${relojId} order by posicion, id`;
  if (!fotos.some((f) => f.id === fotoId)) return;
  const orden = [fotoId, ...fotos.map((f) => f.id).filter((id) => id !== fotoId)];
  await db.begin(async (tx) => {
    for (const [i, id] of orden.entries()) await tx`update fotos set posicion = ${i} where id = ${id}`;
  });
}

export async function getFotoBytes(id: number, size: Size): Promise<Buffer | null> {
  await ensureSchema();
  const db = sql();
  const col = { l: db`l`, m: db`m`, s: db`s` }[size];
  const [row] = await db<{ data: Buffer }[]>`select ${col} as data from fotos where id = ${id}`;
  return row?.data ?? null;
}

/** Carga la vitrina inicial en una base vacía. Las fotos se leen del propio sitio (/img). */
export async function loadSeed(origin: string): Promise<number> {
  await ensureSchema();
  const db = sql();
  const [{ n }] = await db<{ n: number }[]>`select count(*)::int as n from relojes`;
  if (n > 0) return 0;
  let created = 0;
  for (const { foto, ...r } of seed) {
    const src = seedFoto(foto).l;
    const res = await fetch(new URL(src, origin));
    if (!res.ok) throw new Error(`No se pudo leer ${src}`);
    const processed = await processFoto(Buffer.from(await res.arrayBuffer()));
    const id = await createReloj(r);
    await addFoto(id, processed);
    created++;
  }
  return created;
}
