export function queryKeyBuilder(...args: unknown[]): unknown[] {
	return args.filter((arg) => arg != null);
}
