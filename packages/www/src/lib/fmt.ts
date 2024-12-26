/* https://jsr.io/@std/fmt */
import { sprintf } from "@std/fmt/printf";

export module fmt {
	export function Sprintf(pattern: string, ...args: unknown[]): string {
		return sprintf(pattern, ...args);
	}

	export function Errorf(pattern: string, ...args: unknown[]): Error {
		return new Error(Sprintf(pattern, ...args));
	}
}
