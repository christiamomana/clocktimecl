import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Los relojes se editan desde el administrador (/keystatic) y se guardan en src/content/relojes/*.json.
const relojes = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/relojes' }),
  schema: ({ image }) =>
    z.object({
      marca: z.string(),
      modelo: z.string(),
      referencia: z.string(),
      medida: z.string(),
      estado: z.enum(['disponible', 'reservado', 'vendido']).default('disponible'),
      publicado: z.boolean().default(true),
      orden: z.number().default(100),
      etiqueta: z.string().optional(),
      imagen: image(),
      encuadre: z.string().default('50% 50%'),
      descripcion: z.string(),
      especificaciones: z.array(z.object({ nombre: z.string(), valor: z.string() })).default([]),
      incluye: z.array(z.string()).default([]),
    }),
});

export const collections = { relojes };
