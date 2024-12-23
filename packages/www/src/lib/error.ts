import type { ZodError } from "zod";
import type { HttpStatusCode } from "./http.js";
import type { ValueOf } from "./types.js";
import { errWithCause } from "pino-std-serializers";

export const ErrorCode = {
	// The client specified an invalid argument regardless of the state of the system.
	INVALID_ARGUMENT: 'INVALID_ARGUMENT',
	// The operation was rejected because the system is not in a state required for the operation's execution.
	// For example, the directory to be deleted is non-empty, an rmdir operation is applied to a non-directory, etc.
	FAILED_PRECONDITION: 'FAILED_PRECONDITION',
	// The requested entity was not found.
	NOT_FOUND: 'NOT_FOUND',
	// The entity that a client tried to create already exists.
	ALREADY_EXISTS: 'ALREADY_EXISTS',
	// The caller does not have valid authentication credentials for the operation.
	UNAUTHENTICATED: 'UNAUTHENTICATED',
	// The caller does not have permission to execute the specified operation.
	PERMISSION_DENIED: 'PERMISSION_DENIED',
	// The caller has exhausted their rate limit or quota
	TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
	// The part of the underlying system is broken
	INTERNAL: 'INTERNAL',
	// When the application doesn't know how to handle the caught error
	UNKNOWN: 'UNKNOWN',
	// The service is currently unavailable. Can be retried with a backoff.
	UNAVAILABLE: 'UNAVAILABLE',
} as const;

export const HTTP_STATUS_CODE: Record<ValueOf<typeof ErrorCode>, ValueOf<typeof HttpStatusCode>> = {
	INVALID_ARGUMENT: 400,
	FAILED_PRECONDITION: 400,
	NOT_FOUND: 404,
	ALREADY_EXISTS: 409,
	UNAUTHENTICATED: 401,
	PERMISSION_DENIED: 403,
	TOO_MANY_REQUESTS: 429,
	INTERNAL: 500,
	UNKNOWN: 500,
	UNAVAILABLE: 503,
};

const errorType = Symbol("ApiError");

export type ErrorInfo = {
	__type: "ErrorInfo",
	reason: string;
	metadata: Record<string, any>;
}

export type FieldViolation = {
	field: string;
	description: string;
}

export type BadRequest = {
	__type: "BadRequest";
	fieldViolations: FieldViolation[];
}

export class ApiError extends Error {
	code: ValueOf<typeof ErrorCode>;
	details?: (ErrorInfo | BadRequest)[]

	type = errorType

	constructor(code: ValueOf<typeof ErrorCode>, message: string, details?: (ErrorInfo | BadRequest)[], cause?: unknown) {
		super();
		this.name = "ApiError";
		this.message = message;
		this.code = code;
		this.details = details ?? [];
		this.cause = cause;


		if (typeof Error.captureStackTrace === "function" && Error.stackTraceLimit !== 0) {
			Error.captureStackTrace(this, this.constructor);
		}
	}

	override toString() {
		return `${this.name}[${this.code}]: ${this.message}`;
	}

	static serialize(error: ApiError, to?: 'json' | 'log') {
		if (to === 'json') {
			return {
				code: error.code,
				message: error.message,
				details: error.details,
			}
		} else if (to === 'log') {
			return errWithCause(error);
		} else {
			return error.toString()
		}
	}


	static is(error: unknown): error is ApiError {
		if (typeof error !== "object" || error == null) {
			return false;
		}

		return Reflect.get(error, 'type') === errorType;
	}

	static toResponse(error: ApiError, init?: ResponseInit) {
		return Response.json({
			code: error.code,
			message: error.message,
			details: error.details,
		}, {
			status: HTTP_STATUS_CODE[error.code],
			...init,
		});
	}

	static fromZodError(error: ZodError) {
		const violations = error.errors.map<FieldViolation>(issue => ({
			field: issue.path.join("."),
			description: issue.message
		}));

		const err = new ApiError("INVALID_ARGUMENT", "Validation failed", [
			{
				__type: "BadRequest",
				fieldViolations: violations,
			}
		]);

		return err;
	}
}
