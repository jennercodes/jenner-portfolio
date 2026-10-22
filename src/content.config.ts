import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const proyectos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/proyectos' }),
  schema: z.object({
    title: z.string(),
    /** Rol de Jenner en el proyecto */
    role: z.string(),
    /** Cliente o empresa, cuando no coincide con el título */
    client: z.string().optional(),
    start: z.number().int(),
    /** Sin `end` = sigue en curso */
    end: z.number().int().optional(),
    /** Una línea para listados */
    summary: z.string(),
    stack: z.array(z.string()).default([]),
    /** Aparece en "Trabajo seleccionado" de la portada */
    featured: z.boolean().default(false),
    /** Muestra la etiqueta "Proyecto personal" */
    personal: z.boolean().default(false),
    url: z.url().optional(),
    /** Orden en los listados, de menor a mayor */
    order: z.number().int(),
  }),
});

export const collections = { proyectos };
