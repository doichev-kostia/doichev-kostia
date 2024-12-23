import { defineMiddleware } from "astro/middleware";
import { DatabaseContext } from "./db/db";
import { drizzle } from "drizzle-orm/d1";
import { LoggerContext } from "./lib/logger";
import { Context } from "./lib/context";
import { QueueContext } from "./core/queue";

export const onRequest = defineMiddleware(async function middleware(context, next) {
	const composition = [
		LoggerContext.curry(console),
		context.locals.runtime.cf ? DatabaseContext.curry(drizzle(context.locals.runtime.env.DB)) : undefined,
		context.locals.runtime.cf ? QueueContext.curry(context.locals.runtime.env.Queue) : undefined,
	];

	const wrap = Context.compose(...composition);

	const r = await wrap(next);
	return r;
});
