import { z } from "zod";

export module Comparison {
	export const T = z.object({
		id: z.string(),
		name: z.string(),
		status: z.enum(["completed"]),
		comparisonFileObject: z.string(),
	});
	export type T = z.infer<typeof T>;

	export const Row = z.object({
		id: z.string(),
		x1: z.number(),
		x2: z.number(),
		difference_x: z.number(),
		y1: z.number(),
		y2: z.number(),
		difference_y: z.number(),
	});

	export type Row = z.infer<typeof Row>;
}
