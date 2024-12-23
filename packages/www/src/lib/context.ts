import { AsyncLocalStorage } from "node:async_hooks";
import { err, ok, Result } from "neverthrow";

class ErrContextUnavailable extends Error {
	constructor(name: string) {
		super(`context ${name} is unavailable`);
		this.name = `ErrContextUnavailable`;
	}
}

export function createContext<T>(name: string) {
	const storage = new AsyncLocalStorage<T>();
	return {
		use(): Result<T, ErrContextUnavailable> {
			const result = storage.getStore();
			if (result) {
				return ok(result);
			} else {
				return err(new ErrContextUnavailable(name));
			}
		},
		/** @throws {ErrContextUnavailable} */
		mustUse(): T {
			const result = this.use();
			if (result.isErr()) {
				throw result._unsafeUnwrapErr();
			} else {
				return result._unsafeUnwrap();
			}
		},
		with<R>(value: T, fn: () => R) {
			return storage.run<R>(value, fn);
		},
	};

}
