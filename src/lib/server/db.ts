import postgres from 'postgres';

// Conexión a Postgres (Neon en producción). La integración Neon de Vercel crea DATABASE_URL, o
// DB_DATABASE_URL si se conectó con el prefijo "DB". Sin ninguna, el sitio muestra la vitrina
// inicial y el admin avisa.
const env = (k: string): string | undefined => (import.meta.env[k] as string | undefined) || process.env[k] || undefined;
const url = env('DATABASE_URL') ?? env('DB_DATABASE_URL');

let client: postgres.Sql | null = null;
let schemaReady: Promise<void> | null = null;

export const hasDatabase = () => Boolean(url);

export function sql(): postgres.Sql {
  if (!url) throw new Error('Falta DATABASE_URL');
  client ??= postgres(url, {
    max: 1,
    prepare: false, // compatible con el pooler de Neon
    idle_timeout: 20,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : 'require',
  });
  return client;
}

/** Crea las tablas si no existen. Se ejecuta una vez por instancia. */
export function ensureSchema(): Promise<void> {
  schemaReady ??= (async () => {
    const db = sql();
    await db`
      create table if not exists relojes (
        id serial primary key,
        marca text not null,
        modelo text not null,
        referencia text not null default '',
        medida text not null default '',
        estado text not null default 'disponible' check (estado in ('disponible', 'reservado', 'vendido')),
        publicado boolean not null default true,
        orden integer not null default 100,
        etiqueta text,
        precio integer check (precio is null or precio >= 0),
        encuadre text not null default '50% 50%',
        descripcion text not null default '',
        especificaciones jsonb not null default '[]',
        incluye jsonb not null default '[]',
        instagram_url text unique,
        creado timestamptz not null default now(),
        actualizado timestamptz not null default now()
      )`;
    await db`
      create table if not exists fotos (
        id serial primary key,
        reloj_id integer not null references relojes(id) on delete cascade,
        posicion integer not null default 0,
        ancho integer not null,
        alto integer not null,
        l bytea not null,
        m bytea not null,
        s bytea not null,
        creado timestamptz not null default now()
      )`;
    await db`create index if not exists fotos_reloj_idx on fotos (reloj_id, posicion)`;
    // Imágenes del sitio que no son de un reloj (p. ej. la portada) y ajustes editables desde el admin.
    await db`
      create table if not exists imagenes (
        id serial primary key,
        ancho integer not null,
        alto integer not null,
        l bytea not null,
        m bytea not null,
        s bytea not null,
        creado timestamptz not null default now()
      )`;
    await db`
      create table if not exists ajustes (
        clave text primary key,
        valor jsonb not null,
        actualizado timestamptz not null default now()
      )`;
  })().catch((e) => {
    schemaReady = null;
    throw e;
  });
  return schemaReady;
}
