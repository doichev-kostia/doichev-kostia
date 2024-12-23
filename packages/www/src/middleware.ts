import { defineMiddleware } from "astro/middleware";
import { DatabaseContext } from "./db/db";
import { drizzle } from "drizzle-orm/d1";
import { LoggerContext } from "./lib/logger";

export const onRequest = defineMiddleware(async function middleware(context, next) {

	return next();
	// return LoggerContext.with(console, () => DatabaseContext.with(drizzle(context.locals.runtime.env.DB), next));
})
