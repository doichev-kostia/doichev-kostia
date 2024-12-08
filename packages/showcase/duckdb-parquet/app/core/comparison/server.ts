import { KV } from "~/kv";
import { Comparison } from "~/core/comparison/comparison";

export module ServerComparison {
	export function list(): Promise<Array<Comparison.T>> {
		return KV().get("comparisons", "json").then(xs => xs ?? []).then(xs => Comparison.T.array().parse(xs));
	}

	export async function get(id: string) {
		const xs = await list();
		return xs.find(x => x.id === id);
	}
}
