import { defineMiddleware } from "astro/middleware";
import { DatabaseContext } from "./db/db";
import { drizzle } from "drizzle-orm/d1";
import { LoggerContext, pinoLogger } from "./lib/logger";
import { Context } from "./lib/context";
import { QueueContext } from "./core/queue";
import { ulid } from "@std/ulid";

export const onRequest = defineMiddleware(async function middleware(context, next) {
	const requestID = `req_${ulid()}`;
	context.request.headers.set("x-req-id", requestID);
	const wrap = Context.compose(
		LoggerContext.curry(pinoLogger.child({
			requestID,
			method: context.request.method,
			path: context.routePattern,
		})),
		context.locals.runtime.cf ? DatabaseContext.curry(drizzle(context.locals.runtime.env.DB)) : undefined,
		context.locals.runtime.cf ? QueueContext.curry(context.locals.runtime.env.Queue) : undefined,
	)
	const response = await wrap(next);
	return response;
});
