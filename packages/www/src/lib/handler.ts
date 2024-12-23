import type { APIContext, APIRoute, Props } from "astro";
import { ApiError } from "./error";
import { fmt } from "./fmt";
import { ZodError } from "zod";
import { logger } from "./logger";

export type Handler<Props extends Record<string, any> = Record<string, any>, APIParams extends Record<string, string | undefined> = Record<string, string | undefined>> = (context: APIContext<Props, APIParams>) => Promise<Response | Error>;

function errorToResponse(error: unknown): Response {
	if (error instanceof ApiError) {
		return ApiError.toResponse(error);
	} else if (error instanceof ZodError) {
		const err = ApiError.fromZodError(error);
		return ApiError.toResponse(err);
	} else {
		const err = new ApiError("INTERNAL", "Internal Error");
		return ApiError.toResponse(err);
	}
}

export function ApiHandler(handler: Handler): APIRoute {
	return async function handle(context) {
		try {
			const result = await handler(context);
			if (result instanceof Error) {
				logger().error(result, fmt.Sprintf("[ApiHandler] returned an error. Method = %s; Path = %s;", context.request.method, context.routePattern))
				return errorToResponse(result);
			} else {
				return result;
			}
		} catch (error) {
			logger().error(error, fmt.Sprintf("[ApiHandler] caught an error. Method = %s; Path = %s;", context.request.method, context.routePattern))
			return errorToResponse(error);
		}
	}
}
