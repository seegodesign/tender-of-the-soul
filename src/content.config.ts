import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value);

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    publishDate: z.coerce.date(),
    updatedDate: z.preprocess(emptyToUndefined, z.coerce.date().optional()),
    author: z.string().default('Elana'),
    excerpt: z.string(),
    featuredImage: z.preprocess(emptyToUndefined, z.string().optional()),
    featuredImageAlt: z.preprocess(emptyToUndefined, z.string().optional()),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    seoTitle: z.preprocess(emptyToUndefined, z.string().optional()),
    metaDescription: z.preprocess(emptyToUndefined, z.string().optional()),
    draft: z.boolean().default(false)
  })
});
const faqs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/faqs' }),
  schema: z.object({ question: z.string(), category: z.string(), order: z.number() })
});
const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: z.object({ clientName: z.string(), descriptor: z.string().optional(), featured: z.boolean(), order: z.number(), placeholder: z.boolean().default(true) })
});
const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({ title: z.string(), seoTitle: z.string(), eyebrow: z.string(), introduction: z.string(), updatedLabel: z.string().optional(), order: z.number() })
});
export const collections = { blog, faqs, testimonials, legal };
