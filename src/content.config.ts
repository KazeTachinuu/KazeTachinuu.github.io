import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_index.md'], base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
  }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_index.md'], base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    categories: z.array(z.string()).default([]),
    github: z.array(z.string()).default([]),
    githubCard: z.boolean().default(false),
    image: z.string().optional(),
    tech: z.array(z.object({
      name: z.string(),
      logo: z.string().optional(),
    })).default([]),
  }),
});

const snippets = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_index.md'], base: './src/content/snippets' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    language: z.string().optional(),
  }),
});

const tools = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_index.md'], base: './src/content/tools' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    external_link: z.string().optional(),
  }),
});

const writeups = defineCollection({
  loader: glob({ pattern: ['**/*.{md,mdx}', '!**/_index.md'], base: './src/content/writeups' }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    date: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    cat: z.enum(['ctf', 'year', 'chal']).optional(),
    ctf: z.string().optional(),
    categories: z.string().optional(),
    difficulty: z.string().optional(),
    solved: z.boolean().default(false),
    files: z.array(z.object({
      name: z.string(),
      path: z.string(),
    })).optional(),
  }),
});

export const collections = { blog, portfolio, snippets, tools, writeups };
