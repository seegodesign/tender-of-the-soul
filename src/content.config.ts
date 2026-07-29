import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(), publishDate: z.coerce.date(), updatedDate: z.coerce.date().optional(),
    author: z.string().default('Elana'), excerpt: z.string(), featuredImage: z.string().optional(),
    featuredImageAlt: z.string().optional(), category: z.string(), tags: z.array(z.string()).default([]),
    seoTitle: z.string().optional(), metaDescription: z.string().optional(), socialImage: z.string().optional(),
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
export const collections = { blog, faqs, testimonials };
