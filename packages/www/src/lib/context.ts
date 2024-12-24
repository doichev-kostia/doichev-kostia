import { AsyncLocalStorage } from "node:async_hooks";
import { err, ok, Result } from "neverthrow";
import { reduce, filter, map, pipe, reverse } from "remeda";

class ErrContextUnavailable extends Error {
	constructor(name: string) {
		super(`context ${name} is unavailable`);
		this.name = `ErrContextUnavailable`;
	}
}

export module Context {
	export type ContextFn<R> = (fn: () => R) => R;

	const contextName = Symbol.for("ContextName");

	export function create<T>(name: string) {
		const storage = new AsyncLocalStorage<T>();
		const context = {
			name,
			[contextName]: name,
			[Symbol.toStringTag]: `${name}Context`,
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
			with<R>(value: T, fn: (this: { [contextName]: string }, value: T) => R) {
				// To improve the error stack trace
				const ctx = { [contextName]: name, [Symbol.toStringTag]: `${name}Context` };
				const runner = fn.bind(ctx, value);
				return storage.run<R>(value, runner);
			},
			curry(value: T) {
				const ctx = { [contextName]: name, [Symbol.toStringTag]: `${name}Context.curry` };
				const f = function storageRunner<R>(fn: (this: typeof ctx) => R) {
					return storage.run<R>(value, fn);
				}
				f[contextName] = name;

				return f.bind(ctx);
			}
		};

		return context;
	}



	/**
	* @example
	* const wrap = Context.compose(
	* 	LoggerContext.curry(console),
	* 	env.DB ? DatabaseContext.curry(drizzle(env.DB)) : undefined,
	* );
	* await wrap(async function doSomething() {
	*  const db = DatabaseContext.mustUse();
	*
	* }):
	*/
	export function compose(
		...contexts: (ContextFn<any> | undefined)[]
	) {
		return function wrap<R>(fn: () => R): R {
			const result = pipe(
				contexts,
				filter<ContextFn<any> | undefined>(Boolean), // typescript doesn't understand the Boolean thing
				map(ctx => ctx!),
				reverse(),
				reduce((prev: R | (() => R), curr: ContextFn<any>) => {
					if (prev === fn) {
						return curr(fn)
					} else {
						return curr(() => prev as R);
					}
				}, fn)
			);

			return result as R;
		};
	}
}
