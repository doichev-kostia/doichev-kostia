import { defineCollection, z } from "astro:content";
import { glob } from 'astro/loaders';

const blogCollection = defineCollection({
	loader: glob({ pattern: '**/[^_]*.md', base: "./src/content/blog" }),
	schema: z.object({
		title: z.string(),
		summary: z.string(),
		publishTime: z.string().transform((str: string) => new Date(str)),
		updateTime: z.string().transform(str => new Date(str)).optional(),
		minutesToRead: z.number(),
		draft: z.boolean().optional(),
	}),
});

export const collections = {
	blog: blogCollection,
};
