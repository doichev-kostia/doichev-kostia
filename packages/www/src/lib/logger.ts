import { Context } from "./context";
import { pino } from "pino";

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

export const pinoLogger = pino();
