// 1. Import utilities from `astro:content`
import { defineCollection, z } from "astro:content";
// 2. Define your collection(s)
const blogCollection = defineCollection({
	schema: z.object({
		title: z.string(),
		image: z.string(),
		imageSource: z.string().optional(),
		publishedAt: z.string().transform((str: string) => new Date(str)),
	}),
});
// 3. Export a single `collections` object to register your collection(s)
//    This key should match your collection directory name in "src/content"
export const collections = {
	blog: blogCollection,
};
