import { Context } from "./context";

// TODO: use pino logger and add the request path and method to its context
type Logger = {
	/* [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/error_static) */
	error(...data: any[]): void;
	/* [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/info_static) */
	info(...data: any[]): void;
	/* [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/warn_static) */
	warn(...data: any[]): void;
}

export const LoggerContext = Context.create<Logger>("Logger");

export function logger(): Logger {
	return LoggerContext.use().unwrapOr(console);
}
