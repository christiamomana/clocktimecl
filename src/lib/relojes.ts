import { getCollection, type CollectionEntry } from 'astro:content';

export type Reloj = CollectionEntry<'relojes'>;

/** Relojes publicados, en el orden del carrusel. */
export async function getRelojes(): Promise<Reloj[]> {
  const all = await getCollection('relojes', ({ data }) => data.publicado);
  return all.sort((a, b) => a.data.orden - b.data.orden || a.data.modelo.localeCompare(b.data.modelo, 'es'));
}

export const estadoLabel = { disponible: 'Disponible', reservado: 'Reservado', vendido: 'Vendido' } as const;

/** Texto del botón principal de la ficha. */
export const askLabel = (estado: Reloj['data']['estado']) =>
  estado === 'disponible' ? 'Consultar precio' : 'Buscar una pieza similar';
